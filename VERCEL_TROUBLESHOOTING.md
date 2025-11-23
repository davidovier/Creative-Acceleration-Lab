# Vercel 404 Troubleshooting Guide

**Issue**: Getting 404 errors when accessing `https://creative-acceleration-lab.vercel.app`

## Diagnosis

The build works locally (`npm run build` succeeds), but Vercel deployment shows 404 errors.

Common errors seen:
```
GET https://creative-acceleration-lab.vercel.app/ 404 (Not Found)
GET https://creative-acceleration-lab.vercel.app/meta.json 404 (Not Found)
GET https://creative-acceleration-lab.vercel.app/favicon.ico 404 (Not Found)
```

This suggests **the deployment exists but isn't serving the built files**.

---

## Solution Steps

### Step 1: Check Vercel Project Settings

1. Go to https://vercel.com/dashboard
2. Find your "Creative Acceleration Lab" project
3. Click on the project name

### Step 2: Verify Deployment Settings

Click **Settings** → **General**

**Check these settings:**
- ✅ **Framework Preset**: Should be **Next.js**
- ✅ **Root Directory**: Should be `./` (or leave blank)
- ✅ **Build Command**: Should be `npm run build` or auto-detected
- ✅ **Output Directory**: Should be `.next` (auto-detected for Next.js)
- ✅ **Install Command**: Should be `npm install` or auto-detected

**If any of these are wrong, update them and redeploy.**

### Step 3: Check Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment (commit `c90324f`)
3. Look at the **Build Logs**

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (10/10)
Build Completed in [output directory]
```

**If you see errors:**
- Missing environment variables → Add them in Settings → Environment Variables
- TypeScript errors → Check the error details
- Module not found → Ensure all dependencies are in package.json

### Step 4: Verify Environment Variables

Click **Settings** → **Environment Variables**

**Required variables for build:**
```bash
OPENAI_API_KEY=sk-proj-your-key-here
SUPABASE_URL=https://idqhczkvuoxetllmooch.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Important:**
- ✅ Check "Production", "Preview", and "Development" for each variable
- ✅ No quotes around values
- ✅ No trailing spaces

### Step 5: Force Redeploy with Cache Clear

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **...** (three dots) menu
4. Select **Redeploy**
5. ✅ **Check "Use existing Build Cache"** → **UNCHECK this** (clear cache)
6. Click **Redeploy**

### Step 6: Check for Framework Detection Issues

If Vercel isn't detecting Next.js correctly:

1. Go to **Settings** → **General**
2. Under **Framework Preset**, manually select **Next.js**
3. Save
4. Redeploy

### Step 7: Check Node.js Version

1. Go to **Settings** → **General**
2. Find **Node.js Version**
3. Should be **18.x** or **20.x** (recommended)
4. If it's older (16.x or below), update to 18.x
5. Redeploy

---

## Common Issues & Solutions

### Issue: "No Output Directory found"

**Solution:**
- Ensure `package.json` has `"build": "next build"`
- Check that `.gitignore` doesn't ignore `.next` output
- Manually set Output Directory to `.next` in Settings

### Issue: "Module not found" during build

**Solution:**
- Check that all imports are correct
- Verify all dependencies are in `package.json` (not devDependencies)
- Try redeploying with cache cleared

### Issue: Environment variables not working

**Solution:**
- Re-add environment variables in Vercel dashboard
- Ensure they're checked for Production environment
- Redeploy after adding variables

### Issue: Build succeeds but pages still 404

**Solution:**
- Check Framework Preset is set to Next.js (not Other)
- Check Root Directory is correct (should be `./` or blank)
- Try connecting to GitHub again (disconnect/reconnect)

---

## Nuclear Option: Reimport Project

If nothing works, try reimporting:

1. Go to Vercel dashboard
2. Delete the current project (Settings → scroll to bottom → Delete)
3. Click **Add New...** → **Project**
4. Import from GitHub: `davidovier/Creative-Acceleration-Lab`
5. Vercel should auto-detect Next.js
6. Add environment variables
7. Deploy

---

## Verify It's Working

After redeployment, test these URLs:
- `https://creative-acceleration-lab.vercel.app/` → Should show home page
- `https://creative-acceleration-lab.vercel.app/session` → Should show session page
- `https://creative-acceleration-lab.vercel.app/kb` → Should show KB page
- `https://creative-acceleration-lab.vercel.app/api/kb/stats` → Should return JSON

---

## Debug Information

**Local build status**: ✅ Working
```bash
npm run build
# ✓ Compiled successfully
# ✓ Generating static pages (10/10)
```

**Git status**: ✅ Up to date
- Latest commit: `c90324f` (Fix Vercel deployment 404 error)
- Branch: `main`
- Remote: Up to date with origin

**Project structure**: ✅ Correct
```
app/
  ├── page.tsx         (home page)
  ├── layout.tsx       (root layout)
  ├── globals.css      (styles)
  ├── session/
  │   └── page.tsx     (session page)
  ├── kb/
  │   └── page.tsx     (KB page)
  └── api/
      ├── session/route.ts
      ├── kb/stats/route.ts
      └── kb/search/route.ts
```

**Next.js config**: ✅ Clean
- No output directory override
- No custom build configuration
- Should auto-detect as Next.js App Router

---

## Contact Vercel Support

If all else fails:
1. Go to https://vercel.com/help
2. Click **Contact Support**
3. Provide:
   - Project name: "Creative Acceleration Lab"
   - Issue: "404 on all pages despite successful local build"
   - Deployment URL: `https://creative-acceleration-lab.vercel.app`
   - Latest commit: `c90324f`
   - Framework: Next.js 14.2.33
   - Build logs (attach screenshot)

---

## Expected Behavior

Once working, you should see:
- ✅ Home page with "Creative Acceleration Lab" heading
- ✅ Two cards: "Launch Session" and "KB Diagnostic"
- ✅ Purple/blue gradient background
- ✅ No console errors
- ✅ All links working
