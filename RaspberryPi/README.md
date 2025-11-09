# Raspberry Pi Plant Monitoring System - README

Complete autonomous plant monitoring system with AI-powered analysis and automatic watering.

## Features

- 🌡️ **Continuous Monitoring**: Soil moisture, temperature, humidity, and light levels
- 📸 **AI Disease Detection**: Automatic image capture and Hugging Face model analysis
- 💧 **Smart Auto-Watering**: Threshold-based automatic watering with safety mechanisms
- 🎮 **Remote Control**: Dashboard commands via web interface
- 🔒 **Safety Features**: Cooldown periods, max duration limits, emergency stop
- 🧪 **Mock Modes**: Test without physical hardware

## Quick Start

### 1. Installation

```bash
# Clone/copy files to Raspberry Pi
cd ~
# (transfer RaspberryPi folder to Pi)

cd RaspberryPi

# Run installation script
chmod +x install.sh
./install.sh
```

### 2. Configuration

Edit `config_local.py` with your settings:

```bash
nano config_local.py
```

**Required settings**:
```python
API_BASE_URL = 'https://your-backend-url.com'  # Your Next.js backend
DEVICE_TOKEN_SECRET = 'your-secret-token'      # From backend .env
DEVICE_ID = 'pi_001'                           # Unique device identifier
```

### 3. Hardware Setup

Connect components according to wiring diagram in `RASPBERRY_PI_OPERATION_GUIDE.md`:

- **Soil Moisture Sensor** → MCP3008 CH0
- **Light Sensor** → MCP3008 CH1
- **DHT22** → GPIO 17
- **Water Pump Relay** → GPIO 18
- **Camera Module** → CSI port

### 4. Test Run

```bash
# Activate virtual environment
source venv/bin/activate

# Run in foreground (see output)
python main.py

# Press Ctrl+C to stop
```

### 5. Install as Service

```bash
# Copy service file
sudo cp plant-monitor.service /etc/systemd/system/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable plant-monitor.service
sudo systemctl start plant-monitor.service

# Check status
sudo systemctl status plant-monitor.service

# View logs
sudo journalctl -u plant-monitor.service -f
```

## File Structure

```
RaspberryPi/
├── config.py                           # Configuration (edit config_local.py instead)
├── config_local.py                     # Local configuration overrides
├── sensors.py                          # Sensor reading module
├── camera.py                           # Camera capture module
├── pump.py                             # Pump control module
├── api_client.py                       # Backend API communication
├── main.py                             # Main application
├── requirements.txt                    # Python dependencies
├── install.sh                          # Installation script
├── plant-monitor.service               # Systemd service file (auto-created)
├── RASPBERRY_PI_OPERATION_GUIDE.md     # Complete operation documentation
└── README.md                           # This file
```

## Operation Overview

### What It Does

1. **Reads sensors** every 15 seconds → sends to backend
2. **Captures images** every 5 minutes → AI analyzes for plant type/disease → updates thresholds
3. **Polls for commands** every 10 seconds → executes manual watering or other commands
4. **Auto-waters** when soil moisture drops below threshold (from AI analysis)

### How Auto-Watering Works

```
Sensor reads soil moisture: 35%
AI-determined threshold: 50%
Decision: Water needed!
Safety check: Cooldown OK? Duration OK?
Action: Activate pump for calculated duration
Result: Soil moisture increases to 52%
Next cycle: No watering needed, moisture adequate
```

## Configuration Options

### Timing Intervals

```python
TELEMETRY_INTERVAL = 15      # Sensor readings every 15 seconds
IMAGE_INTERVAL = 300         # Photos every 5 minutes
COMMAND_POLL_INTERVAL = 10   # Check for commands every 10 seconds
```

### Safety Limits

```python
MIN_PUMP_INTERVAL = 300      # Wait 5 minutes between waterings
MAX_PUMP_DURATION = 10       # Never run pump longer than 10 seconds
```

### Mock Modes (Testing)

```python
USE_MOCK_SENSORS = True      # Generate random sensor data
USE_MOCK_CAMERA = True       # Create test images
```

## API Communication

All communication authenticated with `DEVICE_TOKEN_SECRET`:

- **POST /api/telemetry**: Send sensor readings
- **POST /api/image**: Upload plant photos for AI analysis
- **GET /api/commands**: Poll for queued commands
- **POST /api/commands/:id**: Acknowledge command completion

## Troubleshooting

### Check Service Status

```bash
sudo systemctl status plant-monitor.service
```

### View Logs

```bash
# Live log stream
sudo journalctl -u plant-monitor.service -f

# Last 100 lines
sudo journalctl -u plant-monitor.service -n 100

# Since 1 hour ago
sudo journalctl -u plant-monitor.service --since "1 hour ago"
```

### Common Issues

**Network connection errors**:
- Check `API_BASE_URL` in `config_local.py`
- Verify backend is running
- Test: `curl https://your-backend.com/api/latest`

**Camera not working**:
```bash
sudo raspi-config
# Interface Options → Camera → Enable
sudo reboot
```

**Pump not activating**:
- Check GPIO pin (default 18)
- Verify relay type (ACTIVE_HIGH = True/False)
- Check cooldown period hasn't elapsed
- Test GPIO manually (see operation guide)

**Sensor readings are 0**:
```bash
# Enable SPI
sudo raspi-config
# Interface Options → SPI → Enable
sudo reboot
```

### Emergency Stop

```bash
# Stop service
sudo systemctl stop plant-monitor.service

# Or if running manually
Ctrl+C
```

## Development

### Running in Development Mode

```bash
# Activate virtual environment
source venv/bin/activate

# Run with debug logging
python main.py

# Enable mock mode for testing
# Edit config_local.py:
USE_MOCK_SENSORS = True
USE_MOCK_CAMERA = True
```

### Testing Individual Modules

```python
# Test sensors
python3 -c "from sensors import SensorReader; sr = SensorReader(); print(sr.read_all())"

# Test camera
python3 -c "from camera import CameraHandler; ch = CameraHandler(); ch.capture_image()"

# Test pump (careful!)
python3 -c "from pump import PumpController; pc = PumpController(); pc.activate(1)"
```

## Safety

⚠️ **Important Safety Notes**:

- Keep electronics away from water
- Use external power supply for pump (not Pi's 5V)
- Verify wiring before powering on
- Test pump duration before leaving unattended
- Monitor initial operation closely
- Set conservative thresholds initially

## Documentation

Full documentation in `RASPBERRY_PI_OPERATION_GUIDE.md`:
- Complete wiring diagrams
- Detailed operation flow
- API communication details
- Auto-watering algorithm
- Command execution process
- Troubleshooting guide

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u plant-monitor.service -f`
2. Review operation guide: `RASPBERRY_PI_OPERATION_GUIDE.md`
3. Verify configuration: `config_local.py`
4. Test individual modules (see Development section)

## License

MIT

---

**Enjoy automated plant care! 🌱**
