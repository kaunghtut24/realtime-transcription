import React, { useState } from 'react';
import type { TranscriptSession } from '../services/storageService';
import { 
  CalendarIcon, 
  ClockIcon, 
  FileTextIcon,
  CopyIcon,
  CheckMarkIcon,
  DownloadIcon,
  PlayIcon,
  UserIcon
} from './icons';
import { AnalysisCard } from './AnalysisCard';
import { SummaryIcon, CheckCircleIcon, ListIcon } from './icons';

interface SessionDetailsPanelProps {
  session: TranscriptSession;
  onClose: () => void;
  onLoadSession: (session: TranscriptSession) => void;
  onExport?: (session: TranscriptSession) => void;
}

export const SessionDetailsPanel: React.FC<SessionDetailsPanelProps> = ({ 
  session, 
  onClose, 
  onLoadSession,
  onExport 
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getFullTranscript = () => {
    return session.turns.map(turn => turn.transcript).join('\n\n');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-light-bg dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-grow min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate mb-2">
              {session.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {formatDate(session.timestamp)}
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {formatDuration(session.duration)}
              </div>
              <div className="flex items-center gap-1">
                <FileTextIcon className="w-4 h-4" />
                {session.turns.length} turns
              </div>
              {session.analysis && (
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                  AI Analyzed
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onLoadSession(session)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-dark text-white rounded-lg transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              Load Session
            </button>
            {onExport && (
              <button
                onClick={() => onExport(session)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                Export
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden flex">
          {/* Transcript Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Original Transcript
                </h3>
                <button
                  onClick={() => handleCopy(getFullTranscript(), 'transcript')}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {copiedSection === 'transcript' ? (
                    <>
                      <CheckMarkIcon className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 max-h-[50vh] overflow-y-auto">
                {session.turns.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">
                    No transcript content available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {session.turns.map((turn, index) => (
                      <div key={index} className="group">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                            <UserIcon className="w-4 h-4 flex-shrink-0" />
                            <span>Turn {turn.turn_order}</span>
                            {turn.words && turn.words.length > 0 && (
                              <span>• {turn.words.length} words</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopy(turn.transcript, `turn-${index}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          >
                            {copiedSection === `turn-${index}` ? (
                              <CheckMarkIcon className="w-3 h-3 text-green-500" />
                            ) : (
                              <CopyIcon className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-7">
                          {turn.transcript}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Section */}
          {session.analysis && (
            <div className="w-1/2 p-6 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Analysis
              </h3>
              <div className="space-y-4">
                <AnalysisCard 
                  icon={<SummaryIcon/>} 
                  title="Summary" 
                  content={session.analysis.summary} 
                  isLoading={false}
                />
                
                <AnalysisCard 
                  icon={<CheckCircleIcon/>} 
                  title="Corrected Transcript" 
                  content={session.analysis.correctedTranscript} 
                  isLoading={false}
                />

                <AnalysisCard 
                  icon={<ListIcon/>} 
                  title="Topics" 
                  content={
                    session.analysis.topics.length > 0 ? (
                      <ul className="space-y-1 bg-gray-700/30 p-3 rounded-lg">
                        {session.analysis.topics.map((topic, i) => (
                          <li key={i} className="flex items-start">
                            <span className="inline-block w-4 h-4 mt-1 mr-2 text-brand-teal">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No topics identified.'
                    )
                  } 
                  isLoading={false}
                />

                <AnalysisCard 
                  icon={<ListIcon/>} 
                  title="Action Items" 
                  content={
                    session.analysis.actionItems.length > 0 ? (
                      <ul className="space-y-2 bg-gray-700/30 p-4 rounded-lg">
                        {session.analysis.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <span className="inline-block w-4 h-4 mt-1 mr-2 text-brand-teal">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No action items identified.'
                    )
                  } 
                  isLoading={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <div>
              Session ID: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">{session.id}</code>
            </div>
            <div>
              {session.turns.reduce((total, turn) => total + (turn.words?.length || 0), 0).toLocaleString()} total words
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
