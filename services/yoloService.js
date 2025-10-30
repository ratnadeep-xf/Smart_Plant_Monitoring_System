// services/yoloService.js
import axios from 'axios';

const YOLO_PROVIDER_URL = process.env.YOLO_PROVIDER_URL || '';
const YOLO_API_KEY = process.env.YOLO_API_KEY || '';
const YOLO_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function inferByUrl(imageUrl) {
  if (!YOLO_PROVIDER_URL || !YOLO_API_KEY) {
    console.warn('YOLO provider not configured. Returning empty detections.');
    return {
      detections: [],
      provider: 'none',
      rawResponse: { error: 'YOLO provider not configured' },
      error: 'YOLO provider not configured',
    };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`YOLO inference attempt ${attempt}/${MAX_RETRIES} for URL: ${imageUrl}`);

      const response = await axios({
        method: 'POST',
        url: YOLO_PROVIDER_URL,
        params: { api_key: YOLO_API_KEY },
        data: imageUrl,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: YOLO_TIMEOUT_MS,
      });

      const detections = normalizeYoloResponse(response.data);

      return {
        detections,
        provider: detectProvider(YOLO_PROVIDER_URL),
        rawResponse: response.data,
      };
    } catch (error) {
      lastError = error;
      console.error(`YOLO inference attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  console.error('YOLO inference failed after all retries:', lastError?.message);
  return {
    detections: [],
    provider: detectProvider(YOLO_PROVIDER_URL),
    rawResponse: { error: lastError?.message || 'Unknown error' },
    error: lastError?.message || 'Inference timeout after retries',
  };
}

function normalizeYoloResponse(responseData) {
  const detections = [];

  if (responseData.predictions && Array.isArray(responseData.predictions)) {
    for (const pred of responseData.predictions) {
      detections.push({
        label: pred.class || pred.label || 'unknown',
        confidence: pred.confidence || 0,
        bbox: pred.x !== undefined
          ? { x: pred.x, y: pred.y, width: pred.width, height: pred.height }
          : undefined,
      });
    }
  } else if (responseData.results && Array.isArray(responseData.results)) {
    for (const result of responseData.results) {
      detections.push({
        label: result.name || result.class || 'unknown',
        confidence: result.confidence || 0,
        bbox: result.box
          ? {
              x: result.box.x1,
              y: result.box.y1,
              width: result.box.x2 - result.box.x1,
              height: result.box.y2 - result.box.y1,
            }
          : undefined,
      });
    }
  } else if (Array.isArray(responseData)) {
    for (const item of responseData) {
      detections.push({
        label: item.label || item.class || item.name || 'unknown',
        confidence: item.confidence || item.score || 0,
        bbox: item.bbox || item.box || undefined,
      });
    }
  }

  return detections;
}

function detectProvider(url) {
  if (url.includes('roboflow')) return 'roboflow';
  if (url.includes('ultralytics')) return 'ultralytics';
  return 'unknown';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
