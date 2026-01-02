# Performance Optimization Guide

## Overview

This guide covers performance optimization strategies for Strapi 5 applications, including caching, database optimization, API response optimization, asset optimization, and monitoring.

**Reference:** [Strapi Performance Best Practices](https://docs.strapi.io/dev-docs/deployment#performance-optimization)

---

## Performance Optimization Strategies

### 1. Caching Strategies

#### Response Caching

```javascript
// src/middlewares/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only cache GET requests
    if (ctx.method !== 'GET') {
      return await next();
    }

    const cacheKey = ctx.url;
    const cached = cache.get(cacheKey);

    if (cached) {
      ctx.body = cached;
      return;
    }

    await next();

    // Cache successful responses
    if (ctx.status === 200) {
      cache.set(cacheKey, ctx.body);
    }
  };
};
```

#### Redis Caching

```javascript
// Install: npm install redis
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.method !== 'GET') {
      return await next();
    }

    const cacheKey = `strapi:${ctx.url}`;
    const cached = await client.get(cacheKey);

    if (cached) {
      ctx.body = JSON.parse(cached);
      return;
    }

    await next();

    if (ctx.status === 200) {
      await client.setex(cacheKey, 600, JSON.stringify(ctx.body));
    }
  };
};
```

#### CDN Caching

```javascript
// config/middlewares.js
module.exports = [
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'https://cdn.yourdomain.com'],
        },
      },
    },
  },
];
```

**Cache-Control Headers:**

```javascript
// Set cache headers in controller
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    
    // Set cache headers
    ctx.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    
    return { data, meta };
  }
}));
```

---

### 2. Database Optimization

#### Query Optimization

```javascript
// ❌ DON'T: N+1 queries
const articles = await strapi.entityService.findMany('api::article.article');
for (const article of articles) {
  const author = await strapi.entityService.findOne('api::author.author', article.author);
}

// ✅ DO: Populate relations
const articles = await strapi.entityService.findMany('api::article.article', {
  populate: ['author']
});
```

#### Pagination

```javascript
// Always paginate large datasets
const articles = await strapi.entityService.findMany('api::article.article', {
  pagination: {
    page: 1,
    pageSize: 20
  }
});
```

#### Field Selection

```javascript
// Select only needed fields
const articles = await strapi.entityService.findMany('api::article.article', {
  fields: ['title', 'publishedAt'],
  populate: {
    author: {
      fields: ['name']
    }
  }
});
```

#### Database Indexing

```sql
-- Create indexes on frequently queried fields
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_featured ON articles(featured) WHERE featured = true;
```

#### Connection Pooling

```javascript
// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      // ... connection details
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      },
    },
  },
});
```

---

### 3. API Response Optimization

#### Response Compression

```javascript
// config/middlewares.js
const compression = require('compression');

module.exports = [
  {
    name: 'global::compression',
    config: {
      level: 6,
      threshold: 1024, // Only compress responses > 1KB
    },
  },
];
```

#### Response Transformation

```javascript
// Transform responses to reduce payload size
module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    
    // Transform to reduce size
    const transformed = data.map(item => ({
      id: item.id,
      title: item.attributes.title,
      excerpt: item.attributes.content.substring(0, 150),
      publishedAt: item.attributes.publishedAt
      // Exclude large fields
    }));
    
    return { data: transformed, meta };
  }
}));
```

#### Lazy Loading

```javascript
// Load relations only when needed
const article = await strapi.entityService.findOne('api::article.article', id, {
  populate: {
    author: {
      fields: ['name'] // Only load name, not full profile
    }
  }
});
```

---

### 4. Asset Optimization

#### Image Optimization

```javascript
// config/plugins.js
module.exports = {
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        // Cloudinary auto-optimizes images
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
    },
  },
};
```

#### CDN for Assets

```javascript
// Use CDN for media files
// Configure in upload provider settings
// Or use custom middleware to rewrite URLs
```

#### Asset Compression

```bash
# Compress images before upload
# Use tools like imagemin, sharp, etc.
```

---

### 5. Code Optimization

#### Lazy Loading Components

```javascript
// Load heavy components only when needed
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### Bundle Optimization

```javascript
// webpack.config.js
module.exports = (config, webpack) => {
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  };
  
  return config;
};
```

---

### 6. Monitoring and Profiling

#### Performance Monitoring

```javascript
// src/middlewares/performance.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const start = process.hrtime.bigint();
    
    await next();
    
    const duration = Number(process.hrtime.bigint() - start) / 1e6; // milliseconds
    
    if (duration > 1000) { // Log slow requests > 1s
      strapi.log.warn(`Slow request: ${ctx.method} ${ctx.url} took ${duration}ms`);
    }
    
    // Send to monitoring service
    if (process.env.MONITORING_ENABLED) {
      await sendMetrics({
        endpoint: ctx.url,
        method: ctx.method,
        duration,
        status: ctx.status
      });
    }
  };
};
```

#### Database Query Monitoring

```javascript
// Monitor database queries
strapi.db.connection.on('query', (query) => {
  if (query.sql.includes('SELECT') && query.bindings) {
    strapi.log.debug('Query:', query.sql, query.bindings);
  }
});
```

#### Memory Monitoring

```javascript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  strapi.log.info('Memory usage:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
  });
}, 60000); // Every minute
```

---

## Best Practices

### General Performance

1. **Pagination**: Always paginate large datasets
2. **Caching**: Implement caching at multiple levels
3. **Indexing**: Index frequently queried fields
4. **Compression**: Enable response compression
5. **CDN**: Use CDN for static assets

### Database Performance

1. **Connection Pooling**: Use connection pooling
2. **Query Optimization**: Optimize database queries
3. **Selective Population**: Only populate needed relations
4. **Field Selection**: Select only required fields
5. **Avoid N+1**: Use populate to avoid N+1 queries

### API Performance

1. **Response Size**: Minimize response payload
2. **Caching**: Cache API responses
3. **Compression**: Compress responses
4. **Lazy Loading**: Load data on demand
5. **Rate Limiting**: Implement rate limiting

### Asset Performance

1. **Image Optimization**: Optimize images
2. **CDN**: Use CDN for media files
3. **Lazy Loading**: Lazy load images
4. **Format Selection**: Use appropriate formats (WebP, etc.)
5. **Caching**: Cache static assets

---

## Performance Testing

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:1337/api/articles

# Using k6
k6 run load-test.js
```

