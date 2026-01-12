# Custom Controllers, Services, and Models

## Overview

This guide covers how to customize and extend Strapi's default functionality by creating custom controllers, services, and extending models. Understanding Strapi's MVC-like structure is essential for building custom business logic and API endpoints.

---

## Strapi's MVC-Like Structure

Strapi follows an MVC (Model-View-Controller) pattern:

- **Models**: Define data structure (Content Types)
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain reusable business logic
- **Routes**: Define API endpoints

### File Structure

```
src/api/[content-type]/
├── content-types/
│   └── [content-type]/
│       ├── schema.json
│       └── lifecycles.js
├── controllers/
│   └── [content-type].js
├── routes/
│   └── [content-type].js
└── services/
    └── [content-type].js
```

---

## Custom Controllers

Controllers handle incoming HTTP requests and send responses. They contain the logic for your API endpoints. Controllers bundle actions that handle business logic for each route within Strapi's MVC pattern.

**Reference:** [Strapi Controllers Documentation](https://docs.strapi.io/cms/backend-customization/controllers)

### Default Controller

Strapi automatically generates controllers for each Content Type using the `createCoreController` factory function. The default controller provides CRUD operations:

```javascript
// src/api/article/controllers/article.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article');
```

### Creating Custom Controllers

You can extend or override the default controller to add custom logic. Strapi provides three methods for customizing controllers:

#### Method 1: Wrapping a Core Action (Recommended)

This method leaves the core logic in place and adds custom logic before or after:

```javascript
// src/api/article/controllers/article.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // Some custom logic here
    ctx.query = { ...ctx.query, locale: 'en' };

    // Calling the default core action
    const { data, meta } = await super.find(ctx);

    // Some more custom logic
    meta.date = Date.now();

    return { data, meta };
  },

  async findOne(ctx) {
    // Custom logic before
    const { id } = ctx.params;

    // Call default findOne method
    const response = await super.findOne(ctx);

    // Custom logic after
    if (response.data) {
      // Increment view count
      await strapi.entityService.update('api::article.article', id, {
        data: {
          views: (response.data.attributes.views || 0) + 1
        }
      });
    }

    return response;
  },

  async create(ctx) {
    // Custom validation before create
    const { data } = ctx.request.body;

    if (!data.title) {
      return ctx.badRequest('Title is required');
    }

    // Call default create method
    const response = await super.create(ctx);

    // Custom logic after create
    if (response.data) {
      // Send notification, etc.
      await strapi.service('api::article.article').sendNotification(response.data.id);
    }

    return response;
  }
}));
```

#### Method 2: Replacing a Core Action with Proper Sanitization

**Important:** When replacing a core action, you MUST use sanitization methods to avoid leaking private fields or bypassing access rules. This is critical for security.

```javascript
// src/api/article/controllers/article.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // validateQuery (optional) - throws error on invalid params
    await this.validateQuery(ctx);

    // sanitizeQuery (recommended) - removes invalid query params
    const sanitizedQueryParams = await this.sanitizeQuery(ctx);

    // Use service to fetch data with sanitized params
    const { results, pagination } = await strapi.service('api::article.article').find(sanitizedQueryParams);

    // sanitizeOutput - ensures user doesn't receive unauthorized data
    const sanitizedResults = await this.sanitizeOutput(results, ctx);

    return this.transformResponse(sanitizedResults, { pagination });
  },

  async findOne(ctx) {
    await this.validateQuery(ctx);
    const sanitizedQueryParams = await this.sanitizeQuery(ctx);

    const entity = await strapi.service('api::article.article').findOne(ctx.params.id, sanitizedQueryParams);

    if (!entity) {
      return ctx.notFound('Article not found');
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  async create(ctx) {
    const { data } = ctx.request.body;

    // Validate input
    if (!data.title) {
      return ctx.badRequest('Title is required');
    }

    // Sanitize input data
    const sanitizedInputData = await this.sanitizeInput(data, ctx);

    const entity = await strapi.service('api::article.article').create({
      data: sanitizedInputData,
      ...ctx.query,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  }
}));
```

#### Method 3: Creating an Entirely Custom Action

For actions that don't override core functionality:

```javascript
// src/api/article/controllers/article.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async exampleAction(ctx) {
    try {
      ctx.body = 'ok';
    } catch (err) {
      ctx.body = err;
    }
  }
}));
```

### Sanitization and Validation Methods

When overriding core actions, Strapi provides these methods through `createCoreController`:

| Method | Parameters | Description |
|--------|------------|-------------|
| `validateQuery` | `ctx` | Validates request query (throws error on invalid params) - Optional |
| `sanitizeQuery` | `ctx` | Sanitizes query params (removes invalid params) - **Strongly recommended** |
| `sanitizeInput` | `data, ctx` | Sanitizes input data |
| `sanitizeOutput` | `data, ctx` | Sanitizes output data (prevents leaking private fields) - **Required** |
| `transformResponse` | `data, meta` | Transforms response to standard format |

**Warning:** When querying data from another model (e.g., querying "menus" within a "restaurant" controller), use `strapi.contentAPI` methods instead:

```javascript
// src/api/restaurant/controllers/restaurant.js
module.exports = {
  async findCustom(ctx) {
    const contentType = strapi.contentType('api::menu.menu');

    await strapi.contentAPI.validate.query(ctx.query, contentType, { auth: ctx.state.auth });
    const sanitizedQueryParams = await strapi.contentAPI.sanitize.query(ctx.query, contentType, { auth: ctx.state.auth });

    const documents = await strapi.documents(contentType.uid).findMany(sanitizedQueryParams);

    return await strapi.contentAPI.sanitize.output(documents, contentType, { auth: ctx.state.auth });
  }
};
```

### Custom Controller Actions

Add custom actions beyond CRUD operations:

```javascript
// src/api/article/controllers/article.js
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    return super.find(ctx);
  },

  // Custom action: Get featured articles
  async featured(ctx) {
    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: {
        featured: true,
        publishedAt: { $notNull: true }
      },
      sort: { publishedAt: 'desc' },
      limit: 10
    });

    return { data: entries };
  },

  // Custom action: Search articles
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
      }
    });

    return { data: entries };
  },

  // Custom action: Get articles by author
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

### Controller Context (ctx)

The `ctx` (context) object is central to Strapi's request handling, built on Koa framework. It contains request, state, and response information:

**Reference:** [Strapi Requests and Responses Documentation](https://docs.strapi.io/cms/backend-customization/requests-responses)

```javascript
{
  // Request information
  request: {
    body: {},           // Parsed request body
    query: {},          // Query parameters object
    params: {},         // Route parameters
    headers: {},        // Request headers object
    method: 'GET',      // HTTP method (GET, POST, PUT, DELETE, etc.)
    url: '/api/articles', // Full URL of the request
    path: '/api/articles' // URL path
  },
  
  // Response information
  response: {
    body: {},           // Response body (automatically sent)
    status: 200,        // HTTP status code
    headers: {},        // Response headers
    type: 'application/json' // Content-Type
  },
  
  // Application state
  state: {
    user: {},           // Authenticated user (if authenticated)
    auth: {},           // Authentication information (strategy, credentials)
    route: {}           // Current route information (method, path, handler)
  },
  
  // Helper methods
  badRequest(message, details),
  notFound(message),
  unauthorized(message),
  forbidden(message),
  throw(status, message)
}
```

### Accessing Request Context Anywhere

You can access the current request context from anywhere in your code (e.g., in lifecycle functions or services) using `strapi.requestContext.get()`:

```javascript
// In a service or lifecycle function
const ctx = strapi.requestContext.get();
console.log(ctx.state.user);
console.log(ctx.request.method);
```

---

## Custom Services

Services contain reusable business logic that can be shared across controllers and other parts of your application.

### Default Service

Strapi automatically generates services for each Content Type:

```javascript
// src/api/article/services/article.js
'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::article.article');
```

### Creating Custom Services

#### Method 1: Extend Default Service

```javascript
// src/api/article/services/article.js
'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::article.article', ({ strapi }) => ({
  async findPublished() {
    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: {
        publishedAt: { $notNull: true }
      },
      sort: { publishedAt: 'desc' }
    });

    return entries;
  },

  async findByCategory(categoryId) {
    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: {
        categories: {
          id: categoryId
        }
      },
      populate: ['author', 'categories']
    });

    return entries;
  },

  async incrementViews(articleId) {
    const article = await strapi.entityService.findOne('api::article.article', articleId);
    
    if (article) {
      await strapi.entityService.update('api::article.article', articleId, {
        data: {
          views: (article.views || 0) + 1
        }
      });
    }
  },

  async sendNotification(articleId) {
    const article = await strapi.entityService.findOne('api::article.article', articleId, {
      populate: ['author']
    });

    if (article && article.author) {
      // Send email notification
      await strapi.plugins['email'].services.email.send({
        to: article.author.email,
        subject: 'Article Published',
        text: `Your article "${article.title}" has been published.`
      });
    }
  },

  async generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}));
