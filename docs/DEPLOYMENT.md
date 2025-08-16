# 🚀 Keyper Deployment Guide

> **Dream it, Pixel it** ✨  
> *Made with ❤️ by Pink Pixel*

This guide will help you deploy Keyper to Cloudflare Pages using Wrangler.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **npm or yarn** package manager
- ✅ **Cloudflare account** (free tier works)
- ✅ **Supabase project** set up
- ✅ **Git repository** (optional but recommended)

## 🛠️ Setup Instructions

### 1. Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version
```

### 2. Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### 3. Configure Environment Variables

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your Supabase credentials:**
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### 4. Update Supabase Client (if needed)

If you need to update the Supabase configuration, edit:
```
src/integrations/supabase/client.ts
```

## 🚀 Deployment Methods

### Method 1: Automated Deployment Scripts

#### **Windows (PowerShell)**
```powershell
# Deploy to production
.\deploy.ps1

# Deploy to preview
.\deploy.ps1 -Preview

# Show help
.\deploy.ps1 -Help
```

#### **Linux/macOS (Bash)**
```bash
# Make script executable (Linux/macOS only)
chmod +x deploy.sh

# Deploy to production
./deploy.sh

# Deploy to preview
./deploy.sh --preview

# Show help
./deploy.sh --help
```

### Method 2: Manual Deployment

#### **Step-by-step manual deployment:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Deploy to Cloudflare Pages:**
   ```bash
   # Production deployment
   wrangler pages deploy dist --project-name keyper

   # Preview deployment
   wrangler pages deploy dist --project-name keyper-preview
   ```

## ⚙️ Cloudflare Configuration

### 1. Environment Variables in Cloudflare

After deployment, configure environment variables in the Cloudflare dashboard:

1. Go to **Cloudflare Dashboard** → **Pages** → **Your Project**
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production & Preview |
| `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | Production & Preview |

### 2. Custom Domain (Optional)

1. Go to **Custom Domains** in your Pages project
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `keyper.yourdomain.com`)
4. Follow the DNS configuration instructions

### 3. Build Settings

Cloudflare should automatically detect these settings, but verify:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (leave empty)

## 🔒 Security Configuration

### Headers and Security

The deployment includes security headers configured in:
- `_headers` - Cloudflare Pages headers
- `wrangler.toml` - Wrangler configuration

### Content Security Policy

The CSP is configured to allow:
- ✅ Supabase connections
- ✅ Required scripts and styles
- ✅ Image loading from trusted sources
- ❌ Unsafe inline scripts (except where necessary)

## 🌐 Domain Configuration

### Supabase CORS Settings

Update your Supabase project settings:

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Add your Cloudflare domain to **Site URL**:
   ```
   https://your-keyper-site.pages.dev
   ```
3. Add to **Additional Redirect URLs** if using custom domain:
   ```
   https://keyper.yourdomain.com
   ```

## 📊 Monitoring and Analytics

### Cloudflare Analytics

Monitor your deployment:
- **Pages Dashboard** → **Analytics**
- View traffic, performance, and errors
- Set up alerts for downtime

### Error Tracking

Consider adding error tracking:
```env
# Optional: Add to environment variables
VITE_SENTRY_DSN=your-sentry-dsn
```

## 🔄 Continuous Deployment

### GitHub Integration

1. Connect your GitHub repository to Cloudflare Pages
2. Enable automatic deployments on push
3. Configure branch deployments:
   - **Production:** `main` branch
   - **Preview:** `develop` or feature branches

### Deployment Triggers

Automatic deployments trigger on:
- ✅ Push to main branch (production)
- ✅ Pull requests (preview)
- ✅ Manual deployments via Wrangler

## 🐛 Troubleshooting

### Common Issues

#### **Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Environment Variables Not Working**
- Verify variables are set in Cloudflare dashboard
- Check variable names match exactly
- Redeploy after adding variables

#### **Supabase Connection Issues**
- Verify CORS settings in Supabase
- Check Site URL configuration
- Ensure API keys are correct

#### **Routing Issues**
- Verify `_redirects` file is in place
- Check SPA routing configuration
- Ensure all routes redirect to `index.html`

### Debug Commands

```bash
# Check Wrangler configuration
wrangler pages project list

# View deployment logs
wrangler pages deployment list --project-name keyper

# Test local build
npm run build && npm run preview
```

## 📞 Support

Need help with deployment?

- 📧 **Email:** admin@pinkpixel.dev
- 🌐 **Website:** [pinkpixel.dev](https://pinkpixel.dev)
- 💬 **Discord:** @sizzlebop
- 📚 **Cloudflare Docs:** [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)

## 🎉 Success!

Once deployed, your Keyper application will be available at:
- **Production:** `https://keyper.pages.dev`
- **Preview:** `https://keyper-preview.pages.dev`
- **Custom Domain:** `https://your-domain.com` (if configured)

---

**Made with ❤️ by Pink Pixel** ✨  
*Dream it, Pixel it*
