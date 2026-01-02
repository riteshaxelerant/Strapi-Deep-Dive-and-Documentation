# Authentication and Authorization

## Overview

This guide covers authentication and authorization in Strapi 5, including authentication providers, user management, API tokens, session management, and security best practices.

---

## Authentication Overview

### Authentication Methods

Strapi supports multiple authentication methods:

1. **JWT (JSON Web Tokens)**: Default authentication for API
2. **Local Authentication**: Email/password authentication
3. **OAuth Providers**: Third-party authentication (Google, Facebook, etc.)
4. **API Tokens**: Token-based authentication for applications
5. **SSO (Single Sign-On)**: Enterprise authentication

### Two Authentication Contexts

1. **Admin Panel**: For administrators accessing the admin interface
2. **API**: For end users consuming content via API

---

## JWT Authentication

### How JWT Works

1. User authenticates with credentials
2. Strapi validates credentials
3. Strapi issues JWT token
4. Client includes token in requests
5. Strapi validates token on each request

### JWT Configuration

```javascript
// config/plugins.js
module.exports = {
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
      jwt: {
        expiresIn: '7d', // Token expiration
      },
    },
  },
};
```

### Using JWT in API Requests

```javascript
// Include token in Authorization header
fetch('http://localhost:1337/api/articles', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Token Structure

```json
{
  "id": 1,
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1235173890
}
```

---

## Local Authentication

### User Registration

#### API Endpoint

```javascript
POST /api/auth/local/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Response

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": {
      "id": 1,
      "name": "Authenticated",
      "type": "authenticated"
    }
  }
}
```

### User Login

#### API Endpoint

```javascript
POST /api/auth/local
Content-Type: application/json

{
  "identifier": "john@example.com", // email or username
  "password": "securepassword"
}
```

#### Response

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Password Reset

#### Request Reset

```javascript
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password

```javascript
POST /api/auth/reset-password
Content-Type: application/json

{
  "code": "reset-code-from-email",
  "password": "newpassword",
  "passwordConfirmation": "newpassword"
}
```

---

## OAuth Providers

### Supported Providers

- Google
- Facebook
- GitHub
- Discord
- Twitter
- Microsoft
- Apple
- Instagram
- VK
- Twitch
- LinkedIn

### Configuring OAuth Providers

#### Step 1: Get Provider Credentials

1. Register application with provider
2. Obtain Client ID and Client Secret
3. Set redirect URI: `http://localhost:1337/api/connect/{provider}/callback`

#### Step 2: Configure in Strapi

1. Navigate to **Settings** > **Users & Permissions** > **Providers**
2. Select provider (e.g., Google)
3. Enable provider
4. Enter Client ID and Client Secret
5. Save configuration

#### Step 3: Update Redirect URI

Update redirect URI in provider settings:
- Development: `http://localhost:1337/api/connect/{provider}/callback`
- Production: `https://yourdomain.com/api/connect/{provider}/callback`

### OAuth Flow

1. User clicks "Sign in with {Provider}"
2. Redirected to provider login
3. User authenticates with provider
4. Provider redirects back to Strapi
5. Strapi creates/updates user account
6. Strapi issues JWT token
7. User is authenticated

### Custom OAuth Provider

```javascript
// config/plugins.js
module.exports = {
  'users-permissions': {
    config: {
      providers: [
        {
          uid: 'custom-provider',
          displayName: 'Custom Provider',
          icon: 'custom-icon',
          createStrategy: (strapi) => {
            return new CustomStrategy({
              // Provider configuration
            });
          },
        },
      ],
    },
  },
};
```

---

## API Tokens

### Overview

API Tokens provide authentication for applications without user credentials.

### Creating API Tokens

#### Via Admin Panel

1. Navigate to **Settings** > **Global Settings** > **API Tokens**
2. Click **Create new API Token**
3. Configure token:
   - **Name**: Descriptive name
   - **Token type**: Read-only, Full access, or Custom
   - **Token duration**: Unlimited or specific duration
   - **Permissions**: For custom tokens, set specific permissions
4. Click **Save**
5. **Copy token immediately** (shown only once)

#### Token Types

**Read-only**:
- Can read all content
- Cannot create, update, or delete

**Full access**:
- Full CRUD operations
- Can manage all content

**Custom**:
- Define specific permissions
- Granular control

### Using API Tokens

```javascript
// Include token in Authorization header
fetch('http://localhost:1337/api/articles', {
  headers: {
    'Authorization': `Bearer ${apiToken}`
  }
});
```

### Token Security

1. **Store Securely**: Never commit tokens to version control
2. **Rotate Regularly**: Change tokens periodically
3. **Limit Scope**: Use custom tokens with minimal permissions
4. **Monitor Usage**: Track token usage
5. **Revoke When Compromised**: Immediately revoke compromised tokens

---

## Single Sign-On (SSO)

### Overview

SSO allows administrators to authenticate through identity providers like Microsoft Azure AD.

### Configuring SSO

#### Step 1: Set Up Identity Provider

1. Configure identity provider (e.g., Azure AD)
2. Obtain client ID and secret
3. Set redirect URI

