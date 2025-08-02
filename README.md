# Real-time Audio Intelligence

A comprehensive web application that provides real-time audio transcription and intelligent analysis. It captures audio from your microphone, transcribes it using **AssemblyAI's Universal Streaming model**, analyzes it with **Google's Gemini AI**, and offers advanced session management and editing capabilities.

## Features

### Core Functionality
- **Real-time Transcription**: Live speech-to-text conversion using AssemblyAI Streaming API
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
- **Framework**: React 19 RC with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom CSS properties for theming
- **State Management**: React Context API for global state
- **Storage**: IndexedDB for session data, localStorage for preferences
- **Audio Processing**: Web Audio API with custom AudioWorklet processors

### Backend
- **Runtime**: Node.js with Express server
- **Proxy Server**: Secure API key handling and CORS management
- **Health Monitoring**: Built-in health check endpoints
- **Environment**: Development and production configurations

### APIs & Services
- **Speech-to-Text**: AssemblyAI Universal Streaming model
- **AI Analysis**: Google Gemini 2.0 Flash model
- **Real-time Communication**: WebSocket connections for live transcription
- **Audio Capture**: getUserMedia API with permission handling

### Development Tools
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint and Prettier configuration
- **Theme Validation**: Custom validation scripts
- **Hot Reload**: Vite HMR for instant development feedback

## Prerequisites

### System Requirements
- **Node.js**: Version 16 or higher
- **Package Manager**: npm or yarn
- **Browser**: Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- **HTTPS**: Required for microphone access in production
- **Microphone**: Working microphone for audio capture

