# Security Best Practices

## Overview

This guide covers security best practices for Strapi 5 applications, including environment security, API security, data protection, and production security measures.

---

## Environment Security

### Environment Variables

#### Secure Configuration

```javascript
// config/server.js
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'), // Multiple keys for rotation
  },
});
```

#### Required Environment Variables

```env
# Application Security
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt

# Database (use strong passwords)
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=strong-password-here

# Server
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
```

#### Security Guidelines

1. **Never Commit Secrets**: Use `.env` files and never commit them
2. **Use Different Keys**: Use different keys for each environment
3. **Rotate Keys**: Rotate keys periodically
4. **Strong Passwords**: Use strong, unique passwords
5. **Secret Management**: Use secret management services in production

### .env File Security

```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

---

## API Security

### Rate Limiting

#### Implementation

```javascript
// src/middlewares/rate-limit.js
'use strict';

const rateLimit = require('express-rate-limit');

module.exports = (config, { strapi }) => {
  const limiter = rateLimit({
    windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
    max: config.max || 100, // 100 requests per window
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  return async (ctx, next) => {
    await limiter(ctx.request, ctx.response, next);
  };
};
```

#### Configuration

```javascript
// config/middlewares.js
module.exports = [
  // ... other middlewares
  {
    name: 'global::rate-limit',
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
    },
  },
];
```

### Input Validation

#### Controller Validation

```javascript
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;

    // Validate required fields
    if (!data.title || data.title.length < 3) {
      return ctx.badRequest('Title must be at least 3 characters');
    }

    // Validate email format
    if (data.email && !isValidEmail(data.email)) {
      return ctx.badRequest('Invalid email format');
    }

    // Sanitize input
    data.title = sanitize(data.title);

    return super.create(ctx);
  }
}));
```

#### Schema Validation

```json
{
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "minLength": 3,
      "maxLength": 200
    },
    "email": {
      "type": "email",
      "required": true,
      "unique": true
    }
  }
}
```

### SQL Injection Prevention

Strapi uses parameterized queries by default, preventing SQL injection. However, be cautious with:

```javascript
// ❌ DON'T: Raw queries with user input
const query = `SELECT * FROM articles WHERE title = '${userInput}'`;

