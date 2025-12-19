import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Debug Middleware to log requests (Placed first to capture everything)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers['content-type']));
    // Body won't be parsed yet, but we can see headers
    next();
});

import helmet from 'helmet';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Allow form data
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Parsed Body:', JSON.stringify(req.body));
    }
    next();
});

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Health Check
import { getHealth } from './controllers/healthController.js';
app.get('/api/health', getHealth);

// Master v1 Router
import v1Routes from './routes/v1.js';
app.use('/api/v1', v1Routes);

// Uploads static folder
import path from 'path';
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// Error Handling
import { errorHandler } from './middlewares/errorHandler.js';
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
