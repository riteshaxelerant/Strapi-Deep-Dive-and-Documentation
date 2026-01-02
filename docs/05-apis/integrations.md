# External Integrations Guide

## Overview

This guide covers integrating Strapi with external services, including webhooks, third-party APIs, payment gateways, email services, and other common integrations.

**Reference:** [Strapi Webhooks Documentation](https://docs.strapi.io/cms/features/webhooks)

---

## Webhooks

### Overview

Webhooks allow Strapi to send HTTP requests to external URLs when specific events occur. This enables real-time integration with external services.

### Webhook Events

Strapi triggers webhooks for these events:

- **Entry Create**: When an entry is created
- **Entry Update**: When an entry is updated
- **Entry Delete**: When an entry is deleted
- **Entry Publish**: When an entry is published
- **Entry Unpublish**: When an entry is unpublished

### Creating Webhooks

#### Via Admin Panel

1. Navigate to **Settings** > **Global Settings** > **Webhooks**
2. Click **Create new webhook**
3. Configure webhook:
   - **Name**: Descriptive name
   - **URL**: Endpoint URL to call
   - **Events**: Select events to trigger webhook
   - **Headers**: Custom headers (optional)
4. Click **Save**

#### Webhook Configuration

```javascript
// Webhook settings
{
  name: "Notify External Service",
  url: "https://api.external-service.com/webhook",
  events: [
    "entry.create",
    "entry.update",
    "entry.delete",
    "entry.publish"
  ],
  headers: {
    "Authorization": "Bearer token",
    "X-Custom-Header": "value"
  }
}
```

### Webhook Payload

#### Entry Create/Update/Delete

```json
{
  "event": "entry.create",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "model": "article",
  "entry": {
    "id": 1,
    "documentId": "abc123def456",
    "title": "My Article",
    "content": "Article content",
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Entry Publish/Unpublish

```json
{
  "event": "entry.publish",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "model": "article",
  "entry": {
    "id": 1,
    "documentId": "abc123def456",
    "title": "My Article",
    "publishedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Receiving Webhooks

#### Express.js Example

```javascript
// webhook-receiver.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { event, model, entry } = req.body;

  // Handle different events
  switch (event) {
    case 'entry.create':
      handleEntryCreate(model, entry);
      break;
    case 'entry.update':
      handleEntryUpdate(model, entry);
      break;
    case 'entry.delete':
      handleEntryDelete(model, entry);
      break;
    case 'entry.publish':
      handleEntryPublish(model, entry);
      break;
  }

  res.status(200).json({ received: true });
});

function handleEntryCreate(model, entry) {
  // Process created entry
  console.log(`Entry created: ${model}`, entry);
}

function handleEntryUpdate(model, entry) {
  // Process updated entry
  console.log(`Entry updated: ${model}`, entry);
}

function handleEntryDelete(model, entry) {
  // Process deleted entry
  console.log(`Entry deleted: ${model}`, entry);
}

function handleEntryPublish(model, entry) {
  // Process published entry
  console.log(`Entry published: ${model}`, entry);
}

app.listen(3000);
```

### Webhook Security

#### Verify Webhook Signature

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-strapi-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
});
```

---

## Third-Party Service Integrations

### Payment Gateway Integration

#### Stripe Integration

```javascript
// src/api/order/services/order.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = ({ strapi }) => ({
  async createPaymentIntent(orderId, amount) {
    const order = await strapi.entityService.findOne('api::order.order', orderId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id
      }
    });

    // Update order with payment intent
    await strapi.entityService.update('api::order.order', orderId, {
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'pending'
      }
    });

    return paymentIntent;
  },

  async confirmPayment(orderId, paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await strapi.entityService.update('api::order.order', orderId, {
        data: {
          paymentStatus: 'paid',
          paidAt: new Date()
        }
      });
    }

    return paymentIntent;
  }
});
```

### Email Service Integration

#### SendGrid Integration

```javascript
// config/plugins.js
module.exports = {
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: 'noreply@yourdomain.com',
        defaultReplyTo: 'support@yourdomain.com',
      },
    },
  },
};
```

#### Custom Email Service

```javascript
// src/services/email.js
const nodemailer = require('nodemailer');

module.exports = {
  async sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  }
};
```

### Cloud Storage Integration

#### AWS S3 Integration

```javascript
// config/plugins.js
module.exports = {
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET'),
        },
      },
    },
  },
};
```

#### Cloudinary Integration

```javascript
// config/plugins.js
module.exports = {
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
    },
  },
};
```

### Analytics Integration

#### Google Analytics

```javascript
// src/middlewares/analytics.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Track API requests
    if (ctx.request.url.startsWith('/api/')) {
      // Send to Google Analytics
      await trackEvent({
        event: 'api_request',
        endpoint: ctx.request.url,
        method: ctx.request.method,
        status: ctx.response.status
      });
    }
  };
};
```

### Search Service Integration

#### Algolia Integration

```javascript
// src/api/article/services/article.js
const algoliasearch = require('algoliasearch');

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = client.initIndex('articles');

