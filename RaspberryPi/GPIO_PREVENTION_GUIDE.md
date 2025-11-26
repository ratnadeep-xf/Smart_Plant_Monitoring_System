# GPIO "Busy" Error Prevention Guide

## What Causes GPIO Busy Errors?

1. **Previous process still running** - Old main.py process didn't exit cleanly
2. **GPIO pins not cleaned up** - Pins remain reserved after crash/kill
3. **Multiple initializations** - Trying to setup same pin twice
4. **Permission issues** - Running without proper GPIO permissions

---

## Fixes Implemented in Code:

### ✅ 1. Automatic Cleanup on Startup
- `sensors.py` now calls `GPIO.cleanup()` before initializing
- Clears any previous GPIO state automatically

### ✅ 2. Initial Pin States
- All GPIO pins set with `initial=` parameter
- Prevents undefined states causing conflicts

### ✅ 3. Proper Exception Handling
- GPIO operations wrapped in try/except
- Graceful fallback to mock mode on errors

### ✅ 4. Cleanup on Exit
- `finally:` block ensures cleanup runs
- Signal handlers (Ctrl+C) trigger cleanup
- All exit paths call `sensor_reader.cleanup()`

### ✅ 5. GPIO Warnings Suppressed
- `GPIO.setwarnings(False)` prevents spam
- Errors still logged with helpful hints

---

## Manual Prevention Steps:

### On Raspberry Pi, run these commands ONCE:

```bash
# 1. Make scripts executable
cd ~/Smart_Plant_Monitoring_System/RaspberryPi
chmod +x start.sh cleanup_gpio.py

# 2. Download updated files
wget https://raw.githubusercontent.com/ratnadeep-xf/Smart_Plant_Monitoring_System/main/RaspberryPi/sensors.py -O sensors.py
wget https://raw.githubusercontent.com/ratnadeep-xf/Smart_Plant_Monitoring_System/main/RaspberryPi/main.py -O main.py
wget https://raw.githubusercontent.com/ratnadeep-xf/Smart_Plant_Monitoring_System/main/RaspberryPi/cleanup_gpio.py -O cleanup_gpio.py
wget https://raw.githubusercontent.com/ratnadeep-xf/Smart_Plant_Monitoring_System/main/RaspberryPi/start.sh -O start.sh
chmod +x start.sh
```

---

## How to Start the System (Recommended):

### Option 1: Use Safe Startup Script (Best)
```bash
cd ~/Smart_Plant_Monitoring_System/RaspberryPi
./start.sh
```
This script automatically:
- Kills existing processes
- Cleans GPIO pins
- Activates virtual environment
- Starts monitoring system
- Cleans up on exit

### Option 2: Manual Start
```bash
cd ~/Smart_Plant_Monitoring_System/RaspberryPi
source venv/bin/activate
python3 main.py
```

---

## If You Still Get GPIO Busy Error:

### Step 1: Kill existing processes
```bash
sudo pkill -f main.py
```

### Step 2: Manual GPIO cleanup
```bash
python3 cleanup_gpio.py
```

### Step 3: Verify no processes running
```bash
ps aux | grep main.py
# Should show no results except the grep command itself
```

### Step 4: Try starting again
```bash
./start.sh
```

---

## Emergency Recovery:

If all else fails:
```bash
# Nuclear option - cleanup everything and reboot
sudo pkill -f python
python3 -c "import RPi.GPIO as GPIO; GPIO.cleanup()"
sudo reboot
```

After reboot, run:
```bash
cd ~/Smart_Plant_Monitoring_System/RaspberryPi
./start.sh
```

---

## Prevention Best Practices:

### ✅ DO:
- Always use `./start.sh` to start the system
- Press Ctrl+C once and wait for cleanup
- Let the system shutdown gracefully

### ❌ DON'T:
- Kill processes with `kill -9` (use `pkill -f` instead)
- Start multiple instances simultaneously
- Unplug power without proper shutdown
- Edit code while system is running

---

## Troubleshooting:

### Error: "This channel is already in use"
**Solution:** Run `python3 cleanup_gpio.py`

### Error: "Permission denied"
**Solution:** Add user to gpio group
```bash
sudo usermod -a -G gpio $USER
sudo reboot
```

### Error: Process won't stop
**Solution:** Force kill and cleanup
```bash
sudo pkill -9 -f main.py
python3 cleanup_gpio.py
```

### System hangs on startup
**Solution:** Check for hardware issues
```bash
# Test sensors independently
python3 -c "from sensors import SensorReader; s = SensorReader(use_mock=True); print(s.read_all())"
```

---

## Automatic Startup on Boot (Optional):

To run on boot with automatic cleanup:

```bash
# Create systemd service
sudo nano /etc/systemd/system/plant-monitor.service
```

Add:
```ini
[Unit]
Description=Smart Plant Monitoring System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Smart_Plant_Monitoring_System/RaspberryPi
ExecStartPre=/usr/bin/python3 cleanup_gpio.py
ExecStart=/home/pi/Smart_Plant_Monitoring_System/RaspberryPi/start.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable plant-monitor
sudo systemctl start plant-monitor

# Check status
sudo systemctl status plant-monitor
```

---

## Summary:

With the code changes + using `start.sh`, you should **never** get GPIO busy errors again. The system now:

1. ✅ Cleans GPIO before starting
2. ✅ Sets proper initial pin states
3. ✅ Handles Ctrl+C gracefully
4. ✅ Cleans up on all exit paths
5. ✅ Provides manual cleanup tools
6. ✅ Has helpful error messages

**Just use `./start.sh` every time and you're good!**
