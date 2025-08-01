
import React, { useEffect, useRef } from 'react';
import type { AssemblyAITurn } from '../types';

interface TranscriptPanelProps {
  turns: AssemblyAITurn[];
  interimTranscript: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ turns, interimTranscript }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, interimTranscript]);

  return (
    <div className="bg-gray-800/50 h-full rounded-lg shadow-lg flex flex-col">
        <h2 className="text-xl font-semibold text-gray-200 p-4 border-b border-gray-700">Live Transcript</h2>
        <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto">
            <div className="space-y-4 text-gray-200">
                {turns.map((turn, index) => (
                    <p key={index} className={`transition-opacity duration-300 ${turn.turn_is_formatted ? 'opacity-100' : 'opacity-70'}`}>
                        {turn.transcript}
                    </p>
                ))}
                {interimTranscript && (
                    <p className="text-gray-500">{interimTranscript}</p>
                )}
            </div>
        </div>
    </div>
  );
};
