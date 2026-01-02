# REST API Guide

## Overview

Strapi automatically generates REST API endpoints for all Content Types. This guide covers REST API endpoints, query parameters, filtering, pagination, sorting, authentication, and usage examples.

**Reference:** [Strapi REST API Documentation](https://docs.strapi.io/cms/api/rest)

---

## API Endpoints

### Default Endpoints

For each Content Type, Strapi generates these endpoints:

```
GET    /api/{content-type}          # List all entries
GET    /api/{content-type}/{id}     # Get single entry
POST   /api/{content-type}          # Create entry
PUT    /api/{content-type}/{id}     # Update entry
DELETE /api/{content-type}/{id}     # Delete entry
```

### Example: Article Content Type

```
GET    /api/articles                # List all articles
GET    /api/articles/1              # Get article with ID 1
POST   /api/articles                # Create new article
PUT    /api/articles/1              # Update article 1
DELETE /api/articles/1              # Delete article 1
```

---

## Query Parameters

### Filtering

Filter entries using the `filters` parameter.

#### Basic Filters

```javascript
// Exact match
GET /api/articles?filters[title][$eq]=My Article

// Not equal
GET /api/articles?filters[title][$ne]=My Article

// Contains
GET /api/articles?filters[title][$contains]=Article

// Not contains
GET /api/articles?filters[title][$notContains]=Draft

// Starts with
GET /api/articles?filters[title][$startsWith]=My

// Ends with
GET /api/articles?filters[title][$endsWith]=Article

// Greater than
GET /api/articles?filters[views][$gt]=100

// Greater than or equal
GET /api/articles?filters[views][$gte]=100

// Less than
GET /api/articles?filters[views][$lt]=1000

// Less than or equal
GET /api/articles?filters[views][$lte]=1000

// In array
GET /api/articles?filters[id][$in][0]=1&filters[id][$in][1]=2&filters[id][$in][2]=3

// Not in array
GET /api/articles?filters[id][$notIn][0]=1&filters[id][$notIn][1]=2

// Is null
GET /api/articles?filters[publishedAt][$null]=true

// Is not null
GET /api/articles?filters[publishedAt][$notNull]=true
```

#### Complex Filters

```javascript
// AND condition
GET /api/articles?filters[title][$contains]=Article&filters[views][$gt]=100

// OR condition
GET /api/articles?filters[$or][0][title][$contains]=Article&filters[$or][1][content][$contains]=Article

// Nested conditions
GET /api/articles?filters[$and][0][title][$contains]=Article&filters[$and][1][views][$gt]=100
```

#### Filtering Relations

```javascript
// Filter by relation
GET /api/articles?filters[author][id][$eq]=1

// Filter by relation field
GET /api/articles?filters[author][name][$eq]=John

// Filter by multiple relations
GET /api/articles?filters[categories][id][$in][0]=1&filters[categories][id][$in][1]=2
```

### Sorting

Sort results using the `sort` parameter.

```javascript
// Single field ascending
GET /api/articles?sort=title

// Single field descending
GET /api/articles?sort=title:desc

// Multiple fields
GET /api/articles?sort[0]=publishedAt:desc&sort[1]=title:asc
```

### Pagination

Control pagination with `pagination` parameter.

```javascript
// Page-based pagination
GET /api/articles?pagination[page]=1&pagination[pageSize]=10

// Offset-based pagination
GET /api/articles?pagination[start]=0&pagination[limit]=10

// Get all entries (no pagination)
GET /api/articles?pagination[limit]=-1
```

#### Pagination Response

```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 50
    }
  }
}
```

### Population (Relations)

Populate relations using the `populate` parameter.

```javascript
// Populate all relations
GET /api/articles?populate=*

// Populate specific relation
GET /api/articles?populate=author

// Populate multiple relations
GET /api/articles?populate[0]=author&populate[1]=categories

// Populate nested relations
GET /api/articles?populate[author][populate]=profile

// Populate with filters
GET /api/articles?populate[categories][filters][name][$eq]=Tech

// Populate with sort
GET /api/articles?populate[categories][sort]=name:asc

// Populate with pagination
GET /api/articles?populate[categories][pagination][page]=1&populate[categories][pagination][pageSize]=5
```

### Field Selection

Select specific fields using the `fields` parameter.

```javascript
// Select specific fields
GET /api/articles?fields[0]=title&fields[1]=content&fields[2]=publishedAt

// Exclude fields (select all except)
GET /api/articles?fields[0]=*&fields[1]=!internalNotes&fields[2]=!draftContent
```

### Locale (i18n)

Filter by locale when i18n is enabled.

```javascript
// Get entries for specific locale
GET /api/articles?locale=en

// Get entries for all locales
GET /api/articles?locale=all
```

---

## API Authentication

### JWT Authentication

```javascript
// Include JWT token in Authorization header
fetch('http://localhost:1337/api/articles', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
```

### API Token Authentication

```javascript
// Include API token in Authorization header
fetch('http://localhost:1337/api/articles', {
  headers: {
    'Authorization': `Bearer ${apiToken}`
  }
});
```

### Public Access

```javascript
// No authentication required for public endpoints
fetch('http://localhost:1337/api/articles');
```

---

## Request Examples

### Create Entry

```javascript
POST /api/articles
Content-Type: application/json
Authorization: Bearer {token}

{
  "data": {
    "title": "My Article",
    "content": "Article content here",
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "author": 1,
    "categories": [1, 2]
  }
}
```

### Update Entry

```javascript
PUT /api/articles/1
Content-Type: application/json
Authorization: Bearer {token}

{
  "data": {
    "title": "Updated Title",
    "content": "Updated content"
  }
}
```

### Delete Entry

```javascript
DELETE /api/articles/1
Authorization: Bearer {token}
```

### Bulk Operations

```javascript
// Create multiple entries
POST /api/articles
{
  "data": [
    { "title": "Article 1", "content": "Content 1" },
    { "title": "Article 2", "content": "Content 2" }
  ]
}
```

---

## Response Format

### Success Response

```json
{
  "data": {
    "id": 1,
    "documentId": "abc123def456",
    "title": "My Article",
    "content": "Article content",
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "author": {
      "id": 1,
      "name": "John Doe"
    }
  },
  "meta": {}
}
```

### Collection Response

```json
{
  "data": [
    {
      "id": 1,
      "title": "Article 1"
    },
    {
      "id": 2,
      "title": "Article 2"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

### Error Response

```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Title is required",
    "details": {
      "errors": [
        {
          "path": ["title"],
          "message": "Title is required",
          "name": "ValidationError"
        }
      ]
    }
  }
}
```

---

## Advanced Query Examples

### Complex Filtering

```javascript
// Articles with title containing "Article" OR content containing "Article"
// AND views greater than 100
GET /api/articles?filters[$or][0][title][$contains]=Article&filters[$or][1][content][$contains]=Article&filters[views][$gt]=100
```

### Filtering with Relations

```javascript
// Articles by author "John" in category "Tech"
GET /api/articles?filters[author][name][$eq]=John&filters[categories][name][$eq]=Tech
```

### Sorting and Pagination

```javascript
// Get latest 10 articles, sorted by published date
GET /api/articles?sort=publishedAt:desc&pagination[page]=1&pagination[pageSize]=10
```

### Complete Example

```javascript
// Get featured articles by author, sorted by views, with pagination
GET /api/articles?filters[featured][$eq]=true&filters[author][id][$eq]=1&sort=views:desc&pagination[page]=1&pagination[pageSize]=10&populate=*
```

---

## API Rate Limiting

### Default Rate Limits

Strapi doesn't enforce rate limiting by default. Implement rate limiting using middleware.

### Custom Rate Limiting

```javascript
// src/middlewares/rate-limit.js
const rateLimit = require('express-rate-limit');

