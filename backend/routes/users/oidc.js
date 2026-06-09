import express from 'express';
import { auth } from 'express-openid-connect';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import { API_PATH, FRONTEND_ORIGIN, IS_PROD, PORT, SECRET_KEY } from '../../config/config.js';
import { roles } from './authSettings.js';

const router = express.Router();

export default function (sequelize) {
  const User = defineUser(sequelize, DataTypes);

  const signInURL = `${FRONTEND_ORIGIN}/account/signin`;
  const apiOrigin = IS_PROD ? `${FRONTEND_ORIGIN}${API_PATH}` : `http://localhost:${PORT}`;

  const isOIDCConfigured =
    process.env.OIDC_ISSUER != null && process.env.OIDC_CLIENT_ID != null && process.env.OIDC_CLIENT_SECRET != null;

  router.get('/oidc/enabled', (req, res) => {
    res.json({ enabled: isOIDCConfigured });
  });

  if (!isOIDCConfigured) {
    return router;
  }

  const config = {
    authRequired: false,
    secret: SECRET_KEY,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    baseURL: `${apiOrigin}/users`,
    clientID: process.env.OIDC_CLIENT_ID,
    issuerBaseURL: process.env.OIDC_ISSUER,
    authorizationParams: {
      response_type: 'code',
      response_mode: 'query',
      scope: 'openid profile email',
    },
    routes: {
      login: false, // We'll handle this manually
      callback: '/oidc/callback',
      postLogoutRedirect: FRONTEND_ORIGIN,
    },
  };

  // Apply auth middleware
  router.use(auth(config));

  // Manual login route to redirect to OIDC provider
  router.get('/oidc/login', (req, res) => {
    res.oidc.login({
      returnTo: `${apiOrigin}/users/oidc/afterCallback`,
      authorizationParams: {
        redirect_uri: `${apiOrigin}/users/oidc/callback`,
      },
    });
  });

  router.get('/oidc/afterCallback', async (req, res) => {
    try {
      if (!req.oidc.isAuthenticated()) {
        return res.redirect(signInURL);
      }

      const oidcUser = req.oidc.user;
      const email = oidcUser.email;
      const username = oidcUser.name || oidcUser.nickname || email?.split('@')[0] || 'oidc_user';

      if (!email) {
        console.error('Email not provided by OIDC provider');
        return res.redirect(signInURL);
      }

      let user = await User.findOne({ where: { email } });

      if (!user) {
        const userCount = await User.count();
        const initialRole =
          userCount > 0
            ? roles.findIndex((entry) => entry.uid === 'user')
            : roles.findIndex((entry) => entry.uid === 'administrator');

        user = await User.create({
          email,
          password: Math.random().toString(36),
          username,
          role: initialRole,
        });
      }

      // Generate JWT token (same as regular signin)
      const accessToken = jwt.sign({ userId: user.id }, SECRET_KEY, {
        expiresIn: '24h',
      });
      const expiresAt = Date.now() + 3600 * 1000 * 24; // expire date(ms)

      user.password = undefined;

      // Redirect to the frontend callback page with token data
      const tokenData = {
        access_token: accessToken,
        expires_at: expiresAt,
        user,
      };

      const tokenParam = encodeURIComponent(JSON.stringify(tokenData));
      res.redirect(`${FRONTEND_ORIGIN}/account/sso-callback?token=${tokenParam}`);
    } catch (error) {
      console.error('OIDC authentication error:', error);
      res.redirect(signInURL);
    }
  });

  return router;
}
