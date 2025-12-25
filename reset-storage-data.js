import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.tibvxiumirawpqnwvhcr:wsyYDziXrItfkPnS@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
});

async function resetStorageData() {
  try {
    await client.connect();
    console.log("Connected to database");
    
    // Update all existing nodes to set storageUsed to 0 (will be populated by next crawl)
    const result = await client.query('UPDATE nodes SET storage_used = 0');
    console.log(`✅ Reset storage_used for ${result.rowCount} nodes`);
    
    // Also clear snapshots storage_used
    const snapshotResult = await client.query('UPDATE node_snapshots SET storage_used = 0');
    console.log(`✅ Reset storage_used for ${snapshotResult.rowCount} snapshots`);
    
    console.log("\n✅ Database reset complete. Restart the server to populate fresh data.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

resetStorageData();
