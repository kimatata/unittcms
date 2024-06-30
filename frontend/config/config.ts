const Config = {
  apiServer: process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:8001',

  // set 'NEXT_PUBLIC_IS_DEMO=true' in frontend/.env
  isDemoSite: process.env.NEXT_PUBLIC_IS_DEMO === 'true' || false,
};

export default Config;
