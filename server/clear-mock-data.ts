import { db } from "./db";
import { nodes, nodeSnapshots } from "@shared/schema";

/**
 * Script to clear all mock data from the database
 */
async function clearMockData() {
  try {
    console.log("🗑️  Clearing mock data from database...");
    
    // Delete all snapshots first (foreign key dependency)
    const snapshotsDeleted = await db.delete(nodeSnapshots);
    console.log(`✅ Deleted all node snapshots`);
    
    // Delete all nodes
    const nodesDeleted = await db.delete(nodes);
    console.log(`✅ Deleted all nodes`);
    
    console.log("✨ Database cleared successfully! Ready for real data.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clearMockData();
