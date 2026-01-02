# Best Practices and Patterns Guide

## Overview

This guide covers best practices, code organization patterns, project structure recommendations, naming conventions, error handling patterns, and logging strategies for Strapi 5 applications.

**Reference:** [Strapi Best Practices](https://docs.strapi.io/dev-docs/backend-customization)

---

## Code Organization Patterns

### Project Structure

```
my-strapi-project/
├── config/                 # Configuration files
│   ├── database.js
│   ├── server.js
│   ├── admin.js
│   └── plugins.js
├── src/
│   ├── api/               # API routes, controllers, services
│   │   └── article/
│   │       ├── content-types/
│   │       │   └── article/
│   │       │       ├── schema.json
│   │       │       └── lifecycles.js
│   │       ├── controllers/
│   │       │   └── article.js
│   │       ├── services/
│   │       │   └── article.js
│   │       └── routes/
│   │           └── article.js
│   ├── components/        # Reusable components
│   │   └── seo/
│   │       ├── schema.json
│   │       └── lifecycles.js
│   ├── extensions/        # Plugin extensions
│   │   └── users-permissions/
│   │       └── strapi-server.js
│   ├── middlewares/       # Custom middlewares
│   │   └── custom.js
│   ├── policies/         # Custom policies
│   │   └── is-owner.js
│   └── admin/            # Admin panel customizations
│       ├── app.js
│       └── webpack.config.js
├── database/             # Database migrations
│   └── migrations/
├── public/              # Public assets
│   └── uploads/
├── .env                 # Environment variables
└── package.json
```

### API Organization

#### Single Responsibility Principle

Each API should have a single, well-defined responsibility:

```javascript
// ✅ Good: Clear responsibility
// src/api/article/controllers/article.js
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // Article-specific logic only
  },
}));

// ❌ Bad: Mixed responsibilities
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // Article logic
    // User logic (should be in user controller)
    // Comment logic (should be in comment controller)
  },
}));
```

#### Service Layer Pattern

Extract business logic into services:

```javascript
// src/api/article/services/article.js
module.exports = ({ strapi }) => ({
  async findPublished() {
    return await strapi.entityService.findMany('api::article.article', {
      filters: {
        publishedAt: { $notNull: true },
      },
    });
  },
  
  async findByAuthor(authorId) {
    return await strapi.entityService.findMany('api::article.article', {
      filters: {
        author: authorId,
      },
    });
  },
});
```

#### Controller Layer Pattern

Keep controllers thin, delegate to services:

```javascript
// src/api/article/controllers/article.js
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    
    // Transform response if needed
    return { data, meta };
  },
  
  async findPublished(ctx) {
    const articles = await strapi.service('api::article.article').findPublished();
    ctx.body = { data: articles };
  },
}));
```

---

## Project Structure Best Practices

### Directory Organization

1. **Group by Feature**: Organize by feature/domain
   ```
   src/api/
   ├── article/
   ├── author/
   └── category/
   ```

2. **Separate Concerns**: Keep controllers, services, routes separate
   ```
   src/api/article/
   ├── controllers/
   ├── services/
   └── routes/
   ```

3. **Shared Code**: Use shared utilities
   ```
   src/utils/
   ├── validation.js
   ├── formatting.js
   └── helpers.js
   ```

### Configuration Organization

```javascript
// config/server.js - Server configuration
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
});

// config/database.js - Database configuration
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    // ...
  },
});

// config/plugins.js - Plugin configuration
module.exports = {
  // Plugin configurations
};
```

---

## Naming Conventions

### Content Types

```javascript
// ✅ Good: PascalCase for display, kebab-case for API ID
{
  "displayName": "Blog Post",
  "singularName": "blog-post",
  "pluralName": "blog-posts"
}

// ❌ Bad: Inconsistent naming
{
  "displayName": "blog_post",
  "singularName": "BlogPost",
  "pluralName": "blogPosts"
}
```

### Fields

```javascript
// ✅ Good: camelCase
{
  "featuredImage": { "type": "media" },
  "publishedAt": { "type": "datetime" },
  "isFeatured": { "type": "boolean" }
}

// ❌ Bad: snake_case or kebab-case
{
  "featured_image": { "type": "media" },
  "published-at": { "type": "datetime" }
}
```

### Files and Directories

```javascript
// ✅ Good: kebab-case for files
article-controller.js
article-service.js
custom-middleware.js

// ✅ Good: camelCase for directories
src/api/article/
src/components/seo/

// ❌ Bad: Mixed cases
ArticleController.js
article_service.js
```

### Variables and Functions

```javascript
// ✅ Good: camelCase
const articleService = strapi.service('api::article.article');
const publishedArticles = await articleService.findPublished();

// ✅ Good: Descriptive names
async function findPublishedArticlesByAuthor(authorId) {
  // ...
}

// ❌ Bad: Abbreviations or unclear names
const artSvc = strapi.service('api::article.article');
const arts = await artSvc.find();
```

---

## Error Handling Patterns

### Consistent Error Responses

```javascript
// src/utils/errors.js
module.exports = {
  createError(status, message, details = {}) {
    const error = new Error(message);
    error.status = status;
    error.details = details;
    return error;
  },
  
  notFound(resource) {
    return this.createError(404, `${resource} not found`);
  },
  
  unauthorized(message = 'Unauthorized') {
    return this.createError(401, message);
  },
  
  forbidden(message = 'Forbidden') {
    return this.createError(403, message);
  },
  
  validationError(message, details) {
    return this.createError(400, message, details);
  },
};
```

### Controller Error Handling

```javascript
// src/api/article/controllers/article.js
const { createError } = require('../../../utils/errors');

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async findOne(ctx) {
    const { id } = ctx.params;
    
    try {
      const article = await strapi.entityService.findOne('api::article.article', id);
      
      if (!article) {
        return ctx.notFound('Article not found');
      }
      
      ctx.body = { data: article };
    } catch (error) {
      strapi.log.error('Error finding article:', error);
      throw createError(500, 'Internal server error');
    }
  },
}));
```

### Service Error Handling

```javascript
// src/api/article/services/article.js
const { createError } = require('../../../utils/errors');

module.exports = ({ strapi }) => ({
  async findById(id) {
    if (!id) {
      throw createError(400, 'Article ID is required');
    }
    
    const article = await strapi.entityService.findOne('api::article.article', id);
    
    if (!article) {
      throw createError(404, 'Article not found');
    }
    
    return article;
  },
});
```

### Global Error Handler

```javascript
// src/middlewares/error-handler.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      strapi.log.error('Error:', error);
      
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      
      ctx.status = status;
      ctx.body = {
        error: {
          status,
          message,
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.details,
          }),
        },
      };
    }
  };
};
```

### Validation Error Handling

```javascript
// src/api/article/controllers/article.js
const { createError } = require('../../../utils/errors');

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;
    
    // Validate required fields
    if (!data.title) {
      throw createError(400, 'Title is required');
    }
    
    if (!data.content) {
      throw createError(400, 'Content is required');
    }
    
    // Validate title length
    if (data.title.length > 200) {
      throw createError(400, 'Title must be less than 200 characters');
    }
    
    return await super.create(ctx);
  },
}));
```

---

## Logging Strategies

### Logging Levels

```javascript
// Use appropriate log levels
strapi.log.debug('Debug information');    // Detailed debugging
strapi.log.info('Informational message');   // General information
strapi.log.warn('Warning message');         // Warnings
strapi.log.error('Error message');         // Errors
```

### Structured Logging

```javascript
// src/utils/logger.js
module.exports = {
  logRequest(ctx) {
    strapi.log.info('Request', {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      duration: ctx.state.duration,
      user: ctx.state.user?.id,
    });
  },
  
  logError(error, context = {}) {
    strapi.log.error('Error occurred', {
      message: error.message,
      stack: error.stack,
      status: error.status,
      ...context,
    });
  },
  
  logDatabaseQuery(query, duration) {
    if (duration > 1000) { // Log slow queries
      strapi.log.warn('Slow query', {
        sql: query.sql,
        bindings: query.bindings,
        duration,
      });
    }
  },
};
```

### Request Logging Middleware

```javascript
// src/middlewares/request-logger.js
const { logRequest } = require('../utils/logger');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();
    
    await next();
    
    ctx.state.duration = Date.now() - start;
    logRequest(ctx);
  };
};
```

### Error Logging

```javascript
// src/middlewares/error-logger.js
const { logError } = require('../utils/logger');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      logError(error, {
        method: ctx.method,
        url: ctx.url,
        user: ctx.state.user?.id,
      });
      
      throw error;
    }
  };
};
```

### Activity Logging

```javascript
// Log important activities
async function logActivity(action, resource, userId) {
  await strapi.entityService.create('api::activity-log.activity-log', {
    data: {
      action,
      resource,
      user: userId,
      timestamp: new Date(),
    },
  });
}

// Usage
await logActivity('create', 'article', ctx.state.user.id);
```

---

## Code Style Guide

### JavaScript Style

```javascript
// ✅ Good: Use const/let appropriately
const articles = await strapi.entityService.findMany('api::article.article');
let filteredArticles = articles.filter(a => a.published);

// ❌ Bad: Use var
var articles = await strapi.entityService.findMany('api::article.article');

// ✅ Good: Use arrow functions for callbacks
articles.map(article => article.title);

// ✅ Good: Use async/await
async function getArticles() {
  const articles = await strapi.entityService.findMany('api::article.article');
  return articles;
}

// ❌ Bad: Use callbacks
function getArticles(callback) {
  strapi.entityService.findMany('api::article.article', callback);
}
```

### Code Formatting

```javascript
// ✅ Good: Consistent indentation (2 spaces)
module.exports = {
  async find(ctx) {
    const articles = await strapi.entityService.findMany('api::article.article');
    ctx.body = { data: articles };
  },
};

// ✅ Good: Consistent spacing
const { data, meta } = await super.find(ctx);

// ✅ Good: Trailing commas
const config = {
  host: '0.0.0.0',
  port: 1337,
};
```

### Comments

```javascript
// ✅ Good: Explain why, not what
// Filter published articles to avoid showing drafts
const publishedArticles = articles.filter(a => a.publishedAt);

// ❌ Bad: Obvious comments
// Get articles
const articles = await strapi.entityService.findMany('api::article.article');
```

---

## Best Practices Summary

### Development

1. **Use TypeScript** (if possible): Better type safety and IDE support
2. **Follow Single Responsibility**: Each function/class should do one thing
3. **Keep Functions Small**: Functions should be focused and testable
4. **Use Services**: Extract business logic to services
5. **Validate Input**: Always validate user input
6. **Handle Errors**: Proper error handling and logging
7. **Write Tests**: Test critical functionality

### Code Quality

1. **Consistent Naming**: Follow naming conventions
2. **DRY Principle**: Don't repeat yourself
3. **KISS Principle**: Keep it simple, stupid
4. **YAGNI Principle**: You aren't gonna need it
5. **Code Reviews**: Review code before merging
6. **Documentation**: Document complex logic

### Performance

1. **Optimize Queries**: Use populate wisely
2. **Implement Caching**: Cache frequently accessed data
3. **Pagination**: Always paginate large datasets
4. **Index Database**: Add indexes for frequently queried fields
5. **Monitor Performance**: Track and optimize slow queries

### Security

1. **Environment Variables**: Store secrets in environment variables
2. **Input Validation**: Validate and sanitize all input
3. **Authentication**: Implement proper authentication
4. **Authorization**: Use policies for authorization
5. **HTTPS**: Always use HTTPS in production
6. **Regular Updates**: Keep dependencies updated

---

## References

- [Strapi Backend Customization](https://docs.strapi.io/dev-docs/backend-customization)
- [Strapi Code Style](https://docs.strapi.io/dev-docs/backend-customization)
- [JavaScript Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)

---

## Notes

### Key Takeaways

- Organize code by feature/domain
- Follow consistent naming conventions
- Extract business logic to services
- Implement proper error handling
- Use structured logging
- Follow code style guidelines

### Important Reminders

- Keep code simple and maintainable
- Write tests for critical functionality
- Document complex logic
- Review code regularly
- Follow security best practices
- Monitor and optimize performance

