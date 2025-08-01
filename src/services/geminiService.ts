import type { GeminiAnalysis } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Use proxy endpoints with configurable base URL
const GEMINI_ANALYZE_ENDPOINT = `${API_BASE_URL}/api/gemini/analyze`;
const GEMINI_CHAT_ENDPOINT = `${API_BASE_URL}/api/gemini/chat`;

interface ChatMessage {
    role: string;
    text: string;
}

export const analyzeTranscript = async (
    transcript: string,
    signal?: AbortSignal
): Promise<GeminiAnalysis | null> => {
    if (!transcript.trim()) {
        return null;
    }

    try {
        console.log('🌐 Making fetch request to:', GEMINI_ANALYZE_ENDPOINT);

        // Create timeout controller
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 30000); // 30 second timeout

        // Combine the timeout signal with the passed signal if any
        const controller = signal
            ? new AbortController()
            : timeoutController;

        if (signal) {
            signal.addEventListener('abort', () => controller.abort());
            timeoutController.signal.addEventListener('abort', () => controller.abort());
        }

        const response = await fetch(GEMINI_ANALYZE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transcript }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Failed to analyze transcript:', response.status, errorData);
            return null;
        }

        const result = await response.json();
        
        if (!result || !result.summary || !result.correctedTranscript) {
            console.error("Invalid response schema from Gemini API", result);
            return null;
        }

        return result as GeminiAnalysis;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Analysis request cancelled');
            return null;
        }
        console.error('Error analyzing transcript:', error);
        return null;
    }
};

export const sendChatMessage = async (
    message: string, 
    history: ChatMessage[],
    signal?: AbortSignal
): Promise<string | null> => {
    if (!message.trim()) {
        return null;
    }

    try {
        // Create timeout controller
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 30000);

        // Combine the timeout signal with the passed signal if any
        const controller = signal
            ? new AbortController()
            : timeoutController;

        if (signal) {
            signal.addEventListener('abort', () => controller.abort());
            timeoutController.signal.addEventListener('abort', () => controller.abort());
        }

        const response = await fetch(GEMINI_CHAT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, history }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to send chat message:', response.status, errorData);
            return null;
        }

        const result = await response.json();
        
        if (!result || (typeof result.text !== 'string' && !result.response)) {
            console.error("Invalid response schema from Gemini Chat API", result);
            return null;
        }

        // Handle both response formats
        return result.text || result.response;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Chat request cancelled');
            return null;
        }
        console.error('Error sending chat message:', error);
        return null;
    }
};
