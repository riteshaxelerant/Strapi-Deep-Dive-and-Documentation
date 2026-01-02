# API Customization Guide

## Overview

This guide covers customizing Strapi's REST and GraphQL APIs, including endpoint customization, response transformations, custom routes, middleware, policies, and error handling patterns.

---

## REST API Customization

### Default REST Endpoints

Strapi automatically generates REST endpoints for each Content Type:

```
GET    /api/articles          # List all articles
GET    /api/articles/:id      # Get single article
POST   /api/articles          # Create article
PUT    /api/articles/:id      # Update article
DELETE /api/articles/:id      # Delete article
```

### Customizing Default Endpoints

#### Override Controller Methods

```javascript
// src/api/article/controllers/article.js
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // Custom find logic
    const { data, meta } = await super.find(ctx);
    
    // Transform response
    const transformedData = data.map(item => ({
      ...item,
      customField: 'custom value'
    }));

    return { data: transformedData, meta };
  },

  async findOne(ctx) {
    // Custom findOne logic
    const response = await super.findOne(ctx);
    
    // Add custom data
    if (response.data) {
      response.data.attributes.customData = await strapi
        .service('api::article.article')
        .getCustomData(response.data.id);
    }

    return response;
  }
}));
```

### Custom API Routes

#### Adding Custom Routes

```javascript
// src/api/article/routes/custom.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/featured',
      handler: 'article.featured',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/search',
      handler: 'article.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/articles/:id/publish',
      handler: 'article.publish',
      config: {
        policies: ['is-authenticated'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/author/:authorId',
      handler: 'article.byAuthor',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
```

#### Custom Route Handlers

```javascript
// src/api/article/controllers/article.js
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  // Custom action: Featured articles
  async featured(ctx) {
    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: {
        featured: true,
        publishedAt: { $notNull: true }
      },
      sort: { publishedAt: 'desc' },
      limit: 10,
      populate: ['author', 'categories']
    });

    return { data: entries };
  },

  // Custom action: Search
  async search(ctx) {
    const { query } = ctx.query;

    if (!query) {
      return ctx.badRequest('Search query is required');
    }

    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: {
        $or: [
          { title: { $contains: query } },
          { content: { $contains: query } }
        ]
      },
      populate: ['author']
    });

    return { data: entries };
  },

  // Custom action: Publish
  async publish(ctx) {
    const { id } = ctx.params;

    const entry = await strapi.entityService.update('api::article.article', id, {
      data: {
        publishedAt: new Date()
      }
    });

    return { data: entry };
  },

  // Custom action: By author
  async byAuthor(ctx) {
    const { authorId } = ctx.params;

    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: {
        author: authorId
      },
      populate: ['author', 'categories']
    });

    return { data: entries };
  }
}));
```

### API Response Transformations

#### Transform Response Data

```javascript
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);

    // Transform each item
    const transformedData = data.map(item => ({
      id: item.id,
      title: item.attributes.title,
      slug: item.attributes.slug,
      excerpt: item.attributes.content.substring(0, 150),
      author: {
        name: item.attributes.author?.data?.attributes?.name,
        email: item.attributes.author?.data?.attributes?.email
      },
      publishedAt: item.attributes.publishedAt,
      // Remove sensitive fields
      // Add computed fields
    }));

    return { data: transformedData, meta };
  }
}));
```

#### Custom Response Format

```javascript
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);

    // Custom response format
    return {
      success: true,
      articles: data,
      pagination: {
        page: meta.pagination.page,
        pageSize: meta.pagination.pageSize,
        total: meta.pagination.total,
        pageCount: meta.pagination.pageCount
      },
      timestamp: new Date().toISOString()
    };
  }
}));
```

### Query Parameter Customization

#### Custom Filtering

```javascript
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;

    // Custom filter logic
    const filters = {
      ...query.filters,
      // Add custom filters
      publishedAt: { $notNull: true }
    };

    // Custom sort
    const sort = query.sort || { publishedAt: 'desc' };

    const entries = await strapi.entityService.findMany('api::article.article', {
      filters,
      sort,
      populate: query.populate || ['author'],
      pagination: {
        page: query.pagination?.page || 1,
        pageSize: query.pagination?.pageSize || 10
      }
    });

    return { data: entries };
  }
}));
```

---

## GraphQL API Customization

### Enabling GraphQL

Install the GraphQL plugin:

```bash
yarn strapi install graphql
# or
npm run strapi install graphql
```

### Custom GraphQL Resolvers

#### Extend Default Resolvers

