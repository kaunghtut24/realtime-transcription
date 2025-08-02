import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';

interface WebSocketManagerConfig {
  url: string;
  maxRetries?: number;
  retryInterval?: number;
  onMessage: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

interface WebSocketState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  retryCount: number;
  ws: WebSocket | null;
}

export function useWebSocketManager({
  url,
  maxRetries = 3,
  retryInterval = 3000,
  onMessage,
  onOpen,
  onClose,
  onError
}: WebSocketManagerConfig) {
  const [state, setState] = useState<WebSocketState>({
    status: 'disconnected',
    retryCount: 0,
    ws: null
  });

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setState(prev => ({ ...prev, status: 'connected', retryCount: 0, ws }));
        toast.success('WebSocket connection established');
        onOpen?.();
      };

      ws.onmessage = (event) => {
        onMessage(event.data);
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, status: 'disconnected', ws: null }));
        onClose?.();
      };

      ws.onerror = (event) => {
        setState(prev => ({ ...prev, status: 'error', ws: null }));
        const error = new Error('WebSocket error occurred');
        toast.error('Connection error. Retrying...');
        onError?.(error);
      };

      setState(prev => ({ ...prev, status: 'connecting', ws }));
    } catch (error) {
      setState(prev => ({ ...prev, status: 'error', ws: null }));
      const err = error instanceof Error ? error : new Error('Failed to create WebSocket');
      onError?.(err);
    }
  }, [url, onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    state.ws?.close();
    setState(prev => ({ ...prev, status: 'disconnected', ws: null }));
  }, [state.ws]);

  // Automatic reconnection logic
  useEffect(() => {
    if (state.status === 'error' && state.retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
        connect();
      }, retryInterval);

      return () => clearTimeout(timer);
    }
    
    if (state.status === 'error' && state.retryCount >= maxRetries) {
      toast.error('Unable to establish connection after multiple attempts');
    }
  }, [state.status, state.retryCount, maxRetries, retryInterval, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      state.ws?.close();
    };
  }, [state.ws]);

  return {
    status: state.status,
    retryCount: state.retryCount,
    connect,
    disconnect
  };
}
