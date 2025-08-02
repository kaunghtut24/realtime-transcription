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
import { SessionManager } from './components/SessionManager';
import { 
  MicIcon, 
  SummaryIcon, 
  CheckCircleIcon, 
  ListIcon, 
  BrainCircuitIcon, 
  HourglassIcon,
  DownloadIcon,
  HistoryIcon,
  EditIcon,
  PaletteIcon
} from './components/icons';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdvancedTranscriptEditor } from './components/AdvancedTranscriptEditor';
import { ThemePreview } from './components/ThemePreview';

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
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isThemePreviewOpen, setIsThemePreviewOpen] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  
  const fullTranscriptRef = useRef<string>('');
  const analyzedTranscriptRef = useRef<string>('');
  
  const { saveCurrentSession } = useSession();

  const handleTranscriptChange = useCallback(async (newTranscript: string) => {
    fullTranscriptRef.current = newTranscript;
    
    // TODO: Implement transcript editing history when needed
    // This would require updating the TranscriptSession interface to include edit history
  }, []);

  const handleLoadSession = useCallback((session: any) => {
    // Load a session from history
    setTurns(session.turns || []);
    setGeminiAnalysis(session.analysis || null);
    setChatHistory([]);
    setChatEnabled(!!session.analysis);
    setIsAnalyzing(false);
    fullTranscriptRef.current = session.turns?.map((turn: AssemblyAITurn) => turn.transcript).join('\n\n') || '';
  }, []);

  const handleExportSession = useCallback((session: any) => {
    // Set the current session data and open export dialog
    setTurns(session.turns || []);
    setGeminiAnalysis(session.analysis || null);
    fullTranscriptRef.current = session.turns?.map((turn: AssemblyAITurn) => turn.transcript).join('\n\n') || '';
    setIsExportDialogOpen(true);
  }, []);

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
        
        // Update the saved session with analysis results
        if (turns.length > 0) {
          const sessionDuration = turns.reduce((total, turn) => {
            if (turn.words && turn.words.length > 0) {
              const lastWord = turn.words[turn.words.length - 1];
              return Math.max(total, lastWord.end);
            }
            return total;
          }, 0);

          saveCurrentSession({
            name: `Transcript ${new Date().toLocaleString()}`,
            turns: turns,
            analysis: result,
            duration: Math.round(sessionDuration)
          });
        }
        
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
  }, [isAnalyzing, saveCurrentSession]);

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
        
        // Save session when transcript is completed
        const sessionDuration = turns.reduce((total, turn) => {
          if (turn.words && turn.words.length > 0) {
            const lastWord = turn.words[turn.words.length - 1];
            return Math.max(total, lastWord.end);
          }
          return total;
        }, 0);

        saveCurrentSession({
          name: `Transcript ${new Date().toLocaleString()}`,
          turns: turns,
          analysis: null, // Will be updated after analysis completes
          duration: Math.round(sessionDuration)
        });
    }
  }, [status, triggerGeminiAnalysis, isAnalyzing, turns, saveCurrentSession]);
  
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
    <div className="min-h-screen bg-theme-primary font-sans p-4 sm:p-6 lg:p-8 flex flex-col text-theme-primary">
      <header className="w-full max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-theme">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="bg-brand-blue p-2 rounded-lg mr-3">
            <MicIcon className="w-6 h-6 text-white"/>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary tracking-tight">Real-time Audio Intelligence</h1>
          <ThemeToggle />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-theme-secondary text-sm">{getStatusText(status)}</p>
            <ControlButton onClick={handleToggleListening} status={status} />
            
            {/* Advanced Editing Button */}
            <button
              onClick={() => setShowAdvancedEditor(!showAdvancedEditor)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showAdvancedEditor 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <EditIcon className="w-4 h-4" />
              {showAdvancedEditor ? 'Hide Editor' : 'Advanced Editing'}
            </button>
            
            {/* Session Manager Button */}
            <button
              onClick={() => setIsSessionManagerOpen(true)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <HistoryIcon className="w-4 h-4" />
              Sessions
            </button>
            
            {/* Theme Preview Button */}
            <button
              onClick={() => setIsThemePreviewOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <PaletteIcon className="w-4 h-4" />
              Themes
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
        {showAdvancedEditor && turns.length > 0 ? (
          <div className="lg:col-span-5">
            <AdvancedTranscriptEditor 
              turns={turns}
              onWordsUpdate={(updatedTurns: AssemblyAITurn[]) => {
                setTurns(updatedTurns);
                // Update full transcript ref
                fullTranscriptRef.current = getFullTranscript(updatedTurns);
              }}
            />
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        transcript={fullTranscriptRef.current}
        analysis={geminiAnalysis}
        turns={turns}
      />

      <SessionManager
        isOpen={isSessionManagerOpen}
        onClose={() => setIsSessionManagerOpen(false)}
        onLoadSession={handleLoadSession}
        onExportSession={handleExportSession}
      />

      <ThemePreview
        isOpen={isThemePreviewOpen}
        onClose={() => setIsThemePreviewOpen(false)}
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