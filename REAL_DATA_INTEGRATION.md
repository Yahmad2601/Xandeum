# Mock Data Removal & Real Data Integration Guide

## ✅ What Was Cleared

### 1. **Database**
- ✅ All mock nodes deleted from `nodes` table
- ✅ All mock snapshots deleted from `node_snapshots` table
- Database is now empty and ready for real data

### 2. **Server (crawler.ts)**
- ✅ Removed all mock node generation logic
- ✅ Removed random data generation for:
  - IP addresses
  - Countries
  - Versions
  - Storage amounts
  - STOINC earnings
  - Uptime history
  - Status changes
- ⚠️ `fetchNodesFromPRPC()` now returns empty array with warning

### 3. **Client Components**

#### NodeList.tsx
- ✅ Removed `getLatency()` mock function
- ✅ Removed `getUptimeString()` mock function
- ✅ Replaced with "-" placeholders in UI
- ✅ Kept `getShortId()` and `getXdnScore()` (these work with real data)

#### ActivityFeed.tsx
- ✅ Removed `generateMockEvents()` function
- ✅ Now returns empty array
- ✅ Shows "No recent activity" message when empty

#### Home.tsx
- ✅ Removed `avgUptime` mock value

---

## 🔧 Next Steps: Implementing Real Data

### 1. **Integrate with Xandeum pRPC**

Edit `server/crawler.ts` and replace the `fetchNodesFromPRPC()` method:

```typescript
private async fetchNodesFromPRPC(): Promise<InsertNode[]> {
  try {
    const response = await fetch('http://YOUR_RPC_ENDPOINT:6000/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'get-pods-with-stats',
        id: 1
      })
    });

    const data = await response.json();
    
    // Transform pRPC response to InsertNode format
    return data.result.map((pod: any) => ({
      pubkey: pod.pubkey || pod.id,
      ip: pod.ip,
      version: pod.version || '1.0.0',
      country: pod.country || pod.region || 'Unknown',
      status: pod.status === 'active' ? 'active' : 'offline',
      totalStorage: pod.storage?.total || 0,
      stoincEarnings: pod.earnings || 0,
      networkCapacity: 200000, // Adjust based on your network
      stoincGenerated: pod.total_earnings || 0,
      uptimeHistory: [], // Will be built over time from snapshots
      weeklyUptimeHistory: [], // Will be built over time
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch from pRPC:', error);
    return [];
  }
}
```

### 2. **Add Real-Time Data Fields**

You may want to extend the schema to include fields that come from pRPC:

```typescript
// In shared/schema.ts, consider adding:
export const nodes = pgTable("nodes", {
  // ... existing fields ...
  latency: doublePrecision("latency"), // Real latency from pRPC
  cpuUsage: doublePrecision("cpu_usage"), // CPU metrics
  memoryUsage: doublePrecision("memory_usage"), // Memory metrics
  // ... etc
});
```

### 3. **Update NodeList Component**

Once you have real latency and uptime data:

```typescript
// In NodeList.tsx, replace placeholders:
<td className="px-6 py-4 font-mono text-muted-foreground">
  {node.latency ? `${node.latency.toFixed(0)}ms` : '-'}
</td>
```

### 4. **Implement Activity Feed**

Create an events table or derive events from snapshots:

```typescript
// Option 1: New events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'credits', 'version-update', 'status-change'
  nodeId: text("node_id").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Option 2: Derive from snapshots (status changes, version changes, etc.)
```

### 5. **Test with Real Data**

```bash
# Start the crawler
npm run dev

# The crawler will:
# 1. Fetch from your pRPC endpoint every 30 seconds
# 2. Store nodes in the database
# 3. Record snapshots for history
# 4. Calculate uptime scores over time
```

---

## 📊 Expected Data Flow

1. **Crawler fetches from pRPC** → Stores in `nodes` table
2. **Snapshots recorded** → Builds historical data in `node_snapshots`
3. **Every 10 crawls** → Uptime scores recalculated
4. **Frontend queries** → Displays real data from database

---

## 🔍 Testing Without Real pRPC

If you need to test before pRPC is ready:

```typescript
// Create a test endpoint that mimics pRPC structure
private async fetchNodesFromPRPC(): Promise<InsertNode[]> {
  // Fetch from a test JSON file or local endpoint
  const response = await fetch('http://localhost:3000/test-nodes.json');
  const data = await response.json();
  return data.map(transformToInsertNode);
}
```

---

## ✨ Benefits of Current State

- ✅ Clean slate - no mock data pollution
- ✅ All components handle empty data gracefully
- ✅ Database schema is production-ready
- ✅ Crawler infrastructure is in place
- ✅ Time Machine architecture is ready to collect real history

**You're now ready to connect to real Xandeum pRPC and start collecting authentic network data!** 🚀
