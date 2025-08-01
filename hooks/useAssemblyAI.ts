import { useState, useRef, useCallback } from 'react';
import type { AssemblyAITurn, ConnectionStatus, AssemblyAIMessage } from '../types';

interface UseAssemblyAIProps {
  apiKey: string;
  onTurn: (turn: AssemblyAITurn) => void;
}

const SAMPLE_RATE = 16000;
const TOKEN_API_ENDPOINT = 'https://streaming.assemblyai.com/v3/token';
const WS_API_BASE_URL = 'wss://streaming.assemblyai.com/v3/ws';

// The AudioWorkletProcessor code is defined as a string to be loaded as a Blob.
const workletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const inputChannelData = inputs[0][0];
    if (!inputChannelData) {
      return true;
    }
    const pcm16 = new Int16Array(inputChannelData.length);
    for (let i = 0; i < inputChannelData.length; i++) {
        let s = Math.max(-1, Math.min(1, inputChannelData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
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
      const message: AssemblyAIMessage = JSON.parse(event.data);
      if (message.type === 'Turn') {
        onTurn(message);
      } else if (message.type === 'Begin') {
        console.log('AssemblyAI session started:', message.id);
      } else if (message.type === 'Termination') {
        console.log('AssemblyAI session terminated.');
      }
    } catch (error) {
      console.error('Error parsing message from AssemblyAI:', error);
    }
  }, [onTurn]);

  const cleanupResources = useCallback(() => {
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
    if (ws.current) {
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close();
      }
      ws.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    console.log('WebSocket connection closed.');
    cleanupResources();
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
      const tokenResponse = await fetch(TOKEN_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in: 3600 })
      });
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Failed to get temporary token: ${errorData.error || 'Unknown error'}`);
      }
      const { token } = await tokenResponse.json();
      if (!token) throw new Error("Temporary token not found in AssemblyAI response.");

      const wsUrl = `${WS_API_BASE_URL}?token=${token}&sample_rate=${SAMPLE_RATE}&encoding=pcm_s16le`;
      audioStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      ws.current = new WebSocket(wsUrl); 
      
      ws.current.onmessage = handleMessage;
      ws.current.onerror = handleError;
      ws.current.onclose = handleClose;

      ws.current.onopen = async () => {
        setStatus('connected');
        console.log('WebSocket connected to AssemblyAI.');

        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
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
          audioBuffer.push(pcmData);

          // If the buffer reaches a certain size (e.g., 200ms), send it immediately.
          const SAMPLES_PER_BUFFER = 3200; // 200ms * 16kHz
          const currentSampleCount = audioBuffer.reduce((sum, b) => sum + b.length, 0);
          if (currentSampleCount >= SAMPLES_PER_BUFFER) {
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
    if (status === 'idle' || status === 'closed' || status === 'closing') return;
    setStatus('closing');

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Send terminate message. The `onclose` handler will perform the cleanup.
      ws.current.send(JSON.stringify({ type: "Terminate" }));
    } else {
      // If there's no websocket for some reason, clean up and set status immediately.
      cleanupResources();
      setStatus('closed');
    }
  }, [status, cleanupResources]);
  
  return { status, startListening, stopListening };
};