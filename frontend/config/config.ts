const Config = {
  get isProduction() {
    return process.env.NODE_ENV === 'production';
  },

  get apiServer() {
    const isSSR = typeof window === 'undefined';

    // we are in production build with SSR enabled
    if (isSSR && Config.isProduction) {
      if (process.env.NEXT_PUBLIC_BACKEND_ORIGIN) {
        return process.env.NEXT_PUBLIC_BACKEND_ORIGIN;
      }

      const PORT = process.env.PORT || 8000;
      const apiPath = process.env.API_PATH || '/api';

      return `http://localhost:${PORT}${apiPath}`;
    }

    return process.env.NEXT_PUBLIC_BACKEND_ORIGIN || '/api';
  },

  // set 'NEXT_PUBLIC_IS_DEMO=true' in frontend/.env
  isDemoSite: process.env.NEXT_PUBLIC_IS_DEMO === 'true' || false,
};

export default Config;
