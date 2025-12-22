# ⚡ Quick Start Guide

## 🎯 Goal
Get your Xandeum dashboard running locally in 5 minutes!

---

## 📝 Steps

### 1️⃣ Get Your Supabase Connection String

1. Go to https://app.supabase.com
2. Select your **Xandeum** project
3. Click **Settings** (⚙️) → **Database**
4. Find **"Connection String"** section
5. Click the **"URI"** tab
6. Copy the string (looks like `postgresql://postgres:[PASSWORD]@db.xxx...`)
7. Replace `[YOUR-PASSWORD]` with your actual password

**Can't remember your password?**
- Reset it in: Settings → Database → Database Password → Reset

---

### 2️⃣ Configure Your .env File

Open the `.env` file and paste your connection string:

```env
DATABASE_URL=postgresql://postgres:YourPassword123@db.abcdefghij.supabase.co:5432/postgres
```

**Save the file!**

---

### 3️⃣ Run the Database Migration

Open **Supabase Dashboard** → **SQL Editor** → **New Query**

Copy everything from `migrations/0001_add_historical_tracking.sql` and paste it into the SQL editor.

Click **"Run"** ▶️

You should see: ✅ "Migration completed successfully!"

---

### 4️⃣ Install Dependencies

```powershell
npm install
```

---

### 5️⃣ Test Database Connection (Optional but Recommended)

```powershell
npm run db:test
```

You should see:
```
✅ Successfully connected to database!
📊 Database Information: ...
📋 Table Status: ...
```

---

### 6️⃣ Start the Server

```powershell
npm run dev
```

Look for:
```
🚀 Starting crawler service (30s intervals)...
✅ Crawl #1 completed: 50 nodes processed
Server running on port 5000
```

---

### 7️⃣ Open Your Dashboard

Go to: **http://localhost:5000**

You should see:
- ✅ Dashboard with nodes
- ✅ Green "Crawler: Active" badge (top-right)
- ✅ Network statistics

Click any node to see its **Reliability Score** and **Historical Trends**!

---

## 🎉 Done!

Your Time Machine is running! The crawler collects data every 30 seconds.

- After **1 hour**: Good hourly trend data
- After **7 days**: Accurate reliability scores
- After **1 month**: Full historical analysis

---

## 🆘 Problems?

Check [LOCAL_DEPLOYMENT.md](./LOCAL_DEPLOYMENT.md) for detailed troubleshooting.

**Common issues:**
- ❌ "DATABASE_URL must be set" → Check your .env file
- ❌ "relation 'node_snapshots' does not exist" → Run the migration
- ❌ "password authentication failed" → Check your password in DATABASE_URL

---

## 🚀 Next: Replace Mock Data with Real pRPC

Edit `server/crawler.ts` → `fetchNodesFromPRPC()` method

Replace the mock data generation with actual Xandeum pRPC calls!
