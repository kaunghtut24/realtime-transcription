import { useState, useRef, useCallback } from 'react';
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
const WS_API_BASE_URL = import.meta.env.VITE_WS_API_URL || 'wss://streaming.assemblyai.com/v3/ws';
const WS_API_ENDPOINT = `${WS_API_BASE_URL}/realtime`;

export function useAssemblyAI({ apiKey, onTurn }: UseAssemblyAIProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const wsUrlRef = useRef<string>('');

  const handleMessage = useCallback((data: any) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'Turn') {
        onTurn(message);
      } else if (message.type === 'Begin') {
        sessionIdRef.current = message.id;
        console.log('🎙️ Session started:', message.id);
      } else if (message.type === 'Termination') {
        console.log('🛑 Session terminated:', message);
        setStatus('closed');
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [onTurn]);

  const wsManager = useWebSocketManager({
    url: wsUrlRef.current,
    maxRetries: 3,
    retryInterval: 3000,
    onMessage: handleMessage,
    onOpen: () => setStatus('connected'),
    onClose: () => setStatus('closed'),
    onError: (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
    }
  });

  const startListening = useCallback(async () => {
    try {
      // Get microphone stream first to detect native sample rate
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1
        }
      });
      
      mediaStreamRef.current = stream;

      // Get token from our server
      const tokenResponse = await fetch(TOKEN_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        credentials: 'include'
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        throw new Error(`Failed to get AssemblyAI token: ${tokenResponse.status} - ${errorBody}`);
      }

      const tokenData = await tokenResponse.json();
      wsUrlRef.current = `${WS_API_ENDPOINT}?token=${tokenData.token}`;

      // Initialize audio context with native sample rate
      audioContextRef.current = new AudioContext({
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
          channelCount: 1
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

      // Connect to WebSocket with token
      wsManager.connect();
      setStatus('connecting');

    } catch (error) {
      console.error('Error starting microphone or WebSocket:', error);
      setStatus('error');
      toast.error('Failed to start recording. Please check your microphone access and try again.');
    }
  }, [apiKey, wsManager]);

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
