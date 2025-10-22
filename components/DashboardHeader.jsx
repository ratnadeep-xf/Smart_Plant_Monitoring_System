import React from 'react';
import StatusIndicator from './StatusIndicator';

export default function DashboardHeader({ projectName = 'Smart Plant Monitoring System', deviceStatus = 'offline' }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-700 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{projectName}</h1>
        <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Device Status</p>
          <StatusIndicator status={deviceStatus} />
        </div>
      </div>
    </div>
  );
}