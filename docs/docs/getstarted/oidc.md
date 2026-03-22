---
sidebar_position: 5
---

# OIDC Authentication

UnitTCMS supports OpenID Connect (OIDC) authentication, allowing users to sign in using their existing identity provider (such as Keycloak, Auth0, Okta, or any OIDC-compliant provider).

## Overview

When OIDC is configured, a "Sign in with SSO" button will appear on the sign-in page. Users can authenticate through your OIDC provider, and upon successful authentication, a JWT token will be generated just like normal email/password login.

## Configuration

OIDC authentication is configured through environment variables. You need to provide four required variables:

### Environment Variables

| Variable | Description | Example                                       |
|----------|-------------|-----------------------------------------------|
| `OIDC_ISSUER` | The issuer base URL of your OIDC provider | `https://your-keycloak.com/realms/your-realm` |
| `OIDC_CLIENT_ID` | The client ID from your OIDC provider | `unittcms-client`                             |
| `OIDC_CLIENT_SECRET` | The client secret from your OIDC provider | `your-secret-here`                            |
| `OIDC_CALLBACK_URL` | The backend callback URL where OIDC will redirect | `http://localhost:8001/users/oidc/callback`   |

:::info
All four environment variables must be set for OIDC authentication to be enabled. If any variable is missing, the SSO button will not appear.
:::

## Docker Setup

If you are running UnitTCMS with Docker, add the OIDC environment variables to your `docker-compose.yaml`:

```yaml title="docker-compose.yaml"
services:
  unittcms:
    image: unittcms:latest
    build: .
    ports:
      - '8000:8000'
    environment:
      - PORT=8000
      - SECRET_KEY=your_secret_key_here
      // highlight-start
      - OIDC_ISSUER=https://your-keycloak.com/realms/your-realm
      - OIDC_CLIENT_ID=unittcms-client
      - OIDC_CLIENT_SECRET=your-client-secret
      - OIDC_CALLBACK_URL=http://localhost:8000/users/oidc/callback
      // highlight-end
    volumes:
      - db-data:/app/backend/database
```

:::warning
Make sure to update the `OIDC_CALLBACK_URL` to match your deployment URL in production.
:::

## From Source Setup

If you are running UnitTCMS from source, add the OIDC variables to your backend `.env` file:

```.env title="backend/.env"
FRONTEND_ORIGIN=http://localhost:8000
PORT=3001
SECRET_KEY=your-secret-key

# OIDC Configuration
OIDC_ISSUER=https://your-keycloak.com/realms/your-realm
OIDC_CLIENT_ID=unittcms-client
OIDC_CLIENT_SECRET=your-client-secret
OIDC_CALLBACK_URL=http://localhost:3001/users/oidc/callback
```

## OIDC Provider Setup

You need to configure your OIDC provider to allow authentication from UnitTCMS. The exact steps vary by provider, but here are the general requirements:

### Required Configuration

1. **Client Type**: Confidential
2. **Protocol**: OpenID Connect
3. **Grant Type**: Authorization Code
4. **Valid Redirect URIs**: `http://localhost:3001/users/oidc/callback` (update for production)
5. **Scopes**: `openid`, `profile`, `email`

### Example: Keycloak

1. Log in to your Keycloak admin console
2. Select your realm
3. Navigate to **Clients** → **Create**
4. Configure the client:
   - **Client ID**: `unittcms-client`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `confidential`
   - **Valid Redirect URIs**: `http://localhost:3001/users/oidc/callback`
5. Click **Save**
6. Go to the **Credentials** tab and copy the **Client Secret**
7. Ensure the following scopes are enabled:
   - `openid`
   - `profile`
   - `email`

### Example: Authentik

1. In your Authentik Admin UI, go to **Applications → Providers** and create a new **OAuth2/OpenID Connect Provider**
2. Configure the following:
    - **Name**: `UnitTCMS` (or any descriptive name)
    - **Client type**: `Confidential`
    - **Client ID**: copy or set your own (use as `OIDC_CLIENT_ID`)
    - **Client Secret**: copy the generated secret (use as `OIDC_CLIENT_SECRET`)
    - **Redirect URIs**
        - `http://localhost:8001/users/oidc/callback`
    - **Signing Key**: select your Authentik signing certificate
3. Under **Advanced Protocol Settings**, ensure the following scopes are enabled:
    - `openid`
    - `profile`
    - `email`
4. Go to **Applications → Applications** and create a new Application, linking it to the provider you just created
5. Copy the **OpenID Configuration Issuer** URL from the provider's detail page — it will look like `https://your-authentik.com/application/o/your-app-slug/` — and use it as `OIDC_ISSUER`
