# HMCS Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
│                      (Render/Railway)                        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐          ┌──────────▼──────────┐
    │   Client (React)  │          │   Server (Express)  │
    │   Port: 3000      │          │   Port: 4000        │
    │   Static Assets   │          │   API + Scheduler   │
    └───────────────────┘          └──────────┬──────────┘
                                              │
                                   ┌──────────▼──────────┐
                                   │   PostgreSQL 15     │
                                   │   Port: 5432        │
                                   └──────────┬──────────┘
                                              │
                                   ┌──────────▼──────────┐
                                   │   S3-Compatible     │
                                   │   Photo Storage     │
                                   │   (AWS S3/R2/Minio) │
                                   └─────────────────────┘
```

## Docker Setup

### Client Dockerfile
```dockerfile
# DOCKERFILE.client
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Server Dockerfile
```dockerfile
# DOCKERFILE.server
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate

EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hmcs
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hmcs
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hmcs"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: ./server
      dockerfile: DOCKERFILE.server
    environment:
      DATABASE_URL: postgresql://hmcs:${DB_PASSWORD}@postgres:5432/hmcs
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: http://localhost:3000
      S3_BUCKET: ${S3_BUCKET}
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      S3_ENDPOINT: ${S3_ENDPOINT}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "4000:4000"
    command: >
      sh -c "npx prisma migrate deploy &&
             npx prisma db seed &&
             node dist/server.js"

  client:
    build:
      context: ./client
      dockerfile: DOCKERFILE.client
    ports:
      - "3000:80"
    depends_on:
      - server

volumes:
  postgres_data:
```

### Environment Variables (.env.example)
```bash
# Database
DATABASE_URL=postgresql://hmcs:password@localhost:5432/hmcs
DB_PASSWORD=your_secure_password

# Authentication
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# S3 Storage
S3_BUCKET=hmcs-photos
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring (optional)
SENTRY_DSN=https://your_sentry_dsn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Platforms

### Render.com

1. **Create PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Name: `hmcs-db`
   - Note the internal database URL

2. **Deploy Server**
   - Dashboard → New → Web Service
   - Connect your GitHub repo
   - Root directory: `server`
   - Build command: `npm ci && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && node dist/server.js`
   - Environment variables: Add all from .env.example
   - Auto-deploy: Yes

3. **Deploy Client**
   - Dashboard → New → Static Site
   - Connect your GitHub repo
   - Root directory: `client`
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
   - Environment variables:
     - `VITE_API_URL`: Your Render server URL

4. **Scheduler (Cron Job)**
   - Dashboard → New → Cron Job
   - Schedule: `* * * * *` (every minute)
   - Command: `curl -X POST https://your-server.onrender.com/api/scheduler/run`
   - **Important**: Use a secret header to prevent unauthorized triggers

### Railway.app

1. **Create Project**
   - `railway init`
   - Name: `hmcs`

2. **Add PostgreSQL**
   - `railway add`
   - Select: PostgreSQL
   - Note the `DATABASE_URL`

3. **Deploy Server**
   - `railway up`
   - Set environment variables in dashboard
   - Enable auto-deploy from GitHub

4. **Deploy Client**
   - Separate project for client
   - Build command: `npm run build`
   - Output directory: `dist`

5. **Scheduler**
   - Use Railway's cron feature or external service (cron-job.org)

## Database Migrations on Deploy

### Automatic Migrations
The server startup script runs migrations automatically:
```bash
npx prisma migrate deploy
```

### Manual Migrations
```bash
# Create migration
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Best Practices
- ✅ Always test migrations on staging first
- ✅ Never delete migration files after they're applied
- ✅ Use `prisma migrate deploy` in production (not `dev`)
- ✅ Back up database before major migrations
- ✅ Monitor migration duration (should be < 30s for most)

## Scheduler Configuration

### Single Instance Requirement
The penalty scheduler must run **exactly once** even when scaled horizontally.

**Solution**: Use a distributed lock (Redis/PostgreSQL advisory lock)

```typescript
// server/src/scheduler.ts
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

const LOCK_KEY = 'hmcs:scheduler:lock';
const LOCK_TTL = 55000; // 55 seconds (just under 1 minute)

export async function runScheduler() {
  // Try to acquire lock
  const acquired = await redis.set(LOCK_KEY, '1', 'PX', LOCK_TTL, 'NX');
  
  if (!acquired) {
    console.log('Scheduler already running on another instance');
    return;
  }
  
  try {
    await checkExpiredWindows();
    await checkOverdueAndPenalize();
    await sendWindowExpiryWarnings();
  } finally {
    // Lock auto-expires after 55s
  }
}
```

### Alternative: Database Advisory Lock
```typescript
export async function runScheduler() {
  const lockId = 12345; // Unique ID for this scheduler
  
  const result = await prisma.$queryRaw`
    SELECT pg_try_advisory_lock(${lockId})
  `;
  
  if (!result[0].pg_try_advisory_lock) {
    console.log('Scheduler already running');
    return;
  }
  
  try {
    await checkExpiredWindows();
    await checkOverdueAndPenalize();
  } finally {
    await prisma.$queryRaw`
      SELECT pg_advisory_unlock(${lockId})
    `;
  }
}
```

## S3-Compatible Photo Storage

### StorageProvider Interface
```typescript
interface StorageProvider {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}
```

### AWS S3 Implementation
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  
  constructor() {
    this.client = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
    });
    this.bucket = process.env.S3_BUCKET!;
  }
  
  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    }));
    return key;
  }
  
  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
```

