// Quick test for AssemblyAI Universal Streaming API
// Usage: node test-assemblyai-ws.cjs
require('dotenv').config({ path: '.env.local' });

const WebSocket = require('ws');

async function testWebSocket() {
  try {
    if (!process.env.VITE_ASSEMBLYAI_API_KEY) {
      throw new Error('VITE_ASSEMBLYAI_API_KEY not found in environment variables');
    }

    // Construct WebSocket URL with query parameters
    const params = new URLSearchParams({
      sample_rate: '16000',
      encoding: 'pcm_s16le',
      format_turns: 'true'
    });
    
    const WS_URL = `wss://streaming.assemblyai.com/v3/ws?${params.toString()}`;
    console.log('Connecting to:', WS_URL);
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Authorization': process.env.VITE_ASSEMBLYAI_API_KEY
      }
    });

    ws.on('open', () => {
      console.log('✅ WebSocket connection opened!');
      console.log('Waiting for session begin message...');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', JSON.stringify(message, null, 2));
        
        if (message.type === 'Begin') {
          console.log('🎉 Session successfully started!');
          console.log(`Session ID: ${message.id}`);
          console.log(`Expires at: ${new Date(message.expires_at * 1000).toISOString()}`);
          
          // Close the connection after successful test
          setTimeout(() => {
            console.log('Test completed successfully, closing connection...');
            ws.close();
          }, 2000);
        }
      } catch (parseError) {
        console.log('Received non-JSON message:', data.toString());
      }
    });

    ws.on('close', (code, reason) => {
      console.log('❌ WebSocket closed:', code, reason.toString());
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
console.log('Starting WebSocket test...');
testWebSocket();