module.exports = ({ strapi }) => ({
  async indexArticle(articleId) {
    const article = await strapi.entityService.findOne('api::article.article', articleId, {
      populate: ['author', 'categories']
    });

    await index.saveObject({
      objectID: article.id,
      title: article.title,
      content: article.content,
      author: article.author?.name,
      categories: article.categories?.map(c => c.name),
      publishedAt: article.publishedAt
    });
  },

  async searchArticles(query) {
    const { hits } = await index.search(query);
    return hits;
  }
});
```

---

## API Consumption Patterns

### Consuming External APIs

#### Fetch API

```javascript
// src/services/external-api.js
module.exports = {
  async fetchData(endpoint, options = {}) {
    const response = await fetch(`https://api.external.com/${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}`,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
};
```

#### Axios

```javascript
// src/services/external-api.js
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'https://api.external.com',
  headers: {
    'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}`
  }
});

module.exports = {
  async getData(endpoint) {
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  async postData(endpoint, data) {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  }
};
```

### Error Handling

```javascript
module.exports = {
  async callExternalAPI(endpoint, options) {
    try {
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      strapi.log.error('External API error:', error);
      
      // Retry logic
      if (options.retry && options.retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.callExternalAPI(endpoint, {
          ...options,
          retryCount: (options.retryCount || 0) + 1
        });
      }

      throw error;
    }
  }
};
```

---

## Integration Examples

### Example 1: Slack Notification

```javascript
// src/api/article/lifecycles.js
module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Send Slack notification
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `New article created: ${result.title}`,
        attachments: [{
          color: 'good',
          fields: [{
            title: 'Article',
            value: result.title,
            short: true
          }]
        }]
      })
    });
  }
};
```

### Example 2: Zapier Integration

```javascript
// Webhook to Zapier
// Configure webhook in Strapi to send to Zapier webhook URL
// Zapier handles the integration logic
```

### Example 3: Content Sync

```javascript
// src/services/content-sync.js
module.exports = {
  async syncToExternalCMS(articleId) {
    const article = await strapi.entityService.findOne('api::article.article', articleId);

    // Sync to external CMS
    await fetch('https://external-cms.com/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXTERNAL_CMS_TOKEN}`
      },
      body: JSON.stringify({
        title: article.title,
        content: article.content,
        externalId: article.id
      })
    });
  }
};
```

---

## Best Practices

### Webhooks

1. **Idempotency**: Make webhook handlers idempotent
2. **Retry Logic**: Implement retry logic for failed webhooks
3. **Security**: Verify webhook signatures
4. **Logging**: Log all webhook events
5. **Error Handling**: Handle errors gracefully

### External APIs

1. **Rate Limiting**: Respect API rate limits
2. **Error Handling**: Implement proper error handling
3. **Retry Logic**: Add retry logic for transient failures
4. **Caching**: Cache API responses when appropriate
5. **Monitoring**: Monitor API usage and errors

### Security

1. **API Keys**: Store API keys in environment variables
2. **HTTPS**: Always use HTTPS for external calls
3. **Validation**: Validate all external data
4. **Timeouts**: Set appropriate timeouts
5. **Secrets Management**: Use secret management services

---

## Troubleshooting

### Common Issues

**Issue**: Webhook not firing
- **Solution**: Check webhook configuration
- **Solution**: Verify URL is accessible
- **Solution**: Check event selection

**Issue**: External API errors
- **Solution**: Verify API credentials
- **Solution**: Check rate limits
- **Solution**: Review API documentation

**Issue**: Integration timeouts
- **Solution**: Increase timeout values
- **Solution**: Implement async processing
- **Solution**: Use queue system for long operations

---

## References

- [Strapi Webhooks Documentation](https://docs.strapi.io/cms/features/webhooks)
- [Strapi Email Configuration](https://docs.strapi.io/cms/features/email)
- [Strapi Upload Providers](https://docs.strapi.io/cms/features/media-library)

---

## Notes

### Key Takeaways

- Webhooks enable real-time integrations
- External APIs extend Strapi functionality
- Proper error handling is essential
- Security is critical for integrations
- Monitor integration health

### Important Reminders

- Always use HTTPS for external calls
- Store API keys securely
- Implement retry logic
- Handle errors gracefully
- Monitor integration performance

