import React, { useState, useCallback } from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { XIcon, CheckIcon, EyeIcon, RefreshIcon } from './icons';

interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
  preview: {
    background: string;
    surface: string;
    text: string;
    accent: string;
    secondary: string;
  };
  cssClass: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright theme for daylight use',
    preview: {
      background: 'bg-white',
      surface: 'bg-slate-50',
      text: 'text-slate-900',
      accent: 'bg-blue-500',
      secondary: 'bg-slate-100'
    },
    cssClass: 'theme-light'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes for low-light environments',
    preview: {
      background: 'bg-slate-900',
      surface: 'bg-slate-800',
      text: 'text-slate-50',
      accent: 'bg-blue-500',
      secondary: 'bg-slate-700'
    },
    cssClass: 'theme-dark'
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Calming blue theme inspired by the ocean',
    preview: {
      background: 'bg-blue-50',
      surface: 'bg-blue-100',
      text: 'text-blue-900',
      accent: 'bg-blue-600',
      secondary: 'bg-blue-200'
    },
    cssClass: 'theme-blue'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Elegant purple theme with premium feel',
    preview: {
      background: 'bg-purple-50',
      surface: 'bg-purple-100',
      text: 'text-purple-900',
      accent: 'bg-purple-600',
      secondary: 'bg-purple-200'
    },
    cssClass: 'theme-purple'
  },
  {
    id: 'green',
    name: 'Forest Green',
    description: 'Natural green theme for a fresh look',
    preview: {
      background: 'bg-green-50',
      surface: 'bg-green-100',
      text: 'text-green-900',
      accent: 'bg-green-600',
      secondary: 'bg-green-200'
    },
    cssClass: 'theme-green'
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    description: 'Warm and energetic theme with sunset colors',
    preview: {
      background: 'bg-orange-50',
      surface: 'bg-orange-100',
      text: 'text-orange-900',
      accent: 'bg-orange-600',
      secondary: 'bg-orange-200'
    },
    cssClass: 'theme-orange'
  }
];

interface ThemePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ isOpen, onClose }) => {
  const { theme: currentTheme, toggleTheme } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<string>(currentTheme);
  const [isApplying, setIsApplying] = useState(false);

  const handlePreview = useCallback((themeId: string) => {
    setPreviewTheme(themeId);
    
    // Apply theme preview to document for real-time preview
    const themeOption = themeOptions.find(t => t.id === themeId);
    if (themeOption) {
      // Remove all theme classes
      document.documentElement.classList.remove('dark', 'midnight', 'forest', 'sunset', 'cyberpunk');
      
      // Add the preview theme class
      if (themeId !== 'light') {
        document.documentElement.classList.add(themeOption.cssClass);
      }
    }
  }, []);

  const handleApplyTheme = useCallback(async (themeId: string) => {
    setIsApplying(true);
    
    try {
      // For now, we only support light/dark themes in the main theme context
      // But we can extend this to support more themes in the future
      if (themeId === 'dark' && currentTheme !== 'dark') {
        toggleTheme();
      } else if (themeId === 'light' && currentTheme !== 'light') {
        toggleTheme();
      } else if (themeId !== 'light' && themeId !== 'dark') {
        // For custom themes, we'll store the preference and apply the class
        localStorage.setItem('customTheme', themeId);
        const themeOption = themeOptions.find(t => t.id === themeId);
        if (themeOption) {
          document.documentElement.classList.remove('dark', 'midnight', 'forest', 'sunset', 'cyberpunk');
          document.documentElement.classList.add(themeOption.cssClass);
        }
      }
      
      // Close the preview after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Error applying theme:', error);
    } finally {
      setTimeout(() => {
        setIsApplying(false);
      }, 500);
    }
  }, [currentTheme, toggleTheme, onClose]);

  const handleClose = useCallback(() => {
    // Restore original theme when closing without applying
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark', 'midnight', 'forest', 'sunset', 'cyberpunk');
    }
    
    // Check if there's a saved custom theme
    const customTheme = localStorage.getItem('customTheme');
    if (customTheme && customTheme !== currentTheme) {
      const themeOption = themeOptions.find(t => t.id === customTheme);
      if (themeOption) {
        document.documentElement.classList.add(themeOption.cssClass);
      }
    }
    
    onClose();
  }, [currentTheme, onClose]);

  const getCurrentThemeId = () => {
    const customTheme = localStorage.getItem('customTheme');
    if (customTheme && customTheme !== 'light' && customTheme !== 'dark') {
      return customTheme;
    }
    return currentTheme;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <EyeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Theme Preview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preview and select your preferred theme
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themeOptions.map((themeOption) => {
              const isCurrentTheme = getCurrentThemeId() === themeOption.id;
              const isPreviewTheme = previewTheme === themeOption.id;
              
              return (
                <div
                  key={themeOption.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    isPreviewTheme
                      ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handlePreview(themeOption.id)}
                >
                  {/* Theme Preview */}
                  <div className={`rounded-lg p-3 mb-3 ${themeOption.preview.background}`}>
                    <div className={`${themeOption.preview.surface} rounded p-2 mb-2`}>
                      <div className={`h-2 ${themeOption.preview.accent} rounded mb-1`}></div>
                      <div className={`h-1 ${themeOption.preview.secondary} rounded w-3/4`}></div>
                    </div>
                    <div className="flex gap-1">
                      <div className={`h-1 ${themeOption.preview.accent} rounded flex-1`}></div>
                      <div className={`h-1 ${themeOption.preview.secondary} rounded flex-1`}></div>
                      <div className={`h-1 ${themeOption.preview.accent} rounded flex-1`}></div>
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                      {themeOption.name}
                      {isCurrentTheme && (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {themeOption.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTheme(themeOption.id);
                    }}
                    disabled={isCurrentTheme || isApplying}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      isCurrentTheme
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-not-allowed'
                        : isApplying
                        ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                    }`}
                  >
                    {isCurrentTheme ? 'Currently Active' : isApplying ? 'Applying...' : 'Apply Theme'}
                  </button>

                  {/* Preview Indicator */}
                  {isPreviewTheme && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Previewing
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <RefreshIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Live Preview
              </h4>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Click on any theme card to see a live preview. The entire application will update in real-time 
              to show how the theme looks. Click "Apply Theme" to make it permanent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
