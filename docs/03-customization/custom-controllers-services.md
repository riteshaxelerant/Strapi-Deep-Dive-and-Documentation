# Custom Controllers, Services, and Models (Enhanced)

## Overview

This guide covers customizing Strapi's default functionality by creating custom controllers, services, and extending models with lifecycle hooks. You'll learn the MVC pattern in Strapi, how to extend default functionality, and when to use each approach.

**What You'll Learn:**
- Understanding Strapi's MVC architecture
- Creating custom controllers (extending vs replacing)
- Building reusable services
- Using lifecycle hooks for models
- Entity Service API for data operations
- Best practices and real-world patterns

---

## Understanding Strapi's MVC Architecture

### MVC Pattern in Strapi

Strapi follows an MVC (Model-View-Controller) pattern:

- **Models**: Define data structure (Content Types with schemas)
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain reusable business logic
- **Routes**: Define API endpoints

**Why MVC?**
- Separation of concerns: Each component has a specific role
- Reusability: Services can be used across multiple controllers
- Maintainability: Changes in one layer don't affect others

### File Structure

```
src/api/article/
├── content-types/
│   └── article/
│       ├── schema.json          # Content type definition
│       └── lifecycles.ts        # Lifecycle hooks
├── controllers/
│   └── article.ts               # Request handlers
├── routes/
│   └── article.ts               # API endpoints
└── services/
    └── article.ts               # Business logic
```

**Learning Point:** Each Content Type has its own folder with controllers, services, routes, and lifecycle hooks. This keeps related code together.

---

## Custom Controllers

Controllers handle HTTP requests and send responses. They're the entry point for your API endpoints.

### Default Controller

Strapi automatically generates controllers using `createCoreController`:

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article');
```

**What it provides:**
- `find()` - List entries with filters, pagination, sorting
- `findOne()` - Get single entry by ID
- `create()` - Create new entry
- `update()` - Update existing entry
- `delete()` - Delete entry

**Learning Point:** Default controllers handle sanitization, validation, and permissions automatically. Always extend them when possible.

### Method 1: Extending Default Controllers (Recommended)

Add custom logic while preserving built-in functionality.

**Use Case:** Track article views when someone reads an article.

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async findOne(ctx) {
      // Call default findOne (handles sanitization)
      const response = await super.findOne(ctx);

      // Add custom logic: Track view
      if (response.data) {
        const { id } = ctx.params;
        
        await strapi.entityService.update('api::article.article', id, {
          data: {
            views: (response.data.attributes.views || 0) + 1,
          },
        });
      }

      return response;
    },

    async find(ctx) {
      // Add default filter: only published articles
      ctx.query = {
        ...ctx.query,
        filters: {
          ...ctx.query.filters,
          publishedAt: { $notNull: true },
        },
      };

      // Call default find
      const { data, meta } = await super.find(ctx);

      // Transform response: add computed fields
      const transformedData = data.map((item) => ({
        ...item,
        attributes: {
          ...item.attributes,
          excerpt: item.attributes.content?.substring(0, 150) || '',
          readingTime: Math.ceil(
            (item.attributes.content?.split(/\s+/).length || 0) / 200
          ),
        },
      }));

      return { data: transformedData, meta };
    },

    async create(ctx) {
      const { data } = ctx.request.body;

      // Custom validation
      if (!data.title || data.title.length < 10) {
        return ctx.badRequest('Title must be at least 10 characters');
      }

      // Call default create (handles sanitization)
      const response = await super.create(ctx);

      // Custom logic after creation
      if (response.data) {
        // Send notification
        await strapi.service('api::article.article').sendNotification(
          response.data.id
        );
      }

      return response;
    },
  })
);
```

**Learning Points:**
- Use `super.methodName()` to call parent methods
- Add logic before or after default behavior
- Sanitization and validation are handled automatically
- Transform responses to add computed fields

### Method 2: Replacing Core Actions (Advanced)

When you need complete control, replace actions but **always use sanitization methods**.

**Use Case:** Custom filtering based on user roles.

```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async find(ctx) {
      // Validate query parameters
      await this.validateQuery(ctx);

      // Sanitize query (removes invalid params)
      const sanitizedQuery = await this.sanitizeQuery(ctx);

      // Custom filtering logic
      const customFilters = {
        ...sanitizedQuery.filters,
        publishedAt: { $notNull: true },
        // Role-based filtering
        ...(ctx.state.user?.role?.name === 'Author' && {
          author: { id: ctx.state.user.id },
        }),
      };

      // Fetch data using service
      const { results, pagination } = await strapi
        .service('api::article.article')
        .find({
          ...sanitizedQuery,
          filters: customFilters,
        });

      // Sanitize output (prevents data leaks)
      const sanitizedResults = await this.sanitizeOutput(results, ctx);

      // Transform response
      return this.transformResponse(sanitizedResults, { pagination });
    },
  })
);
```