module.exports = (config, { strapi }) => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  });

  return async (ctx, next) => {
    await limiter(ctx.request, ctx.response, next);
  };
};
```

---

## Best Practices

### Performance

1. **Use Pagination**: Always paginate large datasets
2. **Selective Population**: Only populate needed relations
3. **Field Selection**: Select only required fields
4. **Indexing**: Ensure database indexes on filtered fields

### Security

1. **Authentication**: Protect sensitive endpoints
2. **Input Validation**: Validate all inputs
3. **Rate Limiting**: Implement rate limiting
4. **HTTPS**: Always use HTTPS in production

### API Design

1. **Consistent Responses**: Maintain consistent response format
2. **Error Handling**: Provide clear error messages
3. **Versioning**: Consider API versioning for breaking changes
4. **Documentation**: Document all endpoints

---

## Common Patterns

### Pattern 1: Get Published Content

```javascript
GET /api/articles?filters[publishedAt][$notNull]=true&sort=publishedAt:desc
```

### Pattern 2: Search Content

```javascript
GET /api/articles?filters[$or][0][title][$contains]=query&filters[$or][1][content][$contains]=query
```

### Pattern 3: Get Related Content

```javascript
GET /api/articles?filters[categories][id][$eq]=1&populate=author&sort=publishedAt:desc
```

### Pattern 4: Get User's Content

```javascript
GET /api/articles?filters[author][id][$eq]=1&populate=*
```

---

## Troubleshooting

### Common Issues

**Issue**: 403 Forbidden
- **Solution**: Check permissions for Content Type
- **Solution**: Verify authentication token
- **Solution**: Check API token permissions

**Issue**: 404 Not Found
- **Solution**: Verify Content Type name (plural)
- **Solution**: Check entry ID exists
- **Solution**: Verify endpoint URL

**Issue**: 400 Bad Request
- **Solution**: Check request body format
- **Solution**: Verify required fields
- **Solution**: Check filter syntax

**Issue**: Slow Queries
- **Solution**: Add pagination
- **Solution**: Limit population depth
- **Solution**: Add database indexes

---

## References

- [Strapi REST API Documentation](https://docs.strapi.io/cms/api/rest)
- [Strapi REST API Query Parameters](https://docs.strapi.io/cms/api/rest/guides/intro)
- [Strapi API Filters](https://docs.strapi.io/cms/api/rest/filters)
- [Strapi API Population](https://docs.strapi.io/cms/api/rest/populate-select)

---

## Notes

### Key Takeaways

- REST API is automatically generated for all Content Types
- Use filters for querying data
- Pagination is essential for performance
- Population loads relations
- Authentication required for protected endpoints

### Important Reminders

- Always use pagination for large datasets
- Populate relations selectively
- Use filters to reduce data transfer
- Implement rate limiting
- Validate all inputs

