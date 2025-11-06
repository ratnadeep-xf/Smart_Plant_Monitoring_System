# Hugging Face AI Model Setup Guide

This guide will help you configure your Smart Plant Monitoring System to use Hugging Face's AI models for plant detection and classification.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Choosing a Model](#choosing-a-model)
3. [Configuration](#configuration)
4. [Supported Model Types](#supported-model-types)
5. [Testing Your Setup](#testing-your-setup)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### 1. Create a Hugging Face Account

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Token

1. Go to your [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Give it a name (e.g., "Smart Plant Monitor")
4. Select "Read" access (sufficient for inference)
5. Click "Generate token"
6. Copy the token (starts with `hf_`)

**Important:** Keep this token secure! Don't commit it to version control.

---

## Choosing a Model

### Option 1: Use an Existing Model

Browse the [Hugging Face Model Hub](https://huggingface.co/models) for:

#### For Object Detection (with bounding boxes):
- **General purpose:** `facebook/detr-resnet-50`
- **Plants/Agriculture:** Search for "plant detection" or "agriculture"
- **Custom models:** Look for community-trained plant detection models

#### For Image Classification:
- **General purpose:** `google/vit-base-patch16-224`
- **Plant species:** Search for "plant classification" or "plant species"
- **Fine-tuned:** Look for models trained on plant datasets

### Option 2: Use Your Own Model

If you have a custom-trained model:

1. **Upload to Hugging Face Hub:**
   ```bash
   # Install huggingface_hub
   pip install huggingface_hub
   
   # Login
   huggingface-cli login
   
   # Upload your model
   huggingface-cli upload your-username/your-model-name ./model_directory
   ```

2. **Enable Inference API:**
   - Go to your model page
   - The Inference API is automatically enabled for most models
   - Test it using the inference widget on the model page

### Option 3: Deploy a Fine-tuned Model

You can fine-tune existing models on plant-specific datasets:

```python
from transformers import AutoModelForImageClassification, TrainingArguments, Trainer

# Load a pre-trained model
model = AutoModelForImageClassification.from_pretrained("google/vit-base-patch16-224")

# Fine-tune on your plant dataset
# ... training code ...

# Push to Hugging Face Hub
model.push_to_hub("your-username/plant-classifier")
```

---

## Configuration

### 1. Environment Variables

Add these to your `.env` file:

```env
# Hugging Face Configuration
HF_API_URL=https://api-inference.huggingface.co/models/your-username/your-model-name
HF_API_TOKEN=hf_your_actual_token_here
HF_TIMEOUT_MS=30000
```

### 2. Model URL Format

The `HF_API_URL` should follow this pattern:
```
https://api-inference.huggingface.co/models/{model-owner}/{model-name}
```

**Examples:**
- Object Detection: `https://api-inference.huggingface.co/models/facebook/detr-resnet-50`
- Classification: `https://api-inference.huggingface.co/models/google/vit-base-patch16-224`
- Custom Model: `https://api-inference.huggingface.co/models/yourname/plant-detector`

### 3. Timeout Configuration

The `HF_TIMEOUT_MS` sets how long to wait for the model to respond:

- **Default:** 30000 (30 seconds)
- **Fast models:** 15000-20000 (15-20 seconds)
- **Large models:** 40000-60000 (40-60 seconds)

**Note:** First request to a cold-started model may take longer. The system automatically retries with exponential backoff.

---

## Supported Model Types

### Object Detection Models

These models detect plants and return bounding boxes:

**Response Format:**
```json
[
  {
    "label": "potted plant",
    "score": 0.95,
    "box": {
      "xmin": 100,
      "ymin": 150,
      "xmax": 300,
      "ymax": 400
    }
  }
]
```

**Recommended Models:**
- `facebook/detr-resnet-50` - General object detection
- `facebook/detr-resnet-101` - Higher accuracy
- Custom trained plant detection models

### Image Classification Models

These models classify the entire image:

**Response Format:**
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

**Recommended Models:**
- `google/vit-base-patch16-224` - Vision Transformer
- `microsoft/resnet-50` - ResNet classifier
- Fine-tuned plant species classifiers

---

## Testing Your Setup

### 1. Test API Connection

Create a test script `test-hf.js`:

```javascript
import axios from 'axios';
import fs from 'fs';

const HF_API_URL = 'YOUR_MODEL_URL';
const HF_API_TOKEN = 'YOUR_TOKEN';

async function testInference() {
  try {
    // Read a test image
    const imageBuffer = fs.readFileSync('./test-plant.jpg');
    
    // Call Hugging Face API
    const response = await axios({
      method: 'POST',
      url: HF_API_URL,
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      data: imageBuffer,
    });
    
    console.log('Success!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testInference();
```

Run it:
```bash
node test-hf.js
```

### 2. Test via API Endpoint

Once your server is running:

```bash
curl -X POST http://localhost:3000/api/image \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -F "device_id=test-device" \
  -F "image=@test-plant.jpg"
```

### 3. Check the Response

A successful response will include:

```json
{
  "success": true,
  "data": {
    "image": {
      "id": "...",
      "url": "https://...",
      "timestamp": "..."
    },
    "detections": [
      {
        "id": "...",
        "label": "basil",
        "confidence": 0.92,
        "bbox": {...},
        "plantType": {...},
        "plantData": {...}
      }
    ],
    "dominant": {
      "label": "basil",
      "confidence": 0.92,
      "plantTypeId": "...",
      "plantDataId": "..."
    }
  }
}
```

---

## Troubleshooting

### Error: "Model is currently loading"

**Status Code:** 503

**Cause:** The model is being loaded into memory (cold start).

**Solution:** The system automatically retries with exponential backoff. First request may take 20-60 seconds.

```javascript
// Already handled in huggingFaceService.js
if (error.response?.status === 503) {
  console.log('Model is loading, will retry...');
  // Automatic retry with delay
}
```

### Error: "Authorization header is invalid"

**Cause:** Invalid or missing API token.

**Solutions:**
1. Check your token starts with `hf_`
2. Verify it's set in `.env` as `HF_API_TOKEN`
3. Regenerate token if needed
4. Ensure no extra spaces in the token

### Error: "Model not found"

**Cause:** Incorrect model URL.

**Solutions:**
1. Verify the model exists: Visit the URL in a browser
2. Check the format: `https://api-inference.huggingface.co/models/owner/name`
3. Ensure the model has Inference API enabled

### No Detections Returned

**Possible Causes:**
1. **Low confidence threshold:** Model is not confident enough
2. **Wrong model type:** Using classification model when expecting detection
3. **Model not trained on plants:** General model may not recognize plants

**Solutions:**
1. Check the raw response in logs
2. Lower confidence threshold in `labelMappingService.js`
3. Try a different model
4. Train/fine-tune a model on plant images

### Slow Response Times

**Solutions:**
1. Use a smaller, faster model
2. Increase `HF_TIMEOUT_MS`
3. Consider using Hugging Face Pro for faster inference
4. Cache results (already implemented via `InferenceCache`)

### Rate Limiting

**Hugging Face Rate Limits (Free tier):**
- ~30 requests per hour for cold models
- More for warm/popular models

**Solutions:**
1. Upgrade to Hugging Face Pro
2. Deploy your own inference server
3. Use caching effectively (already implemented)

---

## Advanced Configuration

### Custom Response Parsing

If your model returns a non-standard format, edit `services/huggingFaceService.js`:

```javascript
function normalizeHuggingFaceResponse(responseData) {
  // Add custom parsing logic here
  if (responseData.myCustomFormat) {
    return responseData.myCustomFormat.map(item => ({
      label: item.className,
      confidence: item.probability,
      bbox: item.boundingBox,
    }));
  }
  
  // Fall back to standard parsing
  // ...
}
```

### Label Mapping

Map model labels to plant types in your database:

```javascript
// Run this after seeding
await prisma.labelMapping.create({
  data: {
    label: 'potted_plant',  // Model output
    minConfidence: 0.7,
    plantTypeId: 'basil-id',
    plantDataId: 'basil-data-id',
  }
});
```

### Multiple Model Support

You can query multiple models by running inference multiple times:

```javascript
const models = [
  process.env.HF_API_URL_DETECTOR,
  process.env.HF_API_URL_CLASSIFIER,
];

for (const modelUrl of models) {
  const result = await inferByUrl(imageUrl, modelUrl);
  // Combine results
}
```

---

## Resources

- [Hugging Face Documentation](https://huggingface.co/docs)
- [Inference API Documentation](https://huggingface.co/docs/api-inference/index)
- [Model Hub](https://huggingface.co/models)
- [Plant Disease Dataset](https://huggingface.co/datasets/plant-village)
- [Fine-tuning Tutorial](https://huggingface.co/docs/transformers/training)

---

## Support

For issues specific to:
- **This project:** Open an issue on GitHub
- **Hugging Face API:** Check [HF Community Forums](https://discuss.huggingface.co/)
- **Model selection:** Browse [HF Discord](https://discord.gg/hugging-face)

---

**Happy Plant Monitoring! 🌱**
