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

Controllers handle incoming HTTP requests and send responses. They contain the logic for your API endpoints.

### Default Controller

Strapi automatically generates controllers for each Content Type. The default controller provides CRUD operations:

```javascript
// src/api/article/controllers/article.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article');
```

### Creating Custom Controllers

You can extend or override the default controller to add custom logic.

#### Method 1: Extend Default Controller

```javascript
// src/api/article/controllers/article.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // Call default find method
    const { data, meta } = await super.find(ctx);

    // Add custom logic
    const customData = data.map(item => ({
      ...item,
      customField: 'custom value'
    }));

    return { data: customData, meta };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const { data, meta } = await super.findOne(ctx);

    // Custom logic for single entry
    if (data) {
      // Increment view count
      await strapi.entityService.update('api::article.article', id, {
        data: {
          views: (data.attributes.views || 0) + 1
        }
      });
    }

    return { data, meta };
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
  },

  async update(ctx) {
    // Custom update logic
    const { id } = ctx.params;
    const { data } = ctx.request.body;

    // Add audit trail
    const updatedData = {
      ...data,
      lastModifiedBy: ctx.state.user?.id
    };

    const response = await super.update(ctx);

    return response;
  },

  async delete(ctx) {
    // Custom delete logic
    const { id } = ctx.params;

    // Soft delete instead of hard delete
    await strapi.entityService.update('api::article.article', id, {
      data: {
        deleted: true,
        deletedAt: new Date()
      }
    });

    return { data: { id } };
  }
}));
```

#### Method 2: Complete Override

```javascript
// src/api/article/controllers/article.js
'use strict';

module.exports = {
  async find(ctx) {
    try {
      const entries = await strapi.entityService.findMany('api::article.article', {
        filters: ctx.query.filters,
        sort: ctx.query.sort,
        populate: ctx.query.populate,
      });

      return { data: entries };
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const entry = await strapi.entityService.findOne('api::article.article', id, {
        populate: ctx.query.populate,
      });

      if (!entry) {
        return ctx.notFound('Article not found');
      }

      return { data: entry };
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      const entry = await strapi.entityService.create('api::article.article', {
        data,
      });

      return { data: entry };
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;

      const entry = await strapi.entityService.update('api::article.article', id, {
        data,
      });

      return { data: entry };
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const entry = await strapi.entityService.delete('api::article.article', id);

      return { data: entry };
    } catch (err) {
      ctx.throw(500, err);
    }
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

The `ctx` object contains request and response information:

```javascript
{
  request: {
    body: {},      // Request body
    query: {},     // Query parameters
    params: {},    // Route parameters
    headers: {}    // Request headers
  },
  response: {
    // Response methods
  },
  state: {
    user: {},      // Authenticated user
    route: {}      // Route information
  },
  // Helper methods
  badRequest(),
  notFound(),
  unauthorized(),
  forbidden(),
  throw()
}
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

Routes define the API endpoints for your Content Types.

### Default Routes

Strapi automatically generates REST routes:

```javascript
// src/api/article/routes/article.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles',
      handler: 'article.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/articles/:id',
      handler: 'article.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/articles',
      handler: 'article.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/articles/:id',
      handler: 'article.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/articles/:id',
      handler: 'article.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
```

### Custom Routes

Add custom routes for additional endpoints:

```javascript
// src/api/article/routes/article.js
'use strict';

module.exports = {
  routes: [
    // Default routes
    {
      method: 'GET',
      path: '/articles',
      handler: 'article.find',
    },
    {
      method: 'GET',
      path: '/articles/:id',
      handler: 'article.findOne',
    },
    // Custom routes
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
      method: 'GET',
      path: '/articles/author/:authorId',
      handler: 'article.byAuthor',
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
  ],
};
```

### Route Configuration

```javascript
{
  method: 'GET|POST|PUT|DELETE|PATCH',
  path: '/custom-path',
  handler: 'controller.action',
  config: {
    policies: ['policy-name'],      // Authorization policies
    middlewares: ['middleware'],    // Middleware functions
    auth: false,                    // Disable authentication
    prefix: '',                     // Route prefix
  }
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

- [Strapi Backend Customization](https://docs.strapi.io/dev-docs/backend-customization)
- [Strapi Controllers Documentation](https://docs.strapi.io/dev-docs/backend-customization/controllers)
- [Strapi Services Documentation](https://docs.strapi.io/dev-docs/backend-customization/services)
- [Strapi Lifecycle Hooks](https://docs.strapi.io/dev-docs/backend-customization/models#lifecycle-hooks)
- [Strapi Entity Service API](https://docs.strapi.io/dev-docs/api/entity-service)

---

## Notes

### Key Takeaways

- Controllers handle HTTP requests and responses
- Services contain reusable business logic
- Lifecycle hooks execute at specific points in content lifecycle
- Routes define API endpoints
- Entity Service API provides programmatic access to content

### Important Reminders

- Always extend default controllers when possible
- Keep business logic in services, not controllers
- Use lifecycle hooks for data validation and side effects
- Follow REST conventions for routes
- Handle errors properly in all custom code

