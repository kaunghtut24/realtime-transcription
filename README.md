# Realtime Transcription with AssemblyAI and Gemini

A real-time transcription application that uses AssemblyAI for speech-to-text conversion and Google's Gemini AI for analysis.

## Features

- Real-time speech-to-text transcription using AssemblyAI
- AI-powered analysis using Google's Gemini
- Manual analysis control with start/stop functionality
- Copy-to-clipboard functionality for transcripts and analysis
- Health check endpoints for monitoring
- Environment-based configuration for development and production

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- AssemblyAI API key
- Google Gemini API key

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/kaunghtut24/realtime-transcription.git
   cd realtime-transcription
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies (if separate package.json)
   cd server && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp .env.example .env.development
   cp .env.server.example .env.development.server
   ```
   
   Edit the files and add your API keys:
   - Frontend (.env.development)
   - Backend (.env.development.server)

4. **Start development servers**
   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend
   NODE_ENV=development node server.js
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001
   - Health Check: http://localhost:3001/health

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Project Structure
```
.
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   └── services/          # API services
├── server.js              # Backend server
└── vite.config.ts         # Vite configuration
```

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## API Documentation

### Health Check Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status including uptime and memory usage

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [AssemblyAI](https://www.assemblyai.com/) for real-time transcription
- [Google Gemini](https://ai.google.dev/) for AI analysis
