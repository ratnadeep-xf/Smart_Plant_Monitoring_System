import React from 'react';

export default function ControlPanel({ onWater, cooldownTime, isLoading, waterDuration = 5, onDurationChange }) {
  return (
    <div className="p-4 rounded-lg bg-gray-800 shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Manual Control</h2>
      
      <div className="mb-4">
        <label htmlFor="duration" className="block text-sm text-gray-400 mb-2">
          Watering Duration (seconds)
        </label>
        <input 
          type="range" 
          id="duration"
          min="1"
          max="15"
          step="1"
          value={waterDuration}
          onChange={(e) => onDurationChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          disabled={isLoading || cooldownTime !== null}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1s</span>
          <span>{waterDuration}s</span>
          <span>15s</span>
        </div>
      </div>
      
      {/* Enhanced Water Button with glow effect */}
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 blur-md rounded-lg ${cooldownTime === null && !isLoading ? 'bg-blue-500 opacity-30' : 'opacity-0'}`}></div>
        
        <button
          onClick={cooldownTime !== null || isLoading ? null : onWater}
          disabled={cooldownTime !== null || isLoading}
          className={`
            relative w-full py-6 font-bold text-lg rounded-lg transition-all duration-200
            ${cooldownTime !== null || isLoading 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/50 hover:shadow-blue-800/70'}
            ${isLoading ? 'animate-pulse' : ''}
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Watering for {waterDuration}s...
            </span>
          ) : cooldownTime ? (
            <div>
              <div className="mb-1">Water Now</div>
              <div className="text-sm opacity-80">
                Cooldown: {formatCooldown(cooldownTime)}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-1">Water Now</div>
              <div className="text-sm opacity-80">
                for {waterDuration} seconds
              </div>
            </div>
          )}
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        <p>Safety limits: max 15 seconds, 30 minute cooldown period.</p>
      </div>
    </div>
  );
}

// Helper function to format cooldown time
function formatCooldown(cooldownTime) {
  const now = new Date();
  const cooldown = new Date(cooldownTime);
  const diffMs = cooldown - now;
  
  if (diffMs <= 0) return '00:00';
  
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}