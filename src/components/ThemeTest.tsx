import React, { useEffect, useState } from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';

const themes: Theme[] = ['light', 'dark', 'blue', 'purple', 'green', 'orange'];

export const ThemeTest: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoTesting, setIsAutoTesting] = useState(false);

  // Auto-cycle through themes for testing
  useEffect(() => {
    if (isAutoTesting) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % themes.length;
          setTheme(themes[nextIndex]);
          return nextIndex;
        });
      }, 2000); // Change theme every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isAutoTesting, setTheme]);

  const handleManualThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setCurrentIndex(themes.indexOf(newTheme));
  };

  const toggleAutoTest = () => {
    setIsAutoTesting(!isAutoTesting);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Theme Test Panel
      </h3>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        Current: <span className="font-medium">{theme}</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {themes.map((themeOption) => (
          <button
            key={themeOption}
            onClick={() => handleManualThemeChange(themeOption)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              theme === themeOption
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {themeOption}
          </button>
        ))}
      </div>

      <button
        onClick={toggleAutoTest}
        className={`w-full px-3 py-1 text-xs rounded transition-colors ${
          isAutoTesting
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isAutoTesting ? 'Stop Auto Test' : 'Start Auto Test'}
      </button>

      {isAutoTesting && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Auto-cycling... ({currentIndex + 1}/{themes.length})
        </div>
      )}
    </div>
  );
};
