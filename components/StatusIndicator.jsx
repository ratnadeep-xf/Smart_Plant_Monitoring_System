import React from 'react';

export default function StatusIndicator({ status = 'offline' }) {
  // Status can be: 'online', 'warning', 'offline', 'error'
  const statusColors = {
    online: 'bg-green-500',
    warning: 'bg-yellow-500',
    offline: 'bg-red-500',
    error: 'bg-red-500',
  };
  
  const statusText = {
    online: 'Online',
    warning: 'Warning',
    offline: 'Offline',
    error: 'Error',
  };
  
  const pulseClass = status === 'online' ? 'animate-pulse' : '';
  const bgColor = statusColors[status] || statusColors.offline;
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${bgColor} ${pulseClass}`}></div>
      <span className="text-sm font-medium">
        {statusText[status] || 'Unknown'}
      </span>
    </div>
  );
}