**Security Note:** Always use sanitization methods:
- `validateQuery()` - Validates query params (throws on invalid)
- `sanitizeQuery()` - Removes invalid query params
- `sanitizeInput()` - Sanitizes input data
- `sanitizeOutput()` - Prevents leaking private fields (required)
- `transformResponse()` - Formats response

### Method 3: Custom Actions

Add actions beyond CRUD operations.

```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    // Custom action: Get featured articles
    async featured(ctx) {
      const entries = await strapi.entityService.findMany(
        'api::article.article',
        {
          filters: {
            featured: true,
            publishedAt: { $notNull: true },
          },
          sort: { publishedAt: 'desc' },
          limit: 10,
          populate: ['author', 'categories'],
        }
      );

      return { data: entries };
    },

    // Custom action: Search articles
    async search(ctx) {
      const { query } = ctx.query;

      if (!query) {
        return ctx.badRequest('Search query is required');
      }

      const entries = await strapi.entityService.findMany(
        'api::article.article',
        {
          filters: {
            $or: [
              { title: { $contains: query } },
              { content: { $contains: query } },
            ],
            publishedAt: { $notNull: true },
          },
        }
      );

      return { data: entries };
    },
  })
);
```

**Learning Point:** Custom actions don't override core methods, so they don't need sanitization. They're perfect for specialized endpoints.

### Controller Context (ctx)

The `ctx` object contains request and response information:

```typescript
{
  // Request data
  request: {
    body: {},        // Request body (POST/PUT data)
    query: {},       // Query parameters (?key=value)
    params: {},      // Route parameters (:id)
    headers: {},     // HTTP headers
    method: 'GET',   // HTTP method
  },
  
  // Response data
  response: {
    body: {},        // Response body
    status: 200,     // HTTP status code
  },
  
  // Application state
  state: {
    user: {},        // Authenticated user
    auth: {},        // Authentication info
  },
  
  // Helper methods
  badRequest(message, details),
  notFound(message),
  unauthorized(message),
  forbidden(message),
}
```

**Accessing Context Outside Controllers:**

```typescript
// In services or lifecycle hooks
const ctx = strapi.requestContext.get();
const user = ctx.state.user;
```

---

## Custom Services

Services contain reusable business logic. They're shared across controllers and other parts of your application.

### Default Service

Strapi generates services automatically:

```typescript
// src/api/article/services/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::article.article');
```

**What it provides:**
- `find()` - Query entries
- `findOne()` - Get single entry
- `create()` - Create entry
- `update()` - Update entry
- `delete()` - Delete entry

### Extending Services

Add custom methods to services:

```typescript
// src/api/article/services/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService(
  'api::article.article',
  ({ strapi }) => ({
    /**
     * Find published articles
     */
    async findPublished() {
      return await strapi.entityService.findMany('api::article.article', {
        filters: {
          publishedAt: { $notNull: true },
        },
        sort: { publishedAt: 'desc' },
      });
    },

    /**
     * Find articles by category
     */
    async findByCategory(categoryId: number) {
      return await strapi.entityService.findMany('api::article.article', {
        filters: {
          categories: { id: categoryId },
        },
        populate: ['author', 'categories'],
      });
    },

    /**
     * Increment article views
     */
    async incrementViews(articleId: number) {
      const article = await strapi.entityService.findOne(
        'api::article.article',
        articleId
      );

      if (article) {
        await strapi.entityService.update('api::article.article', articleId, {
          data: {
            views: (article.views || 0) + 1,
          },
        });
      }
    },

    /**
     * Send notification when article is published
     */
    async sendNotification(articleId: number) {
      const article = await strapi.entityService.findOne(
        'api::article.article',
        articleId,
        { populate: ['author'] }
      );

      if (article?.author) {
        // Send email notification
        await strapi.plugins['email'].services.email.send({
          to: article.author.email,
          subject: 'Article Published',
          text: `Your article "${article.title}" has been published.`,
        });
      }
    },

    /**
     * Generate URL-friendly slug from title
     */
    generateSlug(title: string): string {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    },

    /**
     * Calculate reading time in minutes
     */
    calculateReadingTime(content: string): number {
      const wordsPerMinute = 200;
      const wordCount = content.split(/\s+/).length;
      return Math.ceil(wordCount / wordsPerMinute);
    },

    /**
     * Validate article data
     */
    validateArticle(data: any): { isValid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!data.title || data.title.length < 10) {
        errors.push('Title must be at least 10 characters');
      }

      if (!data.content || data.content.length < 100) {
        errors.push('Content must be at least 100 characters');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  })
);
```

