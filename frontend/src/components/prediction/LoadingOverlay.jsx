import React, { useState, useEffect } from 'react';

const LoadingOverlay = ({ isVisible }) => {
  const [loadingText, setLoadingText] = useState('Analyzing Product…');

  useEffect(() => {
    if (!isVisible) return;
    const messages = [
      'Analyzing Product…',
      'Running ML Model…',
      'Checking Historical Records…',
      'Generating Recommendation…'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingText(messages[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
      {/* B&W spinner */}
      <div className="relative w-14 h-14 mb-5">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"/>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-black animate-spin"/>
      </div>
      <p className="text-base font-bold text-gray-900">{loadingText}</p>
      <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
    </div>
  );
};

export default LoadingOverlay;
