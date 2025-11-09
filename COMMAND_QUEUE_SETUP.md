# Command Queue Implementation Guide

## ✅ What Was Implemented

The command queue system allows the dashboard to send watering commands to the Raspberry Pi through a database-backed queue.

### Database Changes
- Added `Command` model to Prisma schema
- Stores: `id`, `deviceId`, `type`, `payload`, `status`, `result`, timestamps

### Updated Services
- `services/deviceService.js` - Now uses real database operations:
  - `queueCommand()` - Saves commands to database
  - `getQueuedCommands()` - Retrieves pending commands
  - `updateCommandStatus()` - Marks commands as completed/failed
  - `cleanupOldCommands()` - Removes old completed commands

### API Endpoints (Already Configured)
- `POST /api/control/water` - Dashboard uses this to queue water commands
- `GET /api/commands?device_id=X` - Raspberry Pi polls this for pending commands
- `POST /api/commands/:id` - Raspberry Pi uses this to mark commands complete

---

## 🔧 Setup Steps

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_command_queue
```

This creates the `Command` table in your database.

### 2. Generate Prisma Client

```bash
npx prisma generate
```

---

## 🧪 Testing the Flow

### Test 1: Queue a Command (Dashboard Side)

```bash
curl -X POST http://localhost:3000/api/control/water \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "raspberry-pi-001",
    "duration": 5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "commandId": "abc-123-def-456",
    "duration": 5,
    "nextAllowedAt": "2025-11-10T11:00:00Z",
    "remainingActivations": 1
  }
}
```

### Test 2: Poll for Commands (Raspberry Pi Side)

```bash
curl -X GET "http://localhost:3000/api/commands?device_id=raspberry-pi-001" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "commands": [
      {
        "id": "abc-123-def-456",
        "deviceId": "raspberry-pi-001",
        "type": "water",
        "payload": {
          "duration": 5
        },
        "status": "pending",
        "createdAt": "2025-11-10T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

### Test 3: Mark Command Complete (Raspberry Pi Side)

```bash
curl -X POST http://localhost:3000/api/commands/abc-123-def-456 \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "result": {
      "duration_executed": 5,
      "pump_activated_at": "2025-11-10T10:30:15Z"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-def-456",
    "status": "completed",
    "completedAt": "2025-11-10T10:30:20Z"
  }
}
```

### Test 4: Verify Command Removed from Queue

Poll again - should return empty array:
```bash
curl -X GET "http://localhost:3000/api/commands?device_id=raspberry-pi-001" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "commands": [],
    "count": 0
  }
}
```

---

## 🐍 Raspberry Pi Python Implementation

### Example: Pi Polling Loop

```python
import requests
import time
import RPi.GPIO as GPIO

API_URL = "https://your-server.com/api"
DEVICE_TOKEN = "your-device-token-secret"
DEVICE_ID = "raspberry-pi-001"
PUMP_PIN = 17  # GPIO pin for pump relay

GPIO.setmode(GPIO.BCM)
GPIO.setup(PUMP_PIN, GPIO.OUT)
GPIO.output(PUMP_PIN, GPIO.LOW)

def poll_commands():
    """Poll for pending commands"""
    headers = {"Authorization": f"Bearer {DEVICE_TOKEN}"}
    response = requests.get(
        f"{API_URL}/commands?device_id={DEVICE_ID}",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()["data"]["commands"]
    return []

def execute_water_command(command):
    """Execute watering command"""
    duration = command["payload"]["duration"]
    command_id = command["id"]
    
    print(f"Activating pump for {duration} seconds...")
    
    try:
        # Turn on pump
        GPIO.output(PUMP_PIN, GPIO.HIGH)
        time.sleep(duration)
        GPIO.output(PUMP_PIN, GPIO.LOW)
        
        # Mark command as completed
        headers = {
            "Authorization": f"Bearer {DEVICE_TOKEN}",
            "Content-Type": "application/json"
        }
        
        requests.post(
            f"{API_URL}/commands/{command_id}",
            headers=headers,
            json={
                "status": "completed",
                "result": {
                    "duration_executed": duration,
                    "timestamp": time.time()
                }
            }
        )
        
        print(f"Command {command_id} completed successfully")
        
    except Exception as e:
        print(f"Error executing command: {e}")
        
        # Mark command as failed
        requests.post(
            f"{API_URL}/commands/{command_id}",
            headers=headers,
            json={
                "status": "failed",
                "result": {
                    "error": str(e)
                }
            }
        )

def main_loop():
    """Main polling loop"""
    print("Starting command polling...")
    
    while True:
        try:
            commands = poll_commands()
            
            for command in commands:
                if command["type"] == "water":
                    execute_water_command(command)
            
            # Poll every 10 seconds
            time.sleep(10)
            
        except Exception as e:
            print(f"Polling error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print("\nShutting down...")
        GPIO.cleanup()
```

---

## 📊 Database Queries

### View All Commands
```sql
SELECT * FROM "Command" ORDER BY "created_at" DESC;
```

### View Pending Commands
```sql
SELECT * FROM "Command" WHERE status = 'pending';
```

### Cleanup Old Commands (Manual)
```sql
DELETE FROM "Command" 
WHERE status IN ('completed', 'failed', 'cancelled')
AND "created_at" < NOW() - INTERVAL '7 days';
```

---

## 🔒 Security Notes

- All endpoints require `Authorization: Bearer <DEVICE_TOKEN_SECRET>` header
- Rate limiting prevents abuse (max 2 activations/hour, 15min cooldown)
- Maximum water duration capped at 10 seconds per activation
- Commands are device-specific (Pi only sees its own commands)

---

## 🐛 Troubleshooting

### Commands not appearing in queue
1. Check database: `SELECT * FROM "Command" WHERE status = 'pending';`
2. Verify `DEVICE_TOKEN_SECRET` matches in both dashboard and Pi
3. Check browser console for errors when clicking "Water Now"

### Commands stuck in "pending" status
- Pi may not be polling
- Check Pi authentication token
- Verify Pi can reach the API endpoint
- Check Pi logs for errors

### Rate limit errors
- Wait for cooldown period (15 minutes)
- Check `remainingActivations` in response
- Use `nextAllowedAt` timestamp to know when available

---

## ✅ Complete Flow Summary

```
1. User clicks "Water Now" on dashboard
   ↓
2. Dashboard → POST /api/control/water
   ↓
3. Backend creates Command record in database (status: "pending")
   ↓
4. Raspberry Pi polls GET /api/commands every 10 seconds
   ↓
5. Backend returns pending commands from database
   ↓
6. Pi executes command (activates pump)
   ↓
7. Pi → POST /api/commands/:id (status: "completed")
   ↓
8. Backend updates Command record (status: "completed", completedAt: now)
   ↓
9. Next poll returns empty array (no pending commands)
```

🎉 **Your command queue is ready!**