**Learning Points:**
- Services encapsulate business logic
- Methods are reusable across controllers
- Use Entity Service API for data operations
- Keep services focused on single responsibility

### Using Services in Controllers

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async find(ctx) {
      // Use service method
      const publishedArticles = await strapi
        .service('api::article.article')
        .findPublished();
      
      return { data: publishedArticles };
    },

    async create(ctx) {
      const { data } = ctx.request.body;

      // Validate using service
      const validation = await strapi
        .service('api::article.article')
        .validateArticle(data);

      if (!validation.isValid) {
        return ctx.badRequest('Validation failed', {
          errors: validation.errors,
        });
      }

      // Generate slug using service
      data.slug = strapi
        .service('api::article.article')
        .generateSlug(data.title);

      // Create entry
      const response = await super.create(ctx);

      // Send notification using service
      if (response.data) {
        await strapi
          .service('api::article.article')
          .sendNotification(response.data.id);
      }

      return response;
    },
  })
);
```

**Learning Point:** Controllers should be thin - delegate business logic to services. This keeps code organized and testable.

---

## Lifecycle Hooks

Lifecycle hooks execute custom logic at specific points in the content lifecycle.

### Available Hooks

- `beforeCreate` - Before creating an entry
- `afterCreate` - After creating an entry
- `beforeUpdate` - Before updating an entry
- `afterUpdate` - After updating an entry
- `beforeDelete` - Before deleting an entry
- `afterDelete` - After deleting an entry

### Lifecycle Hook Example

```typescript
// src/api/article/content-types/article/lifecycles.ts
import type { Core } from '@strapi/strapi';

export default {
  /**
   * Before creating an article
   */
  async beforeCreate(event: any) {
    const { data } = event.params;

    // Auto-generate slug if not provided
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Set default published date if published flag is true
    if (!data.publishedAt && data.published) {
      data.publishedAt = new Date();
    }
  },

  /**
   * After creating an article
   */
  async afterCreate(event: any) {
    const { result } = event;

    // Send notification
    await strapi.service('api::article.article').sendNotification(result.id);

    // Log creation
    strapi.log.info(`Article created: ${result.id}`);
  },

  /**
   * Before updating an article
   */
  async beforeUpdate(event: any) {
    const { data, where } = event.params;

    // Prevent updating published articles (unless force flag is set)
    const existing = await strapi.entityService.findOne(
      'api::article.article',
      where.id
    );

    if (existing?.publishedAt && !data.forceUpdate) {
      throw new Error('Cannot update published article without force flag');
    }

    // Update modified date
    data.updatedAt = new Date();
  },

  /**
   * After updating an article
   */
  async afterUpdate(event: any) {
    const { result } = event;

    // Clear cache
    await strapi.cache.del(`article:${result.id}`);

    // Log update
    strapi.log.info(`Article updated: ${result.id}`);
  },

  /**
   * Before deleting an article
   */
  async beforeDelete(event: any) {
    const { where } = event.params;
    const article = await strapi.entityService.findOne(
      'api::article.article',
      where.id
    );

    // Prevent deleting published articles
    if (article?.publishedAt) {
      throw new Error('Cannot delete published article');
    }
  },

  /**
   * After deleting an article
   */
  async afterDelete(event: any) {
    const { result } = event;

    // Clean up related data
    await strapi.entityService.deleteMany('api::comment.comment', {
      filters: {
        article: result.id,
      },
    });

    // Log deletion
    strapi.log.info(`Article deleted: ${result.id}`);
  },
};
```

**Event Object Structure:**

```typescript
{
  params: {
    data: {},      // Data being created/updated
    where: {},     // Where clause (contains id for findOne/update/delete)
    select: [],    // Fields to select
    populate: {}   // Relations to populate
  },
  result: {},      // Result of the operation (available in after hooks)
  state: {}         // Custom state
}
```

**Learning Points:**
- Use `beforeCreate`/`beforeUpdate` for validation and data transformation
- Use `afterCreate`/`afterUpdate` for side effects (notifications, logging)
- Throw errors in `before` hooks to prevent operations
- Keep hooks lightweight (avoid heavy operations)

---

## Custom Routes

Routes connect HTTP requests to controller actions.

### Core Routes

Strapi 5 uses `createCoreRouter` to generate standard CRUD routes:

```typescript
// src/api/article/routes/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article');
```

**With Configuration:**

```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article', {
  prefix: '',
  only: ['find', 'findOne'],  // Only include these routes
  except: [],                  // Exclude these routes
  config: {
    find: {
      auth: false,             // Public access
      policies: [],
      middlewares: [],
    },
    findOne: {
      auth: true,              // Requires authentication
      policies: [],
      middlewares: [],
    },
    create: {},
    update: {},
    delete: {},
  },
});
```

### Custom Routes

For endpoints beyond CRUD:

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

**Handler Format:**
- Full format: `'api::article.article.featured'`
- Short format: `'article.featured'` (resolves to full format)

**Route Parameters:**
- `:id` - Access via `ctx.params.id`
- `:authorId` - Access via `ctx.params.authorId`

---

## Entity Service API

Entity Service provides programmatic access to your content.

### Common Methods

```typescript
// Find many entries
const entries = await strapi.entityService.findMany('api::article.article', {
  filters: { publishedAt: { $notNull: true } },
  sort: { publishedAt: 'desc' },
  populate: ['author', 'categories'],
  limit: 10,
  offset: 0,
});

