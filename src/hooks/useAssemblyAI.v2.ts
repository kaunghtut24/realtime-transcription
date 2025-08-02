import { useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useWebSocketManager } from './useWebSocketManager';
import type { AssemblyAITurn, ConnectionStatus } from '../types';
import { workletProcessor } from './audioWorkletProcessor';

interface UseAssemblyAIProps {
  apiKey: string;
  onTurn: (turn: AssemblyAITurn) => void;
}

const TARGET_SAMPLE_RATE = 16000;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_API_ENDPOINT = `${API_URL}/assemblyai/token`;
const WS_API_BASE_URL = import.meta.env.VITE_WS_API_URL || 'wss://streaming.assemblyai.com/v3/ws';
const WS_API_ENDPOINT = `${WS_API_BASE_URL}/realtime`;

// AudioWorklet processor code
const workletProcessor = String.raw`
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.recordingBuffer = new Float32Array(this.bufferSize);
    this.recordingBufferIndex = 0;
    this.targetSampleRate = 16000;
    this.sourceSampleRate = sampleRate;
    this.ratio = this.targetSampleRate / this.sourceSampleRate;
  }

  resample(inputBuffer) {
    const outputLength = Math.floor(inputBuffer.length * this.ratio);
    const outputBuffer = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const index = i / this.ratio;
      const index0 = Math.floor(index);
      const index1 = Math.min(index0 + 1, inputBuffer.length - 1);
      const frac = index - index0;
      
      // Linear interpolation
      outputBuffer[i] = (1 - frac) * inputBuffer[index0] + frac * inputBuffer[index1];
    }
    
    return outputBuffer;
  }

  process(inputs, outputs, parameters) {
    const inputChannelData = inputs[0][0];
    if (!inputChannelData) {
      return true;
    }

    // Fill recording buffer
    for (let i = 0; i < inputChannelData.length; i++) {
      this.recordingBuffer[this.recordingBufferIndex++] = inputChannelData[i];
      
      // When buffer is full, resample and send
      if (this.recordingBufferIndex >= this.bufferSize) {
        const resampledData = this.resample(this.recordingBuffer);
        
        // Convert to 16-bit integer samples
        const intData = new Int16Array(resampledData.length);
        for (let j = 0; j < resampledData.length; j++) {
          intData[j] = Math.max(-32768, Math.min(32767, Math.floor(resampledData[j] * 32768)));
        }
        
        this.port.postMessage(intData.buffer, [intData.buffer]);
        
        // Reset buffer
        this.recordingBuffer = new Float32Array(this.bufferSize);
        this.recordingBufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);`;

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
          channelCount: 1,
          sampleRate: SAMPLE_RATE // Request preferred sample rate
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
        'recorder-processor'
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
import { toast } from 'react-toastify';
import { useWebSocketManager } from './useWebSocketManager';
import type { AssemblyAITurn, ConnectionStatus } from '../types';

interface UseAssemblyAIProps {
  apiKey: string;
  onTurn: (turn: AssemblyAITurn) => void;
}

const SAMPLE_RATE = 16000;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_API_ENDPOINT = `${API_URL}/assemblyai/token`;
const WS_API_BASE_URL = import.meta.env.VITE_WS_API_URL || 'wss://streaming.assemblyai.com/v3/ws';
const WS_API_ENDPOINT = `${WS_API_BASE_URL}/realtime`;

// AudioWorklet processor code as a template literal
const workletCode = String.raw`
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.recordingBuffer = new Float32Array(this.bufferSize);
    this.recordingBufferIndex = 0;
    this.targetSampleRate = 16000;
    this.sourceSampleRate = sampleRate;
    this.ratio = this.targetSampleRate / this.sourceSampleRate;
  }

  resample(inputBuffer) {
    const outputLength = Math.floor(inputBuffer.length * this.ratio);
    const outputBuffer = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const index = i / this.ratio;
      const index0 = Math.floor(index);
      const index1 = Math.min(index0 + 1, inputBuffer.length - 1);
      const frac = index - index0;
      
      // Linear interpolation
      outputBuffer[i] = (1 - frac) * inputBuffer[index0] + frac * inputBuffer[index1];
    }
    
    return outputBuffer;
  }

  process(inputs, outputs, parameters) {
    const inputChannelData = inputs[0][0];
    if (!inputChannelData) {
      return true;
    }

    // Fill recording buffer
    for (let i = 0; i < inputChannelData.length; i++) {
      this.recordingBuffer[this.recordingBufferIndex++] = inputChannelData[i];
      
      // When buffer is full, resample and send
      if (this.recordingBufferIndex >= this.bufferSize) {
        const resampledData = this.resample(this.recordingBuffer);
        
        // Convert to 16-bit integer samples
        const intData = new Int16Array(resampledData.length);
        for (let j = 0; j < resampledData.length; j++) {
          intData[j] = Math.max(-32768, Math.min(32767, Math.floor(resampledData[j] * 32768)));
        }
        
        this.port.postMessage(intData.buffer, [intData.buffer]);
        
        // Reset buffer
        this.recordingBuffer = new Float32Array(this.bufferSize);
        this.recordingBufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);`;

    // Simple downsampling to 16kHz
    const sourceSampleRate = sampleRate;
    const downsampleRatio = sourceSampleRate / this.targetSampleRate;
    const outputLength = Math.floor(inputChannelData.length / downsampleRatio);
    const resampledData = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = Math.floor(i * downsampleRatio);
      resampledData[i] = inputChannelData[sourceIndex];
    }

    // Convert to PCM16
    const pcm16 = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
      let s = Math.max(-1, Math.min(1, resampledData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    if (pcm16.length > 0) {
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);`;

export function useAssemblyAI({ apiKey, onTurn }: UseAssemblyAIProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);

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

  const wsUrlRef = useRef<string>('');
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
      // Get token from our server
      const tokenResponse = await fetch(TOKEN_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        credentials: 'include' // Include cookies for CORS
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        throw new Error(`Failed to get AssemblyAI token: ${tokenResponse.status} - ${errorBody}`);
      }

      const tokenData = await tokenResponse.json();
      wsUrlRef.current = `${WS_API_ENDPOINT}?token=${tokenData.token}`;

      // Get microphone stream first to detect native sample rate
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: SAMPLE_RATE // Request preferred sample rate
        }
      });

      // Create audio context with native sample rate
      const tempContext = new AudioContext();
      const nativeSampleRate = tempContext.sampleRate;
      tempContext.close();

      // Initialize audio context with correct sample rate
      audioContextRef.current = new AudioContext({
        sampleRate: nativeSampleRate, // Use native sample rate
        latencyHint: 'interactive'
      });

      await audioContextRef.current.audioWorklet.addModule(
        URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' }))
      );

      mediaStreamRef.current = stream;

      // Create and connect audio nodes
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(
        audioContextRef.current,
        'recorder-processor'
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
  }, [wsManager]);

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
    stopListening,
    retryCount: wsManager.retryCount
  };
}
