/// <reference types="vite/client" />

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat } from '@google/genai';
import { useAssemblyAI } from './hooks/useAssemblyAI';
import { analyzeTranscript, ai } from './services/geminiService';
import type { AssemblyAITurn, GeminiAnalysis, ConnectionStatus, ChatMessage } from './types';
import { ControlButton } from './components/ControlButton';
import { TranscriptPanel } from './components/TranscriptPanel';
import { AnalysisCard } from './components/AnalysisCard';
import { ChatPanel } from './components/ChatPanel';
import { MicIcon, SummaryIcon, CheckCircleIcon, ListIcon, BrainCircuitIcon, HourglassIcon } from './components/icons';

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY || "";

const App: React.FC = () => {
  const [turns, setTurns] = useState<AssemblyAITurn[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  
  const fullTranscriptRef = useRef<string>('');

  const handleNewTurn = useCallback((turn: AssemblyAITurn) => {
    setTurns(prevTurns => {
      const existingTurnIndex = prevTurns.findIndex(t => t.turn_order === turn.turn_order);
      if (existingTurnIndex !== -1) {
        const newTurns = [...prevTurns];
        newTurns[existingTurnIndex] = turn;
        return newTurns;
      }
      return [...prevTurns, turn];
    });

    if (!turn.turn_is_formatted && !turn.end_of_turn) {
        setInterimTranscript(turn.transcript);
    } else {
        setInterimTranscript('');
    }
  }, []);

  const { status, startListening, stopListening } = useAssemblyAI({
    apiKey: ASSEMBLYAI_API_KEY,
    onTurn: handleNewTurn
  });

  const getFullTranscript = (currentTurns: AssemblyAITurn[]): string => {
    return currentTurns
      .map(t => t.transcript)
      .join(' ')
      .trim();
  };
  
  useEffect(() => {
    // Keep the ref updated with the latest full transcript
    fullTranscriptRef.current = getFullTranscript(turns);
  }, [turns]);
  
  const triggerGeminiAnalysis = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    setChat(null);
    setChatHistory([]);
    
    try {
      const result = await analyzeTranscript(transcript);
      if(result) {
        setGeminiAnalysis(result);
        // Initialize chat after successful analysis
        const chatPrompt = `Understood. I have analyzed the transcript. The summary is: "${result.summary}". And here are the action items: ${result.actionItems.join(', ') || 'None'}. How can I help you further?`;
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: [
                { role: 'user', parts: [{ text: `Here is a transcript of a conversation I had. Please act as my assistant to answer questions about it:\n\n---\n${transcript}\n---` }] },
                { role: 'model', parts: [{ text: chatPrompt }] }
            ],
            config: {
                systemInstruction: 'You are a helpful assistant analyzing a meeting transcript. The user will ask follow-up questions about it. Be concise and helpful.',
            }
        });
        setChat(newChat);
        setChatHistory([{ role: 'model', text: chatPrompt }]);
      }
    } catch (error) {
      console.error("Error analyzing transcript with Gemini:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (status === 'closed' && fullTranscriptRef.current) {
        triggerGeminiAnalysis(fullTranscriptRef.current);
    }
  }, [status, triggerGeminiAnalysis]);
  
  const handleToggleListening = () => {
    if (status === 'connected') {
      stopListening();
    } else if(status === 'idle' || status === 'closed') {
      setTurns([]);
      setInterimTranscript('');
      setGeminiAnalysis(null);
      setChat(null);
      setChatHistory([]);
      fullTranscriptRef.current = '';
      startListening();
    }
  };

  const handleSendChatMessage = async (message: string) => {
    if (!chat || isChatting) return;
    
    setIsChatting(true);
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    
    try {
        const response = await chat.sendMessage({ message });
        const modelResponse = response.text;
        setChatHistory(prev => [...prev, { role: 'model', text: modelResponse }]);
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
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="w-full max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-700">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="bg-brand-blue p-2 rounded-lg mr-3">
            <MicIcon className="w-6 h-6 text-white"/>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Real-time Audio Intelligence</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-gray-400 text-sm">{getStatusText(status)}</p>
            <ControlButton onClick={handleToggleListening} status={status} />
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-grow grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 h-[75vh] flex flex-col">
            <TranscriptPanel turns={turns} interimTranscript={interimTranscript} />
        </div>

        <aside className="lg:col-span-2 h-[75vh] flex flex-col gap-6 overflow-y-auto pr-2">
          <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2 sticky top-0 bg-gray-900 py-2">
            <BrainCircuitIcon className="w-6 h-6 text-brand-blue" />
            Gemini Analysis
          </h2>
          {isAnalyzing && (
            <div className="flex items-center justify-center text-gray-400 bg-gray-800/50 p-4 rounded-lg">
                <HourglassIcon className="w-5 h-5 mr-2 animate-spin" />
                Analyzing transcript...
            </div>
          )}
          {geminiAnalysis && (
            <>
              <AnalysisCard icon={<SummaryIcon/>} title="Summary" content={geminiAnalysis.summary} isLoading={isAnalyzing}/>
              <AnalysisCard icon={<CheckCircleIcon/>} title="Corrected Transcript" content={geminiAnalysis.correctedTranscript} isLoading={isAnalyzing}/>
              <AnalysisCard icon={<ListIcon/>} title="Action Items" content={geminiAnalysis.actionItems.length > 0 ? <ul>{geminiAnalysis.actionItems.map((item, i) => <li key={i} className="mb-1 ml-4 list-disc">{item}</li>)}</ul> : 'No action items identified.'} isLoading={isAnalyzing}/>
            </>
          )}
          
          {chat && chatHistory.length > 0 && (
            <ChatPanel 
              history={chatHistory}
              isSending={isChatting}
              onSendMessage={handleSendChatMessage}
            />
          )}

          {!isAnalyzing && !geminiAnalysis && status !== 'connected' && status !== 'connecting' && (
            <div className="text-center text-gray-500 bg-gray-800/50 p-6 rounded-lg mt-4">
                Analysis will appear here after you stop a recording.
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default App;