### API Keys Required
1. **AssemblyAI**: [Get your API key here](https://www.assemblyai.com/dashboard/signup)
2. **Google Gemini AI**: [Get your API key here](https://aistudio.google.com/app/apikey)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/kaunghtut24/realtime-transcription.git
   cd realtime-transcription
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   # Create development environment files
   # Frontend configuration
   echo 'VITE_API_BASE_URL=http://localhost:3001
   VITE_WS_API_URL=wss://streaming.assemblyai.com/v3/ws
   VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
   VITE_API_KEY=your-gemini-key' > .env.development

   # Backend configuration
   echo 'PORT=3001
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
   VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
   VITE_API_KEY=your-gemini-key' > .env.development.server
   ```

3. **Start Development Servers**
   ```bash
   # Option 1: Start both servers at once
   npm run dev:full

   # Option 2: Start servers separately
   # Terminal 1 - Backend proxy server
   npm run server

   # Terminal 2 - Frontend development server
   npm run dev
   ```

4. **Access Application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001
   - **Health Check**: http://localhost:3001/health

5. **Validate Installation**
   ```bash
   # Run theme validation script
   chmod +x validate-themes.sh
   ./validate-themes.sh
   ```

## How to Use the Application

### Getting Started
1. **Start Recording**: Click the **Start** button to begin transcription
2. **Grant Permissions**: Allow microphone access when prompted by your browser
3. **Begin Speaking**: The status changes to "Listening..." and transcription appears in real-time
4. **Stop Recording**: Click **Stop** when finished to end the session

### Session Management
1. **View Sessions**: Click "Session Manager" to see all your recorded sessions
2. **Search Sessions**: Use the search bar to find sessions by name or content
3. **Filter Sessions**: Toggle between "All", "Analyzed", or "Unanalyzed" sessions
4. **Load Session**: Click any session to view its full transcript and analysis
5. **Export Data**: Use export buttons to save sessions in various formats

### Advanced Editing
1. **Access Editor**: Click "Advanced Editing" in any transcript view
2. **Edit Words**: Click individual words to edit them directly
3. **View Confidence**: See confidence scores for each transcribed word
4. **Track Changes**: Use the edit history to see all modifications
5. **Switch Views**: Toggle between edit, confidence, and timing views

### Theme Customization
1. **Preview Themes**: Click the theme selector to see all 6 available themes
2. **Live Preview**: Hover over themes to see them applied instantly
3. **Apply Theme**: Click to permanently apply your preferred theme
4. **Theme Persistence**: Your choice is saved and restored on future visits

### AI Analysis & Chat
1. **Automatic Analysis**: Analysis begins automatically when recording stops
2. **View Insights**: See summary, corrected transcript, and action items
3. **Interactive Chat**: Ask follow-up questions about your transcript
4. **Context-Aware**: AI remembers the full conversation context

## Development

### Available Scripts
- `npm run dev` - Start frontend development server (port 5173)
- `npm run server` - Start backend proxy server (port 3001)
- `npm run dev:full` - Start both servers concurrently
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `./validate-themes.sh` - Validate theme system functionality

### Project Structure
```
.
├── .env.development         # Frontend development environment
├── .env.development.server  # Backend development environment
├── src/                     # Frontend source code
│   ├── components/          # React components
│   │   ├── SessionManager.tsx          # Session management interface
│   │   ├── AdvancedTranscriptEditor.tsx # Word-level editing
│   │   ├── ThemePreview.tsx            # Theme selection
│   │   ├── SessionListView.tsx         # Session browsing
│   │   ├── SessionDetailsPanel.tsx     # Session details
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── SessionContext.tsx          # Session state management
│   │   └── ThemeContext.tsx            # Theme management
│   ├── hooks/               # Custom React hooks
│   │   ├── useAssemblyAI.ts           # Real-time transcription
│   │   ├── useGeminiAnalysis.ts       # AI analysis
│   │   └── useTranscriptHistory.ts    # Edit history
│   └── services/            # API and storage services
│       ├── geminiService.ts           # Gemini AI integration
│       ├── storageService.ts          # IndexedDB operations
│       └── exportService.ts           # Data export functionality
├── server.js                # Backend proxy server with CORS
├── validate-themes.sh       # Theme validation script
└── vite.config.ts          # Vite build configuration
```

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

## Deployment

For comprehensive deployment instructions including production setup, environment configuration, security considerations, and troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## API Documentation

### Health Check Endpoints
- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system information including uptime, memory usage, and environment

### Proxy Endpoints
- `POST /api/gemini` - Google Gemini AI analysis proxy
- `WebSocket /ws` - AssemblyAI streaming transcription proxy

## Troubleshooting

### Common Issues
- **Microphone Access**: Ensure HTTPS in production and grant browser permissions
- **CORS Errors**: Verify both frontend and backend servers are running
- **API Errors**: Check API keys in environment variables
- **Theme Issues**: Run `./validate-themes.sh` to verify theme system
- **Session Loading**: Clear IndexedDB if sessions fail to load

### Performance Tips
- **Browser Compatibility**: Use modern browsers for best WebRTC support
- **Network**: Stable internet connection recommended for real-time features
- **Storage**: Monitor browser storage usage for large numbers of sessions

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/realtime-transcription.git
   cd realtime-transcription
   ```

2. **Set Up Development Environment**
   ```bash
   npm install
   # Configure your .env files as described in Quick Start
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

4. **Make Your Changes**
   - Follow TypeScript best practices
   - Add tests for new functionality
   - Update documentation as needed
   - Run validation scripts: `./validate-themes.sh`

5. **Test Your Changes**
   ```bash
   npm run dev:full
   # Test all features thoroughly
   ```

6. **Commit and Push**
   ```bash
   git add .
   git commit -m 'Add amazing new feature'
   git push origin feature/amazing-new-feature
   ```

7. **Create Pull Request**
   - Describe your changes clearly
   - Include screenshots for UI changes
   - Link any related issues

### Development Guidelines
- **Code Style**: Follow existing TypeScript/React patterns
- **Testing**: Test on multiple browsers and devices
- **Documentation**: Update README and DEPLOYMENT guides
- **Performance**: Consider impact on real-time transcription
- **Accessibility**: Maintain keyboard navigation and screen reader support

## Roadmap

Current development status: **~95% feature complete**

### ✅ Completed Features
- Real-time transcription with AssemblyAI
- AI analysis with Google Gemini
- Session management system
- Advanced transcript editing
- 6-theme system with live preview
- Mobile-responsive design
- Production-ready deployment

### 🚧 Upcoming Enhancements
- Advanced export options
- Collaboration features
- Enhanced search capabilities
- Performance optimizations
- Additional theme customization

For detailed roadmap and feature status, see [ROADMAP.md](ROADMAP.md).

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

**Ready to get started?** Follow the [Quick Start](#quick-start) guide above and start transcribing in minutes!
