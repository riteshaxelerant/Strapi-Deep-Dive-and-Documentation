# Strapi Configuration Reference

## Overview

This document provides a comprehensive reference for all Strapi configuration files, environment variables, and settings. Use this as a quick reference when setting up or troubleshooting Strapi projects.

## Configuration Files Structure

```
my-strapi-project/
├── .env                    # Environment variables
├── .env.example           # Example environment variables
├── config/
│   ├── database.js        # Database configuration
│   ├── server.js          # Server configuration (includes CRON jobs)
│   ├── admin.js           # Admin panel configuration
│   ├── middlewares.js     # Middleware configuration
│   └── plugins.js         # Plugin configuration
└── package.json           # Project dependencies and scripts
```

**Note**: For detailed CRON jobs configuration, see [CRON Jobs Documentation](./cron-jobs.md).

---

## Environment Variables (.env)

### Application Security Keys

```env
# Required: Generate unique random strings for each
APP_KEYS=your-app-key-1,your-app-key-2,your-app-key-3,your-app-key-4
API_TOKEN_SALT=your-api-token-salt-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here
JWT_SECRET=your-jwt-secret-here
TRANSFER_TOKEN_SALT=your-transfer-token-salt-here
```

**How to Generate:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Security Notes:**
- Never commit these to version control
- Use different values for development and production
- Rotate keys periodically in production

---

### Server Configuration

```env
# Server host and port
HOST=0.0.0.0              # Listen on all interfaces
PORT=1337                  # Default Strapi port

# Environment
NODE_ENV=development       # development, staging, production

# URLs
PUBLIC_URL=http://localhost:1337
ADMIN_URL=http://localhost:1337/admin
```

**Production Settings:**
```env
NODE_ENV=production
PUBLIC_URL=https://api.yourdomain.com
ADMIN_URL=https://api.yourdomain.com/admin
```

---

### Database Configuration

#### SQLite (Quickstart)

```env
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

#### PostgreSQL

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your_password
DATABASE_SSL=false
DATABASE_SCHEMA=public
```

#### MySQL

```env
DATABASE_CLIENT=mysql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your_password
DATABASE_SSL=false
```

---

## Configuration Files

### config/database.js

```javascript
module.exports = ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'sqlite'),
    connection: {
      filename: env('DATABASE_FILENAME', '.tmp/data.db'),
      // For PostgreSQL/MySQL
      // host: env('DATABASE_HOST', '127.0.0.1'),
      // port: env.int('DATABASE_PORT', 5432),
      // database: env('DATABASE_NAME', 'strapi'),
      // user: env('DATABASE_USERNAME', 'strapi'),
      // password: env('DATABASE_PASSWORD', 'strapi'),
      // ssl: env.bool('DATABASE_SSL', false),
    },
    useNullAsDefault: true,
  },
});
```

**Common Customizations:**

```javascript
// Connection pool settings
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      // ... connection details
      pool: {
        min: 2,
        max: 10,
      },
    },
  },
});
```

---

### config/server.js

```javascript
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  cron: {
    enabled: env.bool('CRON_ENABLED', true),
    tasks: {
      // CRON job definitions
    },
  },
});
```

**Note**: For detailed CRON jobs configuration and examples, see [CRON Jobs Documentation](./cron-jobs.md).

**Common Customizations:**

```javascript
// CORS configuration
module.exports = ({ env }) => ({
  // ... other config
  cors: {
    enabled: true,
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
  },
});

// Proxy settings (for production behind reverse proxy)
module.exports = ({ env }) => ({
  // ... other config
  proxy: true,
  url: env('PUBLIC_URL', 'http://localhost:1337'),
});
```

---

### config/admin.js

```javascript
module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  url: env('ADMIN_URL', '/admin'),
  serveAdminPanel: env.bool('SERVE_ADMIN', true),
});
```

**Common Customizations:**

```javascript
// Disable admin panel in production (API-only)
module.exports = ({ env }) => ({
  // ... other config
  serveAdminPanel: env.bool('SERVE_ADMIN', env('NODE_ENV') === 'development'),
});

// Custom admin URL
module.exports = ({ env }) => ({
  // ... other config
  url: '/custom-admin-path',
});
```

