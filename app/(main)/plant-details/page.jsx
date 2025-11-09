'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function PlantDetailPage() {
  const router = useRouter();
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlantData = async () => {
      try {
        setLoading(true);
        
        // Get the latest data which includes the detected plant
        const { data } = await axios.get('/api/latest');
        
        if (data.success && data.data.detection && data.data.detection.plantData) {
          setPlantData({
            ...data.data.detection.plantData,
            plantType: data.data.detection.plantType,
            image: data.data.image,
            detection: data.data.detection
          });
        } else {
          setError('No plant detected yet. Please upload an image or wait for detection.');
        }
      } catch (err) {
        console.error('Error fetching plant data:', err);
        setError('Failed to load plant information');
      } finally {
        setLoading(false);
      }
    };

    fetchPlantData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading plant information...</p>
        </div>
      </div>
    );
  }

  if (error || !plantData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No plant data available'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold">{plantData.commonName || 'Plant Details'}</h1>
          </div>
          {plantData.detection && (
            <div className="text-sm">
              <span className="text-gray-400">Confidence: </span>
              <span className="text-green-400 font-semibold">
                {(plantData.detection.confidence * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="space-y-6">
            {plantData.image && (
              <div className="rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                <img
                  src={plantData.image.url}
                  alt={plantData.commonName}
                  className="w-full h-auto"
                />
                <div className="p-4 text-sm text-gray-400">
                  <p>Detected: {plantData.detection?.label}</p>
                  <p>Updated: {new Date(plantData.image.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            {plantData.plantType && plantData.plantType.thresholds && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Sensor Thresholds</h2>
                <div className="grid grid-cols-2 gap-4">
                  {plantData.plantType.thresholds.soil_min !== undefined && (
                    <div className="bg-gray-700 rounded p-3">
                      <p className="text-gray-400 text-sm">Soil Moisture</p>
                      <p className="text-white font-semibold">
                        {plantData.plantType.thresholds.soil_min}-{plantData.plantType.thresholds.soil_max}%
                      </p>
                    </div>
                  )}
                  {plantData.plantType.thresholds.temp_min !== undefined && (
                    <div className="bg-gray-700 rounded p-3">
                      <p className="text-gray-400 text-sm">Temperature</p>
                      <p className="text-white font-semibold">
                        {plantData.plantType.thresholds.temp_min}-{plantData.plantType.thresholds.temp_max}°C
                      </p>
                    </div>
                  )}
                  {plantData.plantType.thresholds.humidity_min !== undefined && (
                    <div className="bg-gray-700 rounded p-3">
                      <p className="text-gray-400 text-sm">Humidity</p>
                      <p className="text-white font-semibold">
                        {plantData.plantType.thresholds.humidity_min}-{plantData.plantType.thresholds.humidity_max}%
                      </p>
                    </div>
                  )}
                  {plantData.plantType.thresholds.light_min !== undefined && (
                    <div className="bg-gray-700 rounded p-3">
                      <p className="text-gray-400 text-sm">Light</p>
                      <p className="text-white font-semibold">
                        {plantData.plantType.thresholds.light_min}-{plantData.plantType.thresholds.light_max} lux
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
              <div className="space-y-3">
                {plantData.scientificName && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Scientific Name:</span>
                    <span className="font-medium text-white italic">{plantData.scientificName}</span>
                  </div>
                )}
                {plantData.commonName && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Common Name:</span>
                    <span className="font-medium text-white">{plantData.commonName}</span>
                  </div>
                )}
                {plantData.plantFamily && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Family:</span>
                    <span className="font-medium text-white">{plantData.plantFamily}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Watering & Care */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Watering & Care</h2>
              <div className="space-y-3">
                {plantData.wateringAmountMl && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Watering Amount:</span>
                    <span className="font-medium text-white">{plantData.wateringAmountMl} ml</span>
                  </div>
                )}
                {plantData.wateringFrequencyDays && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Watering Frequency:</span>
                    <span className="font-medium text-white">Every {plantData.wateringFrequencyDays} day(s)</span>
                  </div>
                )}
                {plantData.idealSoilMoisturePercent && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Ideal Soil Moisture:</span>
                    <span className="font-medium text-white">{plantData.idealSoilMoisturePercent}%</span>
                  </div>
                )}
                {plantData.idealSoilType && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Soil Type:</span>
                    <span className="font-medium text-white">{plantData.idealSoilType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Environmental Conditions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Environmental Conditions</h2>
              <div className="space-y-3">
                {plantData.idealSunlightExposure && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Sunlight Exposure:</span>
                    <span className="font-medium text-white">{plantData.idealSunlightExposure}</span>
                  </div>
                )}
                {plantData.idealRoomTemperatureC && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Ideal Temperature:</span>
                    <span className="font-medium text-white">{plantData.idealRoomTemperatureC}°C</span>
                  </div>
                )}
                {plantData.idealHumidityPercent && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Ideal Humidity:</span>
                    <span className="font-medium text-white">{plantData.idealHumidityPercent}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fertilizer Information */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Fertilizer Information</h2>
              <div className="space-y-3">
                {plantData.fertilizerType && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Fertilizer Type:</span>
                    <span className="font-medium text-white">{plantData.fertilizerType}</span>
                  </div>
                )}
                {plantData.idealFertilizerAmountMl && (
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Amount:</span>
                    <span className="font-medium text-white">{plantData.idealFertilizerAmountMl} ml</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
