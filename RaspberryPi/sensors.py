"""
Sensor reading module for Raspberry Pi Plant Monitoring System
Handles reading from soil moisture, temperature, humidity, and light sensors
"""

import time
import random
from typing import Dict, Optional

try:
    import RPi.GPIO as GPIO
    import adafruit_dht
    import board
    RPI_AVAILABLE = True
except ImportError:
    RPI_AVAILABLE = False
    print("Warning: RPi.GPIO or Adafruit libraries not available. Using mock sensors.")

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
        self.gpio_initialized = False
        
        if not self.use_mock:
            try:
                # Initialize GPIO mode if not already set
                # Don't call cleanup() here as it would reset other modules (like pump)
                try:
                    GPIO.setmode(GPIO.BCM)
                except ValueError:
                    # GPIO mode already set, that's fine
                    pass
                
                GPIO.setwarnings(False)  # Suppress GPIO warnings
                self.gpio_initialized = True
                print("✓ GPIO initialized")
            except Exception as e:
                print(f"✗ Error initializing GPIO: {e}")
                self.use_mock = True
                self.gpio_initialized = False

            # Initialize DHT sensor
            try:
                if DHT_SENSOR_TYPE == 22:
                    self.dht_device = adafruit_dht.DHT22(getattr(board, f"D{DHT_PIN}"))
                else:
                    self.dht_device = adafruit_dht.DHT11(getattr(board, f"D{DHT_PIN}"))
            except Exception as e:
                print("Error initializing DHT sensor:", e)
                self.dht_device = None
            
            # Initialize ADC for analog sensors if enabled
            self.adc_initialized = False
            if ADC_ENABLED:
                self._init_adc()
            else:
                print("ADC disabled in config")
        else:
            self.adc_initialized = False
            self.dht_device = None
        
        self.last_reading = None
        print(f"SensorReader initialized (mock={'ON' if self.use_mock else 'OFF'})")
    
    def _init_adc(self):
        """Initialize MCP3008 ADC for analog sensors"""
        if not self.gpio_initialized:
            print("✗ GPIO not initialized, cannot setup ADC")
            self.adc_initialized = False
            return
            
        try:
            # Set up GPIO pins for MCP3008 SPI communication with initial states
            GPIO.setup(ADC_CLK_PIN, GPIO.OUT, initial=GPIO.LOW)
            GPIO.setup(ADC_MISO_PIN, GPIO.IN)
            GPIO.setup(ADC_MOSI_PIN, GPIO.OUT, initial=GPIO.LOW)
            GPIO.setup(ADC_CS_PIN, GPIO.OUT, initial=GPIO.HIGH)
            
            # Store pin references
            self.adc_clk = ADC_CLK_PIN
            self.adc_miso = ADC_MISO_PIN
            self.adc_mosi = ADC_MOSI_PIN
            self.adc_cs = ADC_CS_PIN
            
            self.adc_initialized = True
            print("✓ MCP3008 ADC initialized successfully")
        except Exception as e:
            print(f"✗ Error initializing ADC: {e}")
            print("  Hint: Another process may be using GPIO pins")
            self.adc_initialized = False
    
    def _read_adc(self, channel: int) -> int:
        """Read from MCP3008 ADC channel with proper timing"""
        if self.use_mock:
            return random.randint(0, 1023)
        
        if not self.adc_initialized:
            print("ADC not initialized, using default value")
            return 0
        
        try:
            # Ensure clean state before starting
            time.sleep(0.001)  # 1ms settling time
            
            # Start communication - bring CS low
            GPIO.output(ADC_CS_PIN, GPIO.HIGH)
            time.sleep(0.0001)  # 100μs
            GPIO.output(ADC_CLK_PIN, GPIO.LOW)
            GPIO.output(ADC_CS_PIN, GPIO.LOW)
            
            # Send start bit, single-ended mode, and channel
            command = channel
            command |= 0x18  # Start bit + single-ended
            command <<= 3
            
            # Send command bits
            for i in range(5):
                if command & 0x80:
                    GPIO.output(ADC_MOSI_PIN, GPIO.HIGH)
                else:
                    GPIO.output(ADC_MOSI_PIN, GPIO.LOW)
                command <<= 1
                
                # Clock pulse with delay
                time.sleep(0.00001)  # 10μs
                GPIO.output(ADC_CLK_PIN, GPIO.HIGH)
                time.sleep(0.00001)  # 10μs
                GPIO.output(ADC_CLK_PIN, GPIO.LOW)
            
            # Read result bits (10-bit ADC = 10 bits, but we read 12 for alignment)
            result = 0
            for i in range(12):
                time.sleep(0.00001)  # 10μs
                GPIO.output(ADC_CLK_PIN, GPIO.HIGH)
                time.sleep(0.00001)  # 10μs
                GPIO.output(ADC_CLK_PIN, GPIO.LOW)
                result <<= 1
                if GPIO.input(ADC_MISO_PIN):
                    result |= 0x1
            
            # End communication - bring CS high
            GPIO.output(ADC_CS_PIN, GPIO.HIGH)
            
            # Shift result and mask to 10 bits
            result >>= 1
            result &= 0x3FF  # Mask to 10 bits (0-1023)
            
            return result
            
        except Exception as e:
            print(f"Error reading ADC channel {channel}: {e}")
            return 0
    
    def read_soil_moisture(self) -> Optional[float]:
        """Read soil moisture from MCP3008 CH1"""
        if not ENABLE_SOIL_SENSOR:
            return None
        
        if self.use_mock:
            return round(random.uniform(30, 70), 1)
        
        try:
            raw_value = self._read_adc(SOIL_MOISTURE_CHANNEL)
            # Convert to percentage (higher ADC = drier soil, so invert)
            percentage = 100 - ((raw_value / 1023.0) * 100)
            percentage = max(0, min(100, percentage))
            return round(percentage, 1)
            
        except Exception as e:
            print(f"Error reading soil moisture: {e}")
            return None
    
    def read_temperature_humidity(self) -> tuple[Optional[float], Optional[float]]:
        """Read temperature & humidity from DHT22"""
        if self.use_mock:
            temp = round(random.uniform(18, 28), 1) if ENABLE_TEMPERATURE_SENSOR else None
            humid = round(random.uniform(40, 70), 1) if ENABLE_HUMIDITY_SENSOR else None
            return temp, humid
        
        if not self.dht_device:
            print("DHT22 not initialized")
            return None, None

        try:
            temperature = self.dht_device.temperature
            humidity = self.dht_device.humidity

            if humidity is not None and (humidity < 0 or humidity > 100):
                humidity = None
            if temperature is not None and (temperature < -40 or temperature > 80):
                temperature = None
            
            temp = round(temperature, 1) if temperature is not None else None
            humid = round(humidity, 1) if humidity is not None else None
            
            return temp, humid
            
        except Exception as e:
            print(f"Error reading DHT sensor: {e}")
            return None, None
    
    def read_light_level(self) -> Optional[float]:
        """Read LDR light level from MCP3008 CH0"""
        if not ENABLE_LIGHT_SENSOR:
            return None
        
        if self.use_mock:
            return round(random.uniform(200, 1500), 0)
        
        try:
            raw_value = self._read_adc(LIGHT_SENSOR_CHANNEL)
            # Convert ADC value to lux (higher ADC = brighter)
            lux = (raw_value / 1023.0) * 2000
            return round(lux, 0)
            
        except Exception as e:
            print(f"Error reading light level: {e}")
            return None
    
    def read_all(self) -> Dict:
        """Read all sensors"""
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
        """Validate reading"""
        if not ENABLE_SAFETY_CHECKS:
            return True
        
        has_data = any(v is not None for k, v in reading.items() if k != 'timestamp')
        if not has_data:
            print("Warning: No valid sensor data")
            return False
        
        if reading.get('temperature_c') is not None:
            if reading['temperature_c'] > SAFETY_MAX_TEMP:
                print(f"SAFETY: Temperature too high: {reading['temperature_c']}°C")
                return False
        
        if reading.get('humidity_pct') is not None:
            if reading['humidity_pct'] > SAFETY_MAX_HUMIDITY:
                print(f"SAFETY: Humidity too high: {reading['humidity_pct']}%")
                return False
        
        return True
    
    def cleanup(self):
        """Cleanup GPIO resources"""
        if not self.use_mock and RPI_AVAILABLE and self.gpio_initialized:
            try:
                # Only cleanup sensor-specific pins, not all GPIO
                # This prevents interfering with pump or other modules
                if self.adc_initialized:
                    GPIO.cleanup([ADC_CLK_PIN, ADC_MISO_PIN, ADC_MOSI_PIN, ADC_CS_PIN])
                if self.dht_initialized:
                    GPIO.cleanup(DHT_PIN)
                print("✓ Sensor GPIO cleanup completed")
                self.gpio_initialized = False
                self.adc_initialized = False
            except Exception as e:
                print(f"⚠ GPIO cleanup error: {e}")


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
