import React from 'react';

export default function SparklineChart({ title, data = [], color = 'blue', unit = '' }) {
  // Ensure we have data
  if (!data || data.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-gray-800 shadow-lg h-24">
        <h3 className="text-sm font-medium mb-2">{title}</h3>
        <div className="h-12 flex items-center justify-center text-gray-500 text-xs">
          No data available
        </div>
      </div>
    );
  }

  // Find min and max for scaling
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min > 0 ? max - min : 1;
  
  // Calculate points for the sparkline
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100; // Using percentage for better scaling
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Color mapping
  const colorMap = {
    'blue': '#3b82f6',
    'green': '#10b981',
    'red': '#ef4444',
    'yellow': '#f59e0b',
    'purple': '#8b5cf6',
  };
  const lineColor = colorMap[color] || colorMap.blue;

  // Get latest value
  const latestValue = data[data.length - 1]?.value;
  
  return (
    <div className="p-3 rounded-lg bg-gray-800 shadow-lg">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-sm font-bold">{latestValue}{unit}</span>
      </div>
      
      <div className="relative h-28 w-full">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Line */}
          <polyline 
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Subtle gradient fill for the entire chart area */}
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={lineColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
          
          {/* Fill area - modified to cover the complete SVG space */}
          <polygon 
            points={`0,0 0,100 ${points} 100,0`}
            fill={`url(#gradient-${color})`}
          />
          
          {/* Latest data point */}
          <circle 
            cx={`${(data.length - 1) / (data.length - 1) * 100}%`}
            cy={`${100 - ((latestValue - min) / range) * 100}%`}
            r="3" 
            fill={lineColor}
          />
        </svg>
      </div>
    </div>
  );
}