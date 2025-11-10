"""
Sensor reading module for Raspberry Pi Plant Monitoring System
Handles reading from digital GPIO sensors (D0 pins - no MCP3008 ADC)

Sensors:
- DHT22: Temperature & Humidity on GPIO 4
- Soil Moisture D0: Digital output on GPIO 27 (0=wet, 1=dry)
- LDR Light D0: Digital output on GPIO 17 (0=bright, 1=dark)
"""

import time
import random
from typing import Dict, Optional, Tuple

try:
    import RPi.GPIO as GPIO
    import adafruit_dht
    RPI_AVAILABLE = True
except ImportError:
    RPI_AVAILABLE = False
    print("Warning: RPi.GPIO or adafruit_dht not available. Using mock sensors.")

from config import *


class SensorReader:
    """Handles reading from all connected sensors"""
    
    def __init__(self, use_mock: bool = USE_MOCK_SENSORS):
        """
        Initialize sensor reader
        
        Args:
            use_mock: Use mock sensors for testing without hardware
        """
        self.use_mock = use_mock or not RPI_AVAILABLE
        
        if not self.use_mock:
            # Initialize GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)

            # Setup digital input pins
            if ENABLE_SOIL_SENSOR:
                GPIO.setup(SOIL_SENSOR_PIN, GPIO.IN)
                print(f"✓ Soil moisture sensor initialized on GPIO {SOIL_SENSOR_PIN}")
            
            if ENABLE_LIGHT_SENSOR:
                GPIO.setup(LIGHT_SENSOR_PIN, GPIO.IN)
                print(f"✓ Light sensor (LDR) initialized on GPIO {LIGHT_SENSOR_PIN}")
            
            if ENABLE_TEMPERATURE_SENSOR or ENABLE_HUMIDITY_SENSOR:
                print(f"✓ DHT22 sensor initialized on GPIO {TEMPERATURE_HUMIDITY_PIN}")
        
        self.last_reading = None
        print(f"SensorReader initialized (mock={'ON' if self.use_mock else 'OFF'})")

    # ================================================================
    # Sensor reading functions
    # ================================================================

    def read_soil_moisture(self) -> Optional[float]:
        """
        Read soil moisture percentage from digital D0 pin
        
        Digital output: 0 = wet soil, 1 = dry soil
        
        Returns:
            Soil moisture percentage (0-100)
        """
        if not ENABLE_SOIL_SENSOR:
            return None
        
        if self.use_mock:
            # Mock returns random value between 30-70%
            return round(random.uniform(30, 70), 1)

        try:
            # Read digital value from D0 pin
            digital_value = GPIO.input(SOIL_SENSOR_PIN)
            
            # Map digital value to percentage
            # 0 (LOW) = wet soil → higher percentage (e.g., 80%)
            # 1 (HIGH) = dry soil → lower percentage (e.g., 20%)
            if digital_value == SOIL_DIGITAL_WET_VALUE:
                percentage = SOIL_WET_PERCENTAGE
            else:
                percentage = SOIL_DRY_PERCENTAGE
            
            if DEBUG_MODE:
                print(f"Soil sensor D0={digital_value} → {percentage}%")
            
            return float(percentage)

        except Exception as e:
            print(f"Error reading soil moisture: {e}")
            return None

    def read_temperature_humidity(self) -> Tuple[Optional[float], Optional[float]]:
        """
        Read temperature and humidity from DHT22 sensor
        
        Returns:
            Tuple of (temperature_celsius, humidity_percentage)
        """
        if self.use_mock:
            temp = round(random.uniform(18, 28), 1) if ENABLE_TEMPERATURE_SENSOR else None
            humid = round(random.uniform(40, 70), 1) if ENABLE_HUMIDITY_SENSOR else None
            return temp, humid

        try:
            # Read from DHT22 sensor with retries
            humidity, temperature = adafruit_dht.read_retry(
             adafruit_dht.DHT22,
                TEMPERATURE_HUMIDITY_PIN,
                retries=3,
                delay_seconds=2
            )
            
            # Validate readings
            if humidity is not None and (humidity < 0 or humidity > 100):
                print(f"Invalid humidity reading: {humidity}%")
                humidity = None
            
            if temperature is not None and (temperature < -40 or temperature > 80):
                print(f"Invalid temperature reading: {temperature}°C")
                temperature = None
            
            # Round and apply enable flags
            temp = round(temperature, 1) if temperature is not None and ENABLE_TEMPERATURE_SENSOR else None
            humid = round(humidity, 1) if humidity is not None and ENABLE_HUMIDITY_SENSOR else None
            
            if DEBUG_MODE and (temp is not None or humid is not None):
                print(f"DHT22: Temp={temp}°C, Humidity={humid}%")
            
            return temp, humid

        except Exception as e:
            print(f"Error reading DHT22 sensor: {e}")
            return None, None

    def read_light_level(self) -> Optional[float]:
        """
        Read light level from digital LDR module D0 pin
        
        Digital output: 0 = bright light, 1 = dark/low light
        
        Returns:
            Approximate lux value
        """
        if not ENABLE_LIGHT_SENSOR:
            return None
        
        if self.use_mock:
            # Mock returns random value between 200-1500 lux
            return round(random.uniform(200, 1500), 0)

        try:
            # Read digital value from D0 pin
            digital_value = GPIO.input(LIGHT_SENSOR_PIN)
            
            # Map digital value to approximate lux
            # 0 (LOW) = bright → higher lux (e.g., 2000)
            # 1 (HIGH) = dark → lower lux (e.g., 100)
            if digital_value == LIGHT_DIGITAL_BRIGHT_VALUE:
                lux = LIGHT_BRIGHT_LUX
            else:
                lux = LIGHT_DARK_LUX
            
            if DEBUG_MODE:
                print(f"Light sensor D0={digital_value} → {lux} lux")
            
            return float(lux)

        except Exception as e:
            print(f"Error reading light level: {e}")
            return None

    def read_all(self) -> Dict:
        """
        Read all enabled sensors and return consolidated data
        
        Returns:
            Dictionary with all sensor readings and timestamp
        """
        # Read temperature and humidity together (DHT22)
        temperature, humidity = self.read_temperature_humidity()
        
        # Build reading dictionary
        reading = {
            'soil_pct': self.read_soil_moisture(),
            'temperature_c': temperature,
            'humidity_pct': humidity,
            'lux': self.read_light_level(),
            'timestamp': time.time()
        }
        
        self.last_reading = reading
        
        if DEBUG_MODE:
            print(f"📊 Sensor readings: {reading}")
        
        return reading

    def is_reading_valid(self, reading: Dict) -> bool:
        """
        Validate sensor reading data
        
        Args:
            reading: Dictionary with sensor data
            
        Returns:
            True if reading contains valid data
        """
        if not ENABLE_SAFETY_CHECKS:
            return True
        
        # Check if at least one sensor has data
        has_data = any(
            v is not None 
            for k, v in reading.items() 
            if k != 'timestamp'
        )
        
        if not has_data:
            print("⚠ Warning: No valid sensor data in reading")
            return False
        
        # Safety check: temperature
        if reading.get('temperature_c') is not None:
            if reading['temperature_c'] > SAFETY_MAX_TEMP:
                print(f"🚨 SAFETY: Temperature too high: {reading['temperature_c']}°C")
                return False
        
        # Safety check: humidity
        if reading.get('humidity_pct') is not None:
            if reading['humidity_pct'] > SAFETY_MAX_HUMIDITY:
                print(f"🚨 SAFETY: Humidity too high: {reading['humidity_pct']}%")
                return False
        
        return True

    def get_last_reading(self) -> Optional[Dict]:
        """
        Get the last successful reading
        
        Returns:
            Last reading dictionary or None
        """
        return self.last_reading

    def cleanup(self):
        """Cleanup GPIO resources"""
        if not self.use_mock and RPI_AVAILABLE:
            GPIO.cleanup()
            print("✓ GPIO cleanup completed")


