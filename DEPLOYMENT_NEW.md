# Deployment Guide

This guide covers the deployment process for both development and production environments for the Real-time Audio Intelligence application.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [CORS Configuration](#cors-configuration)
- [New Features](#new-features)
- [Security Considerations](#security-considerations)
- [Performance Considerations](#performance-considerations)

## Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- SSL certificate for production
- Domain name (for production)
- Modern browser with WebRTC support for real-time transcription
- Microphone access for audio capture

### Project Structure
```
.
├── .env.development         # Frontend development environment variables
├── .env.production         # Frontend production environment variables
├── .env.development.server # Backend development environment variables
├── .env.production.server  # Backend production environment variables
├── src/                   # Frontend source code
│   ├── components/        # React components
│   │   ├── SessionManager.tsx          # Session management interface
│   │   ├── AdvancedTranscriptEditor.tsx # Word-level transcript editing
│   │   ├── ThemePreview.tsx            # Theme selection interface
│   │   └── ...
│   ├── contexts/          # React contexts (Theme, Session)
│   ├── services/          # API and storage services
│   └── hooks/             # Custom React hooks
├── server.js              # Backend server code with proxy endpoints
├── vite.config.js        # Vite configuration
└── validate-themes.sh    # Theme validation script
```

## Development Deployment

1. **Set up environment variables**
   ```bash
   # .env.development
   VITE_API_BASE_URL=http://localhost:3001
   VITE_WS_API_URL=wss://streaming.assemblyai.com/v3/ws
   VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
   VITE_API_KEY=your-gemini-key

   # .env.development.server
   PORT=3001
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
   VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
   VITE_API_KEY=your-gemini-key
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development servers**
   ```bash
   # Option 1: Start both servers concurrently
   npm run dev:full

   # Option 2: Start servers separately
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Validate setup**
   ```bash
   # Test theme system and server connectivity
   chmod +x validate-themes.sh
   ./validate-themes.sh
   ```

## Production Deployment

1. **Set up production environment variables**
   ```bash
   # .env.production
   VITE_API_BASE_URL=https://api.yourdomain.com
   VITE_WS_API_URL=wss://streaming.assemblyai.com/v3/ws
   VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
   VITE_API_KEY=your-gemini-key

   # .env.production.server
   PORT=3001
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key
   VITE_API_KEY=your-gemini-key
   ```

2. **Build the application**
   ```bash
   # Install dependencies
   npm install

   # Build the frontend
   npm run build
   ```

3. **Deploy to your hosting service**
   - **Frontend**: Deploy the `dist` folder to your static hosting service (e.g., Netlify, Vercel, AWS S3, Cloudflare Pages)
   - **Backend**: Deploy the `server.js` and related files to your Node.js hosting service (e.g., AWS EC2, Heroku, Railway, DigitalOcean)

4. **Configure web server**
   Example Nginx configuration for the backend API:
   ```nginx
   server {
       listen 443 ssl;
       server_name api.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       # Enable gzip compression
       gzip on;
       gzip_types text/plain application/json application/javascript text/css;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## Environment Variables

### Frontend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | https://api.yourdomain.com |
| VITE_WS_API_URL | AssemblyAI WebSocket URL | wss://streaming.assemblyai.com/v3/ws |
| VITE_ASSEMBLYAI_API_KEY | AssemblyAI API Key | your-key-here |
| VITE_API_KEY | Gemini API Key | your-key-here |

### Backend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | production |
| ALLOWED_ORIGINS | CORS allowed origins (comma-separated) | https://yourdomain.com,https://www.yourdomain.com |
| VITE_ASSEMBLYAI_API_KEY | AssemblyAI API Key for server-side proxy | your-key-here |
| VITE_API_KEY | Google Gemini API Key for server-side proxy | your-key-here |

**Note**: The backend uses `VITE_` prefixed environment variables to maintain consistency with the frontend configuration while providing secure server-side API access.

## CORS Configuration

The backend server includes enhanced CORS configuration based on environment:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
```

**Development CORS**: Automatically allows multiple Vite development ports (5173, 5174, 5175) for flexibility during development.

**Production CORS**: Strictly enforces allowed origins from environment variables for security.

## New Features

### Session Management System
The application now includes a comprehensive session management interface:

**Components:**
- `SessionManager.tsx` - Main session management coordinator
- `SessionListView.tsx` - Browse, search, and filter saved sessions
- `SessionDetailsPanel.tsx` - Detailed session view with full transcript and analysis

**Features:**
- Search sessions by name or transcript content
- Filter sessions by analysis status (analyzed/unanalyzed)
- Sort sessions by date, name, or duration
- Load previous sessions to continue working
- Export individual sessions
- Delete unwanted sessions

**Storage:** Sessions are stored locally using IndexedDB via the SessionContext.

### Advanced Transcript Editing
Word-level transcript editing capabilities:

**Component:** `AdvancedTranscriptEditor.tsx`

**Features:**
- Click any word to edit it directly
- Real-time confidence scoring display
- Word-level timing information
- Edit history tracking with undo functionality
- Multiple view modes (edit, confidence, timing)
- Visual indicators for edited words

**Integration:** Seamlessly integrated with the existing `EditableTranscript.tsx` component.

### Enhanced Theme System
Expanded from 2 to 6 themes with live preview:

**Component:** `ThemePreview.tsx`

**Available Themes:**
- Light - Clean and bright for daylight use
- Dark - Easy on the eyes for low-light environments  
- Ocean Blue - Calming blue theme
- Royal Purple - Elegant purple theme
- Forest Green - Natural green theme
- Sunset Orange - Warm and energetic theme

**Features:**
- Live theme preview before applying
- CSS custom properties for consistent theming
- Theme persistence in localStorage
- Smooth theme transitions

### Enhanced UI/UX
- **Expanded Icon Library**: 20+ new SVG icons for better visual communication
- **Responsive Design**: Improved mobile and desktop layouts
- **Accessibility**: Better keyboard navigation and screen reader support
- **Visual Polish**: Consistent styling, hover effects, and smooth transitions

### Production Readiness
- **Clean Codebase**: Removed all demo/test components and debug logging
- **Error Handling**: Comprehensive error boundaries and user-friendly messages
- **Performance**: Optimized rendering and state management
- **Security**: Proper API key handling and CORS configuration

## Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate API keys periodically
   - Server-side proxy prevents client-side API key exposure

2. **CORS Security**
   - Strictly limit allowed origins in production
   - Only allow necessary HTTP methods
   - Configure proper SSL/TLS certificates

3. **SSL/TLS**
   - Always use HTTPS in production (required for microphone access)
   - Configure secure SSL/TLS settings
   - Keep certificates up to date

4. **Error Handling**
   - Never expose internal errors to clients
   - Log errors securely
   - Implement proper rate limiting

5. **Browser Security**
   - Microphone permissions properly handled
   - Secure WebSocket connections (WSS)
   - Content Security Policy headers recommended

6. **Data Management**
   - **Session Storage**: Local data persists in IndexedDB
   - **Theme Preferences**: Saved in localStorage
   - **Edit History**: Tracked for transcript modifications
   - **Export Capabilities**: PDF, DOCX, SRT, VTT formats supported

7. **Browser Storage Limits**
   - IndexedDB storage can handle large numbers of sessions
   - Automatic cleanup mechanisms prevent storage overflow
   - Export capabilities allow data backup and portability

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Vite automatically handles code splitting for optimal loading
- **Asset Optimization**: CSS and JavaScript minification in production builds
- **Image Optimization**: SVG icons for scalable, lightweight graphics
- **Memory Management**: Proper cleanup of WebSocket connections and audio contexts

### Backend Optimization
- **API Caching**: Consider implementing Redis for API response caching
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Database Optimization**: For production, consider PostgreSQL for session storage
- **CDN Integration**: Use CDN for static assets and API responses

### Real-time Performance
- **WebSocket Management**: Automatic reconnection and error handling
- **Audio Processing**: Efficient audio worklet processing for real-time transcription
- **State Management**: Optimized React state updates for smooth UI performance

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify ALLOWED_ORIGINS matches your frontend domain exactly
   - Check SSL/TLS configuration
   - Validate request headers
   - Ensure comma-separated origins have no spaces

2. **WebSocket Connection Issues**
   - Verify WSS configuration for HTTPS sites
   - Check proxy settings in production
   - Validate SSL certificates
   - Ensure microphone permissions are granted

3. **API Key Issues**
   - Verify environment variables are loaded correctly
   - Check API key permissions and quotas
   - Validate API key format (no extra spaces or quotes)
   - Ensure server-side environment variables use VITE_ prefix

4. **Theme System Issues**
   - Clear browser cache if themes don't update
   - Check CSS custom properties are loading
   - Verify theme persistence in localStorage
   - Run `./validate-themes.sh` for theme validation

5. **Session Management Issues**
   - Check IndexedDB browser support and permissions
   - Clear IndexedDB if sessions aren't loading
   - Verify SessionContext is properly wrapped around components

6. **Audio/Microphone Issues**
   - Ensure HTTPS in production (required for microphone access)
   - Check browser microphone permissions
   - Verify WebRTC support in target browsers
   - Test audio worklet compatibility

### Health Checks

The backend includes built-in health check endpoints for monitoring:

```javascript
// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Detailed health check with system information
app.get('/health/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    env: process.env.NODE_ENV,
    memory: process.memoryUsage()
  });
});
```

### Feature Validation

**Theme System Validation:**
```bash
# Run the theme validation script
chmod +x validate-themes.sh
./validate-themes.sh
```

**Session Management Testing:**
1. Create a test recording session
2. Verify session appears in Session Manager
3. Test search and filter functionality
4. Verify session export capabilities

**Advanced Editing Testing:**
1. Create a transcript with word-level data
2. Access Advanced Editing mode
3. Test word-level editing functionality
4. Verify confidence and timing displays

### Development Tools

**Available Scripts:**
```bash
npm run dev          # Start frontend development server
npm run server       # Start backend server
npm run dev:full     # Start both servers concurrently
npm run build        # Build for production
npm run preview      # Preview production build
```

**Validation Scripts:**
- `validate-themes.sh` - Test theme system functionality
- Health check endpoints for monitoring server status

## Support

For additional support:
- **AssemblyAI Documentation**: [https://www.assemblyai.com/docs](https://www.assemblyai.com/docs)
- **Google Gemini AI Documentation**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Project Repository**: Submit issues and feature requests
- **Feature Status**: Check ROADMAP.md for current implementation status

### Latest Updates (v1.0)
- ✅ Complete session management system
- ✅ Advanced word-level transcript editing
- ✅ 6-theme system with live preview
- ✅ Production-ready codebase
- ✅ Enhanced error handling and validation
- ✅ Mobile-responsive design
- ✅ Comprehensive testing and validation tools

**Current Status**: ~95% feature complete - ready for production deployment.
