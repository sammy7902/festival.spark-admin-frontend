# Netlify Deployment Guide

## Quick Start

### 1. Initialize Git and Push to GitHub

```bash
# Navigate to frontend directory
cd billify-frontend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Festival Spark Admin Frontend"

# Rename branch to main
git branch -M main

# Add remote repository
git remote add origin https://github.com/sammy7902/festival.spark-admin-frontend.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Netlify

1. **Sign up/Login to Netlify:**
   - Go to https://app.netlify.com
   - Sign up or login with GitHub

2. **Import Project:**
   - Click "Add new site" → "Import an existing project"
   - Select "Deploy with GitHub"
   - Authorize Netlify to access your GitHub
   - Select repository: `festival.spark-admin-frontend`

3. **Configure Build Settings:**
   - Netlify will auto-detect from `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - If not auto-detected, manually set:
     - Base directory: (leave empty)
     - Build command: `npm run build`
     - Publish directory: `dist`

4. **Set Environment Variables:**
   - Go to Site settings → Environment variables
   - Click "Add variable"
   - Add:
     ```
     Key: VITE_API_BASE_URL
     Value: https://festive-spark-admin-backend.onrender.com/api
     ```
   - Replace with your actual backend URL

5. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at: `https://random-name.netlify.app`

### 3. Update Backend CORS

Update your backend `.env` file to allow your Netlify URL:

```env
FRONTEND_URL=https://your-netlify-site.netlify.app
```

Or if you have multiple origins:

```env
FRONTEND_URL=https://your-netlify-site.netlify.app,https://your-custom-domain.com
```

**Important:** Restart your backend server after updating CORS settings.

### 4. Custom Domain (Optional)

1. In Netlify dashboard → Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `admin.festivalspark.com`)
4. Follow DNS configuration instructions
5. Update backend `FRONTEND_URL` to include your custom domain

## Environment Variables

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://festive-spark-admin-backend.onrender.com/api` |

### Setting in Netlify

1. Go to Site settings → Environment variables
2. Add each variable
3. Redeploy if variables are added after first deployment

## Build Configuration

The `netlify.toml` file includes:
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`
- ✅ SPA routing (all routes redirect to index.html)
- ✅ Security headers
- ✅ Cache headers for static assets

## Troubleshooting

### Build Fails

1. Check build logs in Netlify dashboard
2. Ensure `package.json` has build script: `"build": "vite build"`
3. Check Node.js version (should be >= 18.0.0)
4. Verify all dependencies are in `package.json`

### API Calls Fail

1. Verify `VITE_API_BASE_URL` is set in Netlify environment variables
2. Check backend CORS settings include your Netlify URL
3. Verify backend is running and accessible
4. Check browser console for CORS errors

### Routes Not Working (404)

- The `netlify.toml` includes SPA redirects
- If still having issues, verify redirect rule is present:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

### Environment Variables Not Working

- Environment variables must start with `VITE_` to be accessible in Vite
- After adding variables, trigger a new deployment
- Variables are available at build time, not runtime

## Post-Deployment Checklist

- [ ] Site is accessible
- [ ] Login works
- [ ] API calls succeed (check Network tab)
- [ ] All routes work (Dashboard, Earnings, Generate Bill, etc.)
- [ ] Backend CORS updated with Netlify URL
- [ ] Environment variables set in Netlify
- [ ] Custom domain configured (if applicable)

## Support

For issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify backend is running and accessible
4. Check CORS configuration in backend

