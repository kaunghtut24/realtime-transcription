# Real-time Audio Intelligence

A comprehensive web application that provides real-time audio transcription and intelligent analysis. It captures audio from your microphone, transcribes it using **AssemblyAI's Universal Streaming model**, analyzes it with **Google's Gemini AI**, and offers advanced session management and editing capabilities.

## Features

### Core Functionality
- **Live Transcription**: Real-time speech-to-text conversion using AssemblyAI Streaming API
- **AI-Powered Analysis**: Comprehensive transcript analysis using Google Gemini AI
- **Interactive AI Chat**: Ask follow-up questions about transcripts in a conversational interface
- **Word-level Accuracy**: Confidence scoring and timing information for each transcribed word

### Session Management System
- **Session History**: Browse, search, and filter all your transcription sessions
- **Session Search**: Find sessions by name or transcript content
- **Session Filtering**: Filter by analysis status (analyzed/unanalyzed)
- **Data Export**: Export sessions in multiple formats (PDF, DOCX, SRT, VTT)
- **Local Storage**: All data stored locally using IndexedDB for privacy

### Advanced Editing Capabilities
- **Word-level Editing**: Click any word to edit it directly in the transcript
- **Confidence Display**: Visual indicators showing transcription confidence levels
- **Edit History**: Track changes with undo functionality
- **Multiple View Modes**: Switch between edit, confidence, and timing views
- **Real-time Updates**: Changes sync immediately across all components

### Enhanced User Experience
- **6 Premium Themes**: Light, Dark, Ocean Blue, Royal Purple, Forest Green, Sunset Orange
- **Live Theme Preview**: See themes before applying them
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Modern UI**: Clean interface with smooth animations and transitions

## Tech Stack

### Frontend
-   **Framework**: React 19 RC with TypeScript
-   **Build Tool**: Vite for fast development and optimized builds
-   **Styling**: Tailwind CSS with custom CSS properties for theming
-   **State Management**: React Context API for global state
-   **Storage**: IndexedDB for session data, localStorage for preferences
-   **Audio Processing**: Web Audio API with custom AudioWorklet processors

### Backend
-   **Runtime**: Node.js with Express server
-   **Proxy Server**: Secure API key handling and CORS management
-   **Health Monitoring**: Built-in health check endpoints
-   **Environment**: Development and production configurations

### APIs & Services
-   **Speech-to-Text**: AssemblyAI Universal Streaming model
-   **AI Analysis**: Google Gemini 2.0 Flash model
-   **Real-time Communication**: WebSocket connections for live transcription
-   **Audio Capture**: getUserMedia API with permission handling

## Prerequisites

### System Requirements
- **Node.js**: Version 16 or higher
- **Package Manager**: npm or yarn
- **Browser**: Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- **HTTPS**: Required for microphone access in production
- **Microphone**: Working microphone for audio capture

### API Keys Required

To run this application, you will need API keys from two services:

