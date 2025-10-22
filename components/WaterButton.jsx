import React from 'react';

export default function WaterButton({ onWater, cooldownTime = null, isLoading = false }) {
  const isDisabled = cooldownTime !== null || isLoading;
  
  // Format cooldown time remaining if applicable
  const formatCooldown = () => {
    if (!cooldownTime) return '';
    
    const now = new Date();
    const cooldown = new Date(cooldownTime);
    const diffMs = cooldown - now;
    
    if (diffMs <= 0) return '';
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <button
      onClick={isDisabled ? null : onWater}
      disabled={isDisabled}
      className={`
        w-full py-4 font-bold rounded-lg transition duration-200 relative
        ${isDisabled 
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'}
        ${isLoading ? 'animate-pulse' : ''}
      `}
    >
      {isLoading ? (
        <span>Watering...</span>
      ) : cooldownTime ? (
        <>
          <span>Water Now</span>
          <span className="block text-sm mt-1">
            Cooldown: {formatCooldown()}
          </span>
        </>
      ) : (
        <span>Water Now</span>
      )}
    </button>
  );
}