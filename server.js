import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production.server' 
  : '.env.development.server';

dotenv.config({ path: envFile });

const app = express();
const PORT = process.env.PORT || 3001;

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [];

// Configure CORS based on environment
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Proxy endpoint for AssemblyAI token generation
app.post('/api/assemblyai/token', async (req, res) => {
  try {
    const apiKey = process.env.VITE_ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'AssemblyAI API key not configured' });
    }

    // Use GET request with query parameters as per AssemblyAI API documentation
    const url = new URL('https://streaming.assemblyai.com/v3/token');
    url.searchParams.append('expires_in_seconds', '600'); // Max allowed is 600 seconds

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AssemblyAI API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `Failed to get token: ${response.status} ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying token request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Proxy endpoint for Google Gemini API
app.post('/api/gemini/analyze', async (req, res) => {
  console.log('📥 Received Gemini analysis request from:', req.ip);
  console.log('📄 Request body:', req.body);

  try {
    const apiKey = process.env.VITE_API_KEY;

    if (!apiKey) {
      console.log('❌ API key not configured');
      return res.status(500).json({ error: 'Google Gemini API key not configured' });
    }

    const { transcript } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `
      You are an expert meeting assistant. Analyze the following transcript.
      1. Provide a concise summary of the conversation.
      2. Correct any spelling or grammatical errors in the transcript.
      3. Identify the main topics or keywords.
      4. Extract any clear action items or tasks.

      Return the result as a single JSON object with the following structure:
      {
        "summary": "A concise summary of the entire transcript in 2-4 sentences.",
        "correctedTranscript": "The full transcript, corrected for any spelling or grammatical errors.",
        "topics": ["topic1", "topic2", ...],
        "actionItems": ["action1", "action2", ...]
      }

      Transcript:
      ---
      ${transcript}
      ---
    `;

    console.log('🌐 Making request to Gemini API...');
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    console.log('📡 Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API error:', response.status, errorData);
      return res.status(response.status).json({
        error: `Failed to analyze transcript: ${response.status} ${response.statusText}`,
        details: errorData
      });
    }

    console.log('📥 Processing Gemini API response...');
    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.log('❌ No response text from Gemini API');
      return res.status(500).json({ error: 'No response from Gemini API' });
    }

    try {
      const parsedJson = JSON.parse(generatedText);
      console.log('✅ Successfully parsed Gemini response, sending to client');
      res.json(parsedJson);
      console.log('📤 Response sent to client successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', generatedText);
      return res.status(500).json({ error: 'Invalid JSON response from Gemini' });
    }

  } catch (error) {
    console.error('❌ Gemini proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    console.log('📤 Error response sent to client');
  }
});

// Proxy endpoint for Gemini chat
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const apiKey = process.env.VITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Google Gemini API key not configured' });
    }

    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Convert our chat history format to Gemini's format
    const contents = [];

    // Add history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      }
    }

    // Add the new message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: 'You are a helpful assistant analyzing a meeting transcript. The user will ask follow-up questions about it. Be concise and helpful.' }]
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini Chat API error:', response.status, errorData);
      return res.status(response.status).json({
        error: `Failed to send chat message: ${response.status} ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return res.status(500).json({ error: 'No response from Gemini API' });
    }

    res.json({ text: generatedText });

  } catch (error) {
    console.error('Gemini chat proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/health/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    env: process.env.NODE_ENV,
    memory: process.memoryUsage()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
});
