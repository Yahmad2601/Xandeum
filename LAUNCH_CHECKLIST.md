# ✅ Pre-Launch Checklist

Before you run `npm run dev`, go through this checklist:

## 🔧 Setup Checklist

### 1. Supabase Connection String
- [ ] Logged into Supabase Dashboard (https://app.supabase.com)
- [ ] Selected the "Xandeum" project
- [ ] Navigated to Settings → Database
- [ ] Copied the Connection String (URI tab)
- [ ] Replaced `[YOUR-PASSWORD]` with actual password
- [ ] Pasted into `.env` file

**Your .env file should look like:**
```env
DATABASE_URL=postgresql://postgres:ActualPassword@db.projectref.supabase.co:5432/postgres
```

### 2. Database Migration
- [ ] Opened Supabase Dashboard → SQL Editor
- [ ] Created a New Query
- [ ] Copied contents of `migrations/0001_add_historical_tracking.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" ▶️
- [ ] Saw success message: "Migration completed successfully!"

### 3. Dependencies
- [ ] Ran `npm install` (make sure to install dotenv)
- [ ] No errors during installation

### 4. Database Test (Optional but Recommended)
- [ ] Ran `npm run db:test`
- [ ] Saw: "✅ Successfully connected to database!"
- [ ] Verified both tables exist: `nodes` and `node_snapshots`

---

## 🚀 Launch Commands

Once all checkboxes above are complete, run:

```powershell
npm run dev
```

---

## 👀 What to Look For

### In the Console
Look for these messages (in order):

1. **Seeding:**
   ```
   Seeding database with 50 mock nodes...
   Seeding complete.
   ```

2. **Crawler Start:**
   ```
   🚀 Starting crawler service (30s intervals)...
   ```

3. **First Crawl:**
   ```
   🔄 Crawl #1 started at 2025-12-22T...
   ✅ Crawl #1 completed: 50 nodes processed
   ```

4. **Server Ready:**
   ```
   Server running on port 5000
   ```

5. **Periodic Crawls (every 30 seconds):**
   ```
   🔄 Crawl #2 started at...
   ✅ Crawl #2 completed: 50 nodes processed
   🔄 Crawl #3 started at...
   ✅ Crawl #3 completed: 50 nodes processed
   ```

6. **Score Updates (every 5 minutes):**
   ```
   📊 Updating uptime scores and rankings...
   ```

### In the Browser (http://localhost:5000)

#### Home Page
- [ ] Page loads without errors
- [ ] See "XandeumScan" logo in header
- [ ] **Green pulsing "Crawler: Active"** badge in top-right
- [ ] Network health bar showing active/total nodes
- [ ] Stats cards showing network capacity, storage, etc.
- [ ] Node list with status indicators
- [ ] Can scroll through nodes

#### Node Detail Page (Click any node)
- [ ] Page loads with node details
- [ ] **Reliability Score card** at the top (shows score, rank, circular indicator)
- [ ] Quick stats grid (location, storage, version, last seen)
- [ ] Earnings performance chart
- [ ] Real-time uptime section with sparkline
- [ ] Statistics panel (showing uptime %, checks, etc.)
- [ ] **Historical Trend Chart** with three tabs:
  - [ ] Last 24 Hours tab works
  - [ ] Last 7 Days tab works
  - [ ] Last 4 Weeks tab works

#### Crawler Badge
- [ ] Shows "Crawler: Active"
- [ ] Has green pulsing indicator
- [ ] Shows crawl count (increases over time)

---

## 🔍 Verification Steps

### After 1 Minute of Running

1. **Check Supabase:**
   - Go to Supabase → Table Editor → `node_snapshots`
   - Should see 100+ rows (50 nodes × 2 crawls)

2. **Check Node Detail:**
   - Click any node
   - Statistics panel should show "Total Checks: 2" (or more)
   - Active/Offline checks should be displayed

### After 5 Minutes of Running

1. **Check Console:**
   - Should see "📊 Updating uptime scores and rankings..."
   - This happens on crawl #10

2. **Check Reliability Scores:**
   - Node detail pages should show updated scores
   - Some nodes may have scores slightly below 100%

---

## ❌ Common Issues & Solutions

### Issue: "DATABASE_URL must be set"
**Solution:** 
- Check `.env` file exists in project root
- Verify DATABASE_URL is set (no quotes needed)
- Restart the server after changing .env

### Issue: "relation 'node_snapshots' does not exist"
**Solution:**
- Run the migration in Supabase SQL Editor
- Make sure you clicked "Run" ▶️
- Check for success message

### Issue: Crawler shows "Stopped"
**Solution:**
- Check console for error messages
- Verify database connection with `npm run db:test`
- Check Supabase for any connection issues

### Issue: No historical data in charts
**Solution:**
- Wait at least 2-3 crawls (1-2 minutes)
- Refresh the node detail page
- Check `node_snapshots` table has data

### Issue: Charts are empty/broken
**Solution:**
- Check browser console for errors (F12)
- Verify recharts library is installed
- Clear browser cache and refresh

---

## 📊 Monitoring Your Deployment

### Watch the Console
Keep an eye on crawl logs to ensure everything is running:
```
✅ Crawl #1 completed: 50 nodes processed
✅ Crawl #2 completed: 50 nodes processed
✅ Crawl #3 completed: 50 nodes processed
```

### Check Supabase Dashboard
- **Table Editor** → `node_snapshots`: Watch rows grow
- **Database** → **Performance**: Monitor query performance
- **Logs** → **Postgres Logs**: Check for any database errors

### Monitor Browser Network Tab
- Open DevTools (F12) → Network tab
- Watch API calls:
  - `/api/nodes` - Should return nodes list
  - `/api/nodes/:pubkey/uptime` - Should return uptime stats
  - `/api/nodes/:pubkey/trends` - Should return trend data
  - `/api/crawler/status` - Should show crawler is active

---

## 🎉 Success Criteria

You know everything is working when:

- ✅ Crawler logs appear every 30 seconds
- ✅ Green "Crawler: Active" badge shows in UI
- ✅ Node detail pages show reliability scores
- ✅ Historical trend chart displays data
- ✅ Supabase `node_snapshots` table grows over time
- ✅ No errors in console (server or browser)

---

## 📝 Next: Make Adjustments

Once verified everything works:

1. **Test navigation** - Click around, open multiple nodes
2. **Check mobile view** - Resize browser window
3. **Customize colors/styles** - Adjust to your preference
4. **Plan pRPC integration** - Note what mock data to replace
5. **Add features** - Consider what innovations to add

---

## 🚀 Ready to Go!

If all checkboxes are complete, you're ready to:

```powershell
npm run dev
```

Then open: **http://localhost:5000**

Good luck! 🎊