```

#### Method 2: Standalone Service

```javascript
// src/api/article/services/article.js
'use strict';

module.exports = {
  async findPublished() {
    return await strapi.entityService.findMany('api::article.article', {
      filters: {
        publishedAt: { $notNull: true }
      }
    });
  },

  async calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  },

  async validateArticle(data) {
    const errors = [];

    if (!data.title || data.title.length < 10) {
      errors.push('Title must be at least 10 characters');
    }

    if (!data.content || data.content.length < 100) {
      errors.push('Content must be at least 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
```

### Using Services in Controllers

```javascript
// src/api/article/controllers/article.js
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // Use service method
    const publishedArticles = await strapi.service('api::article.article').findPublished();
    return { data: publishedArticles };
  },

  async create(ctx) {
    const { data } = ctx.request.body;

    // Use service for validation
    const validation = await strapi.service('api::article.article').validateArticle(data);
    
    if (!validation.isValid) {
      return ctx.badRequest('Validation failed', { errors: validation.errors });
    }

    // Generate slug using service
    data.slug = await strapi.service('api::article.article').generateSlug(data.title);

    // Create entry
    const response = await super.create(ctx);

    // Send notification using service
    await strapi.service('api::article.article').sendNotification(response.data.id);

    return response;
  }
}));
```

---

## Extending Models

Models in Strapi are defined by Content Type schemas. You can extend model functionality using lifecycle hooks.

### Lifecycle Hooks

Lifecycle hooks allow you to execute custom logic at specific points in the content lifecycle.

#### Available Hooks

- `beforeCreate`: Before creating an entry
- `afterCreate`: After creating an entry
- `beforeUpdate`: Before updating an entry
- `afterUpdate`: After updating an entry
- `beforeDelete`: Before deleting an entry
- `afterDelete`: After deleting an entry

#### Lifecycle Hook Example

```javascript
// src/api/article/content-types/article/lifecycles.js
'use strict';

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    // Auto-generate slug if not provided
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Set default published date
    if (!data.publishedAt && data.published) {
      data.publishedAt = new Date();
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Send notification after creation
    await strapi.service('api::article.article').sendNotification(result.id);

    // Log creation
    strapi.log.info(`Article created: ${result.id}`);
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Prevent updating published articles
    const existing = await strapi.entityService.findOne('api::article.article', where.id);
    
    if (existing.publishedAt && !data.forceUpdate) {
      throw new Error('Cannot update published article');
    }

    // Update modified date
    data.updatedAt = new Date();
  },

  async afterUpdate(event) {
    const { result } = event;

    // Clear cache
    await strapi.cache.del(`article:${result.id}`);

    // Log update
    strapi.log.info(`Article updated: ${result.id}`);
  },

  async beforeDelete(event) {
    const { where } = event.params;
    const article = await strapi.entityService.findOne('api::article.article', where.id);

    // Prevent deleting published articles
    if (article.publishedAt) {
      throw new Error('Cannot delete published article');
    }
  },

  async afterDelete(event) {
    const { result } = event;

    // Clean up related data
    await strapi.entityService.deleteMany('api::comment.comment', {
      filters: {
        article: result.id
      }
    });

    // Log deletion
    strapi.log.info(`Article deleted: ${result.id}`);
  }
};
```

### Event Object Structure

```javascript
{
  params: {
    data: {},      // Data being created/updated
    where: {},     // Where clause for queries
    select: [],    // Fields to select
    populate: {}   // Relations to populate
  },
  result: {},      // Result of the operation
  state: {}         // Custom state
}
```

---

## Custom Routes

Routes define the API endpoints for your Content Types. They connect HTTP requests to controller actions.

**Reference:** [Strapi Routes Documentation](https://docs.strapi.io/cms/backend-customization/routes)

### Core Routes with createCoreRouter

Strapi 5 uses the `createCoreRouter` factory function to generate core routes. This is the recommended way to define routes for Content Types.

#### Basic Core Router

```javascript
// src/api/article/routes/article.js
'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::article.article');
```

```typescript
// src/api/article/routes/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article');
```

#### Core Router with Configuration

You can configure which routes to include/exclude and set policies, middlewares, and authentication:

```javascript
// src/api/article/routes/article.js
'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::article.article', {
  prefix: '',
  only: ['find', 'findOne'],  // Only include these routes
  except: [],                  // Exclude these routes (takes precedence over only)
  config: {
    find: {
      auth: false,             // Disable authentication for find route
      policies: [],
      middlewares: [],
    },
    findOne: {
      auth: true,
      policies: [],
      middlewares: [],
    },
    create: {},
    update: {},
    delete: {},
  },
});
```

```typescript
// src/api/article/routes/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article', {
  prefix: '',
  only: ['find', 'findOne'],
  except: [],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    findOne: {},
    create: {},
    update: {},
    delete: {},
  },
});
```

### Custom Routes

For routes that go beyond the standard CRUD operations, create a separate route file. Custom routes use a configuration object with `type` and `routes` properties.

#### TypeScript Format (Recommended)

```typescript
// src/api/article/routes/01-custom-article.ts
import type { Core } from '@strapi/strapi';

