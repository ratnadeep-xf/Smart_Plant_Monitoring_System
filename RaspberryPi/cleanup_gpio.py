#!/usr/bin/env python3
"""
GPIO Cleanup Utility
Run this script if you get "GPIO busy" errors
Usage: python cleanup_gpio.py
"""

import sys

try:
    import RPi.GPIO as GPIO
    
    print("=" * 50)
    print("GPIO Cleanup Utility")
    print("=" * 50)
    
    # Get current GPIO mode
    try:
        mode = GPIO.getmode()
        if mode == GPIO.BCM:
            print("Current mode: BCM")
        elif mode == GPIO.BOARD:
            print("Current mode: BOARD")
        else:
            print("Current mode: Not set")
    except:
        print("Current mode: Not set")
    
    # Cleanup all GPIO pins
    print("\nCleaning up GPIO pins...")
    GPIO.cleanup()
    print("✓ GPIO cleanup completed successfully!")
    
    print("\nAll GPIO pins have been released.")
    print("You can now run main.py again.")
    print("=" * 50)
    
except ImportError:
    print("Error: RPi.GPIO not available")
    print("This script must be run on a Raspberry Pi")
    sys.exit(1)
except Exception as e:
    print(f"Error during cleanup: {e}")
    print("Trying alternate cleanup method...")
    try:
        GPIO.setwarnings(False)
        GPIO.cleanup()
        print("✓ Cleanup successful with warnings disabled")
    except:
        print("✗ Cleanup failed")
        print("\nTry running:")
        print("  sudo pkill -f main.py")
        print("  python3 cleanup_gpio.py")
        sys.exit(1)
