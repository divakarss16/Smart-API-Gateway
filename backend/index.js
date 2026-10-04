const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');

dotenv.config();

const app = express();

// Middleware — explicit CORS so Vite dev server (port 5173) is allowed
// and X-API-Key / Authorization headers pass through without preflight errors.
const corsOptions = {
  origin: [
    'http://localhost:5173',   // Vite dev server
    'http://localhost:4173',   // Vite preview
    'http://localhost:3000',   // fallback CRA / other
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options(/\/.*/, cors(corsOptions)); // preflight for all routes (Express 5 compat)
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1', apiRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB: Smart API Gateway'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Test Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Smart API Gateway Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
