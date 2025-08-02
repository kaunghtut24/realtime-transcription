import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useWebSocketManager } from './useWebSocketManager';
import type { AssemblyAITurn, ConnectionStatus } from '../types';
import { workletProcessor } from './audioWorkletProcessor';

interface UseAssemblyAIProps {
  apiKey: string;
  onTurn: (turn: AssemblyAITurn) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_API_ENDPOINT = `${API_URL}/assemblyai/token`;
const WS_API_BASE_URL = import.meta.env.VITE_WS_API_URL || 'wss://api.assemblyai.com/v2/realtime/ws';

export function useAssemblyAI({ apiKey, onTurn }: UseAssemblyAIProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [wsUrl, setWsUrl] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const handleMessage = useCallback((data: any) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'Turn') {
        onTurn(message);
      } else if (message.type === 'SessionBegins') {
        sessionIdRef.current = message.session_id;
        console.log('🎙️ Session started:', message.session_id);
      } else if (message.type === 'SessionTerminated') {
        console.log('🛑 Session terminated:', message);
        setStatus('closed');
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [onTurn]);

  const wsManager = useWebSocketManager({
    url: wsUrl,
    maxRetries: 3,
    retryInterval: 3000,
    onMessage: handleMessage,
    onOpen: () => {
      console.log('WebSocket connected');
      setStatus('connected');
    },
    onClose: () => {
      console.log('WebSocket closed');
      setStatus('closed');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
      toast.error('Connection error. Retrying...');
    }
  });

  const getToken = useCallback(async () => {
    try {
      const response = await fetch(TOKEN_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get AssemblyAI token: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error getting token:', error);
      toast.error('Failed to get authorization token');
      throw error;
    }
  }, [apiKey]);

  const startListening = useCallback(async () => {
    try {
      // Get token first
      const token = await getToken();
      const wsEndpoint = `${WS_API_BASE_URL}?token=${token}`;
      setWsUrl(wsEndpoint);
      setStatus('connecting');

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000 // AssemblyAI expects 16kHz
        }
      });
      
      mediaStreamRef.current = stream;

      // Initialize audio context
      audioContextRef.current = new AudioContext({
        sampleRate: 16000, // Match AssemblyAI requirements
        latencyHint: 'interactive'
      });

      // Add worklet module
      await audioContextRef.current.audioWorklet.addModule(
        URL.createObjectURL(new Blob([workletProcessor], { type: 'text/javascript' }))
      );

      // Create and connect audio nodes
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(
        audioContextRef.current,
        'recorder-processor',
        {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          channelCount: 1,
          processorOptions: {
            sampleRate: audioContextRef.current.sampleRate
          }
        }
      );

      workletNode.port.onmessage = (event) => {
        if (wsManager.status === 'connected' && event.data instanceof ArrayBuffer) {
          const ws = (wsManager as any).ws;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        }
      };

      source.connect(workletNode);
      audioWorkletNodeRef.current = workletNode;

    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('error');
      toast.error('Failed to start recording. Please check your microphone access and try again.');
    }
  }, [getToken, wsManager.status]);

  // Connect WebSocket when URL is set
  useEffect(() => {
    if (wsUrl && status === 'connecting') {
      wsManager.connect();
    }
  }, [wsUrl, status, wsManager]);

  const stopListening = useCallback(() => {
    try {
      // Stop audio processing
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Close WebSocket connection
      wsManager.disconnect();
      sessionIdRef.current = null;
      setWsUrl('');
      setStatus('closed');

    } catch (error) {
      console.error('Error stopping recording:', error);
      setStatus('error');
      toast.error('Error stopping recording');
    }
  }, [wsManager]);

  return {
    status,
    startListening,
    stopListening
  };
}
