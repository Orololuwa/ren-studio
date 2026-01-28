# Railway Deployment Guide

This guide walks you through deploying this React Router SaaS template to Railway with Docker and Puppeteer support.

## Prerequisites

- A Railway account ([railway.app](https://railway.app))
- A Supabase project with your database migrated
- GitHub repository with your code
- Docker and Docker Compose installed (for local testing)

## Local Testing with Docker

Before deploying to Railway, you can test the Docker setup locally:

### Step 1: Prepare Environment Variables

1. **Create or update your `.env` file** with all required variables:
   ```bash
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   COOKIE_SECRET=your-cookie-secret-here
   API_KEY_ENCRYPTION_KEY=your-encryption-key-here
   NODE_ENV=production
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=mg.yourdomain.com
   ```

### Step 2: Build and Run with Docker Compose

1. **Build and start the container:**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build the Docker image (may take a few minutes the first time)
   - Install all dependencies
   - Build your React Router app
   - Run Prisma migrations
   - Start the application

2. **Access your application:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - The app should be running in production mode

### Step 3: Test Features

1. **Test PDF Export:**
   - Log in to your app
   - Create or open a template
   - Click "Export PDF"
   - Verify the PDF generates correctly (Puppeteer should work)

2. **Test Email Sending:**
   - If Mailgun is configured, test sending emails with PDF attachments

3. **Check Logs:**
   ```bash
   docker-compose logs -f app
   ```

### Step 4: Stop the Container

When you're done testing:
```bash
docker-compose down
```

### Alternative: Build and Run Manually

If you prefer not to use docker-compose:

1. **Build the image:**
   ```bash
   docker build -t react-router-saas .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e COOKIE_SECRET="your-secret" \
     -e API_KEY_ENCRYPTION_KEY="your-key" \
     -e NODE_ENV=production \
     --env-file .env \
     react-router-saas
   ```

### Troubleshooting Local Docker Testing

- **Build fails:** Check Docker has enough resources (memory, disk space)
- **Port already in use:** Change the port mapping in `docker-compose.yml` (e.g., `"3001:3000"`)
- **Database connection fails:** Verify your `DATABASE_URL` is correct and Supabase is accessible
- **Puppeteer fails:** Check logs for Chromium-related errors; the Dockerfile should handle this automatically

## Step 1: Prepare Your Repository

1. **Ensure all changes are committed and pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Add Dockerfile for Railway deployment"
   git push origin main
   ```

2. **Verify your `.env.example` has all required variables** (Railway will use these as a reference)

## Step 2: Deploy on Railway

1. **Sign up/Login to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up with your GitHub account

2. **Create a New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the `Dockerfile` and start building

3. **Configure Environment Variables:**
   - In your Railway project, go to the "Variables" tab
   - Add the following environment variables:

   **Required:**
   ```bash
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   COOKIE_SECRET=your-cookie-secret-here
   API_KEY_ENCRYPTION_KEY=your-encryption-key-here
   NODE_ENV=production
   ```

   **Optional (for email features):**
   ```bash
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=mg.yourdomain.com
   ```

   **Optional (for other features):**
   ```bash
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   ```

4. **Railway will automatically:**
   - Build your Docker image
   - Run Prisma migrations (`prisma migrate deploy`)
   - Generate Prisma client
   - Start your application

## Step 3: Verify Deployment

1. **Check Build Logs:**
   - Go to the "Deployments" tab in Railway
   - Click on the latest deployment
   - Check the logs to ensure:
     - Docker build completed successfully
     - Prisma migrations ran
     - Application started without errors

2. **Test Your Application:**
   - Railway provides a URL like `yourapp.up.railway.app`
   - Visit the URL and verify:
     - Homepage loads
     - Authentication works
     - PDF export works (test with a template)
     - Email sending works (if configured)

## Step 4: Custom Domain (Optional)

1. **Add Custom Domain:**
   - In Railway project settings, go to "Settings" → "Domains"
   - Click "Add Domain"
   - Enter your domain name
   - Follow Railway's DNS instructions

## Troubleshooting

### Build Fails

- **Check Dockerfile syntax:** Ensure the Dockerfile is valid
- **Check build logs:** Look for specific error messages in Railway logs
- **Verify dependencies:** Ensure all npm packages are in `package.json`

### Application Crashes

- **Check application logs:** Railway → Deployments → View logs
- **Verify environment variables:** Ensure all required env vars are set
- **Check database connection:** Verify `DATABASE_URL` is correct and Supabase is accessible

### Puppeteer/PDF Generation Fails

- **Check Chromium installation:** The Dockerfile installs Chromium, but verify it's available
- **Check memory limits:** Railway free tier has memory limits; PDF generation may need more
- **Check logs:** Look for Puppeteer-specific errors in the logs

### Database Connection Issues

- **Verify Supabase connection string:** Ensure it includes `?sslmode=require`
- **Check Supabase project status:** Ensure your Supabase project is active
- **Verify network access:** Railway should be able to reach Supabase

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `COOKIE_SECRET` | Yes | Secret for encrypting session cookies |
| `API_KEY_ENCRYPTION_KEY` | Yes | Key for encrypting API keys |
| `NODE_ENV` | Yes | Set to `production` |
| `MAILGUN_API_KEY` | No | Mailgun API key for sending emails |
| `MAILGUN_DOMAIN` | No | Mailgun domain |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |

## Docker Configuration

The `Dockerfile` is configured to:

1. **Use Debian-based Node image** (better Chromium support)
2. **Install Chromium and dependencies** for Puppeteer
3. **Skip Puppeteer's bundled Chromium** (use system Chromium)
4. **Run Prisma migrations** on startup
5. **Generate Prisma client** on startup
6. **Start the application** with `react-router-serve`

## Updating Your Application

1. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Railway automatically:**
   - Detects the new commit
   - Rebuilds the Docker image
   - Deploys the new version

## Monitoring

- **View logs:** Railway → Deployments → View logs
- **Metrics:** Railway provides basic metrics (CPU, memory, network)
- **Alerts:** Set up alerts in Railway for deployment failures

## Cost Considerations

- **Railway Free Tier:**
  - $5 credit per month
  - Usage-based pricing after free credit
  - Good for development and small projects

- **Upgrade when:**
  - You exceed free tier limits
  - You need more resources (memory, CPU)
  - You need better performance guarantees

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com)
