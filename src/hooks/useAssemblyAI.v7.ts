import { useState, useRef, useCallback } from 'react';
import type { AssemblyAITurn, ConnectionStatus } from '../types';

interface UseAssemblyAIProps {
  apiKey: string;
  onTurn: (turn: AssemblyAITurn) => void;
}

const SAMPLE_RATE = 16000;
const WS_API_BASE_URL = import.meta.env.VITE_WS_API_URL || 'wss://streaming.assemblyai.com/v3/ws';

// The AudioWorkletProcessor code is defined as a string to be loaded as a Blob.
const workletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.resampleBuffer = [];
    this.targetSampleRate = 16000;
  }

  process(inputs, outputs, parameters) {
    const inputChannelData = inputs[0][0];
    if (!inputChannelData) {
      return true;
    }

    // Simple downsampling to 16kHz
    const sourceSampleRate = sampleRate; // AudioWorklet's sample rate
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

registerProcessor('recorder-processor', RecorderProcessor);
`;

export const useAssemblyAI = ({ apiKey, onTurn }: UseAssemblyAIProps) => {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const ws = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioWorkletNode = useRef<AudioWorkletNode | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const bufferSendInterval = useRef<number | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: any = JSON.parse(event.data);
      
      if (message.type === 'Turn') {
        onTurn(message as AssemblyAITurn);
      } else if (message.type === 'Begin') {
        console.log('🎬 AssemblyAI session started');
      } else if (message.type === 'Termination') {
        console.log('🔚 AssemblyAI session terminated');
      }
    } catch (error) {
      console.error('❌ Error parsing message from AssemblyAI:', error);
      console.error('❌ Raw event data:', event.data);
    }
  }, [onTurn]);

  const cleanupResources = useCallback((skipWebSocket = false) => {
    if (bufferSendInterval.current) {
      clearInterval(bufferSendInterval.current);
      bufferSendInterval.current = null;
    }
    if (audioWorkletNode.current) {
        audioWorkletNode.current.port.onmessage = null;
        audioWorkletNode.current.disconnect();
        audioWorkletNode.current = null;
    }
    if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
        audioContext.current = null;
    }
    if (audioStream.current) {
      audioStream.current.getTracks().forEach(track => track.stop());
      audioStream.current = null;
    }
    if (!skipWebSocket && ws.current) {
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close();
      }
      ws.current = null;
    }
  }, []);

  const handleClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
    cleanupResources(true);
    setStatus('closed');
  }, [cleanupResources]);
  
  const handleError = useCallback((error: Event) => {
    console.error('WebSocket Error:', error);
    setStatus('error');
    cleanupResources();
  }, [cleanupResources]);

  const startListening = useCallback(async () => {
    if (!apiKey) {
      alert("AssemblyAI API Key is not set.");
      console.error("AssemblyAI API Key is missing.");
      return;
    }
    if (status === 'connected' || status === 'connecting') return;
    setStatus('connecting');

    // This buffer will hold audio chunks for the current session.
    const audioBuffer: Int16Array[] = [];
    
    // This function concatenates and sends the buffered audio.
    const sendAudioBuffer = () => {
      if (audioBuffer.length === 0 || ws.current?.readyState !== WebSocket.OPEN) {
          return;
      }
      const totalLength = audioBuffer.reduce((sum, b) => sum + b.length, 0);

      // Only send if we have at least 50ms of audio (800 samples at 16kHz)
      const MIN_SAMPLES = 800; // 50ms * 16kHz
      if (totalLength < MIN_SAMPLES) {
        return;
      }

      const concatenatedBuffer = new Int16Array(totalLength);
      let offset = 0;
      for (const buffer of audioBuffer) {
        concatenatedBuffer.set(buffer, offset);
        offset += buffer.length;
      }
      ws.current.send(concatenatedBuffer.buffer);
      audioBuffer.length = 0; // Clear the buffer after sending
    };

    // Clear any existing interval before starting a new one.
    if (bufferSendInterval.current) {
      clearInterval(bufferSendInterval.current);
    }
    // Set up an interval to send buffered audio every 200ms to handle pauses.
    bufferSendInterval.current = window.setInterval(sendAudioBuffer, 200);

    try {
      // Get temporary token from server (recommended approach for production)
      console.log('Getting temporary token from server...');
      
      const tokenResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/assemblyai/token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': apiKey  // Pass the API key to the server
        },
        body: JSON.stringify({ expires_in_seconds: 600 })
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Failed to get temporary token: ${errorData.error || 'Unknown error'}`);
      }
      
      const { token } = await tokenResponse.json();
      if (!token) throw new Error("Temporary token not found in AssemblyAI response.");

      const params = new URLSearchParams({
        token: token,
        sample_rate: SAMPLE_RATE.toString(),
        encoding: 'pcm_s16le',
        format_turns: 'true'
      });
      
      const wsUrl = `${WS_API_BASE_URL}?${params.toString()}`;
      console.log('Connecting to AssemblyAI with temporary token...');
      
      audioStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create WebSocket connection
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onmessage = handleMessage;
      ws.current.onerror = handleError;
      ws.current.onclose = handleClose;

      ws.current.onopen = async () => {
        setStatus('connected');
        console.log('WebSocket connected to AssemblyAI.');

        // Create AudioContext with default sample rate, then resample to 16kHz
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const workletURL = URL.createObjectURL(new Blob([workletCode], { type: 'application/javascript' }));

        try {
            await audioContext.current.audioWorklet.addModule(workletURL);
        } catch (e) {
            console.error('Error adding audio worklet module', e);
            setStatus('error');
            cleanupResources();
            return;
        } finally {
            URL.revokeObjectURL(workletURL);
        }

        const source = audioContext.current.createMediaStreamSource(audioStream.current!);
        audioWorkletNode.current = new AudioWorkletNode(audioContext.current, 'recorder-processor');
        
        // When the worklet sends PCM data, buffer it.
        audioWorkletNode.current.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
          const pcmData = new Int16Array(event.data);
          console.log('🎵 Audio data received:', pcmData.length, 'samples');
          audioBuffer.push(pcmData);

          // If the buffer reaches a certain size (minimum 50ms), send it immediately.
          const MIN_SAMPLES_PER_BUFFER = 800; // 50ms * 16kHz (minimum required by AssemblyAI)
          const currentSampleCount = audioBuffer.reduce((sum, b) => sum + b.length, 0);
          if (currentSampleCount >= MIN_SAMPLES_PER_BUFFER) {
            console.log('🚀 Triggering immediate send with', currentSampleCount, 'samples');
            sendAudioBuffer();
          }
        };

        source.connect(audioWorkletNode.current);
      };
    } catch (err) {
      console.error('Error starting microphone or WebSocket:', err);
      setStatus('error');
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings.');
        } else {
           alert(`An error occurred: ${err.message}`);
        }
      }
      cleanupResources();
    }
  }, [apiKey, status, handleMessage, handleError, handleClose, cleanupResources]);

  const stopListening = useCallback(() => {
    console.log('🛑 stopListening called, current status:', status);
    if (status === 'idle' || status === 'closed' || status === 'closing') {
      console.log('❌ stopListening skipped - already in final state');
      return;
    }

    let timeoutId: number | undefined;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('📤 Sending terminate message to WebSocket');
      setStatus('closing');
      
      // Send terminate message. The `onclose` handler will perform the cleanup.
      ws.current.send(JSON.stringify({ type: "Terminate" }));
      
      // Set a timeout to force cleanup if the close event doesn't fire
      timeoutId = window.setTimeout(() => {
        console.log('⚠️ WebSocket close event not received, forcing cleanup');
        cleanupResources();
        setStatus('closed');
      }, 1000);
    } else {
      console.log('⚠️ WebSocket not open, cleaning up immediately');
      cleanupResources();
      setStatus('closed');
    }

    // Return cleanup function
    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [status, cleanupResources]);
  
  return { status, startListening, stopListening };
};
