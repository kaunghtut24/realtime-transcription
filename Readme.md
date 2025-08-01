# Real-time Audio Intelligence

This is a web application that demonstrates real-time audio transcription and intelligent analysis. It captures audio from your microphone, transcribes it using **AssemblyAI's Universal Streaming model**, and then uses **Google's Gemini API** to provide an initial analysis and an interactive chat for follow-up questions.

## Features

-   **Live Transcription**: Converts speech to text in real-time as you speak.
-   **AI-Powered Analysis**: Upon stopping the recording, the full transcript is sent to Google Gemini for deeper insights.
-   **Intelligent Insights**:
    -   **Concise Summary**: Get a quick overview of the conversation.
    -   **Corrected Transcript**: A polished version of the transcript with corrected grammar and spelling.
    -   **Action Items**: Automatically extracts tasks and to-dos mentioned during the conversation.
-   **Interactive AI Chat**: After the initial analysis, a chat interface appears, allowing you to ask follow-up questions about the transcript.
-   **Modern & Responsive UI**: A clean, intuitive interface built with React and Tailwind CSS.

## Tech Stack

-   **Frontend**: React (v19 RC), TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **Real-time Speech-to-Text**: AssemblyAI Streaming API
-   **AI Analysis & Chat**: Google Gemini API (`gemini-2.5-flash`)
-   **Audio Capture**: Web Audio API (`getUserMedia`)

## Prerequisites

To run this application, you will need API keys from two services:

1.  **AssemblyAI**: [Get your API key here](https://www.assemblyai.com/dashboard/signup)
2.  **Google AI**: [Get your Gemini API key here](https://aistudio.google.com/app/apikey)

## Setup & Running the Application

This application is built with Vite.

1.  **Clone the repository and install dependencies**:
    ```bash
    npm install
    ```

2.  **Set up Environment Variables**:
    Create a file named `.env.local` in the root of the project and add your API keys:

    ```env
    # For Google Gemini API
    VITE_API_KEY="YOUR_GEMINI_API_KEY"

    # For AssemblyAI Streaming API
    VITE_ASSEMBLYAI_API_KEY="YOUR_ASSEMBLYAI_API_KEY"
    ```

3.  **Run both the proxy server and development server**:
    ```bash
    npm run dev:full
    ```

    Or run them separately:
    ```bash
    # Terminal 1 - Proxy server
    npm run server

    # Terminal 2 - Frontend
    npm run dev
    ```

4.  **Open in Browser**:
    Open `http://localhost:5174` in your browser.

## How to Use the App

1.  **Start Recording**: Click the **Start** button.
2.  **Allow Permissions**: Your browser will ask for permission to use your microphone. Click **Allow**.
3.  **Speak**: The status will change to "Listening...". As you speak, you will see your words transcribed in real-time.
4.  **Stop Recording**: When you are finished, click the **Stop** button.
5.  **View Analysis**: The recording will stop, and the app will generate an initial analysis including a summary, corrected transcript, and action items.
6.  **Chat with AI**: After the analysis appears, a chat box will become available. Ask follow-up questions to dig deeper into the transcript.
7.  **Start Again**: Click **Start** to clear the previous session and begin a new recording.

## Troubleshooting

### Audio Issues
- **No transcription appearing**: Make sure both the proxy server (port 3001) and frontend (port 5174) are running
- **Sample rate errors**: The app automatically handles sample rate conversion from your microphone to 16kHz
- **Microphone permission**: Ensure your browser has permission to access your microphone

### API Issues
- **Token errors**: Check that your AssemblyAI API key is correctly set in `.env.local`
- **CORS errors**: Make sure the proxy server is running on port 3001

## Recent Fixes Applied

- ✅ Fixed CORS issues by adding a proxy server for AssemblyAI API calls
- ✅ Fixed React root creation warnings by removing duplicate script tags
- ✅ Fixed import map conflicts that were causing module loading issues
- ✅ Updated API endpoints to use the correct AssemblyAI streaming endpoints
- ✅ Fixed audio sample rate conversion issues for real-time transcription