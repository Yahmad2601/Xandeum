# 🚀 Local Deployment Guide - Xandeum Staker Dashboard

## Prerequisites
- Node.js (v18 or higher)
- Supabase project (already created ✓)

---

## 📋 Step 1: Get Your Supabase Database URL

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Select your "Xandeum" project**
3. **Navigate to**: Settings (⚙️) → Database
4. **Scroll down to "Connection String"**
5. **Select "URI" tab** (not "Connection pooling")
6. **Copy the connection string** - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
7. **Replace `[YOUR-PASSWORD]`** with your actual database password
   - If you forgot your password, you can reset it in Settings → Database → Database Password

---

## 🔧 Step 2: Configure Environment Variables

1. **Open the `.env` file** in the project root
2. **Replace the DATABASE_URL** with your actual connection string:
   ```env
   DATABASE_URL=postgresql://postgres:your_actual_password@db.your_project_ref.supabase.co:5432/postgres
   ```

**Example:**
```env
DATABASE_URL=postgresql://postgres:MySecurePass123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## 🗄️ Step 3: Run Database Migration

You have two options:

### Option A: Using Supabase SQL Editor (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the contents of `migrations/0001_add_historical_tracking.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see: "Migration completed successfully!"

### Option B: Using Drizzle Kit (Alternative)
Run this command in your terminal:
```powershell
npm run db:push
```

---

## 📦 Step 4: Install Dependencies

```powershell
npm install
```

---

## ▶️ Step 5: Start the Development Server

```powershell
npm run dev
```

You should see:
```
🚀 Starting crawler service (30s intervals)...
🔄 Crawl #1 started at 2025-12-22T...
✅ Crawl #1 completed: 50 nodes processed
Server running on port 5000
```

---

## 🌐 Step 6: Open Your Dashboard

Open your browser and navigate to:
```
http://localhost:5000
```

You should see:
- ✅ Network health dashboard
- ✅ Active nodes list
- ✅ Crawler status badge (with green pulsing indicator)
- ✅ Statistics and charts

---

## 🔍 Step 7: Verify Everything is Working

### Check the Crawler
- Look for the **green pulsing "Crawler: Active"** badge in the top-right header
- It should show the number of crawls completed

### Check Historical Data
1. Click on any node in the list
2. You should see:
   - **Reliability Score** card (top of page)
   - **Historical Uptime Trends** chart with 24h/7d/4w tabs
   - **Statistics panel** with uptime percentage and check counts

### Check the Database
Go to Supabase → Table Editor:
- `nodes` table should have ~50 rows
- `node_snapshots` table should start accumulating rows (every 30 seconds)

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL must be set"
- Check your `.env` file exists and has the correct DATABASE_URL
- Make sure there are no quotes around the URL
- Restart the dev server after changing .env

### Error: "relation 'node_snapshots' does not exist"
- Run the migration (Step 3) in Supabase SQL Editor
- Check that the migration completed successfully

### Crawler shows "Stopped"
- Check the server console for errors
- The crawler auto-starts when the server starts
- You can manually trigger a crawl by clicking the refresh button

### No historical data showing
- The system needs time to collect data (runs every 30 seconds)
- Check Supabase → `node_snapshots` table for rows
- Wait a few minutes and refresh the node detail page

### Port 5000 already in use
- Change the port in `server/index.ts` or kill the process using port 5000
- On Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`

---

## 🎯 Next Steps

Once everything is running locally:

1. **Monitor the crawler**: Watch the console for crawl logs every 30 seconds
2. **Test node details**: Click on different nodes to see their reliability scores
3. **Check trends**: The Historical Trend Chart will become more accurate as data accumulates
4. **Customize**: Make adjustments to colors, layouts, or add features
5. **Integrate pRPC**: Replace mock data in `server/crawler.ts` with real Xandeum pRPC calls

---

## 📊 Understanding the Data

- **Crawler runs every 30 seconds** and records node status
- **Uptime Score** is calculated from the last 7 days (168 hours) of data
- **Reliability Rank** updates every 5 minutes (10 crawls)
- **Trends** show hourly (24h), daily (7d), and weekly (4w) aggregates
- **Fresh installs** start with mock data and 100% uptime scores

After ~1 hour of running, you'll have good hourly trend data.
After ~7 days, you'll have accurate weekly reliability scores!

---

## 🚀 Ready for Production?

When you're ready to deploy:
1. Set up a production database (or use the same Supabase project)
2. Update the DATABASE_URL for production
3. Deploy to Vercel, Railway, or your preferred platform
4. Make sure the crawler stays running (consider a separate worker process)

Good luck with your bounty submission! 🎉
