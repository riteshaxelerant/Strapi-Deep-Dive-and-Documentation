# API Customization Guide (Enhanced)

## Overview

This guide covers customizing Strapi's REST and GraphQL APIs from a learning perspective. You'll learn how to extend default endpoints, create custom routes, transform responses, implement middleware and policies, handle errors, and work with GraphQL resolvers and mutations. Each section includes practical examples and real-world use cases.

**Why Customize APIs?**
- Add business logic beyond standard CRUD operations
- Transform data to match frontend requirements
- Implement custom authentication and authorization
- Optimize API responses for performance
- Create specialized endpoints for specific features

---

## REST API Customization

### Understanding Default REST Endpoints

Strapi automatically generates REST endpoints for each Content Type. These endpoints follow REST conventions and provide standard CRUD operations.

**Default Endpoints:**
```
GET    /api/articles          # List all articles (with filters, pagination, sorting)
GET    /api/articles/:id      # Get single article by ID
POST   /api/articles          # Create new article
PUT    /api/articles/:id      # Update entire article
PATCH  /api/articles/:id      # Partial update
DELETE /api/articles/:id      # Delete article
```

**Use Case:** A blog platform needs these endpoints to manage articles. The default endpoints handle most cases, but you might need custom endpoints for features like "featured articles" or "search."

### Customizing Default Endpoints

#### Method 1: Extending Default Controllers (Recommended)

Extend default controllers to add custom logic while preserving built-in functionality like sanitization and validation.

**Real-World Scenario:** You want to add view tracking when someone reads an article.

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async findOne(ctx) {
      // Call the default findOne method
      const response = await super.findOne(ctx);

      // Add custom logic: Track article view
      if (response.data) {
        const { id } = ctx.params;
        
        // Increment view count
        await strapi.entityService.update('api::article.article', id, {
          data: {
            views: (response.data.attributes.views || 0) + 1,
          },
        });

        // Log view for analytics
        strapi.log.info(`Article ${id} viewed`);
      }

      return response;
    },

    async find(ctx) {
      // Add default filter: only show published articles
      ctx.query = {
        ...ctx.query,
        filters: {
          ...ctx.query.filters,
          publishedAt: { $notNull: true },
        },
      };

      // Call default find method
      const { data, meta } = await super.find(ctx);

      // Transform response: add excerpt and reading time
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
  })
);
```

**Learning Points:**
- Use `super.methodName()` to call parent methods
- Access request context via `ctx` parameter
- Transform data before returning to client
- Always preserve sanitization by using `super` methods

#### Method 2: Replacing Core Actions with Sanitization

When you need complete control, replace core actions but **always use sanitization methods** to prevent security vulnerabilities.

**Real-World Scenario:** Creating a custom search endpoint that requires special filtering logic.

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async find(ctx) {
      // Validate query parameters
      await this.validateQuery(ctx);

      // Sanitize query to remove invalid params
      const sanitizedQuery = await this.sanitizeQuery(ctx);

      // Custom filtering logic
      const customFilters = {
        ...sanitizedQuery.filters,
        // Always filter published articles
        publishedAt: { $notNull: true },
        // Add custom filter based on user role
        ...(ctx.state.user?.role?.name === 'Editor' && {
          // Editors see all articles
        }),
        ...(ctx.state.user?.role?.name === 'Author' && {
          // Authors only see their own articles
          author: { id: ctx.state.user.id },
        }),
      };

      // Fetch data using Entity Service
      const { results, pagination } = await strapi
        .service('api::article.article')
        .find({
          ...sanitizedQuery,
          filters: customFilters,
        });

      // Sanitize output to prevent leaking private fields
      const sanitizedResults = await this.sanitizeOutput(results, ctx);

      // Transform response
      return this.transformResponse(sanitizedResults, { pagination });
    },
  })
);
```

**Security Note:** Always use `sanitizeQuery`, `sanitizeInput`, and `sanitizeOutput` when replacing core actions. These methods ensure users can't access unauthorized data or bypass validation.

### Custom API Routes

Create routes for operations that don't fit standard CRUD patterns.

**Use Cases:**
- Featured content endpoints
- Search functionality
- Bulk operations
- Status changes (publish/unpublish)
- Analytics endpoints

