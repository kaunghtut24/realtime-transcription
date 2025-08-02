/// <reference types="vite/client" />

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAssemblyAI } from './hooks/useAssemblyAI.v7';
import { analyzeTranscript, sendChatMessage } from './services/geminiService';
import { useSession } from './contexts/SessionContext';
import type { AssemblyAITurn, GeminiAnalysis, ConnectionStatus, ChatMessage } from './types';
import { ControlButton } from './components/ControlButton';
import { TranscriptPanel } from './components/TranscriptPanel';
import { AnalysisCard } from './components/AnalysisCard';
import { ChatPanel } from './components/ChatPanel';
import { ExportDialog } from './components/ExportDialog';
import { 
  MicIcon, 
  SummaryIcon, 
  CheckCircleIcon, 
  ListIcon, 
  BrainCircuitIcon, 
  HourglassIcon,
  DownloadIcon
} from './components/icons';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY || "";

const AppContent: React.FC = () => {
  const [turns, setTurns] = useState<AssemblyAITurn[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  const fullTranscriptRef = useRef<string>('');
  const analyzedTranscriptRef = useRef<string>('');
  const sessionStartTimeRef = useRef<number>(0);
  
  const { saveCurrentSession, currentSession } = useSession();

  const handleTranscriptChange = useCallback(async (newTranscript: string) => {
    fullTranscriptRef.current = newTranscript;
    
    try {
      await saveCurrentSession({
        id: currentSession?.id ?? '',
        transcript: newTranscript,
        editHistory: [
          ...(currentSession?.editHistory ?? []),
          {
            timestamp: Date.now(),
            content: newTranscript
          }
        ]
      });
    } catch (error) {
      console.error('Error saving transcript changes:', error);
    }
  }, [currentSession, saveCurrentSession]);

  const handleNewTurn = useCallback((turn: AssemblyAITurn) => {
    console.log('🎤 New turn received in App:', {
      turn_order: turn.turn_order,
      turn_is_formatted: turn.turn_is_formatted,
      end_of_turn: turn.end_of_turn,
      transcript: turn.transcript,
      transcript_length: turn.transcript.length,
      words_count: turn.words?.length || 0
    });

    setTurns(prevTurns => {
      const existingTurnIndex = prevTurns.findIndex(t => t.turn_order === turn.turn_order);
      if (existingTurnIndex !== -1) {
        const newTurns = [...prevTurns];
        newTurns[existingTurnIndex] = turn;
        console.log('🔄 Updated existing turn', turn.turn_order, 'New transcript:', turn.transcript);
        return newTurns;
      }
      console.log('➕ Added new turn', turn.turn_order, 'Transcript:', turn.transcript);
      return [...prevTurns, turn];
    });

    // Update interim transcript for unformatted, non-final turns
    if (!turn.turn_is_formatted && !turn.end_of_turn) {
        console.log('📝 Setting interim transcript:', turn.transcript);
        setInterimTranscript(turn.transcript);
    } else {
        console.log('🔄 Clearing interim transcript');
        setInterimTranscript('');
    }
  }, []);

  const { status, startListening, stopListening } = useAssemblyAI({
    apiKey: ASSEMBLYAI_API_KEY,
    onTurn: handleNewTurn
  });

  const getFullTranscript = (currentTurns: AssemblyAITurn[]): string => {
    const transcript = currentTurns
      .map(t => t.transcript)
      .join(' ')
      .trim();
    console.log('📝 Full transcript generated:', transcript);
    console.log('📊 Number of turns:', currentTurns.length);
    return transcript;
  };
  
  useEffect(() => {
    // Keep the ref updated with the latest full transcript
    fullTranscriptRef.current = getFullTranscript(turns);
  }, [turns]);
  
  const triggerGeminiAnalysis = useCallback(async (transcript: string) => {
    console.log('🚀 Triggering Gemini analysis with transcript:', transcript);
    console.log('📏 Transcript length:', transcript.length, 'characters');

    if (!transcript.trim() || isAnalyzing) {
      console.log('❌ Skipping analysis - empty transcript or already analyzing', {
        emptyTranscript: !transcript.trim(),
        isAnalyzing: isAnalyzing
      });
      return;
    }

    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    setChatEnabled(false);
    setChatHistory([]);

    try {
      console.log('📡 Calling analyzeTranscript...');
      const result = await analyzeTranscript(transcript);
      console.log('📊 Analysis result:', result);

      if(result) {
        setGeminiAnalysis(result);
        // Initialize chat after successful analysis
        const chatPrompt = `Understood. I have analyzed the transcript. The summary is: "${result.summary}". And here are the action items: ${result.actionItems.join(', ') || 'None'}. How can I help you further?`;

        // Initialize chat history with the context and initial message
        setChatHistory([
          { role: 'user', text: `Here is a transcript of a conversation I had. Please act as my assistant to answer questions about it:\n\n---\n${transcript}\n---` },
          { role: 'model', text: chatPrompt }
        ]);
        setChatEnabled(true);
        console.log('✅ Analysis completed successfully');
      } else {
        console.log('❌ Analysis returned null result');
      }
    } catch (error) {
      console.error("❌ Failed to analyze transcript:", error);
    } finally {
      console.log('🔄 Resetting isAnalyzing to false');
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    // Update the full transcript whenever turns change
    const newTranscript = turns.map(turn => turn.transcript).join('\n\n');
    fullTranscriptRef.current = newTranscript;

    const shouldAnalyze = 
      status === 'closed' && 
      newTranscript.trim().length > 0 && 
      !isAnalyzing && 
      newTranscript !== analyzedTranscriptRef.current;

    if (shouldAnalyze) {
        analyzedTranscriptRef.current = newTranscript;
        triggerGeminiAnalysis(newTranscript);
    }
  }, [status, triggerGeminiAnalysis, isAnalyzing]);
  
  const handleToggleListening = () => {
    if (status === 'connected') {
      stopListening();
    } else if(status === 'idle' || status === 'closed') {
      setTurns([]);
      setInterimTranscript('');
      setGeminiAnalysis(null);
      setChatEnabled(false);
      setChatHistory([]);
      setIsAnalyzing(false); // Reset analyzing state
      fullTranscriptRef.current = '';
      analyzedTranscriptRef.current = ''; // Reset the analyzed transcript tracker
      startListening();
    }
  };

  // Manual trigger for testing
  const handleManualAnalysis = () => {
    console.log('🔧 Manual analysis triggered');
    setIsAnalyzing(false); // Reset the state first
    const currentTranscript = getFullTranscript(turns);
    if (currentTranscript.trim()) {
      triggerGeminiAnalysis(currentTranscript);
    } else {
      console.log('❌ No transcript available for manual analysis');
    }
  };

  // Debug function to test live transcript
  const handleTestTranscript = () => {
    console.log('🧪 Testing live transcript...');
    const testTurn: AssemblyAITurn = {
      type: 'Turn',
      turn_order: turns.length + 1,
      turn_is_formatted: false,
      end_of_turn: false,
      transcript: `Test transcript ${Date.now()} - This is a test message to verify live transcript updates.`,
      words: []
    };
    handleNewTurn(testTurn);
  };

  const handleSendChatMessage = async (message: string) => {
    if (!chatEnabled || isChatting) return;

    setIsChatting(true);
    const newUserMessage: ChatMessage = { role: 'user', text: message };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
        const response = await sendChatMessage(message, chatHistory);
        if (response) {
          setChatHistory(prev => [...prev, { role: 'model', text: response }]);
        } else {
          setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        }
    } catch (error) {
        console.error("Error sending chat message:", error);
        setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsChatting(false);
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
      switch (status) {
          case 'idle': return 'Click Start to Begin';
          case 'connecting': return 'Connecting...';
          case 'connected': return 'Listening... Press Stop to analyze.';
          case 'closing': return 'Finalizing transcript...';
          case 'closed': return 'Session ended. Click Start to begin again.';
          case 'error': return 'An error occurred. Please refresh.';
      }
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-gray-900 font-sans p-4 sm:p-6 lg:p-8 flex flex-col text-gray-900 dark:text-gray-200">
      <header className="w-full max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-700 dark:border-gray-700">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="bg-brand-blue p-2 rounded-lg mr-3">
            <MicIcon className="w-6 h-6 text-white"/>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Real-time Audio Intelligence</h1>
          <ThemeToggle />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-gray-400 text-sm">{getStatusText(status)}</p>
            <ControlButton onClick={handleToggleListening} status={status} />
            
            {/* Debug button for testing - remove in production */}
            <button
              onClick={handleTestTranscript}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
            >
              Test Live Transcript
            </button>
            
            {turns.length > 0 && (
              <>
                <button
                  onClick={handleManualAnalysis}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Manual Analysis'}
                </button>
                <button
                  onClick={() => setIsExportDialogOpen(true)}
                  className="px-4 py-2 bg-brand-teal hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Export
                </button>
              </>
            )}
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-grow grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 h-[85vh] flex flex-col">
            <TranscriptPanel
              turns={turns}
              interimTranscript={interimTranscript}
              onTranscriptChange={handleTranscriptChange}
            />
        </div>

        <aside className="lg:col-span-2 h-[85vh] flex flex-col gap-4 overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2 sticky top-0 bg-gray-900 py-2 z-10">
            <BrainCircuitIcon className="w-6 h-6 text-brand-blue" />
            Gemini Analysis
          </h2>
          <div className="flex-grow overflow-y-auto pr-2 space-y-4 min-h-0">
          {isAnalyzing && (
            <div className="flex items-center justify-center text-gray-400 bg-gray-800/50 p-4 rounded-lg">
                <HourglassIcon className="w-5 h-5 mr-2 animate-spin" />
                Analyzing transcript...
            </div>
          )}
          {geminiAnalysis && (
            <>
              <AnalysisCard 
                icon={<SummaryIcon/>} 
                title="Summary" 
                content={geminiAnalysis.summary} 
                isLoading={isAnalyzing}
              />
              <AnalysisCard 
                icon={<CheckCircleIcon/>} 
                title="Corrected Transcript" 
                content={geminiAnalysis.correctedTranscript} 
                isLoading={isAnalyzing}
              />
              <AnalysisCard 
                icon={<ListIcon/>} 
                title="Action Items" 
                content={
                  geminiAnalysis.actionItems.length > 0 ? (
                    <ul className="space-y-2 bg-gray-700/30 p-4 rounded-lg">
                      {geminiAnalysis.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="inline-block w-4 h-4 mt-1 mr-2 text-brand-teal">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'No action items identified.'
                  )
                } 
                isLoading={isAnalyzing}
              />
            </>
          )}
          
          {chatEnabled && chatHistory.length > 0 && (
            <ChatPanel 
              history={chatHistory}
              isSending={isChatting}
              onSendMessage={handleSendChatMessage}
            />
          )}

          {!isAnalyzing && !geminiAnalysis && status !== 'connected' && status !== 'connecting' && (
            <div className="text-center text-gray-500 bg-gray-800/50 p-6 rounded-lg">
                Analysis will appear here after you stop a recording.
            </div>
          )}
          </div>
        </aside>
      </main>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        transcript={fullTranscriptRef.current}
        analysis={geminiAnalysis}
        turns={turns}
      />

      <ToastContainer position="bottom-right" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;