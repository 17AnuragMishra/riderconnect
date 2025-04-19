const allowedOrigins = [
    'http://localhost:3000',
    'https://riderconnect.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  ];
  const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  };
  export default corsOptions;