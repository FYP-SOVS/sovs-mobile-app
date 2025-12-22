# Quick Web Deployment Guide

## 🚀 Fastest Way: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod dist
   ```

That's it! You'll get a URL like `https://your-project.vercel.app`

## 📋 Alternative: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod --dir=dist
   ```

## 🔄 Rebuilding After Changes

When you make changes to your app, rebuild and redeploy:

```bash
npm run build:web
vercel --prod dist  # or netlify deploy --prod --dir=dist
```

## 📝 Notes

- Camera features work on web but require HTTPS (provided by hosting)
- The app is responsive and works on desktop and mobile browsers
- All bilingual features (EN/TR) work on web too



