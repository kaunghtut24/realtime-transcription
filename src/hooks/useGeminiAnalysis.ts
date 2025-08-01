import { useState, useCallback, useRef } from 'react';
import { analyzeTranscript } from '../services/geminiService';
import type { GeminiAnalysis } from '../types';

interface UseGeminiAnalysisProps {
  onAnalysis?: (analysis: GeminiAnalysis) => void;
  autoAnalyze?: boolean;
}

export const useGeminiAnalysis = ({ onAnalysis, autoAnalyze = true }: UseGeminiAnalysisProps = {}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(autoAnalyze);
  const [isPending, setIsPending] = useState(false);
  const currentController = useRef<AbortController | null>(null);
  const lastTranscript = useRef<string>('');
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = useCallback(async (transcript: string) => {
    if (!isAnalyzing || !transcript.trim()) {
      return null;
    }

    // Prevent analyzing the same transcript multiple times
    if (transcript === lastTranscript.current && isPending) {
      return null;
    }

    // Cancel any pending analysis and debounce timeout
    if (currentController.current) {
      currentController.current.abort();
    }
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    try {
      // Debounce the analysis request
      return new Promise((resolve) => {
        debounceTimeout.current = setTimeout(async () => {
          try {
            setIsPending(true);
            lastTranscript.current = transcript;
            currentController.current = new AbortController();

            const analysis = await analyzeTranscript(transcript, currentController.current.signal);
            
            if (analysis && onAnalysis) {
              onAnalysis(analysis);
            }

            resolve(analysis);
          } catch (error) {
            console.error('Analysis error:', error);
            resolve(null);
          }
        }, 1000); // 1 second debounce
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Analysis cancelled');
        return null;
      }
      console.error('Analysis error:', error);
      return null;
    } finally {
      setIsPending(false);
      currentController.current = null;
    }
  }, [isAnalyzing, onAnalysis]);

  const toggleAnalysis = useCallback(() => {
    setIsAnalyzing(prev => !prev);
  }, []);

  const stopAnalysis = useCallback(() => {
    if (currentController.current) {
      currentController.current.abort();
      currentController.current = null;
    }
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null;
    }
    lastTranscript.current = '';
    setIsAnalyzing(false);
    setIsPending(false);
  }, []);

  return {
    analyze,
    toggleAnalysis,
    stopAnalysis,
    isAnalyzing,
    isPending
  };
};