// Find one entry
const entry = await strapi.entityService.findOne(
  'api::article.article',
  id,
  { populate: ['author'] }
);

// Create entry
const newEntry = await strapi.entityService.create('api::article.article', {
  data: {
    title: 'New Article',
    content: 'Article content',
  },
});

// Update entry
const updatedEntry = await strapi.entityService.update(
  'api::article.article',
  id,
  {
    data: {
      title: 'Updated Title',
    },
  }
);

// Delete entry
const deletedEntry = await strapi.entityService.delete(
  'api::article.article',
  id
);
```

**Learning Points:**
- Use Entity Service in services (not controllers directly)
- Filters support complex queries (`$or`, `$and`, `$contains`, etc.)
- Populate relations to include related data
- Always handle errors when using Entity Service

---

## Complete Example

Here's a complete example combining controllers, services, and routes:

**Service:**

```typescript
// src/api/article/services/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService(
  'api::article.article',
  ({ strapi }) => ({
    async findPopular(limit = 10) {
      return await strapi.entityService.findMany('api::article.article', {
        filters: {
          publishedAt: { $notNull: true },
        },
        sort: { views: 'desc' },
        limit,
      });
    },

    generateSlug(title: string): string {
      return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    },
  })
);
```

**Controller:**

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async popular(ctx) {
      const entries = await strapi
        .service('api::article.article')
        .findPopular(10);
      
      return { data: entries };
    },
  })
);
```

**Routes:**

```typescript
// src/api/article/routes/01-custom-article.ts
import type { Core } from '@strapi/strapi';

const config: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/articles/popular',
      handler: 'api::article.article.popular',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

export default config;
```

---

## Best Practices

### Controllers

1. **Keep Controllers Thin**: Move business logic to services
2. **Extend Default Controllers**: Use `super.methodName()` when possible
3. **Validate Inputs**: Always validate before processing
4. **Handle Errors**: Use try-catch and return appropriate status codes
5. **Use Sanitization**: Always sanitize when replacing core actions

### Services

1. **Single Responsibility**: Each method should do one thing
2. **Reusability**: Make services reusable across controllers
3. **Error Handling**: Throw meaningful errors
4. **Documentation**: Comment complex logic
5. **Use Entity Service**: Access data through Entity Service API

### Lifecycle Hooks

1. **Keep Hooks Lightweight**: Avoid heavy operations
2. **Handle Errors**: Prevent data corruption
3. **Use for Side Effects**: Notifications, logging, cleanup
4. **Validate in Before Hooks**: Prevent invalid data

### Routes

1. **RESTful Design**: Follow REST conventions
2. **Apply Policies**: Protect sensitive routes
3. **Document Routes**: Comment what each route does
4. **Use TypeScript**: Type your route configurations

---

## Key Takeaways

- **Controllers**: Handle HTTP requests/responses, keep them thin
- **Services**: Contain business logic, make them reusable
- **Lifecycle Hooks**: Execute logic at specific points in content lifecycle
- **Routes**: Connect HTTP requests to controller actions
- **Entity Service**: Programmatic access to content

### Important Reminders

- Always extend default controllers when possible (automatic sanitization)
- Use sanitization methods when replacing core actions
- Keep business logic in services, not controllers
- Use lifecycle hooks for side effects and validation
- Follow REST conventions for routes
- Handle errors properly with meaningful messages

---

## References

- [Strapi Backend Customization](https://docs.strapi.io/cms/backend-customization)
- [Strapi Controllers](https://docs.strapi.io/cms/backend-customization/controllers)
- [Strapi Services](https://docs.strapi.io/cms/backend-customization/services)
- [Strapi Routes](https://docs.strapi.io/cms/backend-customization/routes)
- [Strapi Models](https://docs.strapi.io/cms/backend-customization/models)
- [Entity Service API](https://docs.strapi.io/cms/api/entity-service)
