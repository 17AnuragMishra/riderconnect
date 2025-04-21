const allowedOrigins = [
    'http://localhost:3000',
    'https://riderconnect.vercel.app',
    'http://192.168.1.51:3000',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  ];
  const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  };
  export default corsOptions;