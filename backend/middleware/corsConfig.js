const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://riderconnect.vercel.app',
    'https://riderconnect.in',
    'https://www.riderconnect.in',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  ];
  const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  };
  export default corsOptions;