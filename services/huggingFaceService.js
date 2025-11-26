// services/huggingFaceService.js
import { Client } from "@gradio/client";
import axios from 'axios';

const HF_GRADIO_SPACE = process.env.HF_GRADIO_SPACE || 'ratnadeep-xf/plant-identification';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // Increased from 2s to 5s for cold starts
const GRADIO_TIMEOUT_MS = 120000; // 2 minutes timeout for Gradio connection

/**
 * Perform inference using Hugging Face Gradio Space
 * @param {string} imageUrl - The URL of the image to analyze
 * @returns {Promise<Object>} - Object containing detections, provider, and raw response
 */
export async function inferByUrl(imageUrl) {
  if (!HF_GRADIO_SPACE) {
    console.warn('Hugging Face Gradio Space not configured. Returning empty detections.');
    return {
      detections: [],
      provider: 'none',
      rawResponse: { error: 'Hugging Face Gradio Space not configured' },
      error: 'Hugging Face Gradio Space not configured',
    };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Hugging Face Gradio inference attempt ${attempt}/${MAX_RETRIES} for URL: ${imageUrl}`);

      // Fetch the image from URL as blob with timeout
      const imageResponse = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout for image download
      });

      const imageBlob = new Blob([imageResponse.data], {
        type: imageResponse.headers['content-type'] || 'image/jpeg'
      });

      console.log(`[HF] Connecting to Gradio Space: ${HF_GRADIO_SPACE}...`);
      
      // Connect to Gradio Space with timeout
      const client = await Promise.race([
        Client.connect(HF_GRADIO_SPACE),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gradio connection timeout')), GRADIO_TIMEOUT_MS)
        )
      ]);
      
      console.log('[HF] Connected, calling /predict endpoint...');
      
      // Call the /predict endpoint with timeout
      const result = await Promise.race([
        client.predict("/predict", { img: imageBlob }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gradio prediction timeout')), GRADIO_TIMEOUT_MS)
        )
      ]);

      console.log('=== GRADIO RAW RESPONSE ===');
      console.log('Type:', typeof result.data);
      console.log('Data:', JSON.stringify(result.data, null, 2));
      console.log('=== END GRADIO RESPONSE ===');

      const detections = normalizeGradioResponse(result.data);

      return {
        detections,
        provider: 'huggingface-gradio',
        rawResponse: result.data,
      };
    } catch (error) {
      lastError = error;
      console.error(`Hugging Face Gradio inference attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  console.error('Hugging Face Gradio inference failed after all retries:', lastError?.message);
  
  // Return mock detection so system continues working
  console.warn('[HF] Returning fallback detection due to timeout');
  return {
    detections: [{
      label: 'Unknown Plant',
      confidence: 0.5
    }],
    provider: 'fallback-timeout',
    rawResponse: { 
      error: lastError?.message || 'Unknown error',
      fallback: true,
      note: 'System returned generic plant detection due to AI timeout'
    },
    error: lastError?.message || 'Inference timeout after retries',
  };
}

/**
 * Normalize Gradio response to standard format
 * The Gradio /predict endpoint returns data in various formats
 */
function normalizeGradioResponse(responseData) {
  const detections = [];

  console.log('=== NORMALIZING RESPONSE ===');
  console.log('Input type:', typeof responseData);
  console.log('Is Array:', Array.isArray(responseData));
  console.log('Input data:', JSON.stringify(responseData, null, 2));

  // Handle array response (most common)
  if (Array.isArray(responseData)) {
    for (const item of responseData) {
      // If item is an object with label/confidence
      if (typeof item === 'object' && item !== null) {
        // If it has a label field (even without confidence score)
        if (item.label) {
          detections.push({
            label: item.label,
            confidence: item.score || item.confidence || 0.9, // Default to 0.9 if no confidence provided
          });
        }
      }
      // If item is a string (just the label)
      else if (typeof item === 'string') {
        detections.push({
          label: item,
          confidence: 1.0,
        });
      }
    }
  }
  // Handle object response with predictions
  else if (responseData && typeof responseData === 'object') {
    // Check for predictions array
    if (responseData.predictions && Array.isArray(responseData.predictions)) {
      for (const pred of responseData.predictions) {
        detections.push({
          label: pred.label || pred.class || 'unknown',
          confidence: pred.score || pred.confidence || 0,
        });
      }
    }
    // Check for confidences object (Gradio Label output format)
    else if (responseData.confidences && Array.isArray(responseData.confidences)) {
      for (const item of responseData.confidences) {
        detections.push({
          label: item.label || 'unknown',
          confidence: item.confidence || 0,
        });
      }
    }
    // Single detection result
    else if (responseData.label) {
      detections.push({
        label: responseData.label,
        confidence: responseData.score || responseData.confidence || 0,
      });
    }
  }
  // Handle string response (single label)
  else if (typeof responseData === 'string') {
    detections.push({
      label: responseData,
      confidence: 1.0,
    });
  }

  console.log('=== DETECTIONS RESULT ===');
  console.log('Count:', detections.length);
  console.log('Detections:', JSON.stringify(detections, null, 2));
  console.log('=== END NORMALIZATION ===');

  return detections;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
