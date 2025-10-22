import React from 'react';

export default function ImageCard({ imageUrl, plantLabel, confidence, lastUpdated }) {
  const confidenceLevel = confidence ? Math.round(confidence * 100) : 0;
  
  // Calculate confidence level color
  const getConfidenceColor = (level) => {
    if (level >= 90) return 'bg-green-500';
    if (level >= 70) return 'bg-green-600';
    if (level >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const confidenceColor = getConfidenceColor(confidenceLevel);
  
  return (
    <div className="p-4 rounded-lg bg-gray-800 shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-green-400">Plant Camera</h2>
        {lastUpdated && (
          <span className="text-xs text-gray-400">
            Updated {lastUpdated}
          </span>
        )}
      </div>
      
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-inner">
        {/* Decorative tech elements */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" 
             style={{ animationDelay: '1s' }}></div>
        
        {/* Image or placeholder */}
        {imageUrl ? (
          <div className="relative w-full h-full">
            <img 
              src={imageUrl} 
              alt={`Plant identified as ${plantLabel || 'unknown'}`} 
              className="w-full h-full object-cover"
            />
            
            {/* Scanner animation overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-0 right-0 h-0.5 bg-green-400 opacity-50 animate-scan" 
                   style={{ boxShadow: '0 0 8px 2px rgba(74, 222, 128, 0.5)' }}></div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>No image available</p>
          </div>
        )}
        
        {/* Plant detection info */}
        {plantLabel && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 backdrop-blur-sm p-3 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold text-lg capitalize">{plantLabel}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400 mb-1">Confidence</span>
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${confidenceColor} transition-all duration-500`}
                    style={{ width: `${confidenceLevel}%` }}
                  ></div>
                </div>
                <span className="text-xs mt-1 font-medium">{confidenceLevel}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Optional bounding box explanation */}
      <div className="mt-2 text-xs text-gray-400">
        {plantLabel ? 
          `Detected ${plantLabel} with ${confidenceLevel}% confidence. Thresholds adjusted automatically.` : 
          'Waiting for plant detection...'}
      </div>
    </div>
  );
}