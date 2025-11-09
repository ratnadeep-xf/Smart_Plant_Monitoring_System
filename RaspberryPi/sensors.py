"""
Sensor reading module for Raspberry Pi Plant Monitoring System
Handles reading from soil moisture, temperature, humidity, and light sensors
"""

import time
import random
from typing import Dict, Optional

try:
    import RPi.GPIO as GPIO
    import Adafruit_DHT
    RPI_AVAILABLE = True
except ImportError:
    RPI_AVAILABLE = False
    print("Warning: RPi.GPIO or Adafruit_DHT not available. Using mock sensors.")

from config import *


class SensorReader:
    """Handles reading from all connected sensors"""
    
    def __init__(self, use_mock: bool = USE_MOCK_SENSORS):
        """
        Initialize sensor reader
        
        Args:
            use_mock: Use mock data instead of real sensors (for testing)
        """
        self.use_mock = use_mock or not RPI_AVAILABLE
        
        if not self.use_mock:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            
            # Initialize ADC for analog sensors if enabled
            if ADC_ENABLED:
                self._init_adc()
        
        self.last_reading = None
        print(f"SensorReader initialized (mock={'ON' if self.use_mock else 'OFF'})")
    
    def _init_adc(self):
        """Initialize MCP3008 ADC for analog sensors"""
        try:
            GPIO.setup(ADC_CLK_PIN, GPIO.OUT)
            GPIO.setup(ADC_DOUT_PIN, GPIO.IN)
            GPIO.setup(ADC_DIN_PIN, GPIO.OUT)
            GPIO.setup(ADC_CS_PIN, GPIO.OUT)
            print("ADC initialized successfully")
        except Exception as e:
            print(f"Error initializing ADC: {e}")
    
    def _read_adc(self, channel: int) -> int:
        """
        Read from MCP3008 ADC channel
        
        Args:
            channel: ADC channel (0-7)
            
        Returns:
            ADC value (0-1023)
        """
        if self.use_mock:
            return random.randint(0, 1023)
        
        try:
            GPIO.output(ADC_CS_PIN, GPIO.HIGH)
            GPIO.output(ADC_CLK_PIN, GPIO.LOW)
            GPIO.output(ADC_CS_PIN, GPIO.LOW)
            
            command = channel
            command |= 0x18  # Start bit + single-ended bit
            command <<= 3
            
            for i in range(5):
                if command & 0x80:
                    GPIO.output(ADC_DIN_PIN, GPIO.HIGH)
                else:
                    GPIO.output(ADC_DIN_PIN, GPIO.LOW)
                command <<= 1
                GPIO.output(ADC_CLK_PIN, GPIO.HIGH)
                GPIO.output(ADC_CLK_PIN, GPIO.LOW)
            
            result = 0
            for i in range(12):
                GPIO.output(ADC_CLK_PIN, GPIO.HIGH)
                GPIO.output(ADC_CLK_PIN, GPIO.LOW)
                result <<= 1
                if GPIO.input(ADC_DOUT_PIN):
                    result |= 0x1
            
            GPIO.output(ADC_CS_PIN, GPIO.HIGH)
            result >>= 1
            return result
            
        except Exception as e:
            print(f"Error reading ADC channel {channel}: {e}")
            return 0
    
    def read_soil_moisture(self) -> Optional[float]:
        """
        Read soil moisture percentage
        
        Returns:
            Soil moisture percentage (0-100) or None if error
        """
        if not ENABLE_SOIL_SENSOR:
            return None
        
        if self.use_mock:
            return round(random.uniform(30, 70), 1)
        
        try:
            # Read from ADC channel 0
            raw_value = self._read_adc(0)
            
            # Convert to percentage (inverted - lower value = wetter soil)
            percentage = 100 - ((raw_value - SOIL_SENSOR_MIN) / 
                               (SOIL_SENSOR_MAX - SOIL_SENSOR_MIN) * 100)
            
            # Clamp to 0-100
            percentage = max(0, min(100, percentage))
            
            return round(percentage, 1)
            
        except Exception as e:
            print(f"Error reading soil moisture: {e}")
            return None
    
    def read_temperature_humidity(self) -> tuple[Optional[float], Optional[float]]:
        """
        Read temperature and humidity from DHT sensor
        
        Returns:
            Tuple of (temperature_celsius, humidity_percent)
        """
        if self.use_mock:
            temp = round(random.uniform(18, 28), 1) if ENABLE_TEMPERATURE_SENSOR else None
            humid = round(random.uniform(40, 70), 1) if ENABLE_HUMIDITY_SENSOR else None
            return temp, humid
        
        try:
            # DHT22 sensor (change to Adafruit_DHT.DHT11 if using DHT11)
            humidity, temperature = Adafruit_DHT.read_retry(
                Adafruit_DHT.DHT22,
                TEMPERATURE_HUMIDITY_PIN,
                retries=3,
                delay_seconds=2
            )
            
            # Validate readings
            if humidity is not None and (humidity < 0 or humidity > 100):
                humidity = None
            
            if temperature is not None and (temperature < -40 or temperature > 80):
                temperature = None
            
            temp = round(temperature, 1) if temperature is not None and ENABLE_TEMPERATURE_SENSOR else None
            humid = round(humidity, 1) if humidity is not None and ENABLE_HUMIDITY_SENSOR else None
            
            return temp, humid
            
        except Exception as e:
            print(f"Error reading DHT sensor: {e}")
            return None, None
    
    def read_light_level(self) -> Optional[float]:
        """
        Read light level in lux
        
        Returns:
            Light level in lux or None if error
        """
        if not ENABLE_LIGHT_SENSOR:
            return None
        
        if self.use_mock:
            return round(random.uniform(200, 1500), 0)
        
        try:
            # Read from ADC channel 1
            raw_value = self._read_adc(1)
            
            # Convert to lux (calibration depends on your sensor)
            # This is a simple linear conversion - adjust based on your sensor
            lux = (raw_value / 1023.0) * 2000
            
            return round(lux, 0)
            
        except Exception as e:
            print(f"Error reading light level: {e}")
            return None
    
    def read_all(self) -> Dict:
        """
        Read all enabled sensors
        
        Returns:
            Dictionary with all sensor readings
        """
        temperature, humidity = self.read_temperature_humidity()
        
        reading = {
            'soil_pct': self.read_soil_moisture(),
            'temperature_c': temperature,
            'humidity_pct': humidity,
            'lux': self.read_light_level(),
            'timestamp': time.time()
        }
        
        self.last_reading = reading
        
        if DEBUG_MODE:
            print(f"Sensor readings: {reading}")
        
        return reading
    
    def is_reading_valid(self, reading: Dict) -> bool:
        """
        Check if sensor reading is valid and safe
        
        Args:
            reading: Sensor reading dictionary
            
        Returns:
            True if reading is valid and safe
        """
        if not ENABLE_SAFETY_CHECKS:
            return True
        
        # Check for None values
        has_data = any(v is not None for k, v in reading.items() if k != 'timestamp')
        if not has_data:
            print("Warning: No valid sensor data")
            return False
        
        # Check temperature safety
        if reading.get('temperature_c') is not None:
            if reading['temperature_c'] > SAFETY_MAX_TEMP:
                print(f"SAFETY: Temperature too high: {reading['temperature_c']}°C")
                return False
        
        # Check humidity safety
        if reading.get('humidity_pct') is not None:
            if reading['humidity_pct'] > SAFETY_MAX_HUMIDITY:
                print(f"SAFETY: Humidity too high: {reading['humidity_pct']}%")
                return False
        
        return True
    
    def cleanup(self):
        """Cleanup GPIO resources"""
        if not self.use_mock and RPI_AVAILABLE:
            GPIO.cleanup()
            print("GPIO cleanup completed")


# Test the sensor reader
if __name__ == "__main__":
    print("Testing sensor reader...")
    sensor = SensorReader(use_mock=True)
    
    for i in range(5):
        print(f"\nReading {i+1}:")
        data = sensor.read_all()
        for key, value in data.items():
            if value is not None:
                print(f"  {key}: {value}")
        time.sleep(2)
    
    sensor.cleanup()
    print("Test complete!")