// ✅ DO: Use Entity Service API
const entries = await strapi.entityService.findMany('api::article.article', {
  filters: {
    title: userInput // Strapi handles parameterization
  }
});
```

### XSS Prevention

#### Input Sanitization

```javascript
const sanitize = (input) => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
```

#### Content Security Policy

```javascript
// config/middlewares.js
module.exports = [
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'connect-src': ["'self'", 'https:'],
          'font-src': ["'self'", 'data:'],
          'object-src': ["'none'"],
          'media-src': ["'self'"],
          'frame-src': ["'none'"],
        },
      },
    },
  },
];
```

---

## CORS Configuration

### Production CORS

```javascript
// config/middlewares.js
module.exports = [
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'https://admin.yourdomain.com'
      ],
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'X-Requested-With'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    },
  },
];
```

### Development CORS

```javascript
// config/middlewares.js (development only)
module.exports = [
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: '*', // Only for development
      headers: '*',
    },
  },
];
```

---

## Security Headers

### Recommended Headers

```javascript
// config/middlewares.js
module.exports = [
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      xXSSProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
  },
];
```

### Using Reverse Proxy (Nginx)

```nginx
# nginx.conf
server {
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'" always;
}
```

---

## Database Security

### Connection Security

```javascript
// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'strapi'),
      ssl: env.bool('DATABASE_SSL', true), // Enable SSL in production
      schema: env('DATABASE_SCHEMA', 'public'),
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
});
```

### Database Best Practices

1. **Use SSL**: Enable SSL for database connections
2. **Strong Passwords**: Use strong database passwords
3. **Limited Access**: Restrict database access to application server
4. **Regular Backups**: Implement regular backup strategy
5. **Updates**: Keep database software updated

---

## Authentication Security

### JWT Security

```javascript
// config/plugins.js
module.exports = {
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'), // Strong, random secret
      jwt: {
        expiresIn: '7d', // Reasonable expiration
      },
    },
  },
};
```

### Password Security

1. **Hashing**: Passwords are automatically hashed (bcrypt)
2. **Strength Requirements**: Enforce strong password requirements
3. **Password Reset**: Implement secure password reset
4. **Password History**: Prevent password reuse

### API Token Security

1. **Limited Scope**: Use custom tokens with minimal permissions
2. **Rotation**: Rotate tokens regularly
3. **Storage**: Store tokens securely
4. **Monitoring**: Monitor token usage
5. **Revocation**: Revoke compromised tokens immediately

---

## File Upload Security

### File Validation

```javascript
// config/plugins.js
module.exports = {
  upload: {
    config: {
      sizeLimit: 100 * 1024 * 1024, // 100MB
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
      // File type restrictions
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
      ],
    },
  },
};
```

### Upload Best Practices

1. **File Size Limits**: Set appropriate file size limits
2. **Type Validation**: Validate file types
3. **Virus Scanning**: Implement virus scanning for uploads
4. **Storage Location**: Store uploads outside web root when possible
5. **CDN**: Use CDN for file delivery

---

## Production Security Checklist

### Pre-Deployment

- [ ] All environment variables set and secure
- [ ] Strong passwords for all services
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] File upload restrictions set
- [ ] Database SSL enabled
- [ ] API tokens with minimal permissions
- [ ] Error messages don't expose sensitive info
- [ ] Logging configured (without sensitive data)
- [ ] Backup strategy in place
- [ ] Monitoring and alerting set up

### Ongoing Security

- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Review access logs
- [ ] Rotate secrets periodically
- [ ] Audit permissions regularly
- [ ] Review and update dependencies
- [ ] Test security measures
- [ ] Keep documentation updated

---

## Security Monitoring

### Logging

```javascript
// Log security events
strapi.log.info('Security Event', {
  type: 'authentication_failure',
  ip: ctx.request.ip,
  user: ctx.state.user?.id,
  timestamp: new Date()
});
```

### Monitoring

1. **Failed Login Attempts**: Monitor and alert on multiple failures
2. **Unusual API Activity**: Monitor for unusual patterns
3. **Permission Changes**: Log all permission modifications
4. **Token Usage**: Monitor API token usage
5. **Error Rates**: Track error rates for anomalies

---

## Incident Response

### Security Incident Plan

1. **Identify**: Detect security incident
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat
4. **Recover**: Restore normal operations
5. **Learn**: Document and improve

### Immediate Actions

1. **Revoke Access**: Revoke compromised tokens/credentials
2. **Change Secrets**: Rotate all secrets
3. **Review Logs**: Analyze security logs
4. **Notify**: Notify relevant stakeholders
5. **Document**: Document incident and response

---

## Compliance Considerations

### GDPR

1. **Data Minimization**: Collect only necessary data
2. **Right to Access**: Provide data access
3. **Right to Deletion**: Implement data deletion
4. **Consent Management**: Manage user consent
5. **Data Portability**: Enable data export

### Data Protection

1. **Encryption**: Encrypt sensitive data
2. **Access Control**: Implement proper access control
3. **Audit Trails**: Maintain audit logs
4. **Data Retention**: Define data retention policies
5. **Backup Security**: Secure backup storage

---

## References

- [Strapi Security Documentation](https://docs.strapi.io/dev-docs/configurations/security)
- [Strapi Deployment Security](https://docs.strapi.io/dev-docs/deployment)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Notes

### Key Takeaways

- Always use HTTPS in production
- Implement rate limiting
- Validate and sanitize all inputs
- Use strong, unique secrets
- Monitor security events
- Keep dependencies updated
- Follow principle of least privilege

### Important Reminders

- Never commit secrets to version control
- Use environment variables for configuration
- Implement proper CORS configuration
- Set security headers
- Regular security audits
- Keep Strapi and dependencies updated
- Document security procedures

