const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const searchRoutes = require('./routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 3032;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[Search API] Incoming request: ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[Search API] Request body:`, req.body);
    }
    next();
});

// Routes
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Search API is running',
        timestamp: new Date().toISOString(),
        service: 'search-api'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Search API',
        version: '1.0.0',
        endpoints: {
            search: 'GET /api/search?q=query',
            health: 'GET /health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Search API error:', err);
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        success: false,
        message: 'Route not found',
        method: req.method,
        path: req.originalUrl
    });
});

app.listen(PORT, () => {
    console.log(`🔍 Search API server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API base: http://localhost:${PORT}/api/search`);
}); 