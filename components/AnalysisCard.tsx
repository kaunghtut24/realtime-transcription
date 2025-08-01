
import React from 'react';

interface AnalysisCardProps {
  icon: React.ReactNode;
  title: string;
  content: string | React.ReactNode;
  isLoading: boolean;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ icon, title, content, isLoading }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-center mb-3">
        <span className="text-brand-teal mr-3">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
      </div>
      <div className={`text-gray-300 text-sm leading-relaxed transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {content}
      </div>
    </div>
  );
};
