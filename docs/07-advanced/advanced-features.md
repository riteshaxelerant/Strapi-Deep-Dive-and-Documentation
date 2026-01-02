# Advanced Features Guide

## Overview

This guide covers advanced Strapi 5 features including internationalization (i18n), multi-tenancy patterns, custom admin panel modifications, database migrations, testing strategies, and debugging techniques.

**Reference:** [Strapi Advanced Features](https://docs.strapi.io/dev-docs/backend-customization)

---

## Internationalization (i18n)

### Overview

Strapi's i18n plugin enables multi-language content management, allowing you to create and manage content in multiple languages.

### Installation

The i18n plugin is included by default in Strapi 5. Enable it in your content types:

1. **Enable i18n for Content Type**
   - Go to Content-Type Builder
   - Edit your content type
   - Enable "Internationalization" option

### Configuration

```javascript
// config/plugins.js
module.exports = {
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales: ['en', 'fr', 'es', 'de'],
    },
  },
};
```

### Using i18n in Content Types

```javascript
// When creating content via API
const article = await strapi.entityService.create('api::article.article', {
  data: {
    title: 'Hello World',
    locale: 'en',
    localizations: [],
  },
});

// Create localized version
const frenchArticle = await strapi.entityService.create('api::article.article', {
  data: {
    title: 'Bonjour le monde',
    locale: 'fr',
    localizations: [article.id],
  },
});
```

### API Queries with Locale

```javascript
// Fetch content in specific locale
const articles = await strapi.entityService.findMany('api::article.article', {
  locale: 'fr',
  populate: ['author'],
});

// Fetch all locales
const articles = await strapi.entityService.findMany('api::article.article', {
  locale: 'all',
});
```

### Frontend Integration

```javascript
// REST API
fetch('http://localhost:1337/api/articles?locale=fr')

// GraphQL
query {
  articles(locale: "fr") {
    data {
      id
      attributes {
        title
      }
    }
  }
}
```

---

## Multi-Tenancy Patterns

### Overview

Multi-tenancy allows a single Strapi instance to serve multiple tenants (organizations, clients) with isolated data.

### Pattern 1: Database-Level Isolation

Each tenant has a separate database:

```javascript
// config/database.js
module.exports = ({ env }) => {
  const tenantId = env('TENANT_ID');
  
  return {
    connection: {
      client: 'postgres',
      connection: {
        database: `strapi_tenant_${tenantId}`,
        // ... other connection details
      },
    },
  };
};
```

### Pattern 2: Schema-Level Isolation

Single database with tenant-based schema:

```javascript
// src/middlewares/tenant.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const tenantId = ctx.request.headers['x-tenant-id'];
    
    if (tenantId) {
      // Set tenant context
      ctx.state.tenant = tenantId;
      
      // Modify queries to filter by tenant
      strapi.db.query('api::article.article').where({ tenant: tenantId });
    }
    
    await next();
  };
};
```

### Pattern 3: Field-Level Isolation

Add tenant field to content types:

```javascript
// Add tenant field to content type
// In Content-Type Builder, add "Text" field named "tenant"

// Filter by tenant in queries
const articles = await strapi.entityService.findMany('api::article.article', {
  filters: {
    tenant: ctx.state.tenant,
  },
});
```

### Multi-Tenancy Service

```javascript
// src/services/tenant.js
module.exports = ({ strapi }) => ({
  async getTenantFromRequest(ctx) {
    // Extract tenant from subdomain, header, or JWT
    const subdomain = ctx.request.hostname.split('.')[0];
    const tenantHeader = ctx.request.headers['x-tenant-id'];
    const tenantJWT = ctx.state.user?.tenant;
    
    return tenantHeader || tenantJWT || subdomain;
  },
  
  async filterByTenant(tenantId, query) {
    return {
      ...query,
      filters: {
        ...query.filters,
        tenant: tenantId,
      },
    };
  },
});
```

---

## Custom Admin Panel Modifications

### Overview

Customize the Strapi admin panel to match your needs and branding.

### Customization Methods

#### 1. Admin Panel Configuration

```javascript
// config/admin.js
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
  serveAdminPanel: env.bool('SERVE_ADMIN_PANEL', true),
  watchIgnoreFiles: [
    '**/config/sync/**',
    '**/config/database/**',
  ],
});
```

#### 2. Custom Admin Panel Components

```javascript
// src/admin/app.js
export default {
  config: {
    locales: ['en', 'fr'],
  },
  bootstrap(app) {
    // Custom admin panel initialization
    console.log('Admin panel initialized');
  },
};
```

#### 3. Custom Admin Panel Pages

```javascript
// src/admin/pages/MyCustomPage/index.jsx
import React from 'react';
import { Layout } from '@strapi/design-system';

const MyCustomPage = () => {
  return (
    <Layout>
      <h1>Custom Admin Page</h1>
    </Layout>
  );
};

export default MyCustomPage;
```

#### 4. Admin Panel Theme Customization

```javascript
// src/admin/app.js
import { lightTheme, darkTheme } from '@strapi/design-system';

export default {
  config: {
    theme: {
      light: {
        ...lightTheme,
        colors: {
          ...lightTheme.colors,
          primary100: '#f6ecfc',
          primary200: '#e0c7f2',
          primary500: '#ac73e6',
          primary600: '#9736e8',
          primary700: '#8312d1',
        },
      },
    },
  },
};
```

---

## Database Migrations

### Overview

Strapi handles schema migrations automatically, but you can create custom migrations for data transformations.

### Automatic Migrations

Strapi automatically creates and runs migrations when:
- Content types are created or modified
- Fields are added, removed, or modified
- Relationships are changed

### Manual Migrations

```javascript
// database/migrations/20240115000000-add-custom-field.js
module.exports = {
  async up(knex) {
    await knex.schema.table('articles', (table) => {
      table.string('custom_field');
    });
  },
  
  async down(knex) {
    await knex.schema.table('articles', (table) => {
      table.dropColumn('custom_field');
    });
  },
};
```

### Data Migrations

```javascript
// database/migrations/20240115000001-migrate-data.js
module.exports = {
  async up(knex) {
    // Migrate data
    await knex('articles').update({
      status: 'published',
    }).where('published', true);
  },
  
  async down(knex) {
    // Rollback data
    await knex('articles').update({
      published: true,
    }).where('status', 'published');
  },
};
```

### Running Migrations

```bash
# Strapi runs migrations automatically on startup
# Or manually trigger
yarn strapi migrations:run
```

---

## Testing Strategies

### Overview

Comprehensive testing strategies for Strapi applications including unit tests, integration tests, and end-to-end tests.

### Testing Setup

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
};
```

### Unit Testing

#### Testing Services

```javascript
// src/api/article/services/article.test.js
const articleService = require('./article');

