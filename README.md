# 🌐 Xandeum Network Dashboard

A real-time monitoring dashboard for the Xandeum decentralized storage network. Track node performance, storage utilization, earnings, and network health with an interactive, responsive interface.

![Xandeum Dashboard](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80)

## ✨ Features

- **🗺️ Interactive Network Map** - Visualize global node distribution with real-time clustering
- **📊 Real-Time Statistics** - Monitor total nodes, online status, storage committed, and STOINC earnings
- **🔍 Advanced Node Explorer** - Search, filter, and sort nodes by multiple criteria
- **⚡ Node Comparison Tool** - Side-by-side performance analysis of any two nodes
- **📈 Uptime Charts** - 7-day historical uptime visualization
- **🏥 Network Health Score** - Comprehensive health metrics based on uptime, storage, and version uniformity
- **🎯 Onboarding Tour** - Interactive guide for first-time users
- **🌙 Dark/Light Mode** - Theme toggle for user preference
- **📱 Fully Responsive** - Optimized for desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Maps**: react-simple-maps
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** database (we recommend [Supabase](https://supabase.com/) - free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/xandeum-staker.git
cd xandeum-staker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**To get your Supabase DATABASE_URL:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Navigate to **Project Settings** → **Database** → **Connection string** → **URI**
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password

### 4. Initialize the Database

Push the schema to your database:

```bash
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5000**

---

## 📦 Production Build

### Build for Production

```bash
npm run build
```

This creates:
- `dist/public/` - Compiled frontend assets
- `dist/index.cjs` - Bundled server

### Run Production Server

```bash
npm start
```

---

## ☁️ Deploy to Vercel

This project is configured for seamless Vercel deployment.

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel Dashboard:
   - `DATABASE_URL` - Your Supabase PostgreSQL connection string

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure environment variables:
   - `DATABASE_URL` = `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
6. Click **Deploy**

### Vercel Configuration

The project includes a `vercel.json` for optimal configuration:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "functions": {
    "dist/index.cjs": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/dist/index.cjs" },
    { "src": "/(.*)", "dest": "/dist/public/$1" }
  ]
}
```

---

## 🔧 Project Structure

```
xandeum-staker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── NetworkMap.tsx
│   │   │   ├── NodeList.tsx
│   │   │   ├── NodeComparison.tsx
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities
│   └── index.html
├── server/                 # Backend Express server
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── crawler.ts          # Xandeum network crawler
│   ├── storage.ts          # Database operations
│   └── db.ts               # Database connection
├── shared/                 # Shared types and schemas
│   ├── schema.ts           # Drizzle ORM schema
│   └── routes.ts           # API route definitions
├── script/                 # Build scripts
└── dist/                   # Production build output
```

---

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nodes` | GET | List all nodes |
| `/api/nodes/:pubkey` | GET | Get node details |
| `/api/nodes/:pubkey/uptime` | GET | Get node uptime statistics |
| `/api/nodes/:pubkey/trends` | GET | Get node trend data |
| `/api/activities` | GET | Get recent network activities |
| `/api/crawler/status` | GET | Get crawler status |
| `/api/cron/refresh` | POST | Trigger manual data refresh |

---

## 🔄 How the Crawler Works

The dashboard includes an automated crawler that:

1. **Connects to Xandeum Seed Nodes** - Queries the network via pRPC on port 6000
2. **Fetches All Active Pods** - Gets real-time data from `get-pods-with-stats`
3. **Enriches with GeoIP Data** - Determines node locations
4. **Fetches STOINC Earnings** - Pulls credits from the Xandeum Credits API
5. **Updates Every 30 Seconds** - Maintains real-time accuracy
6. **Records Historical Snapshots** - For uptime calculations and trend charts

---

## 🎨 Customization

### Theme Colors

Modify `tailwind.config.ts` to customize the color palette.

### Add New Seed Nodes

Set the `XANDEUM_SEED_IPS` environment variable:

```env
XANDEUM_SEED_IPS=192.168.1.1,192.168.1.2,192.168.1.3
```

---

## 🐛 Troubleshooting

### Database Connection Issues

- Ensure your `DATABASE_URL` is correct
- Check that your IP is whitelisted in Supabase (or use connection pooling)
- Verify the database password doesn't contain special characters that need URL encoding

### Crawler Not Finding Nodes

- The Xandeum network must be running
- Seed node IPs must be accessible from your server
- Check firewall rules for port 6000

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear build cache
rm -rf dist
npm run build
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/your-username/xandeum-staker/issues) page.

---

**Built with ❤️ for the Xandeum Community**
