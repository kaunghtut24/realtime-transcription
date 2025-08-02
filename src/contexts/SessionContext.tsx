import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { storageService, type TranscriptSession } from '../services/storageService';

interface SessionContextType {
  sessions: TranscriptSession[];
  currentSession: TranscriptSession | null;
  saveCurrentSession: (session: Partial<TranscriptSession>) => Promise<boolean>;
  loadSession: (sessionId: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  clearSessions: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TranscriptSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const loadedSessions = await storageService.getSessions();
        setSessions(loadedSessions);
      } catch (err) {
        setError('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, []);

  const saveCurrentSession = useCallback(async (sessionData: Partial<TranscriptSession>) => {
    setIsLoading(true);
    try {
      const newSession: TranscriptSession = {
        id: sessionData.id || crypto.randomUUID(),
        timestamp: sessionData.timestamp || Date.now(),
        name: sessionData.name || `Transcript ${new Date().toLocaleString()}`,
        turns: sessionData.turns || [],
        analysis: sessionData.analysis || null,
        duration: sessionData.duration || 0
      };

      const success = await storageService.saveSession(newSession);
      if (success) {
        setCurrentSession(newSession);
        setSessions(await storageService.getSessions());
      }
      return success;
    } catch (err) {
      setError('Failed to save session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const session = await storageService.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to load session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const success = await storageService.deleteSession(sessionId);
      if (success) {
        setSessions(await storageService.getSessions());
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
        }
      }
      return success;
    } catch (err) {
      setError('Failed to delete session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const clearSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await storageService.clearSessions();
      if (success) {
        setSessions([]);
        setCurrentSession(null);
      }
      return success;
    } catch (err) {
      setError('Failed to clear sessions');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        currentSession,
        saveCurrentSession,
        loadSession,
        deleteSession,
        clearSessions,
        isLoading,
        error
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