const config: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/articles/featured',
      handler: 'api::article.article.featured',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/search',
      handler: 'api::article.article.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/author/:authorId',
      handler: 'api::article.article.byAuthor',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/articles/:id/publish',
      handler: 'api::article.article.publish',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
        middlewares: [],
      },
    },
  ],
};

export default config;
```

#### JavaScript Format

```javascript
// src/api/article/routes/01-custom-article.js
'use strict';

const config = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/articles/featured',
      handler: 'api::article.article.featured',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/search',
      handler: 'api::article.article.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/author/:authorId',
      handler: 'api::article.article.byAuthor',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/articles/:id/publish',
      handler: 'api::article.article.publish',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
        middlewares: [],
      },
    },
  ],
};

module.exports = config;
```

**Note:** Route files are loaded in alphabetical order. Use prefixes like `01-`, `02-` to control the loading order if needed.

#### Corresponding Controller Method

The controller method referenced in the route handler must be defined in your controller:

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async featured(ctx) {
      const entries = await strapi.entityService.findMany('api::article.article', {
        filters: {
          featured: true,
          publishedAt: { $notNull: true },
        },
        sort: { publishedAt: 'desc' },
        limit: 10,
      });

      return { data: entries };
    },

    async search(ctx) {
      const { query } = ctx.query;

      if (!query) {
        return ctx.badRequest('Search query is required');
      }

      const entries = await strapi.entityService.findMany('api::article.article', {
        filters: {
          $or: [
            { title: { $contains: query } },
            { content: { $contains: query } },
          ],
        },
      });

      return { data: entries };
    },
  })
);
```

