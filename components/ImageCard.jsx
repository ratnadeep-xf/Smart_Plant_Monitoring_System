import React from 'react';

export default function ImageCard({ imageUrl, plantLabel, confidence }) {
  return (
    <div className="p-4 rounded-lg bg-gray-800 shadow-lg">
      <h2 className="text-xl mb-2">Plant Image</h2>
      
      <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`Plant identified as ${plantLabel || 'unknown'}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image available
          </div>
        )}
        
        {plantLabel && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{plantLabel}</span>
              <span className="text-sm bg-green-800 px-2 py-0.5 rounded">
                {Math.round(confidence * 100)}% confidence
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}