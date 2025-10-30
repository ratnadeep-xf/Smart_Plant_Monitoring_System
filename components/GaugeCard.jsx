import React from 'react';

export default function GaugeCard({ title, value, min, max, unit, color = 'blue', icon = null }) {
  // Calculate the percentage within the range
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  // Determine color based on value or use the provided color
  const gaugeColor = color === 'dynamic' 
    ? (percentage < 25 ? 'red' : percentage < 75 ? 'yellow' : 'green') 
    : color;
  
  const colorMap = {
    'red': {
      bg: 'bg-red-500',
      text: 'text-red-400',
      glow: 'shadow-red-500/30',
      border: 'border-red-800',
      gradient: 'from-red-500 to-red-700'
    },
    'yellow': {
      bg: 'bg-yellow-500',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/30',
      border: 'border-yellow-800',
      gradient: 'from-yellow-500 to-yellow-700'
    },
    'green': {
      bg: 'bg-green-500',
      text: 'text-green-400',
      glow: 'shadow-green-500/30',
      border: 'border-green-800',
      gradient: 'from-green-500 to-green-700'
    },
    'blue': {
      bg: 'bg-blue-500',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/30',
      border: 'border-blue-800',
      gradient: 'from-blue-500 to-blue-700'
    },
  };
  
  const theme = colorMap[gaugeColor] || colorMap.blue;
  
  // Icons for each sensor type
  const icons = {
    soil: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
      </svg>
    ),
    temperature: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 2a1 1 0 01.117 1.993L7 4v9.748l3.276 3.276a1 1 0 11-1.275 1.542l-.149-.13a1 1 0 01-.108-.092l-3-3A1 1 0 015 14.5V4a2 2 0 114 0v4.758l.276-.276a1 1 0 111.448 1.381l-.099.104-.047.044L7 13.5V4a1 1 0 01-1-1 1 1 0 011-1zm6-1a1 1 0 01.993.883L14 2v9.5a4.5 4.5 0 11-9 0V2a1 1 0 011-1h6zm-1 2H8v8.5a2.5 2.5 0 005 0V3z" />
      </svg>
    ),
    humidity: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
    light: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
      </svg>
    )
  };
  
  // Display icon if provided or use default based on title
  const displayIcon = icon || 
    (title.toLowerCase().includes('soil') ? icons.soil :
     title.toLowerCase().includes('temp') ? icons.temperature :
     title.toLowerCase().includes('humid') ? icons.humidity :
     title.toLowerCase().includes('light') ? icons.light : null);

  return (
    <div className={`p-4 rounded-lg bg-gray-800 shadow-lg border ${theme.border} relative overflow-hidden group`}>
      {/* Header with title and icon */}
      <div className="flex justify-between items-center mb-3">
        <h2 className={`text-xl font-medium ${theme.text}`}>{title}</h2>
        {displayIcon && <div className={`${theme.text}`}>{displayIcon}</div>}
      </div>
      
      {/* Value display */}
      <div className="mb-4 flex justify-center items-center">
        <div className={`text-4xl font-bold transition-all duration-300 ${percentage > 75 || percentage < 25 ? 'animate-pulse' : ''}`}>
          {value}<span className="text-xl ml-1">{unit}</span>
        </div>
      </div>
      
      {/* Gauge visualization */}
      <div className="relative h-9 bg-gray-700 rounded-full overflow-hidden mb-2 shadow-inner">
        {/* Animated background patterns for gauge */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 8" preserveAspectRatio="none">
            <defs>
              <pattern id={`${gaugeColor}-grid`} width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 0h8v8H0V0zm4 4h4v4H4V4z" fill="currentColor" fillOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="8" fill={`url(#${gaugeColor}-grid)`} />
          </svg>
        </div>
        
        {/* Progress bar with gradient */}
        <div 
          className={`absolute top-0 left-0 h-full bg-linear-to-r ${theme.gradient} rounded-full transition-all duration-500 shadow-lg ${theme.glow}`}
          style={{ width: `${percentage}%` }}
        ></div>
        
        {/* Pulse effect on the edge of the gauge */}
        <div 
          className={`absolute top-0 h-full w-2 rounded-full transition-all duration-500 ${percentage > 0 ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            left: `calc(${percentage}% - 1px)`,
            background: `radial-gradient(ellipse at center, ${gaugeColor === 'blue' ? '#3b82f6' : gaugeColor === 'green' ? '#10b981' : gaugeColor === 'yellow' ? '#f59e0b' : '#ef4444'} 0%, rgba(0,0,0,0) 70%)` 
          }}
        ></div>
      </div>
      
      {/* Min/max labels */}
      <div className="flex justify-between text-sm text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}