describe('Article Service', () => {
  test('should create article', async () => {
    const article = await articleService.create({
      title: 'Test Article',
      content: 'Test Content',
    });
    
    expect(article).toHaveProperty('id');
    expect(article.title).toBe('Test Article');
  });
  
  test('should find articles', async () => {
    const articles = await articleService.find();
    expect(Array.isArray(articles)).toBe(true);
  });
});
```

#### Testing Controllers

```javascript
// src/api/article/controllers/article.test.js
const articleController = require('./article');

describe('Article Controller', () => {
  test('should return articles', async () => {
    const ctx = {
      query: {},
      body: null,
    };
    
    await articleController.find(ctx);
    
    expect(ctx.body).toHaveProperty('data');
  });
});
```

### Integration Testing

```javascript
// tests/integration/article.test.js
const request = require('supertest');
const strapi = require('@strapi/strapi');

let app;

beforeAll(async () => {
  app = await strapi().load();
});

afterAll(async () => {
  await app.destroy();
});

describe('Article API', () => {
  test('GET /api/articles', async () => {
    const response = await request(app.server.httpServer)
      .get('/api/articles')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
  
  test('POST /api/articles', async () => {
    const response = await request(app.server.httpServer)
      .post('/api/articles')
      .send({
        data: {
          title: 'Test Article',
          content: 'Test Content',
        },
      })
      .expect(200);
    
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### End-to-End Testing

```javascript
// tests/e2e/admin.test.js
const puppeteer = require('puppeteer');

describe('Admin Panel E2E', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('should login to admin panel', async () => {
    await page.goto('http://localhost:1337/admin');
    await page.type('#email', 'admin@example.com');
    await page.type('#password', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    expect(page.url()).toContain('/admin');
  });
});
```

### Testing Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Mock External Services**: Mock API calls and external services
3. **Use Test Database**: Use separate database for testing
4. **Clean Up**: Clean up test data after tests
5. **Test Edge Cases**: Test error conditions and edge cases

---

## Debugging Techniques

### Overview

Effective debugging strategies for Strapi applications.

### Logging

```javascript
// Use Strapi's logger
strapi.log.info('Info message');
strapi.log.warn('Warning message');
strapi.log.error('Error message');
strapi.log.debug('Debug message');
```

### Debug Mode

```bash
# Enable debug mode
DEBUG=strapi:* yarn develop
```

### Breakpoints

```javascript
// Add breakpoints in code
debugger; // Pause execution here

// Or use console.log
console.log('Debug:', variable);
```

### Database Query Debugging

```javascript
// Enable query logging
strapi.db.connection.on('query', (query) => {
  console.log('Query:', query.sql);
  console.log('Bindings:', query.bindings);
});
```

### Request/Response Debugging

```javascript
// Middleware to log requests
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    console.log('Request:', {
      method: ctx.method,
      url: ctx.url,
      headers: ctx.headers,
      body: ctx.request.body,
    });
    
    await next();
    
    console.log('Response:', {
      status: ctx.status,
      body: ctx.body,
    });
  };
};
```

### Error Handling

```javascript
// Custom error handler
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      strapi.log.error('Error:', error);
      
      ctx.status = error.status || 500;
      ctx.body = {
        error: {
          message: error.message,
          status: error.status || 500,
          // Only include stack in development
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
      };
    }
  };
};
```

### Performance Debugging

```javascript
// Measure execution time
const start = Date.now();
// ... your code ...
const duration = Date.now() - start;
console.log(`Execution time: ${duration}ms`);
```

---

## References

- [Strapi i18n Plugin](https://docs.strapi.io/dev-docs/plugins/i18n)
- [Strapi Testing Guide](https://docs.strapi.io/dev-docs/testing)
- [Strapi Admin Panel Customization](https://docs.strapi.io/dev-docs/admin-panel-customization)
- [Strapi Database Migrations](https://docs.strapi.io/dev-docs/migrations)

---

## Notes

### Key Takeaways

- i18n enables multi-language content management
- Multi-tenancy can be implemented at database, schema, or field level
- Admin panel can be customized for branding and functionality
- Strapi handles migrations automatically
- Comprehensive testing improves code quality
- Effective debugging speeds up development

### Important Reminders

- Test thoroughly before deploying
- Use logging for debugging
- Keep migrations reversible
- Document custom modifications
- Follow testing best practices
- Monitor performance during debugging

