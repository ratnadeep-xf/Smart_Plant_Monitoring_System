# Migration Guide: YOLO to Hugging Face

This guide helps you migrate from YOLO-based inference to Hugging Face AI models.

## What Changed

### Files Replaced
- ❌ `services/yoloService.js` → ✅ `services/huggingFaceService.js`

### Files Updated
- ✅ `app/api/image/route.js` - Uses Hugging Face service instead of YOLO
- ✅ `README.md` - Updated documentation
- ✅ `API_ROUTES_SUMMARY.md` - Updated API docs
- ✅ `QUICK_START.md` - Updated quick start guide

### New Files
- ✅ `.env.example` - Environment variables template
- ✅ `HUGGING_FACE_SETUP.md` - Comprehensive setup guide
- ✅ `MIGRATION_GUIDE.md` - This file

## Environment Variables

### Old (YOLO)
```env
YOLO_PROVIDER_URL="https://detect.roboflow.com/..."
YOLO_API_KEY="your-yolo-key"
```

### New (Hugging Face)
```env
HF_API_URL="https://api-inference.huggingface.co/models/username/model-name"
HF_API_TOKEN="hf_your_token_here"
HF_TIMEOUT_MS="30000"
```

## Migration Steps

### 1. Update Environment Variables

1. Remove old YOLO variables from `.env`:
   ```bash
   # Remove these lines
   YOLO_PROVIDER_URL=...
   YOLO_API_KEY=...
   ```

2. Add new Hugging Face variables:
   ```bash
   HF_API_URL=https://api-inference.huggingface.co/models/your-username/your-model
   HF_API_TOKEN=hf_your_token_here
   HF_TIMEOUT_MS=30000
   ```

### 2. Choose a Hugging Face Model

See `HUGGING_FACE_SETUP.md` for detailed model selection guide.

**Quick options:**
- **Object Detection:** `facebook/detr-resnet-50`
- **Classification:** `google/vit-base-patch16-224`
- **Custom:** Upload your own model to Hugging Face Hub

### 3. Get Your Hugging Face Token

1. Go to https://huggingface.co/settings/tokens
2. Create a new token
3. Copy it to `HF_API_TOKEN` in `.env`

### 4. No Code Changes Required!

The service interface remains the same:
```javascript
import { inferByUrl } from '../../../services/huggingFaceService.js';

// Usage is identical
const result = await inferByUrl(imageUrl);
// Returns: { detections, provider, rawResponse }
```

### 5. Update Label Mappings (Optional)

If your Hugging Face model returns different labels than YOLO:

```bash
# Connect to your database
npm run prisma:studio
```

Update `LabelMapping` records to match your new model's labels:
```javascript
// Old YOLO label
{ label: 'potted-plant', ... }

// New HF label (example)
{ label: 'potted plant', ... }  // Note: space instead of hyphen
```

### 6. Test Your Setup

```bash
# Start the server
npm run dev

# Upload a test image
curl -X POST http://localhost:3000/api/image \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -F "device_id=test" \
  -F "image=@test-plant.jpg"
```

Check the response for detections.

## Key Differences

### Response Format

#### YOLO (Roboflow)
```json
{
  "predictions": [
    {
      "class": "basil",
      "confidence": 0.92,
      "x": 150,
      "y": 200,
      "width": 100,
      "height": 150
    }
  ]
}
```

#### Hugging Face (Object Detection)
```json
[
  {
    "label": "basil",
    "score": 0.92,
    "box": {
      "xmin": 100,
      "ymin": 125,
      "xmax": 200,
      "ymax": 275
    }
  }
]
```

#### Hugging Face (Classification)
```json
[
  {
    "label": "basil",
    "score": 0.92
  },
  {
    "label": "mint",
    "score": 0.05
  }
]
```

### Normalization

Both YOLO and Hugging Face responses are automatically normalized to:
```javascript
{
  label: string,
  confidence: number,
  bbox: {
    x: number,
    y: number,
    width: number,
    height: number
  } | undefined
}
```

### Performance

| Feature | YOLO (Roboflow) | Hugging Face |
|---------|----------------|--------------|
| **Cold Start** | ~2-5 seconds | ~20-60 seconds (first request) |
| **Warm Requests** | ~1-2 seconds | ~1-3 seconds |
| **Rate Limits (Free)** | Varies by plan | ~30/hour (cold models) |
| **Caching** | ✅ Implemented | ✅ Implemented |
| **Retries** | ✅ 3 attempts | ✅ 3 attempts |

### Error Handling

#### New Error: Model Loading (503)
Hugging Face models may need loading time on first request:

```javascript
// Automatically handled with retry
if (error.response?.status === 503) {
  console.log('Model is loading, will retry...');
  // Exponential backoff: 2s, 4s, 8s
}
```

#### Timeouts
- **YOLO:** 10 seconds default
- **Hugging Face:** 30 seconds default (configurable via `HF_TIMEOUT_MS`)

## Database Compatibility

**No database changes required!** 

The `InferenceCache` table stores responses from both providers:

```javascript
{
  imageId: "...",
  provider: "huggingface",  // Changed from "roboflow" or "ultralytics"
  responseJson: {...},       // Raw HF response
  createdAt: "..."
}
```

Existing YOLO cache entries remain valid and won't be re-processed.

## Rollback Plan

If you need to rollback to YOLO:

1. **Keep the old service file** (optional):
   ```bash
   # Rename instead of delete
   mv services/yoloService.js services/yoloService.backup.js
   ```

2. **Revert environment variables**:
   ```env
   YOLO_PROVIDER_URL="..."
   YOLO_API_KEY="..."
   ```

3. **Revert the import in `app/api/image/route.js`**:
   ```javascript
   import { inferByUrl } from '../../../services/yoloService.js';
   ```

4. **Restart the server**

## Benefits of Hugging Face

✅ **Free & Open Source** - Community models available  
✅ **Flexibility** - Choose from thousands of models  
✅ **Custom Models** - Upload your own trained models  
✅ **Active Development** - Constantly improving models  
✅ **Classification & Detection** - Both supported  
✅ **No Vendor Lock-in** - Can switch models anytime  

## Limitations

⚠️ **Cold Start Time** - First request may take 20-60 seconds  
⚠️ **Rate Limits** - Free tier has limits (~30 requests/hour for cold models)  
⚠️ **Model Selection** - Need to find/train suitable plant model  

### Solutions
- **Cold Start:** First request is slow, but results are cached
- **Rate Limits:** Upgrade to Hugging Face Pro or deploy your own server
- **Model Selection:** See `HUGGING_FACE_SETUP.md` for recommendations

## Troubleshooting

### "Model not found"
- Check your `HF_API_URL` is correct
- Ensure the model exists on Hugging Face
- Verify the model has Inference API enabled

### "Invalid token"
- Check `HF_API_TOKEN` starts with `hf_`
- Regenerate token if needed
- Ensure no extra spaces in `.env`

### "No detections returned"
- Check the raw response in server logs
- Verify your model is trained for plant detection
- Try lowering confidence threshold in label mappings

### "Request timeout"
- Increase `HF_TIMEOUT_MS` (try 60000 for 60 seconds)
- Wait for model to warm up (first request is slow)
- Check Hugging Face status page

## Support

For help with:
- **Migration issues:** Open an issue on GitHub
- **Hugging Face setup:** See `HUGGING_FACE_SETUP.md`
- **API questions:** See `API_ROUTES_SUMMARY.md`

---

**Migration Complete! 🎉**

Your system now uses Hugging Face AI models for plant detection.
