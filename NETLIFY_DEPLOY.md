# Deploying SOVS to Netlify

## Quick Deploy Steps

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Login to Netlify

```bash
netlify login
```

This will open your browser to authenticate with Netlify.

### 3. Deploy to Production

**Option A: One-time deployment**
```bash
npm run build:web
netlify deploy --prod --dir=dist
```

**Option B: Use the deploy script**
```bash
./netlify-deploy.sh
```

**Option C: Initialize site (first time only)**
```bash
netlify init
```
Then follow the prompts to create a new site or link to an existing one.

### 4. Get Your Live URL

After deployment, Netlify will provide you with a URL like:
- `https://your-site-name.netlify.app`

## Automatic Deployments (Continuous Deployment)

To set up automatic deployments from Git:

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **In Netlify Dashboard:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Configure build settings:
     - **Build command:** `npm run build:web`
     - **Publish directory:** `dist`
   - Click "Deploy site"

3. **Future deployments** will happen automatically on every push to your main branch!

## Manual Deployment Commands

```bash
# Build the app
npm run build:web

# Deploy to draft/preview
netlify deploy --dir=dist

# Deploy to production
netlify deploy --prod --dir=dist
```

## Configuration File

The `netlify.toml` file is already configured with:
- ✅ Publish directory: `dist`
- ✅ Build command: `npm run build:web`
- ✅ Redirect rules for SPA routing (all routes → index.html)

## Environment Variables

If you need environment variables:

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Add your variables
3. They'll be available during build time

## Custom Domain

To add a custom domain:

1. Go to Netlify Dashboard → Site settings → Domain management
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

## Troubleshooting

**Build fails?**
- Make sure all dependencies are in `package.json`
- Check that `npm run build:web` works locally first

**404 errors on routes?**
- The `netlify.toml` includes redirect rules to handle SPA routing
- If issues persist, check that the redirect is working

**Need to update?**
- Just run `npm run build:web` and `netlify deploy --prod --dir=dist` again
- Or push to Git if you have continuous deployment set up

## Useful Netlify Commands

```bash
# Check login status
netlify status

# View site info
netlify sites:list

# View deployment logs
netlify logs

# Open site dashboard
netlify open
```


