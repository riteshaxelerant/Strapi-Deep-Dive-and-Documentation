# GraphQL API Guide

## Overview

Strapi provides a GraphQL API through the GraphQL plugin. This guide covers enabling GraphQL, configuring the plugin, writing queries and mutations, authentication, and best practices.

**Reference:** [Strapi GraphQL API Documentation](https://docs.strapi.io/cms/api/graphql)

---

## Enabling GraphQL

### Installation

```bash
# Using Yarn
yarn strapi install graphql

# Using npm
npm run strapi install graphql
```

### Configuration

```javascript
// config/plugins.js
module.exports = {
  graphql: {
    enabled: true,
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

### Configuration Options

- **endpoint**: GraphQL endpoint path (default: `/graphql`)
- **shadowCRUD**: Auto-generate GraphQL schema from Content Types
- **playgroundAlways**: Always show GraphQL playground (development only)
- **depthLimit**: Maximum query depth (prevents deep nested queries)
- **amountLimit**: Maximum number of results
- **apolloServer**: Apollo Server configuration

---

## GraphQL Schema

### Auto-Generated Schema

Strapi automatically generates GraphQL schema from your Content Types.

#### Example Schema

```graphql
type Article {
  id: ID!
  documentId: String!
  title: String!
  content: String
  publishedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
  author: Author
  categories: [Category]
}

type ArticleEntity {
  id: ID
  documentId: String
  attributes: Article
}

type ArticleEntityResponse {
  data: ArticleEntity
  meta: ResponseMeta
}

type ArticleEntityResponseCollection {
  data: [ArticleEntity!]!
  meta: ResponseCollectionMeta
}
```

### Custom Schema

You can extend the schema with custom types and resolvers.

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

---

## Queries

### Basic Queries

#### Get All Entries

```graphql
query {
  articles {
    data {
      id
      documentId
      attributes {
        title
        content
        publishedAt
      }
    }
    meta {
      pagination {
        total
        page
        pageSize
        pageCount
      }
    }
  }
}
```

#### Get Single Entry

```graphql
query {
  article(id: 1) {
    data {
      id
      attributes {
        title
        content
        author {
          data {
            attributes {
              name
              email
            }
          }
        }
      }
    }
  }
}
```

#### Get Entry by Document ID

```graphql
query {
  article(documentId: "abc123def456") {
    data {
      id
      attributes {
        title
      }
    }
  }
}
```

### Filtering

```graphql
query {
  articles(
    filters: {
      title: { contains: "Article" }
      views: { gt: 100 }
    }
  ) {
    data {
      id
      attributes {
        title
        views
      }
    }
  }
}
```

#### Complex Filters

```graphql
query {
  articles(
    filters: {
      or: [
        { title: { contains: "Article" } }
        { content: { contains: "Article" } }
      ]
      and: [
        { views: { gt: 100 } }
        { publishedAt: { notNull: true } }
      ]
    }
  ) {
    data {
      id
      attributes {
        title
      }
    }
  }
}
```

#### Filter Relations

```graphql
query {
  articles(
    filters: {
      author: {
        id: { eq: 1 }
      }
      categories: {
        name: { eq: "Tech" }
      }
    }
  ) {
    data {
      id
      attributes {
        title
      }
    }
  }
}
```

### Sorting

```graphql
query {
  articles(sort: "publishedAt:desc") {
    data {
      id
      attributes {
        title
        publishedAt
      }
    }
  }
}

# Multiple fields
query {
  articles(sort: ["publishedAt:desc", "title:asc"]) {
    data {
      id
      attributes {
        title
        publishedAt
      }
    }
  }
}
```

### Pagination

```graphql
query {
  articles(
    pagination: {
      page: 1
      pageSize: 10
    }
  ) {
    data {
      id
      attributes {
        title
      }
    }
    meta {
      pagination {
        page
        pageSize
        pageCount
        total
      }
    }
  }
}
```

### Population (Relations)

```graphql
query {
  articles {
    data {
      id
      attributes {
        title
        author {
          data {
            attributes {
              name
              email
            }
          }
        }
        categories {
          data {
            attributes {
              name
            }
          }
        }
      }
    }
  }
}
```

### Field Selection

```graphql
query {
  articles {
    data {
      id
      attributes {
        title
        content
        # Only select needed fields
      }
    }
  }
}
```

---

## Mutations

### Create Entry

```graphql
mutation {
  createArticle(data: {
    title: "New Article"
    content: "Article content"
    author: 1
    categories: [1, 2]
  }) {
    data {
      id
      attributes {
        title
        content
      }
    }
  }
}
```

### Update Entry

```graphql
mutation {
  updateArticle(
    id: 1
    data: {
      title: "Updated Title"
      content: "Updated content"
    }
  ) {
    data {
      id
      attributes {
        title
        content
      }
    }
  }
}
```

### Update by Document ID

```graphql
mutation {
  updateArticle(
    documentId: "abc123def456"
    data: {
      title: "Updated Title"
    }
  ) {
    data {
      id
      attributes {
        title
      }
    }
  }
}
```

### Delete Entry

```graphql
mutation {
  deleteArticle(id: 1) {
    data {
      id
    }
  }
}
```

### Publish Entry

```graphql
mutation {
  publishArticle(id: 1) {
    data {
      id
      attributes {
        publishedAt
      }
    }
  }
}
```

### Unpublish Entry

```graphql
mutation {
  unpublishArticle(id: 1) {
    data {
      id
      attributes {
        publishedAt
      }
    }
  }
}
```

---

## Custom Resolvers

### Creating Custom Resolvers

```javascript
// src/api/article/config/schema.graphql.js
module.exports = {
  typeDefs: `
    type Query {
      featuredArticles: [Article]
      searchArticles(query: String!): [Article]
    }
    
    type Mutation {
      publishArticle(id: ID!): Article
    }
  `,
  resolvers: {
    Query: {
      featuredArticles: async (parent, args, context) => {
        const entries = await strapi.entityService.findMany('api::article.article', {
          filters: {
            featured: true,
            publishedAt: { $notNull: true }
          },
          sort: { publishedAt: 'desc' },
          limit: 10
        });

        return entries;
      },
      searchArticles: async (parent, args, context) => {
        const { query } = args;

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
    },
    Mutation: {
      publishArticle: async (parent, args, context) => {
        const { id } = args;

        const entry = await strapi.entityService.update('api::article.article', id, {
          data: {
            publishedAt: new Date()
          }
        });

        return entry;
      }
    }
  }
};
```

---

## GraphQL Authentication

### JWT Authentication

```javascript
// Include JWT token in Authorization header
fetch('http://localhost:1337/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    query: `
      query {
        articles {
          data {
            id
            attributes {
              title
            }
          }
        }
      }
    `
  })
});
```

### API Token Authentication

```javascript
fetch('http://localhost:1337/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`
  },
  body: JSON.stringify({
    query: `...`
  })
});
```

---

## GraphQL Playground

### Accessing Playground

Once GraphQL is enabled, access the playground at:
```
http://localhost:1337/graphql
```

### Playground Features

- **Interactive Query Editor**: Write and test queries
- **Schema Explorer**: Browse available types and fields
- **Query History**: View previous queries
- **Documentation**: Auto-generated API documentation

### Disabling Playground in Production

```javascript
// config/plugins.js
module.exports = {
  graphql: {
    enabled: true,
    config: {
      playgroundAlways: false, // Disable in production
    },
  },
};
```

---

## Advanced Queries

### Nested Queries

```graphql
query {
  articles {
    data {
      id
      attributes {
        title
        author {
          data {
            attributes {
              name
              profile {
                data {
                  attributes {
                    bio
                    avatar {
                      data {
                        attributes {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Fragments

```graphql
fragment ArticleFields on Article {
  id
  title
  content
  publishedAt
}

query {
  articles {
    data {
      attributes {
        ...ArticleFields
      }
    }
  }
}
```

### Variables

```graphql
query GetArticles($filters: ArticleFiltersInput, $sort: [String]) {
  articles(filters: $filters, sort: $sort) {
    data {
      id
      attributes {
        title
      }
    }
  }
}
```

```javascript
// Variables
{
  "filters": {
    "title": { "contains": "Article" }
  },
  "sort": ["publishedAt:desc"]
}
```

---

## Best Practices

### Performance

1. **Limit Depth**: Use depthLimit to prevent deep queries
2. **Limit Amount**: Use amountLimit to prevent large result sets
3. **Selective Fields**: Only request needed fields
4. **Pagination**: Always paginate large datasets

### Security

1. **Authentication**: Protect sensitive queries
2. **Input Validation**: Validate all inputs
3. **Rate Limiting**: Implement rate limiting
4. **Depth Limiting**: Set appropriate depth limits

### Query Optimization

1. **Batch Queries**: Combine multiple queries when possible
2. **Avoid N+1**: Use DataLoader pattern when needed
3. **Caching**: Implement query caching
4. **Indexing**: Ensure database indexes

---

## Common Patterns

### Pattern 1: Get Published Articles

```graphql
query {
  articles(
    filters: { publishedAt: { notNull: true } }
    sort: "publishedAt:desc"
  ) {
    data {
      id
      attributes {
        title
        publishedAt
      }
    }
  }
}
```

### Pattern 2: Search Articles

```graphql
query SearchArticles($query: String!) {
  articles(
    filters: {
      or: [
        { title: { contains: $query } }
        { content: { contains: $query } }
      ]
    }
  ) {
    data {
      id
      attributes {
        title
        content
      }
    }
  }
}
```

### Pattern 3: Get Related Content

```graphql
query {
  article(id: 1) {
    data {
      attributes {
        title
        categories {
          data {
            attributes {
              name
              articles(
                filters: { id: { ne: 1 } }
                pagination: { limit: 5 }
              ) {
                data {
                  attributes {
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue**: Schema not updating
- **Solution**: Restart Strapi server
- **Solution**: Clear cache
- **Solution**: Check Content Type changes

**Issue**: Query too complex
- **Solution**: Reduce query depth
- **Solution**: Simplify nested queries
- **Solution**: Increase depthLimit

**Issue**: Authentication errors
- **Solution**: Verify token is valid
- **Solution**: Check token permissions
- **Solution**: Ensure Authorization header format

---

## References

- [Strapi GraphQL API Documentation](https://docs.strapi.io/cms/api/graphql)
- [Strapi GraphQL Configuration](https://docs.strapi.io/dev-docs/configurations/plugins#graphql)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

---

## Notes

### Key Takeaways

- GraphQL provides flexible querying
- Schema is auto-generated from Content Types
- Use filters, sort, and pagination
- Custom resolvers extend functionality
- Authentication required for protected queries

### Important Reminders

- Enable GraphQL plugin first
- Set appropriate depth and amount limits
- Use pagination for large datasets
- Protect sensitive queries with authentication
- Test queries in GraphQL playground