### Cloudflare R2 (S3-Compatible)
```typescript
// Same as AWS S3, but with R2 endpoint
this.client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

### MinIO (Self-Hosted)
```typescript
this.client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
});
```

## Backups

### PostgreSQL Backups

#### Automated Daily Backups (Render/Railway)
Both platforms provide automated daily backups with 7-day retention.

#### Manual Backup
```bash
# Dump database
pg_dump -U hmcs -h localhost hmcs > backup_$(date +%Y%m%d).sql

# Restore
psql -U hmcs -h localhost hmcs < backup_20240101.sql
```

#### Backup to S3
```bash
#!/bin/bash
# backup.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hmcs_backup_$TIMESTAMP.sql"

pg_dump -U hmcs -h localhost hmcs > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://hmcs-backups/$BACKUP_FILE
rm $BACKUP_FILE

# Delete backups older than 30 days
aws s3 ls s3://hmcs-backups/ | awk '{print $4}' | while read file; do
  FILE_DATE=$(echo $file | grep -oP '\d{8}' | head -1)
  if [ $(date -d "$FILE_DATE" +%s) -lt $(date -d '30 days ago' +%s) ]; then
    aws s3 rm s3://hmcs-backups/$file
  fi
done
```

### Photo Backups
S3 versioning enabled:
```bash
aws s3api put-bucket-versioning --bucket hmcs-photos --versioning-configuration Status=Enabled
```

## Error Monitoring

### Sentry Integration
```typescript
// server/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});

// Express error handler
app.use(Sentry.Handlers.errorHandler());
```

### Client Error Tracking
```typescript
// client/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## Go-Live Checklist

### Pre-Deployment
- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] SSL certificates provisioned
- [ ] Domain DNS configured
- [ ] Email/SMS provider configured (if using)
- [ ] S3 bucket created with CORS policy
- [ ] Sentry DSN configured
- [ ] Backup strategy in place

### Deployment
- [ ] Database migrated (`prisma migrate deploy`)
- [ ] Seed data loaded (if fresh install)
- [ ] Server health check passing (`/api/health`)
- [ ] Client deployed and accessible
- [ ] CORS configured correctly
- [ ] Scheduler running (verify logs)
- [ ] Error monitoring active

### Post-Deployment
- [ ] Test all critical flows (login, submit, upvote, resolve)
- [ ] Verify notifications working
- [ ] Check audit log entries
- [ ] Monitor error rates (Sentry)
- [ ] Monitor performance (APM)
- [ ] Verify backups running
- [ ] Document any issues for future fixes

### Monitoring
- [ ] Set up alerts for:
  - Error rate > 1%
  - Response time > 2s
  - Database connection failures
  - Scheduler not running
  - Disk space < 20%
- [ ] Review logs daily for first week
- [ ] Weekly security audit (first month)

## Rollback Plan

### Quick Rollback (< 5 minutes)
1. Revert to previous deployment (Render/Railway one-click rollback)
2. If database migration caused issue:
   ```bash
   # Restore from backup
   psql -U hmcs -h localhost hmcs < backup_before_migration.sql
   ```

### Data Rollback
If data corruption occurred:
1. Stop the application
2. Restore database from backup
3. Verify data integrity
4. Restart application
5. Monitor closely for 24 hours

## Performance Optimization

### Database
- ✅ Indexes on frequently queried columns
- ✅ Connection pooling (Prisma)
- ✅ Query optimization (no N+1)
- ✅ Pagination on all list endpoints

### Caching
- ⚠️ Redis caching for feed (future enhancement)
- ⚠️ CDN for static assets (Cloudflare)

### Client
- ✅ Code splitting (lazy loading)
- ✅ Image optimization (WebP, lazy loading)
- ✅ Service worker (future enhancement)

## Scaling

### Horizontal Scaling
- **Client**: Stateless, scales automatically (Render/Railway)
- **Server**: Stateless, scales automatically with load balancer
- **Database**: Vertical scaling (upgrade plan) or read replicas
- **Scheduler**: Use distributed lock (Redis/PostgreSQL advisory lock)

### Vertical Scaling
When to upgrade:
- CPU > 70% sustained
- Memory > 80% sustained
- Database connections > 80% of limit
- Response time > 2s p95

### Cost Optimization
- Use auto-scaling (scale to zero during low traffic)
- Compress images before upload
- Use CDN for static assets
- Enable database connection pooling
- Monitor and right-size instances
