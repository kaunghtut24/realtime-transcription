export interface AssemblyAIWord {
  text: string;
  word_is_final: boolean;
  start: number;
  end: number;
  confidence: number;
}

export interface AssemblyAITurn {
  turn_order: number;
  turn_is_formatted: boolean;
  end_of_turn: boolean;
  transcript: string;
  words: AssemblyAIWord[];
  type: 'Turn';
}

export interface AssemblyAISessionBegin {
    type: 'Begin';
    id: string;
    expires_at: number;
}

export interface AssemblyAITermination {
    type: 'Termination';
    audio_duration_seconds: number;
    session_duration_seconds: number;
}

export type AssemblyAIMessage = AssemblyAITurn | AssemblyAISessionBegin | AssemblyAITermination;

export interface GeminiAnalysis {
  summary: string;
  correctedTranscript: string;
  topics: string[];
  actionItems: string[];
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closing' | 'closed' | 'error';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
