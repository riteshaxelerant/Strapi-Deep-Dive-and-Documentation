# CRON Jobs and Scheduled Tasks

## Overview

Strapi allows you to schedule tasks using CRON jobs. This guide covers how to configure and use CRON jobs in Strapi 5 for automated tasks, scheduled operations, and periodic maintenance.

**Reference:** [Strapi CRON Jobs Documentation](https://docs.strapi.io/dev-docs/configurations/cron-jobs)

---

## What are CRON Jobs?

CRON jobs are scheduled tasks that run automatically at specified intervals. They're useful for:
- Periodic data processing
- Automated backups
- Content synchronization
- Cleanup tasks
- Scheduled notifications
- Data aggregation

---

## CRON Job Configuration

### Basic Configuration

CRON jobs are configured in `config/server.js`:

```javascript
// config/server.js
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  cron: {
    enabled: true,
    tasks: {
      // CRON job definitions
    },
  },
});
```

### CRON Job Structure

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: true,
    tasks: {
      '*/10 * * * * *': async ({ strapi }) => {
        // Runs every 10 seconds
        console.log('Running scheduled task');
      },
      '0 0 * * * *': async ({ strapi }) => {
        // Runs every hour at minute 0
        await strapi.service('api::article.article').cleanupOldArticles();
      },
      '0 0 0 * * *': async ({ strapi }) => {
        // Runs daily at midnight
        await strapi.service('api::backup.backup').createBackup();
      },
    },
  },
});
```

---

## CRON Expression Syntax

### Format

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └── Day of week (0-7, 0 or 7 is Sunday)
│ │ │ │ └──── Month (1-12)
│ │ │ └────── Day of month (1-31)
│ │ └──────── Hour (0-23)
│ └────────── Minute (0-59)
└──────────── Second (0-59) - Optional
```

### Common Patterns

```javascript
// Every second
'* * * * * *'

// Every minute
'0 * * * * *'

// Every 5 minutes
'0 */5 * * * *'

// Every hour
'0 0 * * * *'

// Every day at midnight
'0 0 0 * * *'

// Every day at 2 AM
'0 0 2 * * *'

// Every Monday at 9 AM
'0 0 9 * * 1'

// Every first day of month at midnight
'0 0 0 1 * *'

// Every weekday at 9 AM
'0 0 9 * * 1-5'
```

---

## CRON Job Examples

### Example 1: Cleanup Old Articles

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: true,
    tasks: {
      '0 0 2 * * *': async ({ strapi }) => {
        // Run daily at 2 AM
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const oldArticles = await strapi.entityService.findMany('api::article.article', {
          filters: {
            createdAt: {
              $lt: thirtyDaysAgo.toISOString()
            },
            publishedAt: {
              $null: true // Only draft articles
            }
          }
        });

        for (const article of oldArticles) {
          await strapi.entityService.delete('api::article.article', article.id);
        }

        strapi.log.info(`Cleaned up ${oldArticles.length} old articles`);
      },
    },
  },
});
```

### Example 2: Send Daily Digest

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: true,
    tasks: {
      '0 0 9 * * 1-5': async ({ strapi }) => {
        // Run weekdays at 9 AM
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const newArticles = await strapi.entityService.findMany('api::article.article', {
          filters: {
            publishedAt: {
              $gte: yesterday.toISOString()
            }
          }
        });

        // Send digest email
        await strapi.service('api::email.email').sendDailyDigest({
          articles: newArticles,
          date: yesterday
        });

        strapi.log.info(`Sent daily digest with ${newArticles.length} articles`);
      },
    },
  },
});
```