1.  **AssemblyAI**: [Get your API key here](https://www.assemblyai.com/dashboard/signup)
2.  **Google AI**: [Get your Gemini API key here](https://aistudio.google.com/app/apikey)

## Setup & Running the Application

This application is built with Vite and includes both frontend and backend components.

1.  **Clone and Install Dependencies**:
    ```bash
    git clone https://github.com/kaunghtut24/realtime-transcription.git
    cd realtime-transcription
    npm install
    ```

2.  **Set up Environment Variables**:
    Create development environment files and add your API keys:

    ```bash
    # Frontend configuration (.env.development)
    echo 'VITE_API_BASE_URL=http://localhost:3001
    VITE_WS_API_URL=wss://streaming.assemblyai.com/v3/ws
    VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
    VITE_API_KEY=your-gemini-key' > .env.development

    # Backend configuration (.env.development.server)
    echo 'PORT=3001
    NODE_ENV=development
    ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
    VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
    VITE_API_KEY=your-gemini-key' > .env.development.server
    ```

3.  **Run both the proxy server and development server**:
    ```bash
    # Option 1: Start both servers at once
    npm run dev:full
    ```

    Or run them separately:
    ```bash
    # Terminal 1 - Backend proxy server
    npm run server

    # Terminal 2 - Frontend development server  
    npm run dev
    ```

4.  **Open in Browser**:
    Open `http://localhost:5173` in your browser.

5.  **Validate Installation**:
    ```bash
    # Run theme validation script
    chmod +x validate-themes.sh
    ./validate-themes.sh
    ```

## How to Use the Application

### Getting Started
1.  **Start Recording**: Click the **Start** button to begin transcription
2.  **Grant Permissions**: Allow microphone access when prompted by your browser
3.  **Begin Speaking**: The status changes to "Listening..." and transcription appears in real-time
4.  **Stop Recording**: Click **Stop** when finished to end the session

### Session Management
1.  **View Sessions**: Click "Session Manager" to see all your recorded sessions
2.  **Search Sessions**: Use the search bar to find sessions by name or content
3.  **Filter Sessions**: Toggle between "All", "Analyzed", or "Unanalyzed" sessions
4.  **Load Session**: Click any session to view its full transcript and analysis
5.  **Export Data**: Use export buttons to save sessions in various formats

### Advanced Editing
1.  **Access Editor**: Click "Advanced Editing" in any transcript view
2.  **Edit Words**: Click individual words to edit them directly
3.  **View Confidence**: See confidence scores for each transcribed word
4.  **Track Changes**: Use the edit history to see all modifications
5.  **Switch Views**: Toggle between edit, confidence, and timing views

### Theme Customization
1.  **Preview Themes**: Click the theme selector to see all 6 available themes
2.  **Live Preview**: Hover over themes to see them applied instantly
3.  **Apply Theme**: Click to permanently apply your preferred theme
4.  **Theme Persistence**: Your choice is saved and restored on future visits

### AI Analysis & Chat
1.  **Automatic Analysis**: Analysis begins automatically when recording stops
2.  **View Insights**: See summary, corrected transcript, and action items
3.  **Interactive Chat**: Ask follow-up questions about your transcript
4.  **Context-Aware**: AI remembers the full conversation context

## Key Features in Detail

### Session Management System
- **Persistent Storage**: All sessions saved locally using IndexedDB
- **Smart Search**: Find sessions by transcript content or session name  
- **Status Filtering**: View analyzed vs unanalyzed sessions
- **Data Export**: Multiple export formats (PDF, DOCX, SRT, VTT)
- **Session Recovery**: Never lose your transcription work

### Advanced Transcript Editing
- **Word-level Precision**: Edit individual words with confidence scoring
- **Visual Feedback**: Color-coded confidence levels for each word
- **Edit History**: Full undo/redo capability with change tracking
- **Multiple Views**: Switch between editing, confidence, and timing modes
- **Real-time Sync**: Changes update across all interface components

### Enhanced Theme System  
- **6 Premium Themes**: Carefully designed for different preferences and lighting
- **Live Preview**: See themes applied before committing to them
- **Smooth Transitions**: Elegant theme switching with CSS animations
- **Accessibility**: High contrast ratios and readable typography
- **Persistence**: Theme choice saved and restored across sessions

## Troubleshooting

### Common Issues

#### Audio Issues
- **No transcription appearing**: Make sure both the proxy server (port 3001) and frontend (port 5173) are running
- **Sample rate errors**: The app automatically handles sample rate conversion from your microphone to 16kHz
- **Microphone permission**: Ensure your browser has permission to access your microphone and you're using HTTPS in production

#### API Issues
- **Token errors**: Check that your API keys are correctly set in the environment files
- **CORS errors**: Make sure the proxy server is running on port 3001 and allowed origins are configured
- **WebSocket issues**: Verify WSS configuration for HTTPS sites and check SSL certificates

#### Feature Issues
- **Theme not updating**: Clear browser cache if themes don't update, check CSS custom properties
- **Sessions not loading**: Clear IndexedDB if sessions aren't loading, verify SessionContext setup
- **Export failing**: Check browser permissions for file downloads and available disk space

### Performance Tips
- **Browser Compatibility**: Use modern browsers for best WebRTC support
- **Network**: Stable internet connection recommended for real-time features  
- **Storage**: Monitor browser storage usage for large numbers of sessions
- **Memory**: Close unused tabs for optimal performance during long sessions

### Validation Tools
```bash
# Run theme validation script
chmod +x validate-themes.sh
./validate-themes.sh

# Check server health
curl http://localhost:3001/health
```

## Development Status

**Current Status**: ~95% feature complete - ready for production use

### ✅ Completed Features
- Real-time transcription with AssemblyAI
- AI analysis with Google Gemini  
- Session management system
- Advanced transcript editing
- 6-theme system with live preview
- Mobile-responsive design
- Production-ready deployment

### Recent Updates
- ✅ Complete session management system with search and filtering
- ✅ Advanced word-level transcript editing with confidence scoring
- ✅ Enhanced theme system with 6 themes and live preview
- ✅ Production-ready codebase with comprehensive error handling
- ✅ Mobile-responsive design with accessibility improvements
- ✅ Comprehensive testing and validation tools

## Deployment

For comprehensive deployment instructions including production setup, environment configuration, security considerations, and troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Available Scripts

- `npm run dev` - Start frontend development server (port 5173)
- `npm run server` - Start backend proxy server (port 3001)  
- `npm run dev:full` - Start both servers concurrently
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `./validate-themes.sh` - Validate theme system functionality

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository** on GitHub
2. **Clone Your Fork** and set up the development environment
3. **Create a Feature Branch** (`git checkout -b feature/amazing-feature`)
4. **Make Your Changes** following TypeScript and React best practices
5. **Test Thoroughly** on multiple browsers and devices
6. **Commit Your Changes** (`git commit -m 'Add amazing feature'`)
7. **Push to Your Branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request** with a clear description of changes

### Development Guidelines
- Follow existing TypeScript/React patterns
- Test on multiple browsers and devices
- Update documentation as needed
- Consider impact on real-time transcription performance
- Maintain accessibility features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [AssemblyAI](https://www.assemblyai.com/) for cutting-edge real-time transcription
- [Google AI](https://ai.google.dev/) for powerful Gemini analysis capabilities  
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) for excellent development experience
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- Open source community for inspiration and best practices

## Support

- **Documentation**: Complete guides in [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join discussions and share feedback
- **Updates**: Watch the repository for new releases and features

---

**Ready to get started?** Follow the [Setup & Running](#setup--running-the-application) guide above and start transcribing in minutes!