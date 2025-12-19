# Deploying SOVS to Web

The web build has been generated successfully! The static files are in the `dist` directory.

## Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm install -g vercel
   ```

2. **Deploy**:

   ```bash
   cd dist
   vercel --prod
   ```

   Or deploy directly from the project root:

   ```bash
   vercel --prod dist
   ```

3. **Follow the prompts** to link your project or create a new one

**Benefits:**

- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Custom domain support
- ✅ Zero configuration needed

### Option 2: Deploy to Netlify

1. **Install Netlify CLI**:

   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:

   ```bash
   cd dist
   netlify deploy --prod
   ```

   Or from project root:

   ```bash
   netlify deploy --prod --dir=dist
   ```

3. **Follow the prompts** to authenticate and link your site

**Benefits:**

- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Continuous deployment from Git
- ✅ Custom domain support

### Option 3: Deploy to GitHub Pages

1. **Push the `dist` folder to a `gh-pages` branch**:

   ```bash
   git subtree push --prefix dist origin gh-pages
   ```

2. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Select source branch: `gh-pages`
   - Select folder: `/ (root)`

**Alternative using GitHub Actions:**
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:web
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Option 4: Deploy to Cloudflare Pages

1. **Install Wrangler CLI**:

   ```bash
   npm install -g wrangler
   ```

2. **Login**:

   ```bash
   wrangler login
   ```

3. **Deploy**:
   ```bash
   wrangler pages deploy dist --project-name=sovs
   ```

### Option 5: Deploy to Any Static Hosting

You can upload the contents of the `dist` folder to any static hosting service:

- AWS S3 + CloudFront
- Firebase Hosting
- Azure Static Web Apps
- Any web server with static file hosting

## Building for Web

If you need to rebuild after making changes:

```bash
npm run build:web
```

This will regenerate the `dist` folder with the latest changes.

## Important Notes

⚠️ **Camera Functionality**: The camera features (expo-camera) may have limited functionality on web browsers. Users will need to grant camera permissions when prompted.

⚠️ **Web Limitations**:

- Some mobile-specific features may not work perfectly on web
- Camera access requires HTTPS (most hosting services provide this automatically)
- Touch gestures work, but may feel different than native mobile

## Testing Locally

Before deploying, test the build locally:

```bash
# Install a simple HTTP server
npm install -g http-server

# Serve the dist folder
cd dist
http-server -p 3000
```

Then open `http://localhost:3000` in your browser.

## Custom Domain Setup

Most hosting services allow you to add a custom domain:

1. **Vercel/Netlify**: Add domain in project settings
2. **GitHub Pages**: Configure in repository settings → Pages
3. Follow the DNS instructions provided by your hosting service

## Environment Variables

If you need environment variables for production, configure them in your hosting service's dashboard (not in the code, as this is a static build).

## Continuous Deployment

For automatic deployments on code changes:

1. **Vercel/Netlify**: Connect your GitHub repository
2. Set build command: `npm run build:web`
3. Set publish directory: `dist`
4. Deployments will happen automatically on every push

