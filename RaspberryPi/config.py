"""
Configuration file for Raspberry Pi Plant Monitoring System
Copy this to config_local.py and update with your actual values
"""

import os

# ============================================
# API Configuration
# ============================================
# Your backend server URL (no trailing slash)
API_BASE_URL = os.getenv("API_BASE_URL", "https://smart-plant-monitoring-system.vercel.app/api")

# Device authentication token (must match DEVICE_TOKEN_SECRET in backend .env)
DEVICE_TOKEN = os.getenv("DEVICE_TOKEN", "/gYSguYys3l5YxurQV8GwTIYmjndII8DAXyzWXdcG/I=")

# Unique identifier for this Raspberry Pi device
DEVICE_ID = os.getenv("DEVICE_ID", "raspberry-pi-001")

# ============================================
# Sensor Configuration (Analog via MCP3008)
# ============================================
# Enable/disable individual sensors
ENABLE_SOIL_SENSOR = True
ENABLE_TEMPERATURE_SENSOR = True
ENABLE_HUMIDITY_SENSOR = True
ENABLE_LIGHT_SENSOR = True

# DHT22 Temperature/Humidity Sensor (Digital)
DHT_PIN = 17                  # GPIO pin for DHT22 sensor
DHT_SENSOR_TYPE = 22          # 22 for DHT22, 11 for DHT11

# ADC Configuration (MCP3008)
ADC_ENABLED = True            # Enable MCP3008 ADC
ADC_CLK_PIN = 11              # GPIO 11 (SCLK) - Pin 23
ADC_MISO_PIN = 9              # GPIO 9 (MISO) - Pin 21
ADC_MOSI_PIN = 10             # GPIO 10 (MOSI) - Pin 19
ADC_CS_PIN = 8                # GPIO 8 (CE0) - Pin 24

# Analog Sensor Channels on MCP3008
LIGHT_SENSOR_CHANNEL = 0      # MCP3008 CH0 → LDR (Light Dependent Resistor)
SOIL_MOISTURE_CHANNEL = 1     # MCP3008 CH1 → Soil Moisture Sensor

# Sensor Calibration Values
# These depend on your specific sensors and circuit
SOIL_SENSOR_MIN = 0           # ADC value when completely dry
SOIL_SENSOR_MAX = 1023        # ADC value when fully saturated
SOIL_SENSOR_DRY_VALUE = 1023  # Raw ADC value for dry soil
SOIL_SENSOR_WET_VALUE = 0     # Raw ADC value for wet soil

# LDR (Light) Calibration
LIGHT_SENSOR_MIN = 0          # ADC value in darkness
LIGHT_SENSOR_MAX = 1023       # ADC value in bright light
LIGHT_SENSOR_DARK_VALUE = 0   # Raw ADC value for darkness
LIGHT_SENSOR_BRIGHT_VALUE = 1023  # Raw ADC value for bright light

# For backward compatibility with sensors.py
TEMPERATURE_HUMIDITY_PIN = DHT_PIN


# ============================================
# Camera Configuration
# ============================================
ENABLE_CAMERA = True
CAMERA_RESOLUTION = (1024, 768)  # (width, height)
CAMERA_ROTATION = 0              # 0, 90, 180, or 270 degrees

# Image quality (1-100, higher = better quality but larger file)
IMAGE_QUALITY = 85

# ============================================
# Water Pump Configuration
# ============================================
ENABLE_PUMP = True              # Set to False when pump is not physically attached
PUMP_GPIO_PIN = 18               # GPIO pin connected to relay for pump
PUMP_ACTIVE_HIGH = True          # True if relay activates with HIGH signal
PUMP_MAX_DURATION = 10           # Maximum seconds pump can run (safety)
PUMP_MIN_INTERVAL = 300          # Minimum seconds between pump activations

# ============================================
# Timing Configuration
# ============================================
# How often to read sensors and send telemetry (seconds)
TELEMETRY_INTERVAL = 15

# How often to capture and upload images (seconds)
IMAGE_CAPTURE_INTERVAL = 300  # 5 minutes

# How often to poll for commands (seconds)
COMMAND_POLL_INTERVAL = 10

# ============================================
# Automatic Watering Configuration
# ============================================
# Enable local automatic watering based on thresholds
ENABLE_AUTO_WATERING = False

# Default thresholds (will be overridden by plant-specific thresholds from API)
DEFAULT_SOIL_MIN = 30      # % - water when soil moisture below this
DEFAULT_SOIL_MAX = 70      # % - stop watering when soil reaches this
DEFAULT_TEMP_MIN = 15      # °C
DEFAULT_TEMP_MAX = 30      # °C
DEFAULT_HUMIDITY_MIN = 40  # %
DEFAULT_HUMIDITY_MAX = 80  # %
DEFAULT_LIGHT_MIN = 200    # lux
DEFAULT_LIGHT_MAX = 2000   # lux

# Auto-watering behavior
AUTO_WATER_DURATION = 5    # Default watering duration (seconds)
AUTO_WATER_CHECK_INTERVAL = 60  # How often to check if watering needed (seconds)

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE = "plant_monitor.log"
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
LOG_BACKUP_COUNT = 5

# ============================================
# Retry Configuration
# ============================================
API_REQUEST_TIMEOUT = 30    # Timeout for API requests (seconds)
API_MAX_RETRIES = 3         # Number of retries for failed API calls
API_RETRY_DELAY = 5         # Initial delay between retries (seconds)

# ============================================
# Safety Configuration
# ============================================
# Emergency stop if sensors give invalid readings
ENABLE_SAFETY_CHECKS = True
SAFETY_MAX_TEMP = 50        # °C - emergency stop if temp exceeds this
SAFETY_MAX_HUMIDITY = 100   # % - emergency stop if humidity exceeds this

# ============================================
# Development/Testing
# ============================================
# Use mock sensors for testing without hardware
USE_MOCK_SENSORS = False

# Use mock camera for testing without camera
USE_MOCK_CAMERA = False

# Verbose debug output
DEBUG_MODE = False

# ============================================
# Local Configuration Override
# ============================================
# Try to import local configuration overrides
# Create config_local.py to override any settings above
try:
    from config_local import *
    print("✓ Loaded config_local.py overrides")
except ImportError:
    pass  # No local config file, use defaults above