---

### config/middlewares.js

```javascript
module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

**Common Customizations:**

```javascript
// Custom CORS configuration
module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['http://localhost:3000', 'https://yourdomain.com'],
    },
  },
  // ... other middlewares
];
```

---

### config/plugins.js

```javascript
module.exports = ({ env }) => ({
  // Example: GraphQL plugin configuration
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 7,
      amountLimit: 100,
    },
  },
  
  // Example: Upload plugin configuration
  upload: {
    config: {
      provider: 'local',
      providerOptions: {},
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
```

**Common Plugin Configurations:**

```javascript
// Cloudinary upload provider
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});

// AWS S3 upload provider
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET'),
        },
      },
    },
  },
});
```

---

## package.json Scripts

Strapi projects include these default scripts:

```json
{
  "scripts": {
    "develop": "strapi develop",
    "start": "strapi start",
    "build": "strapi build",
    "strapi": "strapi"
  }
}
```

**Script Descriptions:**

- `develop`: Start development server with auto-reload
- `start`: Start production server
- `build`: Build admin panel for production
- `strapi`: Access Strapi CLI directly

**Custom Scripts Example:**

```json
{
  "scripts": {
    "develop": "strapi develop",
    "start": "strapi start",
    "build": "strapi build",
    "strapi": "strapi",
    "seed": "node scripts/seed.js",
    "migrate": "node scripts/migrate.js"
  }
}
```

---

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

### Staging

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://staging-api.yourdomain.com
DATABASE_CLIENT=postgres
DATABASE_HOST=staging-db.yourdomain.com
DATABASE_NAME=strapi_staging
```

### Production

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://api.yourdomain.com
ADMIN_URL=https://api.yourdomain.com/admin
DATABASE_CLIENT=postgres
DATABASE_HOST=production-db.yourdomain.com
DATABASE_NAME=strapi_production
DATABASE_SSL=true
```

---

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env` to version control
- ✅ Use `.env.example` as a template
- ✅ Rotate secrets regularly
- ✅ Use different keys for each environment

### 2. Database

- ✅ Use strong passwords
- ✅ Enable SSL in production
- ✅ Use connection pooling
- ✅ Regular backups

### 3. Server

- ✅ Use HTTPS in production
- ✅ Configure CORS properly
- ✅ Set up rate limiting
- ✅ Use reverse proxy (nginx, Apache)

---

## Quick Reference Table

| Configuration | File | Environment Variable |
|--------------|------|---------------------|
| Database | `config/database.js` | `DATABASE_*` |
| Server | `config/server.js` | `HOST`, `PORT` |
| Admin Panel | `config/admin.js` | `ADMIN_URL`, `ADMIN_JWT_SECRET` |
| Middlewares | `config/middlewares.js` | N/A |
| Plugins | `config/plugins.js` | Plugin-specific |

---

## Troubleshooting

### Configuration Not Loading

**Problem**: Changes in config files not taking effect

**Solution**:
1. Restart Strapi server
2. Clear `.tmp` folder
3. Check for syntax errors in config files

### Environment Variables Not Working

**Problem**: Environment variables not being read

**Solution**:
1. Verify `.env` file exists in project root
2. Check variable names match exactly
3. Restart server after changes
4. Use `env('VARIABLE_NAME', 'default')` syntax

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**:
1. Verify database is running
2. Check credentials in `.env`
3. Test connection outside Strapi
4. Check firewall rules

---

## References

- [Strapi Configuration Documentation](https://docs.strapi.io/dev-docs/configurations)
- [Environment Variables Guide](https://docs.strapi.io/dev-docs/configurations/environment)
- [Database Configuration](https://docs.strapi.io/dev-docs/configurations/database)

---

## Notes

### Configuration Philosophy

- **Environment-based**: Use environment variables for different environments
- **Security-first**: Never hardcode secrets
- **Flexible**: Keep configuration modular and extensible

### Common Patterns

1. Use `.env` for secrets and environment-specific values
2. Use config files for structure and defaults
3. Keep production configs separate from development
4. Document all custom configurations

