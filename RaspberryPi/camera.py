"""
Camera module for Raspberry Pi Plant Monitoring System
Handles capturing images from Pi Camera
"""

import io
import time
from typing import Optional
from PIL import Image

try:
    from picamera import PiCamera
    PICAMERA_AVAILABLE = True
except ImportError:
    PICAMERA_AVAILABLE = False
    print("Warning: picamera not available. Using mock camera.")

from config import *


class CameraHandler:
    """Handles capturing images from Raspberry Pi Camera"""
    
    def __init__(self, use_mock: bool = USE_MOCK_CAMERA):
        """
        Initialize camera handler
        
        Args:
            use_mock: Use mock camera instead of real camera (for testing)
        """
        self.use_mock = use_mock or not PICAMERA_AVAILABLE
        self.camera = None
        
        if not self.use_mock and ENABLE_CAMERA:
            try:
                self.camera = PiCamera()
                self.camera.resolution = CAMERA_RESOLUTION
                self.camera.rotation = CAMERA_ROTATION
                # Allow camera to warm up
                time.sleep(2)
                print(f"Camera initialized: {CAMERA_RESOLUTION[0]}x{CAMERA_RESOLUTION[1]}")
            except Exception as e:
                print(f"Error initializing camera: {e}")
                self.use_mock = True
        
        print(f"CameraHandler initialized (mock={'ON' if self.use_mock else 'OFF'})")
    
    def capture_image(self) -> Optional[bytes]:
        """
        Capture image from camera
        
        Returns:
            Image bytes (JPEG format) or None if error
        """
        if not ENABLE_CAMERA:
            print("Camera disabled in config")
            return None
        
        if self.use_mock:
            return self._generate_mock_image()
        
        try:
            # Capture to BytesIO stream
            stream = io.BytesIO()
            self.camera.capture(stream, format='jpeg', quality=IMAGE_QUALITY)
            
            # Get the bytes
            stream.seek(0)
            image_bytes = stream.read()
            
            print(f"Image captured: {len(image_bytes)} bytes")
            return image_bytes
            
        except Exception as e:
            print(f"Error capturing image: {e}")
            return None
    
    def _generate_mock_image(self) -> bytes:
        """
        Generate a mock image for testing
        
        Returns:
            Mock image bytes (JPEG format)
        """
        try:
            # Create a simple colored image
            img = Image.new('RGB', CAMERA_RESOLUTION, color=(34, 139, 34))  # Forest green
            
            # Add some text to make it identifiable
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(img)
            text = f"Mock Image\n{time.strftime('%Y-%m-%d %H:%M:%S')}"
            
            # Use default font
            draw.text((10, 10), text, fill=(255, 255, 255))
            
            # Convert to bytes
            stream = io.BytesIO()
            img.save(stream, format='JPEG', quality=IMAGE_QUALITY)
            stream.seek(0)
            
            return stream.read()
            
        except Exception as e:
            print(f"Error generating mock image: {e}")
            # Return minimal valid JPEG if PIL fails
            return b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9'
    
    def capture_and_save(self, filename: str) -> bool:
        """
        Capture image and save to file
        
        Args:
            filename: Path to save image
            
        Returns:
            True if successful
        """
        try:
            image_bytes = self.capture_image()
            if image_bytes:
                with open(filename, 'wb') as f:
                    f.write(image_bytes)
                print(f"Image saved to {filename}")
                return True
            return False
        except Exception as e:
            print(f"Error saving image: {e}")
            return False
    
    def cleanup(self):
        """Cleanup camera resources"""
        if self.camera:
            try:
                self.camera.close()
                print("Camera closed")
            except Exception as e:
                print(f"Error closing camera: {e}")


# Test the camera handler
if __name__ == "__main__":
    print("Testing camera handler...")
    camera = CameraHandler(use_mock=True)
    
    print("\nCapturing test images...")
    for i in range(3):
        print(f"\nCapture {i+1}:")
        image_bytes = camera.capture_image()
        if image_bytes:
            print(f"  Successfully captured {len(image_bytes)} bytes")
            # Save test image
            filename = f"test_image_{i+1}.jpg"
            camera.capture_and_save(filename)
        else:
            print("  Failed to capture image")
        time.sleep(1)
    
    camera.cleanup()
    print("\nTest complete!")
