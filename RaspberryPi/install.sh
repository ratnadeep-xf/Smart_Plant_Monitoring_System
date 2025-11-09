#!/bin/bash

# Installation script for Raspberry Pi Plant Monitoring System

echo "========================================"
echo "Plant Monitoring System - Installation"
echo "========================================"

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo; then
    echo "Warning: This does not appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install system dependencies
echo "Installing system dependencies..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-setuptools \
    python3-venv \
    build-essential \
    libgpiod2

# Install camera support
echo "Installing camera support..."
sudo apt-get install -y \
    python3-picamera \
    libraspberrypi-dev \
    libraspberrypi0

# Enable camera
echo "Enabling camera..."
sudo raspi-config nonint do_camera 0

# Enable I2C (for some sensors)
echo "Enabling I2C..."
sudo raspi-config nonint do_i2c 0

# Enable SPI (for ADC)
echo "Enabling SPI..."
sudo raspi-config nonint do_spi 0

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create config_local.py from template
if [ ! -f config_local.py ]; then
    echo "Creating config_local.py..."
    cp config.py config_local.py
    echo "✓ Created config_local.py - PLEASE EDIT THIS FILE WITH YOUR SETTINGS"
fi

# Create systemd service file
echo "Creating systemd service..."
cat > plant-monitor.service <<EOF
[Unit]
Description=Plant Monitoring System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment="PATH=$(pwd)/venv/bin"
ExecStart=$(pwd)/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit config_local.py with your API URL and device token:"
echo "   nano config_local.py"
echo ""
echo "2. Test the system:"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "3. Install as system service (optional):"
echo "   sudo cp plant-monitor.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable plant-monitor.service"
echo "   sudo systemctl start plant-monitor.service"
echo ""
echo "4. View service logs:"
echo "   sudo journalctl -u plant-monitor.service -f"
echo ""
