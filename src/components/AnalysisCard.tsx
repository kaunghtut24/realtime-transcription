
import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckMarkIcon } from './icons';

interface AnalysisCardProps {
  icon: React.ReactNode;
  title: string;
  content: string | React.ReactNode;
  isLoading: boolean;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ icon, title, content, isLoading }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const textToCopy = typeof content === 'string' ? content : 
      title === 'Action Items' && Array.isArray(content) ? 
        content.join('\n') : 
        document.querySelector(`[data-card="${title}"]`)?.textContent || '';

    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [content, title]);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 shadow-lg relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-brand-teal mr-2">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors"
          title={isCopied ? 'Copied!' : 'Copy to clipboard'}
        >
          {isCopied ? 
            <CheckMarkIcon className="w-5 h-5 text-green-500" /> : 
            <CopyIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
          }
        </button>
      </div>
      <div className={`text-gray-300 text-sm transition-opacity duration-300 flex-grow ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {title === 'Summary' && (
          <div className="leading-relaxed bg-gray-700/30 p-3 rounded-lg" data-card={title}>
            {content}
          </div>
        )}
        {title === 'Corrected Transcript' && (
          <div className="h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-line bg-gray-700/30 p-3 rounded-lg leading-relaxed" data-card={title}>
            {content}
          </div>
        )}
        {title === 'Action Items' && (
          <div className="space-y-2" data-card={title}>
            {typeof content === 'string' ? (
              <p className="text-gray-400 italic p-3 bg-gray-700/30 rounded-lg">{content}</p>
            ) : (
              <div className="bg-gray-700/30 p-3 rounded-lg">
                {content}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};