### Example 3: Update Statistics

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: true,
    tasks: {
      '0 */15 * * * *': async ({ strapi }) => {
        // Run every 15 minutes
        const articles = await strapi.entityService.findMany('api::article.article', {
          filters: {
            publishedAt: { $notNull: true }
          }
        });

        // Calculate statistics
        const stats = {
          totalArticles: articles.length,
          totalViews: articles.reduce((sum, article) => sum + (article.views || 0), 0),
          averageViews: articles.length > 0 
            ? articles.reduce((sum, article) => sum + (article.views || 0), 0) / articles.length 
            : 0
        };

        // Update statistics content type
        await strapi.entityService.update('api::statistic.statistic', 1, {
          data: stats
        });

        strapi.log.info('Statistics updated', stats);
      },
    },
  },
});
```

### Example 4: Sync External Data

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: true,
    tasks: {
      '0 0 * * * *': async ({ strapi }) => {
        // Run every hour
        try {
          // Fetch data from external API
          const response = await fetch('https://api.external.com/data', {
            headers: {
              'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}`
            }
          });

          const externalData = await response.json();

          // Sync to Strapi
          for (const item of externalData) {
            await strapi.entityService.update('api::external-data.external-data', item.id, {
              data: {
                title: item.title,
                content: item.content,
                lastSyncedAt: new Date()
              }
            });
          }

          strapi.log.info(`Synced ${externalData.length} items`);
        } catch (error) {
          strapi.log.error('Sync failed:', error);
        }
      },
    },
  },
});
```

### Example 5: Database Backup

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: true,
    tasks: {
      '0 0 3 * * *': async ({ strapi }) => {
        // Run daily at 3 AM
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const backupPath = `./backups/backup-${Date.now()}.sql`;

        try {
          // Create database backup
          await execAsync(`pg_dump ${process.env.DATABASE_NAME} > ${backupPath}`);

          // Upload to cloud storage
          await strapi.service('api::backup.backup').uploadToS3(backupPath);

          strapi.log.info(`Backup created: ${backupPath}`);
        } catch (error) {
          strapi.log.error('Backup failed:', error);
        }
      },
    },
  },
});
```

---

## Using Services in CRON Jobs

### Best Practice: Use Services

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: true,
    tasks: {
      '0 0 * * * *': async ({ strapi }) => {
        // Use service for business logic
        await strapi.service('api::article.article').cleanupOldArticles();
      },
    },
  },
});
```

```javascript
// src/api/article/services/article.js
module.exports = ({ strapi }) => ({
  async cleanupOldArticles() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldArticles = await strapi.entityService.findMany('api::article.article', {
      filters: {
        createdAt: { $lt: thirtyDaysAgo.toISOString() },
        publishedAt: { $null: true }
      }
    });

    for (const article of oldArticles) {
      await strapi.entityService.delete('api::article.article', article.id);
    }

    return { deleted: oldArticles.length };
  }
});
```

---

## CRON Job Best Practices

### Error Handling

```javascript
'0 0 * * * *': async ({ strapi }) => {
  try {
    await strapi.service('api::task.task').performTask();
  } catch (error) {
    strapi.log.error('CRON job failed:', error);
    
    // Send notification
    await strapi.service('api::notification.notification').sendAlert({
      type: 'cron_error',
      message: error.message,
      task: 'performTask'
    });
  }
}
```

### Logging

```javascript
'0 0 * * * *': async ({ strapi }) => {
  const startTime = Date.now();
  
  strapi.log.info('Starting scheduled task');
  
  try {
    await strapi.service('api::task.task').performTask();
    
    const duration = Date.now() - startTime;
    strapi.log.info(`Task completed in ${duration}ms`);
  } catch (error) {
    strapi.log.error('Task failed:', error);
  }
}
```

### Conditional Execution

```javascript
'0 0 * * * *': async ({ strapi }) => {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  await strapi.service('api::task.task').performTask();
}
```

### Rate Limiting

```javascript
'0 * * * * *': async ({ strapi }) => {
  // Check if task was recently run
  const lastRun = await strapi.entityService.findOne('api::task-log.task-log', {
    filters: {
      taskName: 'myTask',
      createdAt: {
        $gte: new Date(Date.now() - 60 * 60 * 1000).toISOString() // Last hour
      }
    }
  });

  if (lastRun) {
    strapi.log.info('Task skipped - already run recently');
    return;
  }

  await strapi.service('api::task.task').performTask();
  
  // Log execution
  await strapi.entityService.create('api::task-log.task-log', {
    data: {
      taskName: 'myTask',
      executedAt: new Date()
    }
  });
}
```

---

## Disabling CRON Jobs

### Environment-Based

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: env.bool('CRON_ENABLED', true),
    tasks: {
      // CRON jobs
    },
  },
});
```