#### Creating Custom Routes

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
    {
      method: 'POST',
      path: '/articles/:id/unpublish',
      handler: 'api::article.article.unpublish',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
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
  ],
};

export default config;
```

#### Implementing Custom Route Handlers

```typescript
// src/api/article/controllers/article.ts
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

      if (!query || query.trim().length === 0) {
        return ctx.badRequest('Search query is required');
      }

      const entries = await strapi.entityService.findMany(
        'api::article.article',
        {
          filters: {
            $or: [
              { title: { $contains: query } },
              { content: { $contains: query } },
              { excerpt: { $contains: query } },
            ],
            publishedAt: { $notNull: true },
          },
          populate: ['author', 'categories'],
          sort: { publishedAt: 'desc' },
        }
      );

      return { data: entries };
    },

    // Custom action: Publish article
    async publish(ctx) {
      const { id } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Check permissions
      const article = await strapi.entityService.findOne(
        'api::article.article',
        id,
        { populate: ['author'] }
      );

      if (!article) {
        return ctx.notFound('Article not found');
      }

      // Check if user can publish (owner or admin)
      if (
        article.author?.id !== user.id &&
        user.role?.name !== 'Administrator'
      ) {
        return ctx.forbidden('You do not have permission to publish this article');
      }

      const updatedArticle = await strapi.entityService.update(
        'api::article.article',
        id,
        {
          data: {
            publishedAt: new Date(),
          },
        }
      );

      // Send notification
      await strapi.service('api::article.article').sendPublishNotification(
        id
      );

      return { data: updatedArticle };
    },

    // Custom action: Unpublish article
    async unpublish(ctx) {
      const { id } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const updatedArticle = await strapi.entityService.update(
        'api::article.article',
        id,
        {
          data: {
            publishedAt: null,
          },
        }
      );

      return { data: updatedArticle };
    },

    // Custom action: Get articles by author
    async byAuthor(ctx) {
      const { authorId } = ctx.params;

      const entries = await strapi.entityService.findMany(
        'api::article.article',
        {
          filters: {
            author: authorId,
            publishedAt: { $notNull: true },
          },
          populate: ['author', 'categories'],
          sort: { publishedAt: 'desc' },
        }
      );

      return { data: entries };
    },
  })
);
```

**Learning Points:**
- Custom routes extend beyond CRUD operations
- Use route parameters (`:id`, `:authorId`) for dynamic values
- Apply policies for authentication/authorization
- Return consistent response format

### API Response Transformations

Transform API responses to match frontend requirements or add computed fields.

**Use Cases:**
- Add computed fields (reading time, excerpt)
- Remove sensitive data
- Flatten nested structures
- Add metadata or analytics

#### Transform Response Data

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async find(ctx) {
      const { data, meta } = await super.find(ctx);

      // Transform each item
      const transformedData = data.map((item) => {
        // Calculate reading time (assuming 200 words per minute)
        const wordCount = item.attributes.content?.split(/\s+/).length || 0;
        const readingTime = Math.ceil(wordCount / 200);

        // Create excerpt
        const excerpt =
          item.attributes.content?.substring(0, 150) + '...' || '';

        return {
          id: item.id,
          documentId: item.documentId,
          title: item.attributes.title,
          slug: item.attributes.slug,
          excerpt,
          readingTime,
          publishedAt: item.attributes.publishedAt,
          // Flatten author data
          author: {
            id: item.attributes.author?.data?.id,
            name: item.attributes.author?.data?.attributes?.name,
            email: item.attributes.author?.data?.attributes?.email,
          },
          // Remove sensitive fields (like internal notes)
          // Add computed fields
        };
      });

      return { data: transformedData, meta };
    },
  })
);
```

#### Custom Response Format

```typescript
// Custom response format for mobile app
async find(ctx) {
  const { data, meta } = await super.find(ctx);

  return {
    success: true,
    articles: data.map((item) => ({
      id: item.id,
      ...item.attributes,
    })),
    pagination: {
      page: meta.pagination.page,
      pageSize: meta.pagination.pageSize,
      total: meta.pagination.total,
      pageCount: meta.pagination.pageCount,
    },
    timestamp: new Date().toISOString(),
  };
}
```

