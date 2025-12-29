# Strapi Architecture Overview

## Overview

This document provides a comprehensive overview of Strapi's architecture, core concepts, and internal structure. Understanding the architecture is crucial for effective development, customization, and troubleshooting.

## Core Architecture Principles

### 1. Headless CMS Architecture

Strapi follows a **headless CMS** architecture pattern:

- **Backend (Content Management)**: Strapi provides the admin panel and content management layer
- **Frontend (Presentation)**: Completely decoupled - can be any frontend framework or platform
- **API Layer**: REST and GraphQL APIs connect backend and frontend
- **Database Layer**: Stores content and configuration

```
┌─────────────────┐
│   Admin Panel   │
│  (Content Mgmt) │
└────────┬────────┘
         │
┌────────▼────────┐
│   Strapi Core   │
│  (API Server)   │
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │
│ (SQLite/Postgres│
│    /MySQL)      │
└─────────────────┘
```

### 2. MVC-Like Structure

Strapi follows an MVC (Model-View-Controller) pattern:

- **Models**: Define data structure (Content Types)
- **Controllers**: Handle business logic and API endpoints
- **Services**: Reusable business logic
- **Views**: Admin panel UI (React-based)

### 3. Plugin-Based Architecture

Strapi is built on a plugin system:
- Core functionality is modular
- Custom plugins can extend functionality
- Admin panel is plugin-based
- API features are plugin-based

---

## Project File Structure

When you create a Strapi project, you get the following structure:

```
my-strapi-project/
├── .env                      # Environment variables
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore rules
├── README.md                 # Project README
├── package.json              # Dependencies and scripts
├── package-lock.json         # Dependency lock file
│
├── config/                   # Configuration files
│   ├── database.js           # Database configuration
│   ├── server.js             # Server configuration
│   ├── admin.js              # Admin panel configuration
│   ├── middlewares.js        # Middleware configuration
│   └── plugins.js            # Plugin configuration
│
├── database/                 # Database migrations (if using)
│   └── migrations/          # Migration files
│
├── public/                   # Public assets
│   └── uploads/              # Uploaded media files
│
├── src/                      # Source code (main application)
│   ├── api/                  # API routes and logic
│   │   └── [content-type]/   # Each content type has its own folder
│   │       ├── content-types/ # Content type definitions
│   │       │   └── [name]/
│   │       │       ├── schema.json    # Content type schema
│   │       │       └── lifecycles.js  # Lifecycle hooks
│   │       ├── controllers/   # Custom controllers
│   │       │   └── [name].js
│   │       ├── routes/       # Custom routes
│   │       │   └── [name].js
│   │       └── services/     # Custom services
│   │           └── [name].js
│   │
│   ├── components/          # Reusable components
│   │   └── [component-name]/
│   │       └── schema.json
│   │
│   ├── extensions/          # Extensions to core/plugins
│   │   └── [plugin-name]/   # Plugin extensions
│   │
│   ├── policies/            # Custom policies (middleware)
│   │   └── [policy-name].js
│   │
│   ├── middlewares/         # Custom middlewares
│   │   └── [middleware-name].js
│   │
│   └── index.js             # Application entry point
│
├── .tmp/                    # Temporary files (build, cache)
│   └── data.db              # SQLite database (if using SQLite)
│
└── node_modules/            # Dependencies
```

---

## Directory Structure Explained

### `/config` - Configuration Files

Contains all configuration files for your Strapi application.

#### `config/database.js`
- Database connection settings
- Connection pooling configuration
- Database client selection (SQLite, PostgreSQL, MySQL)

**Example:**
```javascript
module.exports = ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'sqlite'),
    connection: {
      filename: env('DATABASE_FILENAME', '.tmp/data.db'),
    },
  },
});
```

#### `config/server.js`
- Server host and port configuration
- CORS settings
- Proxy configuration
- Application keys

#### `config/admin.js`
- Admin panel configuration
- JWT secrets
- Admin URL settings
- API token configuration

#### `config/middlewares.js`
- Middleware stack configuration
- Order of middleware execution
- Custom middleware settings

#### `config/plugins.js`
- Plugin-specific configurations
- Third-party plugin settings
- Feature toggles

### `/src/api` - API Layer

Contains all API-related code organized by content type.

#### Content Type Structure

Each content type has its own directory:

