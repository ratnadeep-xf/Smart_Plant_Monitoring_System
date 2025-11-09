"""
Configuration file for Raspberry Pi Plant Monitoring System
Copy this to config_local.py and update with your actual values
"""

import os

# ============================================
# API Configuration
# ============================================
# Your backend server URL (no trailing slash)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api")

# Device authentication token (must match DEVICE_TOKEN_SECRET in backend .env)
DEVICE_TOKEN = os.getenv("DEVICE_TOKEN", "your-device-token-secret-here")

# Unique identifier for this Raspberry Pi device
DEVICE_ID = os.getenv("DEVICE_ID", "raspberry-pi-001")

# ============================================
# Sensor Configuration
# ============================================
# Enable/disable individual sensors
ENABLE_SOIL_SENSOR = True
ENABLE_TEMPERATURE_SENSOR = True
ENABLE_HUMIDITY_SENSOR = True
ENABLE_LIGHT_SENSOR = True

# Sensor GPIO pins (BCM numbering)
SOIL_SENSOR_PIN = 4          # Analog soil moisture sensor (requires ADC)
TEMPERATURE_HUMIDITY_PIN = 17  # DHT22 or DHT11 sensor
LIGHT_SENSOR_PIN = 27        # Analog light sensor (requires ADC)

# ADC Configuration (if using MCP3008 for analog sensors)
ADC_ENABLED = True
ADC_CLK_PIN = 11
ADC_DOUT_PIN = 9
ADC_DIN_PIN = 10
ADC_CS_PIN = 8

# Sensor calibration values
SOIL_SENSOR_MIN = 0      # ADC value when completely dry
SOIL_SENSOR_MAX = 1023   # ADC value when fully saturated

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
ENABLE_AUTO_WATERING = True

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