### Route Configuration Options

#### createCoreRouter Options

```javascript
{
  prefix: '',                    // Route prefix (e.g., '/api/v1')
  only: ['find', 'findOne'],     // Only include these routes
  except: ['delete'],            // Exclude these routes (takes precedence)
  config: {
    find: {
      auth: false,               // Disable authentication (default: true)
      policies: [],              // Array of policy names
      middlewares: [],           // Array of middleware names
    },
    findOne: {},
    create: {},
    update: {},
    delete: {},
  }
}
```

#### Custom Route Configuration Object

```typescript
const config: Core.RouterConfig = {
  type: 'content-api',  // Route type: 'content-api' or 'admin'
  routes: [
    // Array of route objects
  ],
};
```

#### Route Object Structure

```javascript
{
  method: 'GET|POST|PUT|DELETE|PATCH',  // HTTP method
  path: '/custom-path',                  // Route path (supports parameters like :id)
  handler: 'api::article.article.action', // Controller handler (full format)
  config: {
    policies: ['policy-name'],          // Authorization policies (array)
    middlewares: ['middleware-name'],   // Middleware functions (array)
    auth: false,                        // Disable authentication (default: true)
  }
}
```

### Handler Format

The handler string follows the pattern: `'api::content-type-name.controller-name.action-name'`

- **For API controllers**: `'api::article.article.find'` refers to `src/api/article/controllers/article.js` → `find` action
- **For plugin controllers**: `'plugin::plugin-name.controller.action'`
- **Short format** (legacy, still supported): `'article.find'` (resolves to `api::article.article.find`)

### Route Parameters

Routes support dynamic parameters using `:paramName`:

```javascript
{
  method: 'GET',
  path: '/articles/:id',                    // Access via ctx.params.id
  handler: 'api::article.article.findOne',
}

{
  method: 'GET',
  path: '/articles/:id/comments/:commentId', // Access via ctx.params.id and ctx.params.commentId
  handler: 'api::article.article.getComment',
}

{
  method: 'GET',
  path: '/articles/:category([a-z]+)',      // With regex pattern
  handler: 'api::article.article.findByCategory',
}
```

