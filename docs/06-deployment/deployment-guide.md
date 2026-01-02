# Deployment Guide

## Overview

This guide covers deploying Strapi 5 applications to production environments, including deployment options, Docker deployment, environment configurations, CI/CD integration, database migrations, and backup strategies.

**Reference:** [Strapi Deployment Documentation](https://docs.strapi.io/cms/deployment)

---

## Prerequisites

### Hardware Requirements

- **CPU**: Minimum 1 core (Recommended: 2+ cores)
- **Memory**: Minimum 2GB RAM (Recommended: 4GB+)
- **Storage**: Minimum 8GB (Recommended: 32GB+)
- **Network**: Stable internet connection

### Software Requirements

- **Node.js**: Active LTS or Maintenance LTS (v20.x or v22.x)
- **Package Manager**: npm (v6+), Yarn, or pnpm
- **Database**: PostgreSQL (12.0+), MySQL (8.0+), MariaDB (10.5+), or SQLite (3+)
- **Operating System**: Ubuntu (20.04+), Debian (10.x+), RHEL (8.x+), macOS (11.x+), or Windows 10/11

---

## Pre-Deployment Checklist

### Application Preparation

- [ ] Build admin panel for production
- [ ] Set all environment variables
- [ ] Configure production database
- [ ] Set up media storage (cloud storage recommended)
- [ ] Configure security settings
- [ ] Test application locally with production settings
- [ ] Review and optimize code
- [ ] Set up monitoring and logging

### Build Commands

```bash
# Build admin panel
NODE_ENV=production yarn build
# or
NODE_ENV=production npm run build

# Start production server
NODE_ENV=production yarn start
# or
NODE_ENV=production npm start
```

---

## Deployment Options

### Option 1: VPS (Virtual Private Server)

#### Popular VPS Providers

- **DigitalOcean**: Droplets
- **Linode**: Linodes
- **Vultr**: Cloud Compute
- **AWS EC2**: Elastic Compute Cloud
- **Azure Virtual Machines**: VMs
- **Google Cloud Compute Engine**: VM instances

#### VPS Deployment Steps

1. **Provision Server**
   - Choose appropriate instance size
   - Select operating system (Ubuntu LTS recommended)
   - Configure firewall rules

2. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js (using NVM)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
   source ~/.bashrc
   nvm install 20
   nvm use 20
   
   # Install PM2
   npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/strapi-app.git
   cd strapi-app
   
   # Install dependencies
   npm install --production
   
   # Build admin panel
   NODE_ENV=production npm run build
   
   # Start with PM2
   pm2 start npm --name "strapi-app" -- run start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/strapi
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:1337;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. **Enable SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Option 2: Docker Deployment

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --production

# Copy application files
COPY . .

# Build admin panel
RUN yarn build

# Expose port
EXPOSE 1337

# Start application
CMD ["yarn", "start"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  strapi:
    build: .
    container_name: strapi-app
    restart: unless-stopped
    env_file: .env
    environment:
      NODE_ENV: production
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - ./public/uploads:/app/public/uploads
    ports:
      - "1337:1337"
    depends_on:
      - postgres
    networks:
      - strapi-network

  postgres:
    image: postgres:15-alpine
    container_name: strapi-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - strapi-network

  nginx:
    image: nginx:alpine
    container_name: strapi-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - strapi
    networks:
      - strapi-network

volumes:
  postgres_data:

networks:
  strapi-network:
    driver: bridge
```

#### Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f strapi

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Option 3: Cloud Platforms

#### Render

1. **Create Web Service**
   - Connect GitHub repository
   - Set build command: `yarn build`
   - Set start command: `yarn start`
   - Add environment variables

2. **Create PostgreSQL Database**
   - Create managed PostgreSQL database
   - Get connection string
   - Add to environment variables

3. **Configure Persistent Disk**
   - Add persistent disk for uploads
   - Mount at `/opt/render/project/src/public/uploads`

#### Heroku

1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:hobby-dev
   ```

2. **Configure Environment**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DATABASE_URL=$(heroku config:get DATABASE_URL)
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

#### AWS (Elastic Beanstalk)

1. **Initialize EB**
   ```bash
   eb init -p node.js strapi-app
   eb create strapi-production
   ```

2. **Configure Environment**
   - Set environment variables in EB console
   - Configure RDS database
   - Set up S3 for media storage

3. **Deploy**
   ```bash
   eb deploy
   ```

---

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

### Staging

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://staging-api.yourdomain.com
DATABASE_CLIENT=postgres
DATABASE_HOST=staging-db.yourdomain.com
DATABASE_NAME=strapi_staging
```

### Production

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://api.yourdomain.com
ADMIN_URL=https://api.yourdomain.com/admin
DATABASE_CLIENT=postgres
DATABASE_HOST=production-db.yourdomain.com
DATABASE_NAME=strapi_production
DATABASE_SSL=true
```

### Configuration Files

```javascript
// config/server.js
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  proxy: env.bool('PROXY', false),
  cron: {
    enabled: env.bool('CRON_ENABLED', true),
  },
});
```

---

## Process Management

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'strapi-app',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 1337
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs strapi-app

# Restart
pm2 restart strapi-app

# Stop
pm2 stop strapi-app

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

---

## Reverse Proxy Configuration

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/strapi
upstream strapi {
    server localhost:1337;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy Settings
    location / {
        proxy_pass http://strapi;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files
    location /uploads {
        alias /path/to/strapi/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/strapi-app
            git pull origin main
            npm install --production
            npm run build
            pm2 restart strapi-app
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

build:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - build/
    expire_in: 1 hour

deploy:
  stage: deploy
  script:
    - ssh user@server "cd /var/www/strapi-app && git pull && npm install --production && pm2 restart strapi-app"
  only:
    - main
```

---

## Database Migrations

### Migration Strategy

1. **Development**: Test migrations locally
2. **Staging**: Apply migrations to staging
3. **Production**: Apply migrations during maintenance window

### Manual Migration

```bash
# Backup database first
pg_dump strapi_db > backup.sql

# Apply schema changes
# Strapi handles schema migrations automatically on startup
```

### Migration Best Practices

1. **Backup First**: Always backup before migrations
2. **Test Locally**: Test migrations in development
3. **Staging First**: Apply to staging before production
4. **Rollback Plan**: Have rollback strategy ready
5. **Monitor**: Monitor application after migration

---

## Backup and Restore

### Database Backup

#### PostgreSQL

```bash
# Backup
pg_dump -h localhost -U strapi_user -d strapi_db > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U strapi_user -d strapi_db < backup_20240115.sql
```

#### MySQL

```bash
# Backup
mysqldump -u strapi_user -p strapi_db > backup_$(date +%Y%m%d).sql

# Restore
mysql -u strapi_user -p strapi_db < backup_20240115.sql
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="strapi_db"
DB_USER="strapi_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/strapi-app/public/uploads

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql s3://your-bucket/backups/
aws s3 cp $BACKUP_DIR/uploads_backup_$DATE.tar.gz s3://your-bucket/backups/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Scheduled Backups with CRON

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Restore Procedure

1. **Stop Application**
   ```bash
   pm2 stop strapi-app
   ```

2. **Restore Database**
   ```bash
   psql -U strapi_user -d strapi_db < backup.sql
   ```

3. **Restore Uploads**
   ```bash
   tar -xzf uploads_backup.tar.gz -C /var/www/strapi-app/public/
   ```

4. **Start Application**
   ```bash
   pm2 start strapi-app
   ```

---

## Health Checks

### Strapi Health Endpoint

Strapi provides a health check endpoint:

```
GET /_health
```

**Response**: HTTP 204 No Content with header `strapi: You are so French!`

### Custom Health Check

```javascript
// src/api/health/routes/health.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/health',
      handler: 'health.check',
    },
  ],
};
```

```javascript
// src/api/health/controllers/health.js
module.exports = {
  async check(ctx) {
    try {
      // Check database connection
      await strapi.db.connection.raw('SELECT 1');
      
      // Check other services
      const isHealthy = true;
      
      if (isHealthy) {
        ctx.status = 200;
        ctx.body = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        };
      } else {
        ctx.status = 503;
        ctx.body = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      ctx.status = 503;
      ctx.body = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
```

---

## Monitoring and Logging

### Application Monitoring

#### PM2 Monitoring

```bash
# Monitor in real-time
pm2 monit

# View metrics
pm2 describe strapi-app
```

#### External Monitoring

- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure and application monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay and logging

### Logging Configuration

```javascript
// config/server.js
module.exports = ({ env }) => ({
  logger: {
    level: env('LOG_LEVEL', 'info'),
    exposeInContext: true,
    requests: true,
  },
});
```

---

## Scaling Strategies

### Horizontal Scaling

1. **Multiple Instances**: Run multiple Strapi instances
2. **Load Balancer**: Distribute traffic across instances
3. **Shared Database**: All instances use same database
4. **Shared Media Storage**: Use cloud storage (S3, Cloudinary)

### Vertical Scaling

1. **Increase Resources**: More CPU, RAM, storage
2. **Optimize Code**: Improve application performance
3. **Database Optimization**: Optimize queries and indexes

---

## Troubleshooting

### Common Issues

**Issue**: Application won't start
- **Solution**: Check environment variables
- **Solution**: Verify database connection
- **Solution**: Check port availability
- **Solution**: Review application logs

**Issue**: High memory usage
- **Solution**: Increase server RAM
- **Solution**: Optimize application code
- **Solution**: Implement caching
- **Solution**: Review database queries

**Issue**: Slow response times
- **Solution**: Implement caching
- **Solution**: Optimize database queries
- **Solution**: Use CDN for static assets
- **Solution**: Add more server resources

---

## References

- [Strapi Deployment Documentation](https://docs.strapi.io/cms/deployment)
- [Strapi Production Deployment](https://docs.strapi.io/dev-docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## Notes

### Key Takeaways

- Build admin panel before deployment
- Use environment variables for configuration
- Implement process management (PM2)
- Set up reverse proxy (Nginx)
- Configure SSL/HTTPS
- Implement monitoring and logging
- Set up automated backups

### Important Reminders

- Always test in staging first
- Backup before major changes
- Monitor application health
- Keep dependencies updated
- Document deployment procedures
- Have rollback plan ready

