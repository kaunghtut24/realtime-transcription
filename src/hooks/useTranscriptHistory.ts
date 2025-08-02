import { useState, useCallback, useEffect } from 'react';

interface EditHistoryState {
  past: string[];
  present: string;
  future: string[];
}

export function useTranscriptHistory(initialTranscript: string = '') {
  const [history, setHistory] = useState<EditHistoryState>({
    past: [],
    present: initialTranscript,
    future: []
  });
  
  // Update the present transcript when initialTranscript changes (for live updates)
  useEffect(() => {
    setHistory(prev => {
      // Only update if the new transcript is different from current present
      if (prev.present !== initialTranscript) {
        console.log('📋 useTranscriptHistory: Updating transcript', {
          oldLength: prev.present.length,
          newLength: initialTranscript.length,
          oldPreview: prev.present.substring(0, 50) + '...',
          newPreview: initialTranscript.substring(0, 50) + '...'
        });
        return {
          past: prev.past,
          present: initialTranscript,
          future: prev.future
        };
      }
      return prev;
    });
  }, [initialTranscript]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const pushChange = useCallback((newTranscript: string) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newTranscript,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  return {
    transcript: history.present,
    pushChange,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