---

## GraphQL API Customization

### Understanding GraphQL in Strapi

GraphQL provides a flexible query language that allows clients to request exactly the data they need. Strapi's GraphQL plugin automatically generates a schema from your Content Types, but you can extend it with custom resolvers and mutations.

**Why Use GraphQL?**
- Clients request only needed fields (reduces over-fetching)
- Single endpoint for all queries
- Strongly typed schema
- Real-time subscriptions (with additional setup)

### Enabling and Configuring GraphQL

#### Installation

```bash
# Using Yarn
yarn strapi install graphql

# Using npm
npm run strapi install graphql
```

#### Configuration

```typescript
// config/plugins.ts
export default {
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true, // Auto-generate schema from Content Types
      playgroundAlways: false, // Only in development
      depthLimit: 7, // Prevent deeply nested queries
      amountLimit: 100, // Maximum results per query
      apolloServer: {
        tracing: false, // Enable for performance monitoring
      },
    },
  },
};
```

**Configuration Options Explained:**
- **endpoint**: GraphQL endpoint URL (default: `/graphql`)
- **shadowCRUD**: Automatically creates GraphQL schema from Content Types
- **playgroundAlways**: Show GraphQL playground in production (not recommended)
- **depthLimit**: Prevents expensive deep queries (e.g., `article { author { articles { author { ... } } } }`)
- **amountLimit**: Maximum number of results to prevent large responses

### Custom GraphQL Resolvers

Resolvers are functions that resolve GraphQL queries and mutations. Strapi generates default resolvers, but you can create custom ones for specialized operations.

#### Understanding Resolver Structure

A resolver function receives three parameters:
1. **parent**: Result from parent resolver (for nested queries)
2. **args**: Arguments passed to the query/mutation
3. **context**: Request context (includes user, strapi instance)

#### Creating Custom Query Resolvers

**Use Case:** Create a featured articles query that returns only published, featured articles sorted by popularity.

```typescript
// src/api/article/config/schema.graphql.ts
import type { Core } from '@strapi/strapi';

export default {
  typeDefs: `
    type Query {
      featuredArticles(limit: Int): [Article]
      searchArticles(query: String!, limit: Int): [Article]
      popularArticles(days: Int, limit: Int): [Article]
    }
  `,
  resolvers: {
    Query: {
      // Featured articles query
      featuredArticles: async (parent: any, args: any, context: any) => {
        const { limit = 10 } = args;

        const entries = await strapi.entityService.findMany(
          'api::article.article',
          {
            filters: {
              featured: true,
              publishedAt: { $notNull: true },
            },
            sort: { publishedAt: 'desc' },
            limit,
            populate: ['author', 'categories'],
          }
        );

        return entries;
      },

      // Search articles query
      searchArticles: async (parent: any, args: any, context: any) => {
        const { query, limit = 20 } = args;

        if (!query || query.trim().length === 0) {
          throw new Error('Search query is required');
        }

        const entries = await strapi.entityService.findMany(
          'api::article.article',
          {
            filters: {
              $or: [
                { title: { $contains: query } },
                { content: { $contains: query } },
                { excerpt: { $contains: query } },
              ],
              publishedAt: { $notNull: true },
            },
            sort: { publishedAt: 'desc' },
            limit,
            populate: ['author'],
          }
        );

        return entries;
      },

      // Popular articles based on views
      popularArticles: async (parent: any, args: any, context: any) => {
        const { days = 7, limit = 10 } = args;
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        const entries = await strapi.entityService.findMany(
          'api::article.article',
          {
            filters: {
              publishedAt: { $gte: dateLimit.toISOString() },
            },
            sort: { views: 'desc' },
            limit,
            populate: ['author'],
          }
        );

        return entries;
      },
    },
  },
};
```

#### GraphQL Query Examples

```graphql
# Query featured articles
query {
  featuredArticles(limit: 5) {
    id
    documentId
    title
    slug
    publishedAt
    author {
      name
      email
    }
    categories {
      name
    }
  }
}

# Search articles
query {
  searchArticles(query: "TypeScript", limit: 10) {
    id
    title
    excerpt
    publishedAt
  }
}

# Popular articles from last 30 days
query {
  popularArticles(days: 30, limit: 5) {
    id
    title
    views
    publishedAt
  }
}
```