```
src/api/article/
├── content-types/
│   └── article/
│       ├── schema.json       # Field definitions, relationships
│       └── lifecycles.js     # Lifecycle hooks (beforeCreate, afterUpdate, etc.)
├── controllers/
│   └── article.js           # Custom controller logic
├── routes/
│   └── article.js            # Custom route definitions
└── services/
    └── article.js            # Business logic services
```

**schema.json** - Defines the content type structure:
```json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article"
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "content": {
      "type": "richtext"
    }
  }
}
```

**lifecycles.js** - Lifecycle hooks:
```javascript
module.exports = {
  async beforeCreate(event) {
    // Logic before creating an entry
  },
  async afterCreate(event) {
    // Logic after creating an entry
  },
};
```

**controllers/article.js** - Custom controller:
```javascript
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async customAction(ctx) {
    // Custom logic
  },
}));
```

**services/article.js** - Business logic:
```javascript
module.exports = createCoreService('api::article.article', ({ strapi }) => ({
  async customServiceMethod(data) {
    // Reusable business logic
  },
}));
```

### `/src/components` - Reusable Components

Components are reusable field groups that can be used across multiple content types.

```
src/components/shared/seo/
└── schema.json
```

**schema.json:**
```json
{
  "collectionName": "components_shared_seo",
  "info": {
    "displayName": "SEO",
    "description": ""
  },
  "attributes": {
    "metaTitle": {
      "type": "string"
    },
    "metaDescription": {
      "type": "text"
    }
  }
}
```

### `/src/extensions` - Plugin Extensions

Extend or override core Strapi functionality and plugins.

```
src/extensions/users-permissions/
└── controllers/
    └── auth.js  # Override default auth controller
```

### `/src/policies` - Custom Policies

Policies are functions that execute before controllers. Used for authorization and validation.

```javascript
module.exports = async (policyContext, config, { strapi }) => {
  // Policy logic
  return true; // or false to block
};
```

### `/src/middlewares` - Custom Middlewares

Custom middleware functions that run on every request.

```javascript
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Middleware logic
    await next();
  };
};
```

### `/public` - Public Assets

Files in this directory are served statically.

- `/public/uploads/` - Media files uploaded through Strapi

### `/.tmp` - Temporary Files

- Build artifacts
- SQLite database file (if using SQLite)
- Cache files
- Temporary uploads

---

## Request Lifecycle

Understanding how requests flow through Strapi is crucial for debugging and customization.

### 1. HTTP Request Arrives

```
Client Request → Strapi Server
```

### 2. Middleware Stack

Requests pass through middleware in the order defined in `config/middlewares.js`:

```
Request
  ↓
1. logger          # Logs request
  ↓
2. errors          # Error handling
  ↓
3. security        # Security headers, CSP
  ↓
4. cors            # CORS handling
  ↓
5. poweredBy       # X-Powered-By header
  ↓
6. query           # Query parsing
  ↓
7. body            # Body parsing
  ↓
8. session         # Session management
  ↓
9. favicon         # Favicon handling
  ↓
10. public         # Static file serving
  ↓
Custom Middlewares
  ↓
Route Handler
```

### 3. Route Matching

Strapi matches the request to a route:
- **REST API Routes**: Auto-generated from content types
- **Custom Routes**: Defined in `src/api/[content-type]/routes/`
- **Plugin Routes**: Defined by plugins

### 4. Policy Execution

Policies run before controllers:
- **Global Policies**: Applied to all routes
- **Route-Specific Policies**: Applied to specific routes
- **Content-Type Policies**: Applied to content type routes

### 5. Controller Execution

Controller handles the request:
- **Default Controllers**: Auto-generated CRUD operations
- **Custom Controllers**: Custom logic in `controllers/` directory

### 6. Service Layer

Business logic in services:
- **Core Services**: Default service methods
- **Custom Services**: Custom business logic

### 7. Model/Database Layer

Database operations:
- **ORM Layer**: Strapi uses Bookshelf/Knex (SQL) or Mongoose (MongoDB)
- **Query Building**: Strapi query engine
- **Database**: Actual database operations

### 8. Response

Response sent back to client:
- **JSON Response**: For API requests
- **HTML Response**: For admin panel
- **File Response**: For static files

### Complete Flow Diagram

```
HTTP Request
    ↓
Middleware Stack
    ↓
Route Matching
    ↓
Policy Check
    ↓
Controller
    ↓
Service
    ↓
Model/ORM
    ↓
Database
    ↓
Response
```

