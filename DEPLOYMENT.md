# Deployment Guide

This guide covers the deployment process for both development and production environments.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [CORS Configuration](#cors-configuration)
- [Security Considerations](#security-considerations)

## Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- SSL certificate for production
- Domain name (for production)

### Project Structure
```
.
├── .env.development         # Frontend development environment variables
├── .env.production         # Frontend production environment variables
├── .env.development.server # Backend development environment variables
├── .env.production.server  # Backend production environment variables
├── src/                   # Frontend source code
├── server.js              # Backend server code
└── vite.config.js        # Vite configuration
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
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
   ASSEMBLYAI_API_KEY=your-assemblyai-key
   GEMINI_API_KEY=your-gemini-key
   ```

2. **Start development servers**
   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend
   NODE_ENV=development node server.js
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
   ASSEMBLYAI_API_KEY=your-assemblyai-key
   GEMINI_API_KEY=your-gemini-key
   ```

2. **Build the frontend**
   ```bash
   npm run build
   ```

3. **Deploy to your hosting service**
   - Frontend: Deploy the `dist` folder to your static hosting service (e.g., Netlify, Vercel, AWS S3)
   - Backend: Deploy the server to your Node.js hosting service (e.g., AWS EC2, Heroku)

4. **Configure web server**
   Example Nginx configuration for the backend API:
   ```nginx
   server {
       listen 443 ssl;
       server_name api.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

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
| ALLOWED_ORIGINS | CORS allowed origins | https://yourdomain.com |
| ASSEMBLYAI_API_KEY | AssemblyAI API Key | your-key-here |
| GEMINI_API_KEY | Gemini API Key | your-key-here |

## CORS Configuration

The backend server includes CORS configuration based on environment:

```javascript
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

## Security Considerations

1. **API Keys**
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate API keys periodically

2. **CORS Security**
   - Strictly limit allowed origins in production
   - Only allow necessary HTTP methods
   - Configure proper SSL/TLS certificates

3. **SSL/TLS**
   - Always use HTTPS in production
   - Configure secure SSL/TLS settings
   - Keep certificates up to date

4. **Error Handling**
   - Never expose internal errors to clients
   - Log errors securely
   - Implement proper rate limiting

5. **Monitoring**
   - Set up application monitoring
   - Configure error alerting
   - Monitor API usage and costs

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify ALLOWED_ORIGINS matches your frontend domain
   - Check SSL/TLS configuration
   - Validate request headers

2. **WebSocket Connection Issues**
   - Verify WSS configuration
   - Check proxy settings
   - Validate SSL certificates

3. **API Key Issues**
   - Verify environment variables are loaded
   - Check API key permissions
   - Validate API key format

### Health Checks

Add these endpoints to your server for monitoring:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/health/detailed', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

## Support

For additional support:
- Check the [AssemblyAI Documentation](https://www.assemblyai.com/docs)
- Check the [Google Gemini Documentation](https://ai.google.dev/docs)
- Submit issues on the project repository
- Contact the development team