### GraphQL Mutations

Mutations modify data in GraphQL. Strapi provides default mutations (create, update, delete), but you can create custom mutations for complex operations.

#### Understanding Mutations

Mutations are operations that change data. They should:
- Return the modified data
- Handle errors gracefully
- Validate input
- Check permissions

#### Creating Custom Mutations

**Use Case 1: Publish Article Mutation**

```typescript
// src/api/article/config/schema.graphql.ts
export default {
  typeDefs: `
    type Mutation {
      publishArticle(id: ID!): ArticleEntityResponse
      unpublishArticle(id: ID!): ArticleEntityResponse
      updateArticleViews(id: ID!): ArticleEntityResponse
      bulkPublishArticles(ids: [ID!]!): BulkPublishResponse
    }

    type BulkPublishResponse {
      success: Boolean!
      published: Int!
      failed: Int!
      errors: [String!]
    }
  `,
  resolvers: {
    Mutation: {
      // Publish a single article
      publishArticle: async (parent: any, args: any, context: any) => {
        const { id } = args;
        const { user } = context.state;

        if (!user) {
          throw new Error('Authentication required');
        }

        // Check if article exists
        const article = await strapi.entityService.findOne(
          'api::article.article',
          id,
          { populate: ['author'] }
        );

        if (!article) {
          throw new Error('Article not found');
        }

        // Check permissions
        if (
          article.author?.id !== user.id &&
          user.role?.name !== 'Administrator'
        ) {
          throw new Error('You do not have permission to publish this article');
        }

        // Update article
        const updatedArticle = await strapi.entityService.update(
          'api::article.article',
          id,
          {
            data: {
              publishedAt: new Date(),
            },
          }
        );

        // Send notification
        await strapi
          .service('api::article.article')
          .sendPublishNotification(id);

        return {
          data: {
            id: updatedArticle.id,
            documentId: updatedArticle.documentId,
            attributes: updatedArticle,
          },
        };
      },

      // Unpublish article
      unpublishArticle: async (parent: any, args: any, context: any) => {
        const { id } = args;
        const { user } = context.state;

        if (!user) {
          throw new Error('Authentication required');
        }

        const updatedArticle = await strapi.entityService.update(
          'api::article.article',
          id,
          {
            data: {
              publishedAt: null,
            },
          }
        );

        return {
          data: {
            id: updatedArticle.id,
            documentId: updatedArticle.documentId,
            attributes: updatedArticle,
          },
        };
      },

      // Update article views (for tracking)
      updateArticleViews: async (parent: any, args: any, context: any) => {
        const { id } = args;

        const article = await strapi.entityService.findOne(
          'api::article.article',
          id
        );

        if (!article) {
          throw new Error('Article not found');
        }

        const updatedArticle = await strapi.entityService.update(
          'api::article.article',
          id,
          {
            data: {
              views: (article.views || 0) + 1,
            },
          }
        );

        return {
          data: {
            id: updatedArticle.id,
            documentId: updatedArticle.documentId,
            attributes: updatedArticle,
          },
        };
      },

      // Bulk publish articles
      bulkPublishArticles: async (parent: any, args: any, context: any) => {
        const { ids } = args;
        const { user } = context.state;

        if (!user) {
          throw new Error('Authentication required');
        }

        let published = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const id of ids) {
          try {
            const article = await strapi.entityService.findOne(
              'api::article.article',
              id,
              { populate: ['author'] }
            );

            if (!article) {
              failed++;
              errors.push(`Article ${id} not found`);
              continue;
            }

            // Check permissions
            if (
              article.author?.id !== user.id &&
              user.role?.name !== 'Administrator'
            ) {
              failed++;
              errors.push(`No permission to publish article ${id}`);
              continue;
            }

            await strapi.entityService.update('api::article.article', id, {
              data: {
                publishedAt: new Date(),
              },
            });

            published++;
          } catch (error: any) {
            failed++;
            errors.push(`Error publishing article ${id}: ${error.message}`);
          }
        }

        return {
          success: failed === 0,
          published,
          failed,
          errors,
        };
      },
    },
  },
};
```

#### GraphQL Mutation Examples

