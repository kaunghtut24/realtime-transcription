import type { AssemblyAITurn, GeminiAnalysis } from '../types';

export interface TranscriptSession {
  id: string;
  timestamp: number;
  name: string;
  turns: AssemblyAITurn[];
  analysis: GeminiAnalysis | null;
  duration: number;
}

class StorageService {
  private readonly STORAGE_KEY = 'transcript_sessions';
  private readonly MAX_SESSIONS = 50; // Maximum number of sessions to store

  async getSessions(): Promise<TranscriptSession[]> {
    try {
      const sessions = localStorage.getItem(this.STORAGE_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  async saveSession(session: TranscriptSession): Promise<boolean> {
    try {
      const sessions = await this.getSessions();
      
      // Remove oldest session if limit reached
      if (sessions.length >= this.MAX_SESSIONS) {
        sessions.sort((a, b) => a.timestamp - b.timestamp);
        sessions.shift();
      }
      
      // Add new session
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      if (existingIndex !== -1) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessions = await this.getSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<TranscriptSession | null> {
    try {
      const sessions = await this.getSessions();
      return sessions.find(s => s.id === sessionId) || null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async clearSessions(): Promise<boolean> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing sessions:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();
