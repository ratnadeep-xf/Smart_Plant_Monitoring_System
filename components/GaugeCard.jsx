import React from 'react';

export default function GaugeCard({ title, value, min, max, unit, color = 'blue' }) {
  // Calculate the percentage within the range
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  // Determine color based on value or use the provided color
  const gaugeColor = color === 'dynamic' 
    ? (percentage < 25 ? 'red' : percentage < 75 ? 'yellow' : 'green') 
    : color;
  
  const colorMap = {
    'red': 'bg-red-500',
    'yellow': 'bg-yellow-500',
    'green': 'bg-green-500',
    'blue': 'bg-blue-500',
  };
  
  const bgColor = colorMap[gaugeColor] || 'bg-blue-500';
  
  return (
    <div className="p-4 rounded-lg bg-gray-800 shadow-lg">
      <h2 className="text-xl mb-2">{title}</h2>
      
      {/* Gauge visualization */}
      <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden mb-2">
        <div 
          className={`absolute top-0 left-0 h-full ${bgColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-400">
        <span>{min}{unit}</span>
        <span className="text-lg font-bold text-white">{value}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}