```javascript
// config/plugins.js
module.exports = {
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
      },
    },
  },
};
```

#### Custom Resolvers

```javascript
// src/api/article/config/schema.graphql.js
module.exports = {
  resolver: {
    Query: {
      featuredArticles: {
        resolver: async (obj, options, { context }) => {
          const entries = await strapi.entityService.findMany('api::article.article', {
            filters: {
              featured: true,
              publishedAt: { $notNull: true }
            },
            sort: { publishedAt: 'desc' },
            limit: 10
          });

          return entries;
        }
      },
      searchArticles: {
        resolver: async (obj, options, { context }) => {
          const { query } = options;

          const entries = await strapi.entityService.findMany('api::article.article', {
            filters: {
              $or: [
                { title: { $contains: query } },
                { content: { $contains: query } }
              ]
            }
          });

          return entries;
        }
      }
    },
    Mutation: {
      publishArticle: {
        resolver: async (obj, options, { context }) => {
          const { id } = options;

          const entry = await strapi.entityService.update('api::article.article', id, {
            data: {
              publishedAt: new Date()
            }
          });

          return entry;
        }
      }
    }
  }
};
```

#### Custom GraphQL Schema

```graphql
# src/api/article/config/schema.graphql
type Query {
  featuredArticles: [Article]
  searchArticles(query: String!): [Article]
}

type Mutation {
  publishArticle(id: ID!): Article
}
```

### GraphQL Response Transformations

```javascript
module.exports = {
  resolver: {
    Query: {
      articles: {
        resolver: async (obj, options, { context }) => {
          const entries = await strapi.entityService.findMany('api::article.article', options);

          // Transform response
          return entries.map(entry => ({
            ...entry,
            readingTime: calculateReadingTime(entry.content),
            excerpt: entry.content.substring(0, 150)
          }));
        }
      }
    }
  }
};
```

---

## API Middleware

### Creating Custom Middleware

```javascript
// src/middlewares/custom-logger.js
'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const start = Date.now();

    // Log request
    strapi.log.info(`[${ctx.method}] ${ctx.url}`);

    await next();

    // Log response
    const duration = Date.now() - start;
    strapi.log.info(`[${ctx.method}] ${ctx.url} - ${ctx.status} - ${duration}ms`);
  };
};
```

### Registering Middleware

```javascript
// config/middlewares.js
module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  {
    name: 'strapi::body',
    config: {
      formLimit: '256mb',
      jsonLimit: '256mb',
      textLimit: '256mb',
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::custom-logger', // Custom middleware
];
```

### Route-Specific Middleware

```javascript
// src/api/article/routes/article.js
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/articles',
      handler: 'article.create',
      config: {
        middlewares: ['global::custom-logger', 'global::rate-limit'],
      },
    },
  ],
};
```

---

## API Policies

### Creating Policies

```javascript
// src/policies/is-owner.js
'use strict';

module.exports = async (policyContext, config, { strapi }) => {
  const { id } = policyContext.params;
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  // Check if user owns the resource
  const entry = await strapi.entityService.findOne('api::article.article', id, {
    populate: ['author']
  });

  if (!entry) {
    return false;
  }

  return entry.author.id === user.id;
};
```

### Using Policies

```javascript
// src/api/article/routes/article.js
module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/articles/:id',
      handler: 'article.update',
      config: {
        policies: ['is-owner'], // Apply policy
      },
    },
    {
      method: 'DELETE',
      path: '/articles/:id',
      handler: 'article.delete',
      config: {
        policies: ['is-owner', 'is-admin'], // Multiple policies
      },
    },
  ],
};
```

### Policy with Configuration

```javascript
// src/policies/has-role.js
module.exports = async (policyContext, config, { strapi }) => {
  const { role } = config; // Get role from config
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  return user.role.name === role;
};
```

```javascript
// Usage with config
{
  method: 'POST',
  path: '/articles',
  handler: 'article.create',
  config: {
    policies: [
      {
        name: 'has-role',
        config: { role: 'Editor' }
      }
    ],
  },
}
```

---

## Error Handling

### Custom Error Responses

```javascript
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    try {
      const { data, meta } = await super.find(ctx);
      return { data, meta };
    } catch (error) {
      strapi.log.error('Error in find:', error);
      
      return ctx.badRequest('Failed to fetch articles', {
        error: error.message,
        code: 'FETCH_ERROR'
      });
    }
  },

  async create(ctx) {
    try {
      // Validation
      const { data } = ctx.request.body;
      
      if (!data.title) {
        return ctx.badRequest('Title is required');
      }

      const response = await super.create(ctx);
      return response;
    } catch (error) {
      if (error.name === 'ValidationError') {
        return ctx.badRequest('Validation failed', {
          errors: error.errors
        });
      }

      return ctx.internalServerError('Failed to create article', {
        error: error.message
      });
    }
  }
}));
```