---

## Database Layer

### Database Abstraction

Strapi uses an ORM (Object-Relational Mapping) layer that abstracts database operations:

- **SQL Databases**: Uses Bookshelf.js and Knex.js
- **NoSQL Databases**: Uses native drivers

### Supported Databases

1. **SQLite** (Default for Quickstart)
   - File-based database
   - No separate server needed
   - Perfect for development

2. **PostgreSQL** (Recommended for Production)
   - Robust relational database
   - Advanced features
   - Excellent performance

3. **MySQL/MariaDB**
   - Widely used
   - Good performance
   - Compatible with existing infrastructure

### Database Schema

Strapi automatically creates database tables based on:
- Content type schemas
- Component schemas
- Relationship definitions

**Table Naming Convention:**
- Content Types: `[content-type-name]s` (pluralized)
- Components: `components_[category]_[name]`
- Relations: Junction tables for many-to-many relationships

### Query Engine

Strapi provides a powerful query engine with:
- **Filtering**: Complex filter queries
- **Sorting**: Multi-field sorting
- **Pagination**: Built-in pagination
- **Population**: Relationship population
- **Field Selection**: Select specific fields

---

## Plugin System

### Core Plugins

Strapi comes with several core plugins:

1. **Content Manager**: Manages content types
2. **Content Type Builder**: Build content types via UI
3. **Users & Permissions**: Authentication and authorization
4. **Upload**: Media file management
5. **Email**: Email sending
6. **GraphQL**: GraphQL API (optional)
7. **i18n**: Internationalization (optional)

### Plugin Architecture

Plugins are self-contained modules with:
- **Backend**: API routes, controllers, services
- **Frontend**: Admin panel UI components
- **Configuration**: Plugin-specific config

### Plugin Structure

```
plugins/my-plugin/
├── config/
│   └── schema.json
├── server/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── index.js
└── admin/
    └── src/
        └── index.js
```

### Custom Plugins

You can create custom plugins to:
- Add new features
- Extend existing functionality
- Integrate third-party services
- Create admin panel widgets

---

## Admin Panel Architecture

### Technology Stack

The Strapi admin panel is built with:
- **React**: UI framework
- **Redux**: State management
- **React Router**: Routing
- **Styled Components**: Styling
- **React Query**: Data fetching

### Admin Panel Structure

```
admin/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # React hooks
│   ├── utils/          # Utility functions
│   ├── store/          # Redux store
│   └── index.js        # Entry point
└── build/              # Built admin panel
```

### Admin Panel Features

1. **Content Manager**: Create, edit, delete content
2. **Content Type Builder**: Build content types visually
3. **Media Library**: Upload and manage media
4. **Settings**: Configure Strapi
5. **Users & Roles**: Manage users and permissions
6. **Plugins**: Manage and configure plugins

### Admin Panel Customization

You can customize the admin panel by:
- Extending plugins
- Creating custom plugins
- Overriding components
- Adding custom pages

---

## Core Concepts

### Content Types

Content types define the structure of your content:

- **Collection Types**: Multiple entries (e.g., Articles, Products)
- **Single Types**: Single entry (e.g., Homepage, Settings)

### Components

Reusable field groups:
- **Single Components**: One instance
- **Repeatable Components**: Multiple instances

### Dynamic Zones

Flexible content areas that can contain different components:
- Allows content editors to mix and match components
- Useful for page builders and flexible layouts

### Relations

Content types can relate to each other:
- **One-to-One**: One entry relates to one other entry
- **One-to-Many**: One entry relates to many entries
- **Many-to-Many**: Many entries relate to many entries

### Lifecycle Hooks

Functions that run at specific points:
- **beforeCreate**: Before creating an entry
- **afterCreate**: After creating an entry
- **beforeUpdate**: Before updating an entry
- **afterUpdate**: After updating an entry
- **beforeDelete**: Before deleting an entry
- **afterDelete**: After deleting an entry

### Policies

Authorization functions that run before controllers:
- Check permissions
- Validate data
- Block unauthorized access

### Middlewares

Functions that run on every request:
- Logging
- Authentication
- Request transformation
- Error handling

---

## API Architecture

### REST API

Strapi automatically generates REST endpoints for each content type:

