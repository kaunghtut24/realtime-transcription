import React, { useState, useEffect, useRef } from 'react';
import { useTranscriptHistory } from '../hooks/useTranscriptHistory';

interface EditableTranscriptProps {
  initialTranscript: string;
  onSave?: (transcript: string) => void;
}

export const EditableTranscript: React.FC<EditableTranscriptProps> = ({
  initialTranscript,
  onSave
}) => {
  console.log('📝 EditableTranscript rendered with:', {
    initialTranscriptLength: initialTranscript.length,
    initialTranscriptPreview: initialTranscript.substring(0, 100) + (initialTranscript.length > 100 ? '...' : '')
  });

  const {
    transcript,
    pushChange,
    undo,
    redo,
    canUndo,
    canRedo
  } = useTranscriptHistory(initialTranscript);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [transcript, isEditing]);

  // Auto-save debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (transcript !== initialTranscript) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [transcript, initialTranscript]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    pushChange(e.target.value);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(transcript);
      // Note: saveCurrentSession expects different parameters, handled by onSave callback
    } catch (error) {
      console.error('Error saving transcript:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey || e.key === 'y') && canRedo) {
        e.preventDefault();
        redo();
      } else if (e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  return (
    <div className="relative bg-light-surface dark:bg-dark-surface rounded-lg p-4">
      {/* Edit Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-brand-blue hover:bg-brand-blue/80 text-white rounded text-sm font-medium"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
          {isEditing && (
            <>
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              >
                Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
              >
                Redo
              </button>
            </>
          )}
        </div>
        {isSaving && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Saving...
          </span>
        )}
      </div>

      {/* Transcript Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={transcript}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[200px] bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
          placeholder="Start typing..."
        />
      ) : (
        <div className="prose dark:prose-invert max-w-none">
          {transcript.split('\n').map((paragraph, i) => (
            <p key={i} className="mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