```graphql
# Publish a single article
mutation {
  publishArticle(id: "1") {
    data {
      id
      documentId
      attributes {
        title
        publishedAt
      }
    }
  }
}

# Unpublish article
mutation {
  unpublishArticle(id: "1") {
    data {
      id
      attributes {
        publishedAt
      }
    }
  }
}

# Update article views
mutation {
  updateArticleViews(id: "1") {
    data {
      id
      attributes {
        views
      }
    }
  }
}

# Bulk publish articles
mutation {
  bulkPublishArticles(ids: ["1", "2", "3"]) {
    success
    published
    failed
    errors
  }
}
```

#### Advanced Mutation: Create Article with Validation

```typescript
// Create article with custom validation and side effects
createArticle: async (parent: any, args: any, context: any) => {
  const { data } = args;
  const { user } = context.state;

  if (!user) {
    throw new Error('Authentication required');
  }

  // Custom validation
  if (!data.title || data.title.length < 10) {
    throw new Error('Title must be at least 10 characters');
  }

  if (!data.content || data.content.length < 100) {
    throw new Error('Content must be at least 100 characters');
  }

  // Generate slug
  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Create article
  const article = await strapi.entityService.create(
    'api::article.article',
    {
      data: {
        ...data,
        slug,
        author: user.id,
        publishedAt: data.publish ? new Date() : null,
      },
    }
  );

  // Send notification if published
  if (article.publishedAt) {
    await strapi
      .service('api::article.article')
      .sendPublishNotification(article.id);
  }

  return {
    data: {
      id: article.id,
      documentId: article.documentId,
      attributes: article,
    },
  };
},
```

### GraphQL Response Transformations

Transform GraphQL responses to add computed fields or modify data structure.

```typescript
// Add computed fields to GraphQL responses
resolvers: {
  Article: {
    // Add reading time field
    readingTime: (parent: any) => {
      const wordCount = parent.content?.split(/\s+/).length || 0;
      return Math.ceil(wordCount / 200);
    },

    // Add excerpt field
    excerpt: (parent: any) => {
      return parent.content?.substring(0, 150) + '...' || '';
    },

    // Add formatted date
    formattedPublishedAt: (parent: any) => {
      if (!parent.publishedAt) return null;
      return new Date(parent.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
  },
},
```

**GraphQL Query with Computed Fields:**

```graphql
query {
  articles {
    id
    title
    content
    readingTime
    excerpt
    formattedPublishedAt
  }
}
```

### GraphQL Authentication

GraphQL mutations and protected queries require authentication.

#### Authenticating GraphQL Requests

```typescript
// In your GraphQL resolver
const { user } = context.state;

if (!user) {
  throw new Error('Authentication required');
}

// Check user role
if (user.role?.name !== 'Administrator') {
  throw new Error('Admin access required');
}
```

#### Example: Protected Mutation

```typescript
// Only authenticated users can publish articles
publishArticle: async (parent: any, args: any, context: any) => {
  const { user } = context.state;

  if (!user) {
    throw new Error('You must be logged in to publish articles');
  }

  // Rest of the mutation logic...
},
```

---

## API Middleware

Middleware functions execute before requests reach controllers. They're useful for logging, authentication, rate limiting, and request transformation.

### Understanding Middleware

Middleware runs in sequence and can:
- Modify request/response
- Stop request processing
- Add data to context
- Log requests

### Creating Custom Middleware

**Use Case:** Log all API requests with timing information.

```typescript
// src/middlewares/api-logger.ts
import type { Core } from '@strapi/strapi';

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<any>) => {
    const start = Date.now();

    // Log request
    strapi.log.info(`[${ctx.method}] ${ctx.url}`);

    // Add request ID to context
    ctx.state.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await next();
    } catch (error: any) {
      // Log errors
      strapi.log.error(`[${ctx.method}] ${ctx.url} - Error:`, error);
      throw error;
    }

    // Log response
    const duration = Date.now() - start;
    strapi.log.info(
      `[${ctx.method}] ${ctx.url} - ${ctx.status} - ${duration}ms`
    );
  };
};
```

### Registering Middleware

```typescript
// config/middlewares.ts
export default [
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
  'global::api-logger', // Your custom middleware
];
```

