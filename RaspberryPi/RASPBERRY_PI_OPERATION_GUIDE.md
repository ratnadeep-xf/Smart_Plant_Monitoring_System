# Raspberry Pi Plant Monitoring System - Complete Operation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Hardware Setup](#hardware-setup)
3. [Software Architecture](#software-architecture)
4. [Operation Flow](#operation-flow)
5. [API Communication](#api-communication)
6. [Auto-Watering Logic](#auto-watering-logic)
7. [Command Execution](#command-execution)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

The Raspberry Pi Plant Monitoring System is a sophisticated IoT application that continuously monitors plant health, captures images for AI analysis, and automatically waters plants based on sensor readings and configurable thresholds.

### What the Pi Does

1. **Sensor Monitoring**: Reads soil moisture, temperature, humidity, and light levels every 15 seconds
2. **Data Transmission**: Sends sensor readings to backend API for storage and analysis
3. **Image Capture**: Takes plant photos every 5 minutes
4. **AI Analysis**: Uploads images to backend for disease detection via Hugging Face model
5. **Threshold Updates**: Receives optimal plant care parameters from AI analysis
6. **Auto-Watering**: Activates water pump when soil moisture drops below threshold
7. **Remote Control**: Polls and executes commands from dashboard (manual watering, etc.)
8. **Status Reporting**: Provides real-time feedback and health monitoring

### Key Features

- **Autonomous Operation**: Runs continuously without human intervention
- **Safety Mechanisms**: Cooldown periods, maximum pump duration, emergency stop
- **Mock Modes**: Can test without physical hardware connected
- **Resilient Communication**: Automatic retry with exponential backoff
- **Graceful Shutdown**: Clean GPIO cleanup on exit (Ctrl+C)

---

## Hardware Setup

### Required Components

1. **Raspberry Pi** (3B+ or 4 recommended)
2. **Sensors**:
   - Soil Moisture Sensor (analog, via MCP3008 ADC channel 0)
   - DHT22 Temperature/Humidity Sensor (GPIO 17)
   - Light Sensor (analog, via MCP3008 ADC channel 1)
3. **MCP3008 ADC** (Analog-to-Digital Converter)
4. **Camera Module** (Raspberry Pi Camera v1/v2)
5. **Water Pump** (controlled via relay on GPIO 18)
6. **5V Relay Module** (for pump control)
7. **Power Supply** (appropriate for Pi + pump)

### Wiring Diagram

#### MCP3008 ADC Connection to Raspberry Pi
```
MCP3008 Pin  →  Raspberry Pi Pin
VDD          →  3.3V (Pin 1)
VREF         →  3.3V (Pin 1)
AGND         →  GND (Pin 6)
DGND         →  GND (Pin 6)
CLK          →  GPIO 11 (SCLK, Pin 23)
DOUT         →  GPIO 9 (MISO, Pin 21)
DIN          →  GPIO 10 (MOSI, Pin 19)
CS/SHDN      →  GPIO 8 (CE0, Pin 24)

CH0          →  Soil Moisture Sensor (analog out)
CH1          →  Light Sensor (analog out)
```

#### DHT22 Temperature/Humidity Sensor
```
DHT22 Pin 1 (VCC)   →  5V (Pin 2)
DHT22 Pin 2 (DATA)  →  GPIO 17 (Pin 11)
DHT22 Pin 4 (GND)   →  GND (Pin 9)
+ 10kΩ pull-up resistor between VCC and DATA
```

#### Water Pump Relay
```
Relay VCC    →  5V (Pin 4)
Relay GND    →  GND (Pin 14)
Relay IN     →  GPIO 18 (Pin 12)
Relay NO     →  Pump positive
Pump GND     →  External power supply GND
```

#### Camera Module
```
Connect to Pi's CSI camera port (ribbon cable)
```

### Safety Considerations

- **Pump Power**: Use external power supply for pump (not Pi's 5V rail)
- **Relay Type**: Code supports active-high or active-low relays (configure in `config.py`)
- **Water Protection**: Keep Pi and electronics away from water
- **Grounding**: Connect external pump power GND to Pi GND (common ground)

---

## Software Architecture

### Module Structure

The system is divided into modular Python files, each with a specific responsibility:

```
RaspberryPi/
├── config.py           # Central configuration (all settings)
├── sensors.py          # Sensor reading (SensorReader class)
├── camera.py           # Image capture (CameraHandler class)
├── pump.py             # Water pump control (PumpController class)
├── api_client.py       # Backend communication (APIClient class)
├── main.py             # Orchestration (PlantMonitor class)
├── requirements.txt    # Python dependencies
├── install.sh          # Installation script
└── config_local.py     # Local overrides (created during install)
```

### Class Responsibilities

#### `SensorReader` (sensors.py)
- Reads analog sensors via MCP3008 ADC (soil moisture, light)
- Reads digital DHT22 sensor (temperature, humidity)
- Provides mock mode for testing without hardware
- Validates readings and applies calibration

#### `CameraHandler` (camera.py)
- Captures images using Raspberry Pi Camera
- Configurable resolution, rotation, JPEG quality
- Mock mode generates test images
- Returns image as bytes for upload

#### `PumpController` (pump.py)
- Controls water pump via GPIO relay
- Enforces minimum interval between activations (300s default)
- Enforces maximum pump duration (10s default)
- Tracks activation history for safety
- Supports emergency stop

#### `APIClient` (api_client.py)
- Sends telemetry data to backend (`POST /api/telemetry`)
- Uploads images for AI analysis (`POST /api/image`)
- Polls for queued commands (`GET /api/commands`)
- Acknowledges command completion (`POST /api/commands/:id`)
- Implements retry logic with exponential backoff

#### `PlantMonitor` (main.py)
- Main application loop
- Orchestrates all components
- Implements periodic tasks (telemetry, images, commands)
- Executes auto-watering logic
- Handles graceful shutdown

---

## Operation Flow

### Startup Sequence

1. **Initialization**:
   ```
   Load config.py → Import local overrides
   ↓
   Initialize SensorReader → Setup ADC, GPIO
   ↓
   Initialize CameraHandler → Test camera
   ↓
   Initialize PumpController → Configure pump GPIO
   ↓
   Initialize APIClient → Test backend connectivity
   ↓
   PlantMonitor starts main loop
   ```

2. **Main Loop** (runs continuously until Ctrl+C):
   ```python
   while True:
       # Every 15 seconds: Telemetry
       if time_since_last_telemetry >= 15s:
           read_sensors()
           send_to_backend()
           check_auto_watering()
       
       # Every 5 minutes: Image Capture
       if time_since_last_image >= 300s:
           capture_image()
           upload_for_ai_analysis()
           update_thresholds_from_response()
       
       # Every 10 seconds: Command Polling
       if time_since_last_command_check >= 10s:
           poll_commands_from_backend()
           execute_queued_commands()
       
       # Every 60 seconds: Status Display
       if time_since_last_status >= 60s:
           display_current_status()
       
       sleep(1 second)
   ```

### Detailed Process Flow

#### 1. Telemetry Processing (`process_telemetry`)

**Frequency**: Every 15 seconds

**Steps**:
1. Call `sensor_reader.read_all()` to get current readings
2. Create telemetry payload:
   ```json
   {
     "deviceId": "pi_001",
     "soilMoisture": 45.3,
     "temperature": 22.5,
     "humidity": 60.2,
     "lightLevel": 750,
     "timestamp": "2024-01-15T10:30:00Z"
   }
   ```
3. Send to backend via `api_client.send_telemetry(data)`
4. Backend stores in database, updates dashboard in real-time
5. Store latest values for auto-watering checks

**Error Handling**:
- Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Log errors but continue operation
- Don't crash on network failures

#### 2. Image Capture & AI Analysis (`process_image_capture`)

**Frequency**: Every 5 minutes

**Steps**:
1. Call `camera_handler.capture_image()` to take photo
2. Get image bytes (JPEG format)
3. Upload to backend via `api_client.upload_image(image_bytes, device_id)`
4. Backend API route (`POST /api/image`):
   - Uploads to Cloudinary
   - Sends to Hugging Face AI model
   - Analyzes for plant diseases
   - Determines optimal thresholds based on plant type
5. Backend response includes updated thresholds:
   ```json
   {
     "success": true,
     "thresholds": {
       "soilMoisture": { "min": 40, "max": 60 },
       "temperature": { "min": 18, "max": 28 },
       "humidity": { "min": 50, "max": 70 }
     }
   }
   ```
6. Pi updates local threshold cache
7. Use new thresholds for auto-watering decisions

**Why This Matters**:
- Different plants need different care (succulents vs. ferns)
- AI identifies plant type from image
- Thresholds adjust automatically
- Example: Succulent detected → lower soil moisture threshold (30-45%)
- Example: Fern detected → higher soil moisture threshold (50-70%)

#### 3. Auto-Watering Logic (`check_and_water_if_needed`)

**Frequency**: Every telemetry cycle (15s) or on-demand

**Decision Tree**:
```
Check if thresholds are loaded?
├─ NO → Skip (wait for first image analysis)
└─ YES → Continue

Check soil moisture < threshold.min?
├─ NO → No action needed
└─ YES → Continue

Check pump can activate? (safety checks)
├─ NO → Log reason, skip
│   Reasons: Cooldown period, max duration exceeded
└─ YES → Activate pump

Activate pump:
1. Log action: "Auto-watering triggered: 45.3% < 50%"
2. Call pump_controller.activate(duration=5.0)
3. GPIO HIGH on pin 18 (relay activates)
4. Water flows for 5 seconds
5. GPIO LOW on pin 18 (relay deactivates)
6. Record activation time for cooldown tracking
7. Send success/failure result
```

**Safety Mechanisms**:
```python
# Minimum interval between waterings (prevents flooding)
MIN_PUMP_INTERVAL = 300  # 5 minutes

# Maximum pump run time (prevents burnout)
MAX_PUMP_DURATION = 10   # 10 seconds

# Cooldown check
if (current_time - last_activation) < MIN_PUMP_INTERVAL:
    return False, "Pump cooldown active"

# Duration check
if requested_duration > MAX_PUMP_DURATION:
    return False, f"Duration {duration}s exceeds max {MAX_PUMP_DURATION}s"
```

#### 4. Command Execution (`process_commands`)

**Frequency**: Every 10 seconds

**Flow**:
1. Poll backend for pending commands:
   ```http
   GET /api/commands?deviceId=pi_001
   ```
2. Backend checks database for commands with status='pending'
3. Receive command list:
   ```json
   [
     {
       "id": "cmd_123",
       "deviceId": "pi_001",
       "type": "water",
       "payload": { "duration": 3 },
       "status": "pending",
       "createdAt": "2024-01-15T10:35:00Z"
     }
   ]
   ```
4. For each command, execute based on type:
   - **Type: "water"**: Activate pump
     ```python
     duration = command['payload'].get('duration', 5)
     success = pump_controller.activate(duration)
     result = "Watered for 3s" if success else "Pump cooldown active"
     ```
   - **Type: "status"**: Return current sensor readings
   - **Type: "restart"**: Restart application
   - **Type: "stop_pump"**: Emergency stop

5. Acknowledge command completion:
   ```http
   POST /api/commands/cmd_123
   {
     "status": "completed",
     "result": "Watered for 3 seconds"
   }
   ```
6. Backend updates command status in database
7. Dashboard sees real-time update

**Command Types**:
- `water`: Manual watering (payload: `{duration: 3}`)
- `status`: Request status report
- `restart`: Restart monitoring application
- `stop_pump`: Emergency pump shutoff

---

## API Communication

### Authentication

All API requests include device authentication:
```python
headers = {
    'Authorization': f'Bearer {DEVICE_TOKEN_SECRET}',
    'Content-Type': 'application/json'
}
```

Backend verifies token in middleware (`authDevice.js`).

### Endpoints Used

#### 1. POST /api/telemetry
**Purpose**: Send sensor readings to backend

**Request**:
```json
{
  "deviceId": "pi_001",
  "soilMoisture": 45.3,
  "temperature": 22.5,
  "humidity": 60.2,
  "lightLevel": 750,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Telemetry data received"
}
```

**Backend Actions**:
- Validates data
- Stores in database
- Emits real-time update via SSE (`lib/realtime.js`)
- Dashboard updates live gauges/charts

#### 2. POST /api/image
**Purpose**: Upload image for AI analysis

**Request**: Multipart form data
```
image: <binary data>
deviceId: "pi_001"
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/...",
  "thresholds": {
    "soilMoisture": { "min": 40, "max": 60 },
    "temperature": { "min": 18, "max": 28 },
    "humidity": { "min": 50, "max": 70 }
  },
  "diseaseDetected": false,
  "aiResponse": {
    "plantType": "Monstera Deliciosa",
    "confidence": 0.94
  }
}
```

**Backend Actions**:
- Upload to Cloudinary for storage
- Send image to Hugging Face model
- Identify plant type
- Determine optimal care thresholds
- Store image URL in database
- Return thresholds to Pi

#### 3. GET /api/commands
**Purpose**: Poll for pending commands

**Request**:
```
GET /api/commands?deviceId=pi_001
```

**Response**:
```json
[
  {
    "id": "cmd_abc123",
    "deviceId": "pi_001",
    "type": "water",
    "payload": { "duration": 3 },
    "status": "pending",
    "createdAt": "2024-01-15T10:35:00Z"
  }
]
```

**Backend Actions**:
- Query database for commands where deviceId matches and status='pending'
- Return sorted by createdAt (oldest first)

#### 4. POST /api/commands/:id
**Purpose**: Acknowledge command completion

**Request**:
```json
{
  "status": "completed",
  "result": "Watered for 3 seconds"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Command updated"
}
```

**Backend Actions**:
- Update command status in database
- Set completedAt timestamp
- Store result message
- Emit real-time update to dashboard

### Retry Logic

**Exponential Backoff Strategy**:
```python
max_retries = 3
base_delay = 1  # seconds

for attempt in range(max_retries):
    try:
        response = requests.post(url, json=data, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        if attempt < max_retries - 1:
            delay = base_delay * (2 ** attempt)  # 1s, 2s, 4s
            time.sleep(delay)
        else:
            raise  # Give up after 3 attempts
```

**Why This Matters**:
- Network can be temporarily unavailable
- Backend might restart
- Prevents data loss
- Ensures reliable communication

---

## Auto-Watering Logic

### Threshold System

**How Thresholds Work**:
1. Default thresholds in `config.py` (conservative values)
2. AI analysis updates thresholds based on plant type
3. Pi uses latest thresholds for decisions
4. Each plant type has specific needs

**Example Threshold Values**:
```python
# Succulent (detected by AI)
{
  "soilMoisture": {"min": 30, "max": 45},  # Prefers dry soil
  "temperature": {"min": 15, "max": 30},
  "humidity": {"min": 30, "max": 50}
}

# Fern (detected by AI)
{
  "soilMoisture": {"min": 50, "max": 70},  # Needs moist soil
  "temperature": {"min": 18, "max": 25},
  "humidity": {"min": 60, "max": 80}
}
```

### Decision Algorithm

**Pseudocode**:
```python
def should_water():
    # Step 1: Check if thresholds loaded
    if not thresholds_received:
        return False, "Waiting for first AI analysis"
    
    # Step 2: Get current soil moisture
    current_moisture = sensors.read_soil_moisture()
    threshold_min = thresholds['soilMoisture']['min']
    
    # Step 3: Compare
    if current_moisture < threshold_min:
        # Step 4: Safety checks
        if not pump.can_activate():
            return False, pump.get_reason()
        
        # Step 5: Calculate duration
        deficit = threshold_min - current_moisture
        duration = min(deficit * 0.1, MAX_PUMP_DURATION)  # Scale duration
        
        # Step 6: Water
        return True, duration
    else:
        return False, "Soil moisture adequate"
```

**Example Scenario**:
```
Current soil moisture: 35%
Threshold minimum: 50%
Deficit: 15%
Calculated duration: 15 * 0.1 = 1.5 seconds
Action: Activate pump for 1.5 seconds
```

### Feedback Loop

```
Sensor Reads 35% → Below 50% threshold
↓
Auto-water for 1.5 seconds
↓
Wait 15 seconds (next telemetry cycle)
↓
Sensor Reads 48% → Still below 50%
↓
Auto-water for 0.2 seconds
↓
Wait 15 seconds
↓
Sensor Reads 52% → Above 50% ✓
↓
No action, soil moisture adequate
```

This gradual approach prevents over-watering.

---

## Command Execution

### Command Queue Flow

**Dashboard to Pi**:
```
User clicks "Water Now" on dashboard
↓
Dashboard sends: POST /api/control/water
  Body: { deviceId: "pi_001", duration: 3 }
↓
Backend deviceService.queueCommand():
  INSERT INTO Command (deviceId, type, payload, status)
  VALUES ('pi_001', 'water', '{"duration":3}', 'pending')
↓
Command saved in database with status='pending'
↓
Pi polls: GET /api/commands?deviceId=pi_001
↓
Backend returns pending commands
↓
Pi receives command, executes water(3)
↓
Pi acknowledges: POST /api/commands/cmd_123
  Body: { status: "completed", result: "Watered for 3s" }
↓
Backend updates command status='completed'
↓
Dashboard shows "Command completed: Watered for 3s"
```

### Command Types in Detail

#### Water Command
```json
{
  "type": "water",
  "payload": { "duration": 3 }
}
```
**Execution**:
1. Validate duration (must be ≤ MAX_PUMP_DURATION)
2. Check pump cooldown
3. Activate pump for specified duration
4. Return result: "Watered for Xs" or error message

#### Status Command
```json
{
  "type": "status",
  "payload": {}
}
```
**Execution**:
1. Read all sensors
2. Get pump state
3. Return comprehensive status:
   ```json
   {
     "soilMoisture": 45.3,
     "temperature": 22.5,
     "humidity": 60.2,
     "lightLevel": 750,
     "pumpActive": false,
     "lastWatering": "2024-01-15T10:30:00Z",
     "uptime": 3600
   }
   ```

#### Restart Command
```json
{
  "type": "restart",
  "payload": {}
}
```
**Execution**:
1. Acknowledge command
2. Cleanup GPIO
3. Exit application (systemd restarts automatically)

#### Stop Pump Command
```json
{
  "type": "stop_pump",
  "payload": {}
}
```
**Execution**:
1. Immediately call `pump.emergency_stop()`
2. Set GPIO LOW (relay off)
3. Reset pump state
4. Return "Pump stopped"

---

## Configuration

### config.py Structure

**API Configuration**:
```python
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')
DEVICE_TOKEN_SECRET = os.getenv('DEVICE_TOKEN_SECRET', 'your-secret-token')
DEVICE_ID = os.getenv('DEVICE_ID', 'pi_001')
```

**Sensor Pins**:
```python
DHT_PIN = 17              # DHT22 data pin (GPIO17)
ADC_CLK_PIN = 11          # MCP3008 clock
ADC_MISO_PIN = 9          # MCP3008 master in, slave out
ADC_MOSI_PIN = 10         # MCP3008 master out, slave in
ADC_CS_PIN = 8            # MCP3008 chip select
SOIL_MOISTURE_CHANNEL = 0 # ADC channel for soil sensor
LIGHT_SENSOR_CHANNEL = 1  # ADC channel for light sensor
```

**Pump Configuration**:
```python
PUMP_GPIO = 18            # GPIO pin for pump relay
ACTIVE_HIGH = True        # True if relay activates on HIGH, False for active-low
MIN_PUMP_INTERVAL = 300   # Minimum seconds between activations
MAX_PUMP_DURATION = 10    # Maximum pump run time
```

**Timing Intervals**:
```python
TELEMETRY_INTERVAL = 15    # Seconds between sensor readings
IMAGE_INTERVAL = 300       # Seconds between photos (5 minutes)
COMMAND_POLL_INTERVAL = 10 # Seconds between command checks
STATUS_DISPLAY_INTERVAL = 60  # Seconds between status logs
AUTO_WATER_CHECK_INTERVAL = 60  # Seconds between auto-water checks
```

**Default Thresholds** (used until AI updates them):
```python
DEFAULT_THRESHOLDS = {
    'soilMoisture': {'min': 40, 'max': 60},
    'temperature': {'min': 18, 'max': 28},
    'humidity': {'min': 50, 'max': 70}
}
```

**Mock Modes** (for testing without hardware):
```python
USE_MOCK_SENSORS = False  # Use random sensor data
USE_MOCK_CAMERA = False   # Generate test images
```

### Environment Variables

Create `.env` file or set in shell:
```bash
export API_BASE_URL=https://your-backend.com
export DEVICE_TOKEN_SECRET=your_actual_secret_token
export DEVICE_ID=pi_greenhouse_001
```

Or create `config_local.py` to override:
```python
# config_local.py
API_BASE_URL = 'https://my-plant-backend.herokuapp.com'
DEVICE_TOKEN_SECRET = 'abc123xyz456'
DEVICE_ID = 'pi_greenhouse_001'
```

---

## Troubleshooting

### Common Issues

#### 1. "Connection refused" or "Network unreachable"

**Symptoms**: Pi can't connect to backend API

**Causes**:
- Wrong API_BASE_URL
- Backend server not running
- Network/firewall issues
- Wrong device token

**Solutions**:
```bash
# Test network connectivity
ping google.com

# Test backend reachability
curl https://your-backend.com/api/latest

# Check config
cat config_local.py

# Verify token
# Backend logs should show "Device authenticated: pi_001"
```

#### 2. "Camera not detected"

**Symptoms**: `picamera.exc.PiCameraError: Camera is not enabled`

**Solutions**:
```bash
# Enable camera
sudo raspi-config
# Interface Options → Camera → Enable

# Verify camera
vcgencmd get_camera
# Should show: supported=1 detected=1

# Test camera
raspistill -o test.jpg

# Reboot if needed
sudo reboot
```

#### 3. "Pump won't activate"

**Symptoms**: Command sent but pump doesn't run

**Causes**:
- Cooldown period active
- Wrong GPIO pin
- Wrong relay type (active-high vs active-low)
- Power supply issues

**Solutions**:
```python
# Check cooldown
# Look for log: "Pump cooldown active, X seconds remaining"

# Test GPIO manually
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(18, GPIO.OUT)
GPIO.output(18, GPIO.HIGH)  # Should activate relay
# Listen for relay click
GPIO.output(18, GPIO.LOW)
GPIO.cleanup()

# Check relay type
# If pump activates on LOW instead of HIGH:
ACTIVE_HIGH = False  # in config.py
```

#### 4. "Sensor readings are 0 or invalid"

**Symptoms**: All sensor readings show 0, None, or out-of-range values

**Causes**:
- ADC not connected
- SPI not enabled
- Wrong wiring
- Sensor power issues

**Solutions**:
```bash
# Enable SPI
sudo raspi-config
# Interface Options → SPI → Enable

# Check SPI devices
ls /dev/spi*
# Should show /dev/spidev0.0 and /dev/spidev0.1

# Test ADC manually
python3
>>> from sensors import SensorReader
>>> sr = SensorReader()
>>> print(sr.read_all())
# Should show valid readings

# Enable mock mode for testing
USE_MOCK_SENSORS = True  # in config.py
```

#### 5. "DHT22 checksum error"

**Symptoms**: `DHT22 checksum error` in logs

**Causes**:
- Timing issues (DHT22 is sensitive)
- Poor connection
- Interference

**Solutions**:
- DHT22 can occasionally fail, retry logic handles this
- Check 10kΩ pull-up resistor on data line
- Ensure short, solid connections
- Normal to see occasional errors (retries will succeed)

### Logging

**View logs** (if running as systemd service):
```bash
sudo journalctl -u plant-monitor.service -f
```

**Log levels**:
```python
DEBUG: Detailed diagnostic info
INFO: General operational messages
WARNING: Something unusual but not critical
ERROR: Error occurred but operation continues
CRITICAL: Fatal error, application will exit
```

**Enable debug logging**:
```python
# In config.py
LOG_LEVEL = 'DEBUG'
```

### Emergency Stops

**Stop the application**:
```bash
# If running in terminal
Ctrl+C

# If running as service
sudo systemctl stop plant-monitor.service
```

**Emergency pump shutoff**:
```python
# From another terminal
python3 -c "import RPi.GPIO as GPIO; GPIO.setmode(GPIO.BCM); GPIO.setup(18, GPIO.OUT); GPIO.output(18, GPIO.LOW); GPIO.cleanup()"
```

### Reset Everything

```bash
# Stop service
sudo systemctl stop plant-monitor.service

# Clear command queue (backend)
# psql into database and: DELETE FROM "Command" WHERE "deviceId" = 'pi_001';

# Restart service
sudo systemctl start plant-monitor.service

# Watch logs
sudo journalctl -u plant-monitor.service -f
```

---

## Summary

### What the Pi Does (TL;DR)

1. **Every 15 seconds**: Reads sensors, sends data to backend, checks if auto-watering needed
2. **Every 5 minutes**: Takes photo, uploads for AI analysis, updates thresholds
3. **Every 10 seconds**: Polls backend for commands (manual watering, etc.), executes them
4. **Continuously**: Monitors soil moisture against thresholds, auto-waters when needed

### How It Does It

- **Modular design**: Each component (sensors, camera, pump, API) is a separate class
- **Safety first**: Cooldowns, max durations, emergency stops prevent damage
- **Resilient**: Retries, error handling, continues operating despite failures
- **Autonomous**: Runs unattended, makes intelligent watering decisions
- **Observable**: Logs everything, sends status to dashboard, responds to commands

### Key Points

- **No direct database access**: All communication via authenticated API
- **Threshold-based automation**: AI determines optimal values, Pi enforces them
- **Command queue pattern**: Dashboard queues commands, Pi polls and executes
- **Hardware abstraction**: Mock modes allow testing without physical sensors
- **Production-ready**: Systemd service, graceful shutdown, comprehensive error handling

---

## Quick Reference

### Start/Stop Commands
```bash
# Manual run (development)
cd ~/plant-monitor
source venv/bin/activate
python main.py

# Service control (production)
sudo systemctl start plant-monitor.service
sudo systemctl stop plant-monitor.service
sudo systemctl restart plant-monitor.service
sudo systemctl status plant-monitor.service

# View logs
sudo journalctl -u plant-monitor.service -f
sudo journalctl -u plant-monitor.service --since "1 hour ago"
```

### File Locations
- Config: `~/plant-monitor/config_local.py`
- Logs: `sudo journalctl -u plant-monitor.service`
- Service: `/etc/systemd/system/plant-monitor.service`
- Code: `~/plant-monitor/`

### API Endpoints
- Telemetry: `POST /api/telemetry`
- Image: `POST /api/image`
- Commands: `GET /api/commands?deviceId=X`
- Acknowledge: `POST /api/commands/:id`

### GPIO Pins
- DHT22: GPIO 17
- Pump Relay: GPIO 18
- MCP3008 (SPI): GPIO 8, 9, 10, 11

---

**End of Documentation**
