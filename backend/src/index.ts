import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import routes from './routes';
import prisma from './config/database';
import fs from 'fs';
import path from 'path';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://192.168.177.25:5173', 'http://192.168.177.25:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const uploadsDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Errore interno del server',
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connesso con successo');

    app.listen(config.port, () => {
      console.log(`🚀 Server in ascolto su porta ${config.port}`);
      console.log(`🌍 Ambiente: ${config.nodeEnv}`);
      console.log(`📁 Upload directory: ${uploadsDir}`);
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Chiusura server...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