### Route-Specific Middleware

Apply middleware to specific routes:

```typescript
// src/api/article/routes/article.ts
export default {
  routes: [
    {
      method: 'POST',
      path: '/articles',
      handler: 'article.create',
      config: {
        middlewares: ['global::api-logger', 'global::rate-limit'],
      },
    },
  ],
};
```

---

## API Policies

Policies are authorization functions that determine if a user can access a resource. They return `true` to allow access or `false` to deny it.

### Understanding Policies

Policies check:
- User authentication status
- User roles and permissions
- Resource ownership
- Custom business rules

### Creating Policies

**Use Case:** Only allow article owners or admins to update articles.

```typescript
// src/policies/is-owner-or-admin.ts
import type { Core } from '@strapi/strapi';

export default async (
  policyContext: any,
  config: any,
  { strapi }: { strapi: Core.Strapi }
) => {
  const { id } = policyContext.params;
  const user = policyContext.state.user;

  if (!user) {
    return false; // Not authenticated
  }

  // Admins can always access
  if (user.role?.name === 'Administrator') {
    return true;
  }

  // Check if user owns the resource
  const entry = await strapi.entityService.findOne(
    'api::article.article',
    id,
    {
      populate: ['author'],
    }
  );

  if (!entry) {
    return false; // Resource doesn't exist
  }

  return entry.author?.id === user.id;
};
```

### Using Policies

```typescript
// src/api/article/routes/article.ts
export default {
  routes: [
    {
      method: 'PUT',
      path: '/articles/:id',
      handler: 'article.update',
      config: {
        policies: ['global::is-owner-or-admin'],
      },
    },
    {
      method: 'DELETE',
      path: '/articles/:id',
      handler: 'article.delete',
      config: {
        policies: ['global::is-owner-or-admin'],
      },
    },
  ],
};
```

### Policy with Configuration

Create reusable policies that accept configuration:

```typescript
// src/policies/has-role.ts
export default async (policyContext: any, config: any, { strapi }: any) => {
  const { role } = config; // Get role from config
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  return user.role?.name === role;
};
```

**Using Configured Policy:**

```typescript
{
  method: 'POST',
  path: '/articles',
  handler: 'article.create',
  config: {
    policies: [
      {
        name: 'global::has-role',
        config: { role: 'Editor' },
      },
    ],
  },
}
```

---

## Error Handling

Proper error handling provides clear feedback to API consumers and helps with debugging.

### Custom Error Responses

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async find(ctx) {
      try {
        const { data, meta } = await super.find(ctx);
        return { data, meta };
      } catch (error: any) {
        strapi.log.error('Error in find:', error);

        return ctx.badRequest('Failed to fetch articles', {
          error: error.message,
          code: 'FETCH_ERROR',
        });
      }
    },

    async create(ctx) {
      try {
        const { data } = ctx.request.body;

        // Validation
        if (!data.title) {
          return ctx.badRequest('Title is required');
        }

        if (data.title.length < 10) {
          return ctx.badRequest('Title must be at least 10 characters');
        }

        const response = await super.create(ctx);
        return response;
      } catch (error: any) {
        if (error.name === 'ValidationError') {
          return ctx.badRequest('Validation failed', {
            errors: error.errors,
          });
        }

        return ctx.internalServerError('Failed to create article', {
          error: error.message,
        });
      }
    },
  })
);
```

### Global Error Handler Middleware

```typescript
// src/middlewares/error-handler.ts
import type { Core } from '@strapi/strapi';

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<any>) => {
    try {
      await next();
    } catch (error: any) {
      strapi.log.error('API Error:', error);

      // Custom error response
      ctx.status = error.status || 500;
      ctx.body = {
        error: {
          message: error.message || 'Internal server error',
          status: ctx.status,
          code: error.code || 'INTERNAL_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
          }),
        },
      };
    }
  };
};
```

### Standardized Error Response Format

```typescript
// Consistent error format across all endpoints
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

API versioning allows you to make breaking changes without affecting existing clients.

### Route Versioning

```typescript
// src/api/v1/article/routes/article.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/v1/articles',
      handler: 'article.find',
    },
  ],
};

// src/api/v2/article/routes/article.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/v2/articles',
      handler: 'article.find', // Different implementation
    },
  ],
};
```