```env
# .env
CRON_ENABLED=false
```

### Conditional Disable

```javascript
// config/server.js
module.exports = ({ env }) => ({
  cron: {
    enabled: env('NODE_ENV') === 'production',
    tasks: {
      // CRON jobs only run in production
    },
  },
});
```

---

## Testing CRON Jobs

### Manual Execution

```javascript
// Test CRON job manually
const strapi = require('@strapi/strapi')();

(async () => {
  await strapi.load();
  
  // Execute CRON job function
  await strapi.config.cron.tasks['0 0 * * * *']({ strapi });
  
  await strapi.destroy();
})();
```

### Unit Testing

```javascript
// tests/cron-jobs.test.js
describe('CRON Jobs', () => {
  it('should cleanup old articles', async () => {
    const strapi = await createStrapiInstance();
    
    // Setup test data
    // ...
    
    // Execute CRON job
    await strapi.config.cron.tasks['0 0 2 * * *']({ strapi });
    
    // Assert results
    // ...
    
    await strapi.destroy();
  });
});
```

---

## Monitoring CRON Jobs

### Execution Logging

```javascript
'0 0 * * * *': async ({ strapi }) => {
  const taskId = `task-${Date.now()}`;
  
  strapi.log.info(`[${taskId}] Starting task`);
  
  try {
    await strapi.service('api::task.task').performTask();
    strapi.log.info(`[${taskId}] Task completed successfully`);
  } catch (error) {
    strapi.log.error(`[${taskId}] Task failed:`, error);
  }
}
```

### Performance Monitoring

```javascript
'0 0 * * * *': async ({ strapi }) => {
  const startTime = process.hrtime.bigint();
  
  await strapi.service('api::task.task').performTask();
  
  const duration = Number(process.hrtime.bigint() - startTime) / 1e6; // milliseconds
  
  if (duration > 5000) {
    strapi.log.warn(`Task took ${duration}ms - consider optimization`);
  }
}
```

---

## Common Use Cases

### Content Management

- **Publish Scheduled Content**: Auto-publish content at specific times
- **Archive Old Content**: Move old content to archive
- **Generate Reports**: Create daily/weekly reports
- **Update Statistics**: Refresh analytics data

### Data Maintenance

- **Cleanup**: Remove old or unused data
- **Backup**: Create regular backups
- **Sync**: Synchronize with external systems
- **Aggregation**: Aggregate data for analytics

### Notifications

- **Daily Digests**: Send daily content summaries
- **Reminders**: Send reminder notifications
- **Alerts**: Send system alerts
- **Reports**: Generate and send reports

---

## Troubleshooting

### Common Issues

**Issue**: CRON job not running
- **Solution**: Check `cron.enabled` is true
- **Solution**: Verify CRON expression syntax
- **Solution**: Check server logs for errors

**Issue**: CRON job running too frequently
- **Solution**: Verify CRON expression
- **Solution**: Check for multiple instances
- **Solution**: Add execution locks

**Issue**: CRON job errors
- **Solution**: Add error handling
- **Solution**: Check service availability
- **Solution**: Verify database connections

---

## References

- [Strapi CRON Jobs Documentation](https://docs.strapi.io/dev-docs/configurations/cron-jobs)
- [CRON Expression Generator](https://crontab.guru/)

---

## Notes

### Key Takeaways

- CRON jobs run scheduled tasks automatically
- Use CRON expressions to define schedules
- Keep business logic in services
- Implement proper error handling
- Monitor CRON job execution

### Important Reminders

- CRON jobs run in server context
- Use services for reusable logic
- Handle errors gracefully
- Log execution for debugging
- Test CRON jobs thoroughly
- Consider performance impact

