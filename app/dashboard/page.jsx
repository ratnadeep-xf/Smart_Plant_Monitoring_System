'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '../../components/DashboardHeader';
import GaugeCard from '../../components/GaugeCard';
import ImageCard from '../../components/ImageCard';
import ControlPanel from '../../components/ControlPanel';
import AlertBanner from '../../components/AlertBanner';
import SparklineChart from '../../components/SparklineChart';
import '../../styles/animations.css';

export default function Dashboard() {
  // State for sensor readings
  const [sensorData, setSensorData] = useState({
    soil_moisture: 45,
    temperature: 22,
    humidity: 60,
    light: 75,
    lastReading: new Date().toISOString(),
    deviceStatus: 'online'
  });
  
  // State for historical data (sparklines)
  const [historicalData, setHistoricalData] = useState({
    soil_moisture: generateDummyData(45, 5),
    temperature: generateDummyData(22, 2),
    humidity: generateDummyData(60, 7),
    light: generateDummyData(75, 15)
  });
  
  // State for plant detection
  const [plantData, setPlantData] = useState({
    imageUrl: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    plantLabel: 'Basil',
    confidence: 0.92,
    lastUpdated: '2 minutes ago'
  });
  
  // State for watering control
  const [wateringState, setWateringState] = useState({
    isLoading: false,
    cooldownTime: null,
    duration: 5
  });
  
  // State for alerts
  const [alerts, setAlerts] = useState([
    { id: 1, message: 'Soil moisture below recommended level for Basil (40%)' }
  ]);
  
  // Mock function to simulate watering action
  const handleWaterNow = () => {
    setWateringState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    setTimeout(() => {
      setWateringState(prev => ({
        ...prev,
        isLoading: false,
        cooldownTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min cooldown
      }));
      
      // Add a success alert
      setAlerts(prev => [
        ...prev,
        { id: Date.now(), message: `Manual watering completed (${wateringState.duration}s)` }
      ]);
    }, 3000);
  };
  
  // Update duration for watering
  const handleDurationChange = (newDuration) => {
    setWateringState(prev => ({ ...prev, duration: newDuration }));
  };
  
  // Dismiss all alerts
  const dismissAlerts = () => setAlerts([]);
  
  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update sensor readings with small random fluctuations
      setSensorData(prev => ({
        soil_moisture: Math.max(0, Math.min(100, prev.soil_moisture + (Math.random() - 0.5) * 2)),
        temperature: Math.max(10, Math.min(35, prev.temperature + (Math.random() - 0.5) * 0.5)),
        humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
        light: Math.max(0, Math.min(100, prev.light + (Math.random() - 0.5) * 3)),
        lastReading: new Date().toISOString(),
        deviceStatus: 'online'
      }));
      
      // Update historical data
      setHistoricalData(prev => ({
        soil_moisture: [
          ...prev.soil_moisture.slice(1), 
          { timestamp: new Date(), value: sensorData.soil_moisture }
        ],
        temperature: [
          ...prev.temperature.slice(1), 
          { timestamp: new Date(), value: sensorData.temperature }
        ],
        humidity: [
          ...prev.humidity.slice(1), 
          { timestamp: new Date(), value: sensorData.humidity }
        ],
        light: [
          ...prev.light.slice(1), 
          { timestamp: new Date(), value: sensorData.light }
        ]
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [sensorData]);
  
  return (
    <main className="container mx-auto px-4 py-6">
      {/* Alerts Banner */}
      <AlertBanner alerts={alerts} onDismiss={dismissAlerts} />
      
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
          <div className="p-4 rounded-lg bg-gray-800 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-3">Plant Information</h2>
            {plantData.plantLabel ? (
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Type:</span>
                  <span className="font-medium text-white">{plantData.plantLabel}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Ideal Soil:</span>
                  <span className="font-medium text-white">40-60%</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Ideal Temp:</span>
                  <span className="font-medium text-white">18-30°C</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Watered:</span>
                  <span className="font-medium text-white">2 hours ago</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No plant detected</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper function to generate dummy time series data
function generateDummyData(baseValue, variance, count = 20) {
  const result = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setMinutes(now.getMinutes() - i * 3);
    
    const value = Math.max(0, baseValue + (Math.random() * variance * 2) - variance);
    result.push({ timestamp, value });
  }
  
  return result;
}
