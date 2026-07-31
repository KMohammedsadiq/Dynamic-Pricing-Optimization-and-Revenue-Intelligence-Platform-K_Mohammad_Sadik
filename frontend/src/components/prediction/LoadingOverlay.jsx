import React, { useState, useEffect } from 'react';

const LoadingOverlay = ({ isVisible }) => {
  const [loadingText, setLoadingText] = useState('Analyzing Product...');
  
  useEffect(() => {
    if (!isVisible) return;
    
    const messages = [
      'Analyzing Product...',
      'Running ML Model...',
      'Checking Historical Records...',
      'Generating Business Recommendation...'
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingText(messages[currentIndex]);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
      <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium text-gray-800 animate-pulse">{loadingText}</p>
    </div>
  );
};

export default LoadingOverlay;
