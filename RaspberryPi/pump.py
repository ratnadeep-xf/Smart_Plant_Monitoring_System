"""
Water pump control module for Raspberry Pi Plant Monitoring System
Handles water pump activation with safety checks
"""

import time
from typing import Optional

try:
    import RPi.GPIO as GPIO
    RPI_AVAILABLE = True
except ImportError:
    RPI_AVAILABLE = False
    print("Warning: RPi.GPIO not available. Using mock pump.")

from config import *


class PumpController:
    """Handles water pump control with safety features"""
    
    def __init__(self, use_mock: bool = None):
        """
        Initialize pump controller
        
        Args:
            use_mock: Use mock pump instead of real GPIO (for testing)
                     If None, will use ENABLE_PUMP config setting
        """
        # Determine if we should use mock mode
        if use_mock is None:
            # Use mock if pump is disabled OR if RPi.GPIO is not available
            self.use_mock = not ENABLE_PUMP or not RPI_AVAILABLE
        else:
            self.use_mock = use_mock
            
        self.last_activation_time = 0
        self.total_activations = 0
        self.is_running = False
        
        if not self.use_mock:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(PUMP_GPIO_PIN, GPIO.OUT)
            
            # Ensure pump is off initially
            initial_state = GPIO.LOW if PUMP_ACTIVE_HIGH else GPIO.HIGH
            GPIO.output(PUMP_GPIO_PIN, initial_state)
        
        mode = 'MOCK' if self.use_mock else 'REAL'
        reason = ''
        if self.use_mock and not ENABLE_PUMP:
            reason = ' (ENABLE_PUMP=False)'
        elif self.use_mock and not RPI_AVAILABLE:
            reason = ' (RPi.GPIO not available)'
        print(f"PumpController initialized: {mode}{reason}")
    
    def _set_pump_state(self, active: bool):
        """
        Set pump GPIO state
        
        Args:
            active: True to turn pump on, False to turn off
        """
        if self.use_mock:
            print(f"[MOCK] Pump {'ON' if active else 'OFF'}")
            return
        
        # Ensure GPIO is initialized before using it
        try:
            if PUMP_ACTIVE_HIGH:
                GPIO.output(PUMP_GPIO_PIN, GPIO.HIGH if active else GPIO.LOW)
            else:
                GPIO.output(PUMP_GPIO_PIN, GPIO.LOW if active else GPIO.HIGH)
        except RuntimeError as e:
            if "pin numbering mode" in str(e):
                # GPIO not initialized, reinitialize
                GPIO.setmode(GPIO.BCM)
                GPIO.setwarnings(False)
                GPIO.setup(PUMP_GPIO_PIN, GPIO.OUT)
                # Try again
                if PUMP_ACTIVE_HIGH:
                    GPIO.output(PUMP_GPIO_PIN, GPIO.HIGH if active else GPIO.LOW)
                else:
                    GPIO.output(PUMP_GPIO_PIN, GPIO.LOW if active else GPIO.HIGH)
            else:
                raise
    
    def can_activate(self) -> tuple[bool, Optional[str]]:
        """
        Check if pump can be activated (safety checks)
        
        Returns:
            Tuple of (can_activate, reason_if_cannot)
        """
        # Check if already running
        if self.is_running:
            return False, "Pump already running"
        
        # Check minimum interval since last activation
        time_since_last = time.time() - self.last_activation_time
        if time_since_last < PUMP_MIN_INTERVAL:
            remaining = int(PUMP_MIN_INTERVAL - time_since_last)
            return False, f"Must wait {remaining}s before next activation"
        
        return True, None
    
    def activate(self, duration: float, reason: str = "manual") -> dict:
        """
        Activate water pump for specified duration
        
        Args:
            duration: Duration in seconds
            reason: Reason for activation ("manual", "auto", "command")
            
        Returns:
            Dictionary with activation result
        """
        # Safety check: cap duration
        duration = min(duration, PUMP_MAX_DURATION)
        
        # Check if can activate
        can_activate, reason_cannot = self.can_activate()
        if not can_activate:
            print(f"Cannot activate pump: {reason_cannot}")
            return {
                'success': False,
                'reason': reason_cannot,
                'duration': 0
            }
        
        try:
            print(f"Activating pump for {duration}s ({reason})...")
            self.is_running = True
            
            # Turn on pump
            start_time = time.time()
            self._set_pump_state(True)
            
            # Wait for duration
            time.sleep(duration)
            
            # Turn off pump
            self._set_pump_state(False)
            actual_duration = time.time() - start_time
            
            # Update tracking
            self.last_activation_time = time.time()
            self.total_activations += 1
            self.is_running = False
            
            print(f"Pump activation complete: {actual_duration:.1f}s")
            
            return {
                'success': True,
                'duration': actual_duration,
                'reason': reason,
                'timestamp': time.time()
            }
            
        except Exception as e:
            print(f"Error during pump activation: {e}")
            # Emergency shutoff
            self._set_pump_state(False)
            self.is_running = False
            
            return {
                'success': False,
                'reason': f"Error: {str(e)}",
                'duration': 0
            }
    
    def emergency_stop(self):
        """Emergency stop - immediately turn off pump"""
        print("EMERGENCY STOP: Shutting down pump")
        try:
            self._set_pump_state(False)
        except Exception as e:
            print(f"Warning during emergency stop: {e}")
        self.is_running = False
    
    def get_status(self) -> dict:
        """
        Get current pump status
        
        Returns:
            Dictionary with pump status
        """
        time_since_last = time.time() - self.last_activation_time if self.last_activation_time > 0 else None
        
        return {
            'is_running': self.is_running,
            'total_activations': self.total_activations,
            'last_activation': self.last_activation_time if self.last_activation_time > 0 else None,
            'seconds_since_last': int(time_since_last) if time_since_last else None,
            'can_activate': self.can_activate()[0]
        }
    
    def cleanup(self):
        """Cleanup GPIO resources"""
        # Ensure pump is off
        try:
            self._set_pump_state(False)
        except Exception as e:
            print(f"Warning during cleanup: {e}")
        
        if not self.use_mock and RPI_AVAILABLE:
            try:
                GPIO.cleanup(PUMP_GPIO_PIN)
                print("Pump GPIO cleanup completed")
            except Exception as e:
                print(f"Warning during GPIO cleanup: {e}")


# Test the pump controller
if __name__ == "__main__":
    print("Testing pump controller...")
    pump = PumpController(use_mock=True)
    
    print("\nPump status:")
    print(pump.get_status())
    
    print("\nTest 1: Normal activation (3 seconds)")
    result = pump.activate(3, reason="test")
    print(f"Result: {result}")
    
    print("\nPump status after activation:")
    print(pump.get_status())
    
    print("\nTest 2: Immediate reactivation (should fail)")
    result = pump.activate(2, reason="test")
    print(f"Result: {result}")
    
    print(f"\nWaiting {PUMP_MIN_INTERVAL} seconds before next test...")
    time.sleep(PUMP_MIN_INTERVAL + 1)
    
    print("\nTest 3: Activation after cooldown")
    result = pump.activate(2, reason="test")
    print(f"Result: {result}")
    
    pump.cleanup()
    print("\nTest complete!")