### Load Test Script (k6)

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:1337/api/articles');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## Performance Metrics

### Key Metrics to Monitor

1. **Response Time**: Average response time
2. **Throughput**: Requests per second
3. **Error Rate**: Percentage of failed requests
4. **Database Query Time**: Time spent on database queries
5. **Memory Usage**: Application memory consumption
6. **CPU Usage**: CPU utilization

### Monitoring Tools

- **PM2**: Built-in monitoring
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure monitoring
- **Grafana**: Metrics visualization
- **Prometheus**: Metrics collection

---

## Troubleshooting Performance Issues

### Common Issues

**Issue**: Slow API responses
- **Solution**: Implement caching
- **Solution**: Optimize database queries
- **Solution**: Add database indexes
- **Solution**: Use pagination

**Issue**: High memory usage
- **Solution**: Optimize code
- **Solution**: Implement caching
- **Solution**: Increase server RAM
- **Solution**: Review memory leaks

**Issue**: Database performance
- **Solution**: Add indexes
- **Solution**: Optimize queries
- **Solution**: Use connection pooling
- **Solution**: Consider read replicas

---

## References

- [Strapi Performance Optimization](https://docs.strapi.io/dev-docs/deployment#performance-optimization)
- [Strapi Caching Guide](https://docs.strapi.io/cloud/getting-started/caching)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)

---

## Notes

### Key Takeaways

- Implement caching at multiple levels
- Optimize database queries and indexes
- Use pagination for large datasets
- Compress API responses
- Monitor performance metrics
- Use CDN for static assets

### Important Reminders

- Always paginate large datasets
- Monitor performance regularly
- Test performance under load
- Optimize based on metrics
- Keep dependencies updated
- Review and optimize regularly