---

## Entity Service API

The Entity Service API provides a programmatic way to interact with your content.

### Common Methods

```javascript
// Find many entries
const entries = await strapi.entityService.findMany('api::article.article', {
  filters: { published: true },
  sort: { publishedAt: 'desc' },
  populate: ['author', 'categories'],
  limit: 10,
  offset: 0
});

// Find one entry
const entry = await strapi.entityService.findOne('api::article.article', id, {
  populate: ['author']
});

// Create entry
const newEntry = await strapi.entityService.create('api::article.article', {
  data: {
    title: 'New Article',
    content: 'Article content'
  }
});

// Update entry
const updatedEntry = await strapi.entityService.update('api::article.article', id, {
  data: {
    title: 'Updated Title'
  }
});

// Delete entry
const deletedEntry = await strapi.entityService.delete('api::article.article', id);
```

---

## Best Practices

### Controllers

1. **Keep Controllers Thin**: Move business logic to services
2. **Use Default Controllers**: Extend rather than replace when possible
3. **Error Handling**: Always handle errors properly
4. **Validation**: Validate input data
5. **Response Format**: Maintain consistent response format

### Services

1. **Reusability**: Make services reusable across controllers
2. **Single Responsibility**: Each service method should do one thing
3. **Error Handling**: Handle errors and throw appropriate exceptions
4. **Documentation**: Document service methods

### Lifecycle Hooks

1. **Performance**: Keep hooks lightweight
2. **Error Handling**: Handle errors to prevent data corruption
3. **Idempotency**: Make hooks idempotent when possible
4. **Logging**: Log important operations

### Routes

1. **RESTful Design**: Follow REST conventions
2. **Security**: Apply appropriate policies
3. **Versioning**: Consider API versioning for breaking changes
4. **Documentation**: Document custom routes

---

## Examples

### Complete Example: Article API with Custom Features

**Service:**
```javascript
// src/api/article/services/article.js
module.exports = createCoreService('api::article.article', ({ strapi }) => ({
  async findPopular(limit = 10) {
    return await strapi.entityService.findMany('api::article.article', {
      filters: {
        publishedAt: { $notNull: true }
      },
      sort: { views: 'desc' },
      limit
    });
  },

  async generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}));
```

**Controller:**
```javascript
// src/api/article/controllers/article.js
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async popular(ctx) {
    const entries = await strapi.service('api::article.article').findPopular();
    return { data: entries };
  }
}));
```

**Routes:**
```javascript
// src/api/article/routes/article.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/popular',
      handler: 'article.popular',
    }
  ]
};
```

---

## References

- [Strapi Backend Customization](https://docs.strapi.io/cms/backend-customization)
- [Strapi Controllers Documentation](https://docs.strapi.io/cms/backend-customization/controllers)
- [Strapi Services Documentation](https://docs.strapi.io/cms/backend-customization/services)
- [Strapi Routes Documentation](https://docs.strapi.io/cms/backend-customization/routes)
- [Strapi Policies Documentation](https://docs.strapi.io/cms/backend-customization/policies)
- [Strapi Models Documentation](https://docs.strapi.io/cms/backend-customization/models)
- [Strapi Requests and Responses](https://docs.strapi.io/cms/backend-customization/requests-responses)
- [Strapi Entity Service API](https://docs.strapi.io/cms/api/entity-service)

---

## Notes

### Key Takeaways

- Controllers handle HTTP requests and responses
- Services contain reusable business logic
- Lifecycle hooks execute at specific points in content lifecycle
- Routes define API endpoints
- Entity Service API provides programmatic access to content

### Important Reminders

- **Always extend default controllers when possible** - They handle sanitization automatically
- **Use sanitization methods when replacing core actions** - Use `validateQuery`, `sanitizeQuery`, and `sanitizeOutput` to prevent security vulnerabilities
- **Keep business logic in services, not controllers** - Controllers should be thin and delegate to services
- **Use lifecycle hooks for data validation and side effects** - Execute logic at specific points in the content lifecycle
- **Follow REST conventions for routes** - Maintain consistency with standard REST patterns
- **Handle errors properly in all custom code** - Provide meaningful error messages and proper status codes
- **Access request context safely** - Use `strapi.requestContext.get()` when needed outside of controllers

