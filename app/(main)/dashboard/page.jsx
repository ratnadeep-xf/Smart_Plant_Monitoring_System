'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import DashboardHeader from '@/components/DashboardHeader';
import GaugeCard from '@/components/GaugeCard';
import ImageCard from '@/components/ImageCard';
import ControlPanel from '@/components/ControlPanel';
import SparklineChart from '@/components/SparklineChart';
import '@/styles/animations.css';

export default function Dashboard() {
  const router = useRouter();
  
  // State for sensor readings
  const [sensorData, setSensorData] = useState({
    soil_moisture: 0,
    temperature: 0,
    humidity: 0,
    light: 0,
    lastReading: null,
    deviceStatus: 'connecting'
  });
  
  // State for historical data (sparklines)
  const [historicalData, setHistoricalData] = useState({
    soil_moisture: [],
    temperature: [],
    humidity: [],
    light: []
  });
  
  // State for plant detection
  const [plantData, setPlantData] = useState({
    imageUrl: null,
    plantLabel: null,
    confidence: 0,
    lastUpdated: null,
    plantType: null,
    plantInfo: null
  });
  
  // State for watering control
  const [wateringState, setWateringState] = useState({
    isLoading: false,
    cooldownTime: null,
    duration: 5
  });
  
  // Fetch latest data from API
  const fetchLatestData = async () => {
    try {
      const { data } = await axios.get('/api/latest');
      
      if (data.success) {
        const { reading, image, detection } = data.data;
        
        // Update sensor data from latest reading
        if (reading) {
          setSensorData({
            soil_moisture: reading.soilPct || 0,
            temperature: reading.temperatureC || 0,
            humidity: reading.humidityPct || 0,
            light: reading.lux || 0,
            lastReading: reading.timestamp,
            deviceStatus: 'online'
          });
        }
        
        // Update plant data from latest detection
        if (image && detection) {
          setPlantData({
            imageUrl: image.url,
            plantLabel: detection.label,
            confidence: detection.confidence,
            lastUpdated: new Date(image.timestamp).toLocaleString(),
            plantType: detection.plantType,
            plantInfo: detection.plantData
          });
        }
      }
    } catch (error) {
      console.error('Error fetching latest data:', error);
      setSensorData(prev => ({ ...prev, deviceStatus: 'offline' }));
    }
  };
  
  // Fetch historical data for sparklines
  const fetchHistoricalData = async () => {
    try {
      const { data } = await axios.get('/api/history', {
        params: {
          limit: 20,
          agg: 'raw'
        }
      });
      
      if (data.success) {
        const readings = data.data.readings;
        
        setHistoricalData({
          soil_moisture: readings.map(r => ({ 
            timestamp: new Date(r.timestamp), 
            value: r.soilPct || 0 
          })).reverse(),
          temperature: readings.map(r => ({ 
            timestamp: new Date(r.timestamp), 
            value: r.temperatureC || 0 
          })).reverse(),
          humidity: readings.map(r => ({ 
            timestamp: new Date(r.timestamp), 
            value: r.humidityPct || 0 
          })).reverse(),
          light: readings.map(r => ({ 
            timestamp: new Date(r.timestamp), 
            value: r.lux || 0 
          })).reverse()
        });
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };
  
  // Water the plant
  const handleWaterNow = async () => {
    setWateringState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data } = await axios.post('/api/control/water', {
        device_id: 'dashboard-user',
        duration: wateringState.duration
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEVICE_TOKEN || ''}`
        }
      });
      
      if (data.success) {
        setWateringState(prev => ({
          ...prev,
          isLoading: false,
          cooldownTime: data.data.nextAllowedAt
        }));
        
        toast.success(`Watering command sent (${wateringState.duration}s)`);
      }
    } catch (error) {
      console.error('Error watering plant:', error);
      setWateringState(prev => ({ ...prev, isLoading: false }));
      
      const message = error.response?.data?.message || 'Error: Could not connect to device';
      toast.error(message);
    }
  };
  
  
  // Update duration for watering
  const handleDurationChange = (newDuration) => {
    setWateringState(prev => ({ ...prev, duration: newDuration }));
  };
  
  // Dismiss all alerts
  const dismissAlerts = () => setAlerts([]);
  
  // Initial data fetch
  useEffect(() => {
    fetchLatestData();
    fetchHistoricalData();
  }, []);
  
  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestData();
      fetchHistoricalData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <main className="container mx-auto px-4 py-6">
      <Toaster position="top-right" richColors />
      
      {/* Dashboard Header */}
      <DashboardHeader 
        projectName="Smart Plant Monitoring"
        deviceStatus={sensorData.deviceStatus} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Gauges */}
        <div className="md:col-span-3 space-y-6">
          <GaugeCard 
            title="Soil Moisture" 
            value={Math.round(sensorData.soil_moisture)} 
            min={0} 
            max={100} 
            unit="%" 
            color="blue"
          />
          
          <GaugeCard 
            title="Temperature" 
            value={Math.round(sensorData.temperature * 10) / 10} 
            min={10} 
            max={35} 
            unit="°C" 
            color="red"
          />
          
          <GaugeCard 
            title="Humidity" 
            value={Math.round(sensorData.humidity)} 
            min={0} 
            max={100} 
            unit="%" 
            color="green"
          />
          
          <GaugeCard 
            title="Light Level" 
            value={Math.round(sensorData.light)} 
            min={0} 
            max={100} 
            unit="%" 
            color="yellow"
          />
        </div>
        
        {/* Center Column - Camera */}
        <div className="md:col-span-6 space-y-6">
          <ImageCard 
            imageUrl={plantData.imageUrl}
            plantLabel={plantData.plantLabel}
            confidence={plantData.confidence}
            lastUpdated={plantData.lastUpdated}
          />
          
          {/* Mini charts / sparklines */}
          <div className="grid grid-cols-2 gap-4">
            <SparklineChart 
              title="Soil Moisture (1h)" 
              data={historicalData.soil_moisture} 
              color="blue"
              unit="%"
            />
            
            <SparklineChart 
              title="Temperature (1h)" 
              data={historicalData.temperature} 
              color="red"
              unit="°C"
            />
            
            <SparklineChart 
              title="Humidity (1h)" 
              data={historicalData.humidity} 
              color="green"
              unit="%"
            />
            
            <SparklineChart 
              title="Light Level (1h)" 
              data={historicalData.light} 
              color="yellow"
              unit="%"
            />
          </div>
        </div>
        
        {/* Right Column - Controls */}
        <div className="md:col-span-3 space-y-6">
          <ControlPanel 
            onWater={handleWaterNow}
            cooldownTime={wateringState.cooldownTime}
            isLoading={wateringState.isLoading}
            waterDuration={wateringState.duration}
            onDurationChange={handleDurationChange}
          />
          
          {/* Plant Info Card */}
          <div className="p-5 rounded-lg bg-gray-800 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-3">Plant Information</h2>
            {plantData.plantLabel ? (
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Detected:</span>
                  <span className="font-medium text-white">{plantData.plantLabel}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="font-medium text-green-400">{(plantData.confidence * 100).toFixed(1)}%</span>
                </div>
                
                {plantData.plantInfo ? (
                  <>
                    <div className="flex justify-between border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Common Name:</span>
                      <span className="font-medium text-white">{plantData.plantInfo.commonName}</span>
                    </div>
                    
                    {plantData.plantInfo.scientificName && (
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Scientific Name:</span>
                        <span className="font-medium text-white italic text-sm">{plantData.plantInfo.scientificName}</span>
                      </div>
                    )}
                    
                    {plantData.plantInfo.wateringFrequencyDays && (
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Watering:</span>
                        <span className="font-medium text-white">Every {plantData.plantInfo.wateringFrequencyDays} day(s)</span>
                      </div>
                    )}
                    
                    {plantData.plantInfo.idealSunlightExposure && (
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Ideal Sunlight:</span>
                        <span className="font-medium text-white text-right text-sm">{plantData.plantInfo.idealSunlightExposure}</span>
                      </div>
                    )}
                    
                    {plantData.plantInfo.idealRoomTemperatureC && (
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Ideal Temperature:</span>
                        <span className="font-medium text-white">{plantData.plantInfo.idealRoomTemperatureC}°C</span>
                      </div>
                    )}
                    
                    {plantData.plantInfo.idealHumidityPercent && (
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Ideal Humidity:</span>
                        <span className="font-medium text-white">{plantData.plantInfo.idealHumidityPercent}%</span>
                      </div>
                    )}
                    
                    {plantData.plantInfo.idealSoilMoisturePercent && (
                      <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Ideal Moisture:</span>
                        <span className="font-medium text-white">{plantData.plantInfo.idealSoilMoisturePercent}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3 mt-3">
                    <p className="text-yellow-400 text-sm">
                      Plant detected but no care information available in database.
                    </p>
                  </div>
                )}
                
                <div className="mt-4 pt-2 border-t border-gray-600">
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>Last Updated:</span>
                    <span>{plantData.lastUpdated}</span>
                  </div>
                </div>
                
                {plantData.plantInfo && (
                  <button
                    onClick={() => router.push('/plant-details')}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium"
                  >
                    View Full Details
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400">No plant detected yet</p>
                <p className="text-gray-500 text-sm mt-2">Upload an image to identify your plant</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
