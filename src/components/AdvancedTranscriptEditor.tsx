import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { AssemblyAITurn } from '../types';
import { EditIcon, CheckIcon, XIcon, RefreshIcon, EyeIcon, ClockIcon, InfoIcon } from './icons';

interface WordEdit {
  wordIndex: number;
  turnIndex: number;
  originalText: string;
  newText: string;
  timestamp: number;
}

interface AdvancedTranscriptEditorProps {
  turns: AssemblyAITurn[];
  onWordsUpdate?: (updatedTurns: AssemblyAITurn[]) => void;
  readOnly?: boolean;
  showConfidence?: boolean;
  showTimestamps?: boolean;
}

export const AdvancedTranscriptEditor: React.FC<AdvancedTranscriptEditorProps> = ({
  turns,
  onWordsUpdate,
  readOnly = false,
  showConfidence = true,
  showTimestamps = false
}) => {
  const [editingWord, setEditingWord] = useState<{ turnIndex: number; wordIndex: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [editHistory, setEditHistory] = useState<WordEdit[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'confidence' | 'timing'>('edit');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingWord && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingWord]);

  const startEditing = useCallback((turnIndex: number, wordIndex: number, currentText: string) => {
    if (readOnly) return;
    setEditingWord({ turnIndex, wordIndex });
    setEditText(currentText);
  }, [readOnly]);

  const saveEdit = useCallback(() => {
    if (!editingWord || !onWordsUpdate) return;

    const { turnIndex, wordIndex } = editingWord;
    const originalWord = turns[turnIndex]?.words[wordIndex];
    
    if (!originalWord || originalWord.text === editText) {
      setEditingWord(null);
      return;
    }

    // Create updated turns with the edited word
    const updatedTurns = turns.map((turn, tIndex) => {
      if (tIndex !== turnIndex) return turn;
      
      const updatedWords = turn.words.map((word, wIndex) => {
        if (wIndex !== wordIndex) return word;
        return { ...word, text: editText };
      });

      // Rebuild transcript from words
      const newTranscript = updatedWords.map(w => w.text).join(' ');
      
      return { ...turn, words: updatedWords, transcript: newTranscript };
    });

    // Record the edit in history
    const wordEdit: WordEdit = {
      wordIndex,
      turnIndex,
      originalText: originalWord.text,
      newText: editText,
      timestamp: Date.now()
    };

    setEditHistory(prev => [...prev, wordEdit]);
    onWordsUpdate(updatedTurns);
    setEditingWord(null);
  }, [editingWord, editText, turns, onWordsUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingWord(null);
    setEditText('');
  }, []);

  const undoLastEdit = useCallback(() => {
    if (editHistory.length === 0 || !onWordsUpdate) return;

    const lastEdit = editHistory[editHistory.length - 1];
    const updatedTurns = turns.map((turn, tIndex) => {
      if (tIndex !== lastEdit.turnIndex) return turn;
      
      const updatedWords = turn.words.map((word, wIndex) => {
        if (wIndex !== lastEdit.wordIndex) return word;
        return { ...word, text: lastEdit.originalText };
      });

      const newTranscript = updatedWords.map(w => w.text).join(' ');
      return { ...turn, words: updatedWords, transcript: newTranscript };
    });

    setEditHistory(prev => prev.slice(0, -1));
    onWordsUpdate(updatedTurns);
  }, [editHistory, turns, onWordsUpdate]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 dark:bg-green-900/30';
    if (confidence >= 0.7) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === 'edit'
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <EditIcon className="w-4 h-4 inline mr-1" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('confidence')}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === 'confidence'
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <EyeIcon className="w-4 h-4 inline mr-1" />
              Confidence
            </button>
            <button
              onClick={() => setViewMode('timing')}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === 'timing'
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Timing
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editHistory.length > 0 && (
            <button
              onClick={undoLastEdit}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <RefreshIcon className="w-4 h-4 inline mr-1" />
              Undo ({editHistory.length})
            </button>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {turns.reduce((total, turn) => total + turn.words.length, 0)} words
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="space-y-6">
        {turns.map((turn, turnIndex) => (
          <div key={turnIndex} className="group">
            {showTimestamps && turn.words.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <ClockIcon className="w-3 h-3" />
                {formatTimestamp(turn.words[0].start)} - {formatTimestamp(turn.words[turn.words.length - 1].end)}
              </div>
            )}
            
            <div className="text-base leading-relaxed">
              {turn.words.map((word, wordIndex) => {
                const isEditing = editingWord?.turnIndex === turnIndex && editingWord?.wordIndex === wordIndex;
                const isEditedWord = editHistory.some(edit => 
                  edit.turnIndex === turnIndex && edit.wordIndex === wordIndex
                );
                
                if (isEditing) {
                  return (
                    <span key={wordIndex} className="inline-block">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="px-1 py-0.5 text-base bg-blue-50 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ width: Math.max(editText.length * 8 + 16, 60) }}
                      />
                      <span className="ml-1 space-x-1">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-700 dark:text-green-400"
                        >
                          <CheckIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    </span>
                  );
                }

                const confidence = word.confidence;
                let className = 'cursor-pointer px-1 py-0.5 rounded transition-colors ';
                
                if (viewMode === 'confidence' && showConfidence) {
                  className += getConfidenceBg(confidence) + ' ' + getConfidenceColor(confidence);
                } else if (viewMode === 'timing') {
                  className += 'hover:bg-blue-100 dark:hover:bg-blue-900/30 ';
                } else {
                  className += 'hover:bg-gray-100 dark:hover:bg-gray-700 ';
                }

                if (isEditedWord) {
                  className += 'bg-blue-100 dark:bg-blue-900/30 border-b-2 border-blue-500 ';
                }

                if (!readOnly) {
                  className += 'hover:ring-1 hover:ring-blue-300 dark:hover:ring-blue-600 ';
                }

                return (
                  <span key={wordIndex}>
                    <span
                      className={className}
                      onClick={() => startEditing(turnIndex, wordIndex, word.text)}
                      title={
                        viewMode === 'confidence' 
                          ? `Confidence: ${(confidence * 100).toFixed(1)}%`
                          : viewMode === 'timing'
                          ? `${formatTimestamp(word.start)} - ${formatTimestamp(word.end)}`
                          : `Click to edit "${word.text}"`
                      }
                    >
                      {word.text}
                      {viewMode === 'timing' && (
                        <span className="text-xs text-gray-400 ml-1">
                          {formatTimestamp(word.start)}
                        </span>
                      )}
                    </span>
                    {' '}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit History Panel */}
      {editHistory.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <InfoIcon className="w-4 h-4" />
            Edit History ({editHistory.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {editHistory.slice(-5).map((edit, index) => (
              <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="text-red-500">"{edit.originalText}"</span>
                <span>→</span>
                <span className="text-green-500">"{edit.newText}"</span>
                <span className="text-gray-400">
                  {new Date(edit.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