```
GET    /api/articles          # List all articles
GET    /api/articles/:id      # Get single article
POST   /api/articles          # Create article
PUT    /api/articles/:id      # Update article
DELETE /api/articles/:id      # Delete article
```

### GraphQL API

Optional GraphQL API (requires plugin):
- Single endpoint: `/graphql`
- Flexible queries
- Type-safe queries

### API Features

- **Filtering**: Complex query filters
- **Sorting**: Multi-field sorting
- **Pagination**: Built-in pagination
- **Population**: Relationship population
- **Field Selection**: Select specific fields
- **Localization**: Multi-language support (if i18n enabled)

---

## Security Architecture

### Authentication

- **JWT Tokens**: For API authentication
- **Session Management**: For admin panel
- **OAuth Providers**: Optional OAuth integration

### Authorization

- **Role-Based Access Control (RBAC)**: Roles and permissions
- **Policies**: Custom authorization logic
- **Field-Level Permissions**: Control field access

### Security Features

- **CORS**: Cross-Origin Resource Sharing
- **CSP**: Content Security Policy
- **Rate Limiting**: API rate limiting
- **Input Validation**: Automatic input validation
- **SQL Injection Protection**: ORM prevents SQL injection

---

## Performance Considerations

### Caching

- **Response Caching**: Cache API responses
- **Query Caching**: Cache database queries
- **Static Asset Caching**: Cache static files

### Database Optimization

- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Efficient queries
- **Indexing**: Database indexes

### API Optimization

- **Field Selection**: Only fetch needed fields
- **Pagination**: Limit result sets
- **Population Control**: Control relationship loading

---

## Development vs Production

### Development Mode

- **Hot Reloading**: Automatic code reloading
- **Detailed Errors**: Full error stack traces
- **Debug Mode**: Additional logging
- **SQLite**: Default database

### Production Mode

- **Optimized Build**: Minified and optimized
- **Error Handling**: User-friendly errors
- **Performance**: Optimized for speed
- **PostgreSQL/MySQL**: Production databases

---

## Extension Points

### Where to Add Custom Code

1. **Controllers**: `src/api/[content-type]/controllers/`
2. **Services**: `src/api/[content-type]/services/`
3. **Routes**: `src/api/[content-type]/routes/`
4. **Policies**: `src/policies/`
5. **Middlewares**: `src/middlewares/`
6. **Plugins**: `src/plugins/` or separate plugin packages
7. **Extensions**: `src/extensions/`

---

## Best Practices

### File Organization

- Keep related code together
- Use consistent naming conventions
- Separate concerns (controllers, services, models)
- Document custom code

### Performance

- Use services for reusable logic
- Implement proper caching
- Optimize database queries
- Use pagination for large datasets

### Security

- Always validate input
- Use policies for authorization
- Keep dependencies updated
- Follow security best practices

### Code Quality

- Write clean, readable code
- Add comments for complex logic
- Follow JavaScript/TypeScript best practices
- Test your code

---

## Summary

Strapi's architecture is:

1. **Modular**: Plugin-based system
2. **Flexible**: Highly customizable
3. **API-First**: Headless CMS approach
4. **Developer-Friendly**: Clear structure and conventions
5. **Scalable**: Can handle large applications
6. **Secure**: Built-in security features

Understanding this architecture helps you:
- Navigate the codebase effectively
- Make informed customization decisions
- Debug issues efficiently
- Extend functionality properly
- Follow best practices

---

## Next Steps

After understanding the architecture:

1. **Explore the File Structure**: Navigate your Strapi project
2. **Create Content Types**: Build your data model
3. **Customize Controllers**: Add custom logic
4. **Create Plugins**: Extend functionality
5. **Study Request Flow**: Trace requests through the system

---

## References

- [Strapi Architecture Documentation](https://docs.strapi.io/dev-docs/backend-customization)
- [Strapi Plugin Development](https://docs.strapi.io/dev-docs/plugins-development)
- [Strapi API Documentation](https://docs.strapi.io/dev-docs/api/rest)

---

## Notes

### Architecture Decisions

1. **MVC Pattern**: Clear separation of concerns
2. **Plugin System**: Modular and extensible
3. **ORM Layer**: Database abstraction
4. **API-First**: Headless architecture

### Key Takeaways

- Strapi is highly customizable
- Clear file structure makes navigation easy
- Plugin system enables extensibility
- Understanding request lifecycle is crucial for debugging

