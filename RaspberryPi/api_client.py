"""
API client for Raspberry Pi Plant Monitoring System
Handles all communication with the backend server
"""

import requests
import time
import json
from datetime import datetime
from typing import Optional, Dict, List
from io import BytesIO

from config import *


class APIClient:
    """Handles all API communication with backend server"""
    
    def _init_(self):
        """Initialize API client"""
        self.base_url = API_BASE_URL.rstrip('/')
        self.device_token = DEVICE_TOKEN
        self.device_id = DEVICE_ID
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.device_token}',
            'User-Agent': f'PlantMonitor-RaspberryPi/{DEVICE_ID}'
        })
        
        # Track API health
        self.last_successful_request = None
        self.consecutive_failures = 0
        
        print(f"APIClient initialized: {self.base_url}")
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[requests.Response]:
        """
        Make HTTP request with retry logic
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (without base URL)
            **kwargs: Additional arguments for requests
            
        Returns:
            Response object or None if failed
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        for attempt in range(API_MAX_RETRIES):
            try:
                if DEBUG_MODE:
                    print(f"API {method} {url} (attempt {attempt + 1}/{API_MAX_RETRIES})")
                
                response = self.session.request(
                    method,
                    url,
                    timeout=API_REQUEST_TIMEOUT,
                    **kwargs
                )
                
                # Check if successful
                if response.status_code < 500:
                    self.last_successful_request = time.time()
                    self.consecutive_failures = 0
                    return response
                
                # Server error - retry
                print(f"Server error {response.status_code}: {response.text}")
                
            except requests.exceptions.Timeout:
                print(f"Request timeout (attempt {attempt + 1})")
            except requests.exceptions.ConnectionError:
                print(f"Connection error (attempt {attempt + 1})")
            except Exception as e:
                print(f"Request error: {e}")
            
            # Wait before retry (exponential backoff)
            if attempt < API_MAX_RETRIES - 1:
                delay = API_RETRY_DELAY * (2 ** attempt)
                print(f"Retrying in {delay}s...")
                time.sleep(delay)
        
        # All retries failed
        self.consecutive_failures += 1
        print(f"Request failed after {API_MAX_RETRIES} attempts")
        return None
    
    def send_telemetry(self, sensor_data: Dict) -> bool:
        """
        Send sensor telemetry to backend
        
        Args:
            sensor_data: Dictionary with sensor readings
            
        Returns:
            True if successful
        """
        payload = {
            'device_id': self.device_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'soil_pct': sensor_data.get('soil_pct'),
            'temperature_c': sensor_data.get('temperature_c'),
            'humidity_pct': sensor_data.get('humidity_pct'),
            'lux': sensor_data.get('lux')
        }
        
        response = self._make_request('POST', '/telemetry', json=payload)
        
        if response and response.status_code == 201:
            if DEBUG_MODE:
                print(f"Telemetry sent successfully: {response.json()}")
            return True
        
        if response:
            print(f"Telemetry failed: {response.status_code} - {response.text}")
        
        return False
    
    def upload_image(self, image_bytes: bytes) -> Optional[Dict]:
        """
        Upload plant image to backend for AI analysis
        
        Args:
            image_bytes: Image data (JPEG format)
            
        Returns:
            Response data with detections and plant info, or None if failed
        """
        files = {
            'image': ('plant.jpg', BytesIO(image_bytes), 'image/jpeg')
        }
        
        data = {
            'device_id': self.device_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Session already has Authorization header, so don't pass it again
        response = self._make_request(
            'POST',
            '/image',
            files=files,
            data=data
        )
        
        if response and response.status_code == 201:
            result = response.json()
            if DEBUG_MODE:
                print(f"Image uploaded successfully: {result}")
            return result.get('data')
        
        if response:
            try:
                error_data = response.json()
                print(f"Image upload failed: {response.status_code} - {error_data}")
            except:
                print(f"Image upload failed: {response.status_code} - {response.text}")
        
        return None
    
    def poll_commands(self) -> List[Dict]:
        """
        Poll for pending commands from backend
        
        Returns:
            List of pending command dictionaries
        """
        params = {'device_id': self.device_id}
        
        response = self._make_request('GET', '/commands', params=params)
        
        if response and response.status_code == 200:
            result = response.json()
            commands = result.get('data', {}).get('commands', [])
            
            if commands and DEBUG_MODE:
                print(f"Received {len(commands)} pending command(s)")
            
            return commands
        
        if response and response.status_code != 200:
            print(f"Command poll failed: {response.status_code}")
        
        return []
    
    def acknowledge_command(self, command_id: str, status: str, result: Optional[Dict] = None) -> bool:
        """
        Acknowledge command execution
        
        Args:
            command_id: Command ID
            status: Command status ('started', 'completed', 'failed')
            result: Optional result data
            
        Returns:
            True if successful
        """
        payload = {
            'status': status,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        if result:
            payload['result'] = result
        
        response = self._make_request('POST', f'/commands/{command_id}', json=payload)
        
        if response and response.status_code == 200:
            if DEBUG_MODE:
                print(f"Command {command_id} acknowledged as {status}")
            return True
        
        if response:
            print(f"Command acknowledgment failed: {response.status_code}")
        
        return False
    
    def get_command_status(self, command_id: str) -> Optional[Dict]:
        """
        Get command status by ID
        
        Args:
            command_id: Command ID
            
        Returns:
            Command data or None if failed
        """
        response = self._make_request('GET', f'/commands/{command_id}')
        
        if response and response.status_code == 200:
            return response.json().get('data')
        
        return None
    
    def is_connected(self) -> bool:
        """
        Check if connected to backend
        
        Returns:
            True if recently successful request
        """
        if self.last_successful_request is None:
            return False
        
        # Consider connected if successful request in last 5 minutes
        time_since_success = time.time() - self.last_successful_request
        return time_since_success < 300
    
    def get_health(self) -> Dict:
        """
        Get API client health status
        
        Returns:
            Dictionary with health info
        """
        return {
            'connected': self.is_connected(),
            'base_url': self.base_url,
            'device_id': self.device_id,
            'last_success': self.last_successful_request,
            'consecutive_failures': self.consecutive_failures
        }


# Test the API client
if __name__ == "__main__":
    print("Testing API client...")
    
    # Use test configuration
    import sys
    if len(sys.argv) > 1:
        API_BASE_URL = sys.argv[1]
    
    client = APIClient()
    
    print("\nHealth check:")
    print(client.get_health())
    
    print("\nTest 1: Send telemetry")
    test_data = {
        'soil_pct': 45.5,
        'temperature_c': 22.3,
        'humidity_pct': 65.0,
        'lux': 850
    }
    success = client.send_telemetry(test_data)
    print(f"Telemetry {'sent' if success else 'failed'}")
    
    print("\nTest 2: Poll for commands")
    commands = client.poll_commands()
    print(f"Received {len(commands)} commands")
    for cmd in commands:
        print(f"  - {cmd.get('type')}: {cmd.get('payload')}")
    
    print("\nTest complete!")