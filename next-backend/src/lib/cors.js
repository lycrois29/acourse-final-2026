const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
  'Cache-Control': 'no-store',
};
export default corsHeaders;