# ================================================================
# Testing directly
# ================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("Testing Sensor Reader (Digital D0 Sensors)")
    print("=" * 60)
    print(f"DHT22 → GPIO {TEMPERATURE_HUMIDITY_PIN}")
    print(f"Soil Moisture D0 → GPIO {SOIL_SENSOR_PIN}")
    print(f"Light Sensor D0 → GPIO {LIGHT_SENSOR_PIN}")
    print("=" * 60)
    
    sensor = SensorReader(use_mock=False)

    try:
        for i in range(5):
            print(f"\n📊 Reading {i+1}/5:")
            data = sensor.read_all()
            
            # Display readings
            for key, value in data.items():
                if key == 'timestamp':
                    continue
                if value is not None:
                    unit = {
                        'soil_pct': '%',
                        'temperature_c': '°C',
                        'humidity_pct': '%',
                        'lux': ' lux'
                    }.get(key, '')
                    print(f"  {key:20s}: {value}{unit}")
                else:
                    print(f"  {key:20s}: N/A")
            
            # Validate
            valid = sensor.is_reading_valid(data)
            print(f"  Valid: {'✓ Yes' if valid else '✗ No'}")
            
            if i < 4:  # Don't sleep after last reading
                time.sleep(3)
    
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    finally:
        sensor.cleanup()
        print("\n✓ Test complete!")