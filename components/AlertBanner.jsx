import React from 'react';

export default function AlertBanner({ alerts = [], onDismiss }) {
  if (alerts.length === 0) return null;
  
  return (
    <div className="mb-6 overflow-hidden">
      <div className="rounded-lg bg-red-900 border border-red-700 shadow-lg animate-pulse">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-white">
                {alerts.length > 1 ? `${alerts.length} Alerts` : 'Alert'}
              </h3>
            </div>
            {onDismiss && (
              <button 
                onClick={onDismiss} 
                className="text-red-300 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-2">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-red-100 mb-1">
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}