# 🔑 How to Get Your Supabase Database URL

## Visual Step-by-Step Guide

### Step 1: Open Supabase Dashboard
Navigate to: **https://app.supabase.com**

---

### Step 2: Select Your Project
Click on your **"Xandeum"** project from the project list

---

### Step 3: Navigate to Database Settings
1. Click the **Settings** icon (⚙️) in the left sidebar
2. Click **"Database"** in the settings menu

---

### Step 4: Find Connection String
Scroll down to the **"Connection string"** section

You'll see multiple tabs:
- Connection pooling
- Direct connection
- **URI** ← Select this one!

---

### Step 5: Copy the URI
Click on the **"URI"** tab

You'll see something like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Important:** The `[YOUR-PASSWORD]` part is a placeholder!

---

### Step 6: Replace the Password
You need to replace `[YOUR-PASSWORD]` with your actual database password.

**Example:**

**Before:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**After:**
```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

### Step 7: Forgot Your Password?

If you don't remember your database password:

1. Stay in **Settings → Database**
2. Scroll to **"Database Password"** section
3. Click **"Reset database password"**
4. Enter a new password
5. Click **"Update password"**
6. Use this new password in your connection string

⚠️ **Note:** Resetting the password will disconnect any currently running apps until you update their connection strings.

---

### Step 8: Your Final Connection String

Your connection string should look like this (all one line, no spaces):

```
postgresql://postgres:YourPassword@db.projectref.supabase.co:5432/postgres
```

**Breaking it down:**
- `postgresql://` - Protocol
- `postgres` - Username (always "postgres" for Supabase)
- `:YourPassword` - Your actual database password
- `@db.projectref.supabase.co` - Your project's database host
- `:5432` - PostgreSQL port
- `/postgres` - Database name

---

### Step 9: Add to .env File

Open the `.env` file in your project root and paste:

```env
DATABASE_URL=postgresql://postgres:YourPassword@db.projectref.supabase.co:5432/postgres
```

**No quotes needed!** Just paste the connection string directly.

---

## 🔒 Security Tips

1. **Never commit .env to Git** - It's already in .gitignore ✓
2. **Use strong passwords** - Mix letters, numbers, symbols
3. **Different password for production** - Don't use the same for dev/prod
4. **Rotate passwords regularly** - Update every few months

---

## ✅ Verify Your Setup

Run the test script to verify everything works:

```powershell
npm run db:test
```

If successful, you'll see:
```
✅ Successfully connected to database!
📊 Database Information:
   Database: postgres
   User: postgres
   ...
```

---

## 🆘 Troubleshooting

### Error: "password authentication failed"
- ❌ Wrong password in connection string
- ✅ Reset password in Supabase and update .env

### Error: "no pg_hba.conf entry"
- ❌ Your IP might be blocked
- ✅ Check Supabase → Settings → Database → Connection Pooling → Allow all IPs

### Error: "getaddrinfo ENOTFOUND"
- ❌ Wrong project reference in URL
- ✅ Copy the exact URL from Supabase dashboard

### Error: "connection timeout"
- ❌ Network/firewall issue
- ✅ Try from a different network or check firewall settings

---

## 🎯 Ready to Continue?

Once your database connection is verified, continue with [QUICKSTART.md](./QUICKSTART.md)!
