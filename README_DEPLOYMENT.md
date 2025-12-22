# 🎯 Local Deployment - Ready to Go!

## ✅ Everything You Need is Set Up

I've prepared your project for local deployment with the following files:

### 📄 Configuration Files
- ✅ `.env` - Database configuration (needs your Supabase URL)
- ✅ `.env.example` - Template for reference
- ✅ `.gitignore` - Updated to exclude .env files

### 📊 Database Files
- ✅ `migrations/0001_add_historical_tracking.sql` - Database schema migration
- ✅ `script/test-db.ts` - Connection test script

### 📖 Documentation
- ✅ `QUICKSTART.md` - 5-minute setup guide
- ✅ `SUPABASE_SETUP.md` - Detailed Supabase credential guide
- ✅ `LOCAL_DEPLOYMENT.md` - Complete deployment documentation

### 🆕 New npm Scripts
- ✅ `npm run db:test` - Test database connection
- ✅ `npm run dev` - Start development server (existing)
- ✅ `npm run db:push` - Push schema with Drizzle (existing)

---

## 🚀 Quick Start (3 Steps)

### 1. Get Your Supabase Connection String

Follow: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

**TL;DR:**
- Go to Supabase Dashboard
- Settings → Database → Connection String (URI tab)
- Copy and replace `[YOUR-PASSWORD]` with actual password

### 2. Update .env File

```env
DATABASE_URL=postgresql://postgres:YourPassword@db.yourproject.supabase.co:5432/postgres
```

### 3. Run These Commands

```powershell
# Install dependencies
npm install

# Test database connection
npm run db:test

# Run the migration in Supabase SQL Editor
# Copy/paste: migrations/0001_add_historical_tracking.sql

# Start the server
npm run dev
```

Then open: **http://localhost:5000** 🎉

---

## 📋 What Happens When You Start?

```
🚀 Starting crawler service (30s intervals)...
Seeding database with 50 mock nodes...
Seeding complete.
🔄 Crawl #1 started at 2025-12-22T...
✅ Crawl #1 completed: 50 nodes processed

Server running on port 5000
```

The **crawler** automatically:
- Runs every 30 seconds
- Records node status snapshots
- Updates uptime scores every 5 minutes
- Builds historical trend data

---

## 🎨 What You'll See in the Dashboard

### Home Page
- Network health overview
- Active node count & statistics
- **Green pulsing "Crawler: Active"** badge
- Live node list with status indicators
- Network map & regional distribution

### Node Detail Page (Click any node)
- **Reliability Score Card** - Big score with visual indicator
- Quick stats (location, storage, version, last seen)
- Earnings performance chart
- Real-time uptime sparkline
- **Historical Trend Chart** - 24h / 7 days / 4 weeks views
- Statistics panel with check counts

---

## 🕐 Historical Data Timeline

The system starts with mock data and builds real history over time:

| Time Passed | What You Get |
|-------------|-------------|
| **Immediate** | Dashboard works, mock data, 100% scores |
| **30 seconds** | First real snapshot recorded |
| **5 minutes** | 10 snapshots, first score calculation |
| **1 hour** | 120 snapshots, accurate hourly trends |
| **24 hours** | 2,880 snapshots, full daily view |
| **7 days** | 20,160 snapshots, accurate reliability scores |
| **1 month** | ~86,400 snapshots, complete historical analysis |

---

## 🔧 Testing & Adjusting

### Monitor the Crawler
Watch the console for crawl logs:
```
🔄 Crawl #1 started...
✅ Crawl #1 completed: 50 nodes processed
🔄 Crawl #2 started...
✅ Crawl #2 completed: 50 nodes processed
```

### Check Snapshots in Supabase
1. Go to Supabase → Table Editor
2. Select `node_snapshots` table
3. Watch rows accumulate every 30 seconds

### View Reliability Scores
- Nodes list shows `uptimeScore` column
- Detail page shows full Reliability Score card
- Rankings update every 5 minutes

### Adjust Crawler Interval
Edit `server/crawler.ts` line 35:
```typescript
}, 30000); // Change to different milliseconds
```

---

## 🎯 Next Steps After Testing

### 1. Integrate Real pRPC
Replace mock data in `server/crawler.ts`:
```typescript
private async fetchNodesFromPRPC(): Promise<InsertNode[]> {
  // TODO: Replace with actual Xandeum pRPC calls
  // const response = await fetch('your-prpc-endpoint');
  // ...
}
```

### 2. Customize UI
- Colors in `tailwind.config.ts`
- Components in `client/src/components/`
- Layouts in `client/src/pages/`

### 3. Add More Features
- Node comparison tool
- Alert system
- Advanced filters
- Export functionality
- APY calculator

### 4. Deploy to Production
- Update DATABASE_URL for production
- Deploy to Vercel/Railway/etc
- Ensure crawler runs continuously

---

## 📚 Full Documentation

- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Supabase Setup:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Full Guide:** [LOCAL_DEPLOYMENT.md](./LOCAL_DEPLOYMENT.md)
- **Time Machine Architecture:** [TIME_MACHINE_SETUP.md](./TIME_MACHINE_SETUP.md)

---

## 🆘 Need Help?

1. **Database connection issues:** Run `npm run db:test`
2. **Missing tables:** Run migration in Supabase SQL Editor
3. **Crawler not starting:** Check console for error messages
4. **No historical data:** Wait a few minutes for data collection

---

## ✨ You're All Set!

Everything is configured and ready. Just add your Supabase connection string and you're good to go!

**Run this to start:**
```powershell
npm install && npm run db:test && npm run dev
```

Good luck with your bounty submission! 🚀🎉
