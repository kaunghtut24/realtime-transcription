import React, { useState } from 'react';
import type { TranscriptSession } from '../services/storageService';
import { SessionListView } from './SessionListView';
import { SessionDetailsPanel } from './SessionDetailsPanel';

interface SessionManagerProps {
  onLoadSession?: (session: TranscriptSession) => void;
  onExportSession?: (session: TranscriptSession) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  onLoadSession,
  onExportSession,
  isOpen,
  onClose
}) => {
  const [selectedSession, setSelectedSession] = useState<TranscriptSession | null>(null);

  const handleSessionSelect = (session: TranscriptSession) => {
    setSelectedSession(session);
  };

  const handleLoadSession = (session: TranscriptSession) => {
    if (onLoadSession) {
      onLoadSession(session);
    }
    setSelectedSession(null);
    onClose();
  };

  const handleClose = () => {
    setSelectedSession(null);
    onClose();
  };

  const handleBackToList = () => {
    setSelectedSession(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {selectedSession ? (
        <SessionDetailsPanel
          session={selectedSession}
          onClose={handleBackToList}
          onLoadSession={handleLoadSession}
          onExport={onExportSession}
        />
      ) : (
        <SessionListView
          onSessionSelect={handleSessionSelect}
          onClose={handleClose}
        />
      )}
    </>
  );
};