### Global Error Handler

```javascript
// src/middlewares/error-handler.js
'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      strapi.log.error('API Error:', error);

      // Custom error response
      ctx.status = error.status || 500;
      ctx.body = {
        error: {
          message: error.message || 'Internal server error',
          status: ctx.status,
          code: error.code || 'INTERNAL_ERROR',
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
      };
    }
  };
};
```

### Error Response Format

```javascript
// Standardized error response
{
  error: {
    message: "Error message",
    status: 400,
    code: "ERROR_CODE",
    details: {
      // Additional error details
    }
  }
}
```

---

## API Versioning

### Route Versioning

```javascript
// src/api/v1/article/routes/article.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/v1/articles',
      handler: 'article.find',
    },
  ],
};

// src/api/v2/article/routes/article.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/v2/articles',
      handler: 'article.find',
    },
  ],
};
```

### Version Middleware

```javascript
// src/middlewares/api-version.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const version = ctx.request.headers['api-version'] || 'v1';
    ctx.state.apiVersion = version;
    await next();
  };
};
```

---

## Rate Limiting

### Rate Limit Middleware

```javascript
// src/middlewares/rate-limit.js
'use strict';

const rateLimit = require('express-rate-limit');

module.exports = (config, { strapi }) => {
  const limiter = rateLimit({
    windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
    max: config.max || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });

  return async (ctx, next) => {
    await limiter(ctx.request, ctx.response, next);
  };
};
```

### Using Rate Limiting

```javascript
// config/middlewares.js
module.exports = [
  // ... other middlewares
  {
    name: 'global::rate-limit',
    config: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
  },
];
```

---

## API Documentation

### OpenAPI/Swagger Integration

Install the documentation plugin:

```bash
yarn strapi install documentation
```

### Custom API Documentation

```javascript
// config/plugins.js
module.exports = {
  documentation: {
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'My API Documentation',
        description: 'API documentation for my Strapi application',
      },
      servers: [
        {
          url: 'http://localhost:1337',
          description: 'Development server',
        },
      ],
    },
  },
};
```

---

## Best Practices

### API Design

1. **RESTful Conventions**: Follow REST principles
2. **Consistent Responses**: Use consistent response formats
3. **Error Handling**: Implement proper error handling
4. **Validation**: Validate all inputs
5. **Documentation**: Document all endpoints

### Performance

1. **Pagination**: Always paginate large datasets
2. **Filtering**: Provide filtering options
3. **Caching**: Implement caching where appropriate
4. **Optimization**: Optimize database queries

### Security

1. **Authentication**: Require authentication for protected routes
2. **Authorization**: Use policies for authorization
3. **Input Validation**: Validate and sanitize inputs
4. **Rate Limiting**: Implement rate limiting

---

## Complete Example

### Custom Article API

```javascript
// src/api/article/controllers/article.js
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    
    // Transform response
    const transformed = data.map(item => ({
      id: item.id,
      ...item.attributes,
      excerpt: item.attributes.content.substring(0, 150)
    }));

    return { data: transformed, meta };
  },

  async featured(ctx) {
    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: { featured: true },
      sort: { publishedAt: 'desc' },
      limit: 10
    });

    return { data: entries };
  }
}));
```

```javascript
// src/api/article/routes/article.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/featured',
      handler: 'article.featured',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
```

---

## References

- [Strapi REST API Documentation](https://docs.strapi.io/dev-docs/api/rest)
- [Strapi GraphQL API Documentation](https://docs.strapi.io/dev-docs/api/graphql)
- [Strapi Backend Customization](https://docs.strapi.io/dev-docs/backend-customization)
- [Strapi Middlewares](https://docs.strapi.io/dev-docs/configurations/middlewares)
- [Strapi Policies](https://docs.strapi.io/dev-docs/backend-customization/policies)

---

## Notes

### Key Takeaways

- Customize REST endpoints by overriding controllers
- Add custom routes for additional endpoints
- Transform API responses as needed
- Use middleware for cross-cutting concerns
- Implement policies for authorization
- Handle errors consistently

### Important Reminders

- Follow REST conventions
- Always validate inputs
- Implement proper error handling
- Use policies for authorization
- Document your API endpoints
- Consider API versioning for breaking changes

