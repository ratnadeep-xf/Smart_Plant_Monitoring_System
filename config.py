"""
Configuration file for Raspberry Pi Plant Monitoring System
Updated for direct GPIO digital sensors (no MCP3008)
"""

import os

# ============================================
# API Configuration
# ============================================
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api")
DEVICE_TOKEN = os.getenv("DEVICE_TOKEN", "your-device-token-secret-here")
DEVICE_ID = os.getenv("DEVICE_ID", "raspberry-pi-001")

# ============================================
# Sensor Configuration (Digital D0 Pins)
# ============================================
ENABLE_SOIL_SENSOR = True
ENABLE_TEMPERATURE_SENSOR = True
ENABLE_HUMIDITY_SENSOR = True
ENABLE_LIGHT_SENSOR = True

# GPIO Pin Configuration (BCM numbering)
# DHT22 (temperature & humidity) → GPIO 4
# Soil moisture sensor D0 (digital) → GPIO 27
# LDR light sensor D0 (digital) → GPIO 17
TEMPERATURE_HUMIDITY_PIN = 4
SOIL_SENSOR_PIN = 27
LIGHT_SENSOR_PIN = 17

# No ADC - Using digital sensors only
ADC_ENABLED = False

# Digital sensor thresholds
# For D0 pins: 0 = condition met (wet/bright), 1 = condition not met (dry/dark)
SOIL_DIGITAL_WET_VALUE = 0   # D0 = 0 when soil is wet
SOIL_DIGITAL_DRY_VALUE = 1   # D0 = 1 when soil is dry
LIGHT_DIGITAL_BRIGHT_VALUE = 0  # D0 = 0 when bright
LIGHT_DIGITAL_DARK_VALUE = 1    # D0 = 1 when dark

# Mapping digital values to percentages/lux
SOIL_WET_PERCENTAGE = 80   # When D0 = 0 (wet)
SOIL_DRY_PERCENTAGE = 20   # When D0 = 1 (dry)
LIGHT_BRIGHT_LUX = 2000    # When D0 = 0 (bright)
LIGHT_DARK_LUX = 100       # When D0 = 1 (dark)

# ============================================
# Camera Configuration
# ============================================
ENABLE_CAMERA = True
CAMERA_RESOLUTION = (1024, 768)
CAMERA_ROTATION = 0
IMAGE_QUALITY = 85

# ============================================
# Water Pump Configuration
# ============================================
PUMP_GPIO_PIN = 18
PUMP_ACTIVE_HIGH = True
PUMP_MAX_DURATION = 10
PUMP_MIN_INTERVAL = 300  # 5 minutes between activations

# ============================================
# Timing Configuration (in seconds)
# ============================================
TELEMETRY_INTERVAL = 15        # Send sensor data every 15 seconds
IMAGE_CAPTURE_INTERVAL = 300   # Capture image every 5 minutes
COMMAND_POLL_INTERVAL = 10     # Check for commands every 10 seconds

# ============================================
# Automatic Watering Configuration
# ============================================
ENABLE_AUTO_WATERING = True
DEFAULT_SOIL_MIN = 30          # Water when below 30%
DEFAULT_SOIL_MAX = 70
DEFAULT_TEMP_MIN = 15
DEFAULT_TEMP_MAX = 30
DEFAULT_HUMIDITY_MIN = 40
DEFAULT_HUMIDITY_MAX = 80
DEFAULT_LIGHT_MIN = 200
DEFAULT_LIGHT_MAX = 2000
AUTO_WATER_DURATION = 5        # Water for 5 seconds
AUTO_WATER_CHECK_INTERVAL = 60 # Check soil every 60 seconds

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL = "INFO"
LOG_FILE = "plant_monitor.log"
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
LOG_BACKUP_COUNT = 5

# ============================================
# Retry Configuration
# ============================================
API_REQUEST_TIMEOUT = 30
API_MAX_RETRIES = 3
API_RETRY_DELAY = 5

# ============================================
# Safety Configuration
# ============================================
ENABLE_SAFETY_CHECKS = True
SAFETY_MAX_TEMP = 50      # Maximum temperature in Celsius
SAFETY_MAX_HUMIDITY = 100 # Maximum humidity percentage

# ============================================
# Development/Testing
# ============================================
USE_MOCK_SENSORS = False   # Set to True for testing without hardware
USE_MOCK_CAMERA = False    # Set to True for testing without camera
DEBUG_MODE = True          # Enable detailed logging