### Version Middleware

```typescript
// src/middlewares/api-version.ts
export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: () => Promise<any>) => {
    // Extract version from header or URL
    const version =
      ctx.request.headers['api-version'] ||
      ctx.url.split('/')[1] ||
      'v1';

    ctx.state.apiVersion = version;
    await next();
  };
};
```

---

## Rate Limiting

Rate limiting prevents abuse by limiting the number of requests from a single IP.

### Rate Limit Middleware

```typescript
// src/middlewares/rate-limit.ts
import rateLimit from 'express-rate-limit';

export default (config: any, { strapi }: any) => {
  const limiter = rateLimit({
    windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
    max: config.max || 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  return async (ctx: any, next: () => Promise<any>) => {
    await limiter(ctx.request, ctx.response, next);
  };
};
```

### Using Rate Limiting

```typescript
// config/middlewares.ts
export default [
  // ... other middlewares
  {
    name: 'global::rate-limit',
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per IP
    },
  },
];
```

---

## Best Practices

### API Design

1. **Follow REST Conventions**: Use standard HTTP methods and status codes
2. **Consistent Responses**: Use consistent response formats across endpoints
3. **Error Handling**: Provide clear, actionable error messages
4. **Validation**: Validate all inputs before processing
5. **Documentation**: Document all endpoints and their parameters

### Performance

1. **Pagination**: Always paginate large datasets
2. **Filtering**: Provide filtering options to reduce data transfer
3. **Caching**: Implement caching for frequently accessed data
4. **Optimization**: Optimize database queries (use populate wisely)

### Security

1. **Authentication**: Require authentication for protected routes
2. **Authorization**: Use policies to check permissions
3. **Input Validation**: Validate and sanitize all inputs
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Sanitization**: Always sanitize outputs to prevent data leaks

---

## Complete Example: Article API

Here's a complete example combining all concepts:

```typescript
// src/api/article/controllers/article.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::article.article',
  ({ strapi }) => ({
    async find(ctx) {
      // Add default filters
      ctx.query = {
        ...ctx.query,
        filters: {
          ...ctx.query.filters,
          publishedAt: { $notNull: true },
        },
      };

      const { data, meta } = await super.find(ctx);

      // Transform response
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
        }
      );

      return { data: entries };
    },
  })
);
```

```typescript
// src/api/article/routes/article.ts
import type { Core } from '@strapi/strapi';

export default factories.createCoreRouter('api::article.article', {
  config: {
    find: {
      auth: false, // Public access
      policies: [],
      middlewares: [],
    },
    findOne: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    create: {
      auth: true,
      policies: ['plugin::users-permissions.isAuthenticated'],
      middlewares: [],
    },
    update: {
      auth: true,
      policies: ['global::is-owner-or-admin'],
      middlewares: [],
    },
    delete: {
      auth: true,
      policies: ['global::is-owner-or-admin'],
      middlewares: [],
    },
  },
});

// Custom routes
const customRoutes: Core.RouterConfig = {
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
  ],
};

export { customRoutes };
```

---

## References

- [Strapi REST API Documentation](https://docs.strapi.io/dev-docs/api/rest)
- [Strapi GraphQL API Documentation](https://docs.strapi.io/dev-docs/api/graphql)
- [Strapi Backend Customization](https://docs.strapi.io/dev-docs/backend-customization)
- [Strapi Middlewares](https://docs.strapi.io/dev-docs/configurations/middlewares)
- [Strapi Policies](https://docs.strapi.io/dev-docs/backend-customization/policies)

---

## Key Takeaways

### REST API
- Extend default controllers to add custom logic
- Create custom routes for specialized operations
- Transform responses to match frontend needs
- Always use sanitization when replacing core actions

### GraphQL API
- Custom resolvers extend default functionality
- Mutations handle data modifications
- Use authentication and authorization in resolvers
- Transform responses to add computed fields

### Middleware & Policies
- Middleware handles cross-cutting concerns
- Policies enforce authorization rules
- Both can be applied globally or per-route

### Best Practices
- Always validate inputs
- Handle errors gracefully
- Use consistent response formats
- Document your API endpoints
- Implement rate limiting for production
