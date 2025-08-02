
import React, { useEffect, useRef, useMemo } from 'react';
import type { AssemblyAITurn } from '../types';
import { EditableTranscript } from './EditableTranscript';

interface TranscriptPanelProps {
  turns: AssemblyAITurn[];
  interimTranscript: string;
  onTranscriptChange?: (transcript: string) => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ 
  turns, 
  interimTranscript,
  onTranscriptChange 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, interimTranscript]);

  const fullTranscript = useMemo(() => {
    const transcript = turns.map(turn => turn.transcript).join('\n\n') +
      (interimTranscript ? `\n\n${interimTranscript}` : '');
    
    console.log('📋 TranscriptPanel - Full transcript generated:', {
      turnsCount: turns.length,
      interimTranscript: interimTranscript,
      fullTranscriptLength: transcript.length,
      turns: turns.map(t => ({ order: t.turn_order, transcript: t.transcript.substring(0, 50) + '...' }))
    });
    
    return transcript;
  }, [turns, interimTranscript]);

  return (
    <div className="bg-light-surface dark:bg-gray-800/50 h-full rounded-lg shadow-lg flex flex-col">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200 p-4 border-b border-gray-200 dark:border-gray-700">
        Live Transcript
      </h2>
      <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto">
        <EditableTranscript
          initialTranscript={fullTranscript}
          turns={turns}
          onSave={onTranscriptChange}
        />
      </div>
    </div>
  );
};