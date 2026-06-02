# Frontend Deployment to Vercel

## Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access GitHub
5. Create your account

## Step 2: Import Repository

1. On Vercel dashboard, click "Add New..."
2. Select "Project"
3. Click "Import Git Repository"
4. Find and select `PCP_FRONTEND` repository
5. Click "Import"

## Step 3: Configure Project

### Framework Preset
- **Framework**: Vite
- **Root Directory**: ./
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

These should auto-detect. If not:

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Output Directory | `dist` |
| Node.js Version | 18.x (recommended) |

## Step 4: Add Environment Variables

Click "Environment Variables"

Add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | Your Render backend URL |

### Example:
```
VITE_API_BASE_URL=https://pcp-backend-xxxx.onrender.com
```

## Step 5: Deploy

1. Click "Deploy"
2. Wait for build completion (1-2 minutes)
3. You get a live URL: `https://pcp-frontend-xxx.vercel.app`
4. Vercel automatically generates a preview URL for each pull request

## Step 6: Verify Deployment

Visit your URL in browser:
```
https://your-vercel-url.vercel.app
```

Check:
- ✅ Page loads without errors
- ✅ No console errors (F12 → Console)
- ✅ Can see welcome message

## Step 7: Update .env.local

Create `.env.local` in frontend root (DO NOT COMMIT):

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

Or just use Vercel environment variables (recommended).

## Deployment URL

Once deployed, save your URL:
```
https://your-frontend-url.vercel.app
```

You'll need this for:
- Assessment submission
- Testing the application
- Sharing with others

## Important: Update Frontend to Call Backend

Make sure your API service uses the environment variable:

**src/services/api.js** should have:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
```

## Redeploy After Changes

### Option 1: Automatic (Recommended)
1. Make changes locally
2. Commit: `git add -A && git commit -m "message"`
3. Push: `git push`
4. Vercel auto-deploys (watch deployments tab)

### Option 2: Manual Redeploy
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments" tab
4. Click "Redeploy" on latest deployment

## Preview & Production

- **Preview**: Every pull request gets preview URL
- **Production**: Main branch deploys to production URL
- **Staging**: Use separate branches for staging

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check `npm run build` works locally |
| 404 errors | Ensure routing is set up for SPA |
| API calls fail | Check `VITE_API_BASE_URL` is correct |
| CSS/fonts missing | Check file paths are relative |
| Page blank | Check console errors, verify component exports |

## Debugging

1. Click "Deployments" tab
2. Select the failed deployment
3. Scroll to "Build Logs"
4. Read error messages
5. Fix locally and push again

## Performance Tips

- ✅ Build succeeded in ~1-2 minutes
- ✅ Optimal Largest Contentful Paint < 2.5s
- ✅ First Input Delay < 100ms
- Use Vercel Analytics to monitor

## Rollback

If deployment breaks:
1. Go to Deployments
2. Find last working deployment
3. Click "..." menu
4. Select "Promote to Production"

## Final Checklist

Before submitting:

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_BASE_URL` points to backend
- [ ] Health check endpoint works
- [ ] No console errors in browser
- [ ] API calls successful
- [ ] Save both URLs for submission
