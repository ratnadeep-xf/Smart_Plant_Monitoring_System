"""
Main application for Raspberry Pi Plant Monitoring System

Hardware Setup (Digital Sensors - No MCP3008):
- DHT22: Temperature & Humidity → GPIO 4
- Soil Moisture D0: Digital output → GPIO 27 (0=wet, 1=dry)
- LDR Light D0: Digital output → GPIO 17 (0=bright, 1=dark)
- Water Pump: Relay control → GPIO 18

This is the main entry point that coordinates all components:
- Reads sensors periodically
- Captures and uploads images
- Polls for commands from backend
- Executes automatic watering based on thresholds
"""

import time
import sys
import signal
import json
from datetime import datetime
from typing import Optional, Dict

from config import *
from sensors import SensorReader
from camera import CameraHandler
from pump import PumpController
from api_client import APIClient


class PlantMonitor:
    """Main application class for plant monitoring system"""
    
    def __init__(self):
        """Initialize plant monitoring system"""
        print("=" * 60)
        print("Smart Plant Monitoring System - Raspberry Pi")
        print("=" * 60)
        print(f"Device ID: {DEVICE_ID}")
        print(f"API URL: {API_BASE_URL}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 60)
        print("Hardware Configuration (Digital Sensors):")
        print(f"  DHT22 (Temp/Humidity) → GPIO {TEMPERATURE_HUMIDITY_PIN}")
        print(f"  Soil Moisture D0      → GPIO {SOIL_SENSOR_PIN}")
        print(f"  Light Sensor D0       → GPIO {LIGHT_SENSOR_PIN}")
        print(f"  Water Pump Relay      → GPIO {PUMP_GPIO_PIN}")
        print("=" * 60)
        
        # Initialize components
        print("\nInitializing components...")
        self.sensor_reader = SensorReader()
        self.camera = CameraHandler()
        self.pump = PumpController()
        self.api_client = APIClient()
        
        # Plant thresholds (loaded from API after image upload)
        self.thresholds = {
            'soil_min': DEFAULT_SOIL_MIN,
            'soil_max': DEFAULT_SOIL_MAX,
            'temp_min': DEFAULT_TEMP_MIN,
            'temp_max': DEFAULT_TEMP_MAX,
            'humidity_min': DEFAULT_HUMIDITY_MIN,
            'humidity_max': DEFAULT_HUMIDITY_MAX,
            'light_min': DEFAULT_LIGHT_MIN,
            'light_max': DEFAULT_LIGHT_MAX
        }
        
        # Timing trackers
        self.last_telemetry_time = 0
        self.last_image_time = 0
        self.last_command_poll_time = 0
        self.last_auto_water_check = 0
        
        # Plant identification info
        self.identified_plant = None
        
        # Running flag
        self.running = False
        
        print("✓ All components initialized successfully")
    
    def update_thresholds_from_api(self, plant_data: Dict):
        """
        Update thresholds from API response after plant identification
        
        Args:
            plant_data: Plant data from image upload response
        """
        try:
            # Look for dominant detection with plant type
            detections = plant_data.get('detections', [])
            if not detections:
                print("ℹ No plant detections in API response")
                return
            
            # Get dominant detection (highest confidence)
            dominant = max(detections, key=lambda d: d.get('confidence', 0))
            
            plant_type = dominant.get('plantType')
            if plant_type and plant_type.get('thresholds'):
                new_thresholds = plant_type['thresholds']
                self.thresholds.update(new_thresholds)
                
                plant_name = plant_type.get('name', 'Unknown')
                self.identified_plant = plant_name
                
                print(f"\n✓ Updated thresholds for {plant_name}:")
                print(f"  Soil Moisture : {self.thresholds.get('soil_min')}-{self.thresholds.get('soil_max')}%")
                print(f"  Temperature   : {self.thresholds.get('temp_min')}-{self.thresholds.get('temp_max')}°C")
                print(f"  Humidity      : {self.thresholds.get('humidity_min')}-{self.thresholds.get('humidity_max')}%")
                print(f"  Light         : {self.thresholds.get('light_min')}-{self.thresholds.get('light_max')} lux")
            else:
                print("ℹ No plant type thresholds in API response")
                
        except Exception as e:
            print(f"✗ Error updating thresholds: {e}")
    
    def check_and_water_if_needed(self, sensor_data: Dict) -> bool:
        """
        Check if watering is needed based on soil moisture thresholds
        
        Args:
            sensor_data: Current sensor readings
            
        Returns:
            True if plant was watered
        """
        if not ENABLE_AUTO_WATERING:
            return False
        
        soil_moisture = sensor_data.get('soil_pct')
        if soil_moisture is None:
            return False
        
        # Check if soil moisture below minimum threshold
        if soil_moisture < self.thresholds['soil_min']:
            print(f"\n💧 Soil moisture low: {soil_moisture}% < {self.thresholds['soil_min']}%")
            print("Initiating automatic watering...")
            
            result = self.pump.activate(AUTO_WATER_DURATION, reason="auto")
            
            if result['success']:
                print(f"✓ Auto-watering completed: {result['duration']:.1f}s")
                
                # Send telemetry update after watering
                time.sleep(2)  # Wait for soil to absorb water
                new_reading = self.sensor_reader.read_all()
                self.api_client.send_telemetry(new_reading)
                
                return True
            else:
                print(f"✗ Auto-watering failed: {result['reason']}")
        
        return False
    
    def process_telemetry(self):
        """Read sensors and send telemetry to backend"""
        current_time = time.time()
        
        if current_time - self.last_telemetry_time < TELEMETRY_INTERVAL:
            return
        
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 📊 Reading sensors...")
        
        # Read all sensors
        sensor_data = self.sensor_reader.read_all()
        
        # Validate reading
        if not self.sensor_reader.is_reading_valid(sensor_data):
            print("⚠ Invalid sensor reading - skipping telemetry")
            return
        
        # Display readings
        print("  Sensor Data:")
        if sensor_data.get('soil_pct') is not None:
            print(f"    Soil Moisture : {sensor_data['soil_pct']}%")
        if sensor_data.get('temperature_c') is not None:
            print(f"    Temperature   : {sensor_data['temperature_c']}°C")
        if sensor_data.get('humidity_pct') is not None:
            print(f"    Humidity      : {sensor_data['humidity_pct']}%")
        if sensor_data.get('lux') is not None:
            print(f"    Light Level   : {sensor_data['lux']} lux")
        
        # Send to backend
        success = self.api_client.send_telemetry(sensor_data)
        if success:
            print("  ✓ Telemetry sent successfully")
        else:
            print("  ✗ Telemetry send failed")
        
        self.last_telemetry_time = current_time
        
        # Check if automatic watering needed
        if current_time - self.last_auto_water_check >= AUTO_WATER_CHECK_INTERVAL:
            self.check_and_water_if_needed(sensor_data)
            self.last_auto_water_check = current_time
    
    def process_image_capture(self):
        """Capture and upload image for AI analysis"""
        current_time = time.time()
        
        if current_time - self.last_image_time < IMAGE_CAPTURE_INTERVAL:
            return
        
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 📷 Capturing image...")
        
        # Capture image
        image_bytes = self.camera.capture_image()
        if not image_bytes:
            print("✗ Image capture failed")
            return
        
        print(f"✓ Image captured ({len(image_bytes)} bytes)")
        
        # Upload to backend for AI analysis
        print("☁ Uploading image for AI analysis...")
        result = self.api_client.upload_image(image_bytes)
        
        if result:
            print("✓ Image uploaded successfully")
            
            # Display AI detection results
            detections = result.get('detections', [])
            if detections:
                print(f"🤖 AI detected {len(detections)} plant(s):")
                for detection in detections:
                    label = detection.get('label', 'Unknown')
                    confidence = detection.get('confidence', 0) * 100
                    print(f"    - {label} ({confidence:.1f}% confidence)")
            
            # Update thresholds from plant type
            self.update_thresholds_from_api(result)
        else:
            print("✗ Image upload failed")
        
        self.last_image_time = current_time
    
    def process_commands(self):
        """Poll for and execute commands from backend"""
        current_time = time.time()
        
        if current_time - self.last_command_poll_time < COMMAND_POLL_INTERVAL:
            return
        
        # Poll for commands
        commands = self.api_client.poll_commands()
        
        if not commands:
            self.last_command_poll_time = current_time
            return
        
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 📨 Processing {len(commands)} command(s)...")
        
        for command in commands:
            self.execute_command(command)
        
        self.last_command_poll_time = current_time
    
    def execute_command(self, command: Dict):
        """
        Execute a command from backend
        
        Args:
            command: Command dictionary with id, type, and payload
        """
        command_id = command.get('id')
        command_type = command.get('type')
        payload = command.get('payload', {})
        
        print(f"Executing command {command_id}: {command_type}")
        
        if command_type == 'water':
            # Water command
            duration = payload.get('duration', 5)
            
            # Acknowledge start
            self.api_client.acknowledge_command(command_id, 'started')
            
            # Execute watering
            result = self.pump.activate(duration, reason="command")
            
            # Acknowledge completion
            if result['success']:
                self.api_client.acknowledge_command(
                    command_id,
                    'completed',
                    {
                        'duration_executed': result['duration'],
                        'timestamp': result['timestamp']
                    }
                )
                print(f"✓ Water command completed: {result['duration']:.1f}s")
                
                # Send updated telemetry after watering
                time.sleep(2)
                new_reading = self.sensor_reader.read_all()
                self.api_client.send_telemetry(new_reading)
            else:
                self.api_client.acknowledge_command(
                    command_id,
                    'failed',
                    {'error': result['reason']}
                )
                print(f"✗ Water command failed: {result['reason']}")
        
        else:
            print(f"⚠ Unknown command type: {command_type}")
            self.api_client.acknowledge_command(
                command_id,
                'failed',
                {'error': f'Unknown command type: {command_type}'}
            )
    
    def display_status(self):
        """Display current system status"""
        print("\n" + "=" * 60)
        print("SYSTEM STATUS")
        print("=" * 60)
        
        # Plant info
        if self.identified_plant:
            print(f"🌱 Identified Plant: {self.identified_plant}")
        else:
            print("🌱 Identified Plant: Not yet identified")
        
        # API connection
        api_health = self.api_client.get_health()
        connection_status = "✓ Connected" if api_health['connected'] else "✗ Disconnected"
        print(f"🌐 Backend Connection: {connection_status}")
        
        # Pump status
        pump_status = self.pump.get_status()
        print(f"💧 Pump: {'Running' if pump_status['is_running'] else 'Idle'}")
        print(f"   Total Activations: {pump_status['total_activations']}")
        
        # Current sensor readings
        last_reading = self.sensor_reader.get_last_reading()
        if last_reading:
            print("\n📊 Last Sensor Readings:")
            if last_reading.get('soil_pct') is not None:
                print(f"   Soil Moisture : {last_reading['soil_pct']}%")
            if last_reading.get('temperature_c') is not None:
                print(f"   Temperature   : {last_reading['temperature_c']}°C")
            if last_reading.get('humidity_pct') is not None:
                print(f"   Humidity      : {last_reading['humidity_pct']}%")
            if last_reading.get('lux') is not None:
                print(f"   Light Level   : {last_reading['lux']} lux")
        
        # Current thresholds
        print("\n🎯 Active Thresholds:")
        print(f"   Soil Moisture : {self.thresholds['soil_min']}-{self.thresholds['soil_max']}%")
        print(f"   Temperature   : {self.thresholds['temp_min']}-{self.thresholds['temp_max']}°C")
        print(f"   Humidity      : {self.thresholds['humidity_min']}-{self.thresholds['humidity_max']}%")
        print(f"   Light Level   : {self.thresholds['light_min']}-{self.thresholds['light_max']} lux")
        
        print("=" * 60)
    
    def run(self):
        """Main application loop"""
        self.running = True
        
        print("\n🚀 Starting main loop...")
        print("Press Ctrl+C to stop\n")
        
        # Display status every 60 seconds
        last_status_display = 0
        
        try:
            while self.running:
                # Process telemetry
                self.process_telemetry()
                
                # Process image capture
                self.process_image_capture()
                
                # Process commands
                self.process_commands()
                
                # Display status periodically
                if time.time() - last_status_display >= 60:
                    self.display_status()
                    last_status_display = time.time()
                
                # Sleep briefly to prevent CPU spinning
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n\n⚠ Shutdown requested by user...")
        except Exception as e:
            print(f"\n\n🚨 FATAL ERROR: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.shutdown()
    
    def shutdown(self):
        """Cleanup and shutdown"""
        print("\n🛑 Shutting down...")
        self.running = False
        
        # Emergency stop pump
        self.pump.emergency_stop()
        
        # Cleanup resources
        self.sensor_reader.cleanup()
        self.camera.cleanup()
        self.pump.cleanup()
        
        print("✓ Shutdown complete")
        print(f"Stopped: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n\nReceived interrupt signal...")
    sys.exit(0)


if __name__ == "__main__":
    # Setup signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and run monitor
    monitor = PlantMonitor()
    monitor.run()