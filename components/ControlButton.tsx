
import React from 'react';
import type { ConnectionStatus } from '../types';
import { PlayIcon, StopIcon, HourglassIcon } from './icons';

interface ControlButtonProps {
  onClick: () => void;
  status: ConnectionStatus;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ onClick, status }) => {
  const isRecording = status === 'connected';
  const isLoading = status === 'connecting' || status === 'closing';

  const baseClasses = "flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const colorClasses = isRecording 
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    : "bg-brand-blue hover:bg-brand-dark focus:ring-brand-blue";

  const icon = isLoading 
    ? <HourglassIcon className="w-5 h-5 mr-2 animate-spin" /> 
    : isRecording 
    ? <StopIcon className="w-5 h-5 mr-2" /> 
    : <PlayIcon className="w-5 h-5 mr-2" />;

  const text = isLoading ? 'Processing...' : isRecording ? 'Stop' : 'Start';

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`${baseClasses} ${colorClasses}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};
