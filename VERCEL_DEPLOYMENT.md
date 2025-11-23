# Vercel Deployment Guide

Quick guide to deploy the Creative Acceleration Lab to Vercel.

---

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git push origin main
```
✅ Already done!

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `davidovier/Creative-Acceleration-Lab`
4. Vercel will auto-detect Next.js

### 3. Configure Environment Variables

In Vercel dashboard, add these environment variables:

**Required for Build:**
```bash
# These are needed for the build to succeed (can be dummy values for now)
OPENAI_API_KEY=sk-placeholder-will-be-replaced
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_SERVICE_ROLE_KEY=placeholder
ANTHROPIC_API_KEY=sk-ant-placeholder
```

**Required for Runtime:**
```bash
# Database
DATABASE_URL=postgresql://postgres.idqhczkvuoxetllmooch:v8.pG_jZD5wdK%&@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://idqhczkvuoxetllmooch.supabase.co
SUPABASE_ANON_KEY=sb_publishable_M6PMIPRxrGolzRhNu1wAkQ_oNXl_PyI
SUPABASE_SERVICE_ROLE_KEY=sb_secret_HEtUv3qHzmYUo6bbCIZyeA_ggth7Lnx

# AI APIs (use your actual keys from .env file)
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Admin
ADMIN_INGEST_SECRET=a8f3c9e2d7b6a5f4c3e2d1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0

# Optional
LOG_LEVEL=info
```

### 4. Deploy

Click "Deploy" and Vercel will:
- ✅ Install dependencies
- ✅ Build Next.js app
- ✅ Deploy to production

### 5. Verify Deployment

Once deployed, visit:
- `https://your-app.vercel.app` - Home page
- `https://your-app.vercel.app/kb` - KB diagnostic
- `https://your-app.vercel.app/session` - Session interface

---

## 🔧 Build Fixed!

The build error you saw has been fixed by implementing **lazy initialization** of API clients:

### Problem
```
Error: The OPENAI_API_KEY environment variable is missing or empty
```

### Solution
Instead of initializing clients at module load time (build time):
```typescript
// ❌ Old way - fails at build time
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

We now use lazy initialization (runtime only):
```typescript
// ✅ New way - only initializes when called
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}
```

This allows the build to succeed even without environment variables, and clients are created only when API routes are actually called.

---

## 📝 Post-Deployment Checklist

After successful deployment:

- [ ] Visit home page and verify it loads
- [ ] Check `/kb` page (may show 0 chunks until ingestion runs)
- [ ] Check `/session` page
- [ ] Test API endpoint: `https://your-app.vercel.app/api/kb/stats`
- [ ] Add real OpenAI API key (if using dummy during build)
- [ ] Run ingestion via API:
  ```bash
  curl -X POST https://your-app.vercel.app/api/admin/ingest \
    -H "x-admin-secret: a8f3c9e2d7b6a5f4c3e2d1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0"
  ```

---

## 🐛 Troubleshooting

### Build Still Failing?

1. **Check environment variables are set in Vercel**
   - Go to Project Settings → Environment Variables
   - Ensure all variables are added
   - Redeploy

2. **Clear Vercel cache**
   - In deployment, click "..." → Redeploy
   - Check "Clear build cache"

3. **Check build logs**
   - Look for specific error messages
   - Common issues: missing env vars, TypeScript errors

### Runtime Errors?

1. **API routes returning 500?**
   - Check Vercel Function Logs
   - Verify environment variables are set correctly
   - Check database connection

2. **CORS errors?**
   - Vercel handles CORS automatically for same-origin
   - External API calls should work

3. **Database connection issues?**
   - Verify `DATABASE_URL` uses Session Pooler (port 5432)
   - Check Supabase connection limits

---

## 🎯 Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
   - Go to Project Settings → Domains
   - Add your custom domain

2. **Run KB ingestion**
   - Via API endpoint (recommended for production)
   - Or locally then use database

3. **Test RAG search**
   - Visit `/kb` page
   - Try searching for "creative archetypes"

4. **Implement agents** (Prompt 3/4)
   - Create agent system prompts
   - Implement orchestration
   - Test session endpoint

---

## 📊 Vercel Configuration

The app is configured for Vercel with:

- **Runtime**: Node.js (required for database connections)
- **Max Duration**:
  - API routes: 10s (default)
  - `/api/admin/ingest`: 300s (5 min)
  - `/api/session`: 60s (1 min)
- **Regions**: Auto (closest to user)
- **Framework**: Next.js 14
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

---

## 💰 Cost Considerations

### Vercel Costs
- **Hobby plan**: Free for personal projects
- **Pro plan**: $20/month (recommended for production)
  - Includes: Analytics, custom domains, team collaboration

### API Costs
- **OpenAI**: Pay as you go (~$0.002 per ingestion, $0.000002 per query)
- **Anthropic**: Pay as you go (~$0.007 per session with Haiku)
- **Supabase**: Free tier sufficient for testing

---

## ✅ Deployment Checklist

Pre-deployment:
- [x] Code pushed to GitHub
- [x] Build errors fixed (lazy initialization)
- [x] Environment variables documented
- [x] API routes tested locally

Deployment:
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Build successful
- [ ] Deployment live

Post-deployment:
- [ ] Home page loads
- [ ] All pages accessible
- [ ] API endpoints respond
- [ ] KB ingestion ready
- [ ] Session interface working

---

**Status**: Ready to deploy! ✅

**Latest Commit**: `88a6531` - Fixed Vercel build with lazy initialization

**Next**: Deploy to Vercel and set environment variables