#### Step 2: Configure in Strapi

1. Navigate to **Settings** > **Global Settings** > **Single Sign-On**
2. Enable SSO
3. Enter provider configuration:
   - Client ID
   - Client Secret
   - Redirect URI
   - Provider URL
4. Map provider roles to Strapi roles
5. Save configuration

### SSO Flow

1. Administrator clicks "Sign in with SSO"
2. Redirected to identity provider
3. Authenticates with provider
4. Provider redirects back to Strapi
5. Strapi creates/updates admin account
6. Administrator is logged in

---

## User Management

### Creating Users

#### Via Admin Panel

1. Navigate to **Content Manager** > **User**
2. Click **Create new entry**
3. Fill in user details:
   - Username
   - Email
   - Password
   - Role
4. Click **Save**

#### Via API

```javascript
POST /api/users
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": 2
}
```

### Updating Users

```javascript
PUT /api/users/:id
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "role": 3
}
```

### Deleting Users

```javascript
DELETE /api/users/:id
Authorization: Bearer {admin-token}
```

### User Roles

```javascript
// Get user with role
GET /api/users/:id?populate=role

// Update user role
PUT /api/users/:id
{
  "role": roleId
}
```

---

## Session Management

### JWT Token Expiration

```javascript
// config/plugins.js
module.exports = {
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d', // 7 days
        // Options: '1h', '1d', '7d', '30d', etc.
      },
    },
  },
};
```

### Token Refresh

```javascript
// Refresh token endpoint
POST /api/auth/refresh-token
Authorization: Bearer {current-token}
```

### Logout

```javascript
// Client-side: Remove token from storage
localStorage.removeItem('jwtToken');

// Server-side: Token is stateless, no server-side logout needed
// For enhanced security, implement token blacklist
```

---

## Security Best Practices

### Password Security

1. **Strong Passwords**: Enforce strong password requirements
2. **Hashing**: Passwords are automatically hashed (bcrypt)
3. **Password Reset**: Implement secure password reset flow
4. **Password History**: Prevent password reuse

### Token Security

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Expiration**: Set appropriate token expiration
3. **Token Storage**: Store tokens securely (httpOnly cookies recommended)
4. **Token Rotation**: Implement token rotation for long-lived tokens

### API Security

1. **Rate Limiting**: Implement rate limiting
2. **Input Validation**: Validate all inputs
3. **SQL Injection Prevention**: Use parameterized queries (Strapi handles this)
4. **XSS Prevention**: Sanitize user input

### CORS Configuration

```javascript
// config/middlewares.js
module.exports = [
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['https://yourdomain.com'], // Specific origins
      // or
      // origin: '*', // All origins (not recommended for production)
      headers: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  },
];
```

### Security Headers

```javascript
// config/middlewares.js
module.exports = [
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
      crossOriginEmbedderPolicy: false,
    },
  },
];
```

---

## Custom Authentication Strategies

### Creating Custom Strategy

```javascript
// src/extensions/users-permissions/strapi-server.js
module.exports = (plugin) => {
  plugin.controllers.auth.customLogin = async (ctx) => {
    const { identifier, password } = ctx.request.body;

    // Custom authentication logic
    const user = await strapi
      .plugin('users-permissions')
      .service('users-permissions')
      .validatePassword(password, user.password);

    if (!user) {
      return ctx.unauthorized('Invalid credentials');
    }

    // Generate JWT
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    return {
      jwt,
      user: sanitizeUser(user),
    };
  };

  return plugin;
};
```

---

## Multi-Factor Authentication (MFA)

### Overview

MFA adds an extra layer of security by requiring additional verification.

### Implementation

Use plugins like HeadLockr for MFA:
1. Install MFA plugin
2. Configure MFA settings
3. Users enable MFA in their profile
4. Login requires additional verification

---

## Troubleshooting

### Common Issues

**Issue**: Authentication fails
- **Solution**: Check credentials
- **Solution**: Verify JWT secret is set
- **Solution**: Check token expiration

**Issue**: OAuth provider not working
- **Solution**: Verify redirect URI matches
- **Solution**: Check client ID and secret
- **Solution**: Ensure provider is enabled

**Issue**: API token not working
- **Solution**: Verify token is correct
- **Solution**: Check token permissions
- **Solution**: Ensure token hasn't expired

---

## References

- [Strapi Users & Permissions Documentation](https://docs.strapi.io/cms/features/users-permissions)
- [Strapi Authentication Documentation](https://docs.strapi.io/dev-docs/configurations/users-and-permissions-providers)
- [Strapi API Tokens Documentation](https://docs.strapi.io/user-docs/settings/API-tokens)
- [Strapi SSO Documentation](https://docs.strapi.io/cms/features/sso)

---

## Notes

### Key Takeaways

- JWT is the default authentication method
- Multiple OAuth providers are supported
- API tokens provide application authentication
- SSO enables enterprise authentication
- Security best practices are essential

### Important Reminders

- Always use HTTPS in production
- Store tokens securely
- Implement rate limiting
- Validate all inputs
- Keep dependencies updated
- Monitor authentication attempts

