// Helper functions for interacting with YOLO API services
import axios from 'axios';

const YOLO_API_KEY = process.env.ROBOFLOW_API_KEY || '';
const YOLO_MODEL_ID = process.env.YOLO_MODEL_ID || '';
const YOLO_MODEL_VERSION = process.env.YOLO_MODEL_VERSION || '1';

// Map of detected plant labels to our DB records
const PLANT_MAP = {
  'basil': 'basil',
  'mint': 'mint',
  'rosemary': 'rosemary',
  'thyme': 'thyme',
  'cilantro': 'cilantro',
  'parsley': 'parsley',
  'oregano': 'oregano',
  // Add mappings for any potential YOLO model labels
  // If the model returns "tomato_plant" but our DB has "tomato"
  'tomato_plant': 'tomato',
  'pepper_plant': 'pepper',
};

/**
 * Upload an image to the YOLO API for inference
 * @param {Buffer} imageBuffer - Raw image data
 * @param {string} format - Image format (jpeg, png)
 * @returns {Promise<Object>} Detection results
 */
export async function detectPlant(imageBuffer, format = 'jpeg') {
  if (!YOLO_API_KEY || !YOLO_MODEL_ID) {
    console.warn('YOLO API credentials not configured');
    return { 
      success: false, 
      error: 'YOLO API not configured',
      predictions: [] 
    };
  }
  
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Make API request to Roboflow or similar service
    const response = await axios({
      method: 'POST',
      url: `https://detect.roboflow.com/${YOLO_MODEL_ID}/${YOLO_MODEL_VERSION}`,
      params: {
        api_key: YOLO_API_KEY,
      },
      data: base64Image,
      headers: {
        'Content-Type': `application/x-www-form-urlencoded`
      },
    });
    
    return {
      success: true,
      predictions: response.data.predictions || [],
      time: response.data.time || 0,
    };
    
  } catch (error) {
    console.error('YOLO API error:', error.message);
    return { 
      success: false, 
      error: error.message,
      predictions: [] 
    };
  }
}

/**
 * Map YOLO detection results to plant thresholds from our database
 * @param {Array} predictions - YOLO prediction results
 * @returns {Object} Plant data with thresholds
 */
export async function mapDetectionToPlant(predictions) {
  // If no predictions, return default values
  if (!predictions || predictions.length === 0) {
    return {
      plant_label: 'unknown',
      confidence: 0,
      thresholds: getDefaultThresholds()
    };
  }
  
  // Find the prediction with highest confidence
  const topPrediction = predictions.reduce(
    (prev, current) => (current.confidence > prev.confidence) ? current : prev,
    predictions[0]
  );
  
  // Map the detected label to our database labels
  const plantLabel = PLANT_MAP[topPrediction.class.toLowerCase()] || 'unknown';
  
  // Here you would fetch the actual thresholds from your database
  // For now we'll use hard-coded example values
  const thresholds = await getPlantThresholds(plantLabel);
  
  return {
    plant_label: plantLabel,
    confidence: topPrediction.confidence,
    thresholds
  };
}

/**
 * Get plant thresholds from database
 * @param {string} plantLabel 
 * @returns {Promise<Object>} Threshold values
 */
async function getPlantThresholds(plantLabel) {
  // In a real implementation, this would query your database
  // For this example, we'll return hard-coded values
  
  const thresholds = {
    'basil': {
      soil_min: 40,
      soil_max: 60,
      temp_min: 18,
      temp_max: 30,
      humidity_min: 40,
      humidity_max: 60,
      light_min: 60,
      light_max: 85
    },
    'mint': {
      soil_min: 45,
      soil_max: 70,
      temp_min: 18,
      temp_max: 26,
      humidity_min: 50,
      humidity_max: 70,
      light_min: 50,
      light_max: 75
    },
    'rosemary': {
      soil_min: 30,
      soil_max: 50,
      temp_min: 20,
      temp_max: 32,
      humidity_min: 30,
      humidity_max: 50,
      light_min: 70,
      light_max: 95
    },
    // Add more plant types as needed
  };
  
  return thresholds[plantLabel] || getDefaultThresholds();
}

/**
 * Default thresholds for unknown plants
 */
function getDefaultThresholds() {
  return {
    soil_min: 30,
    soil_max: 70,
    temp_min: 18,
    temp_max: 28,
    humidity_min: 30,
    humidity_max: 70,
    light_min: 50,
    light_max: 85
  };
}