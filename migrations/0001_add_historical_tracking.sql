-- Migration: Add Historical Data Tables
-- Created: 2025-12-22
-- Description: Adds node_snapshots table for historical tracking and enhances nodes table with reliability metrics

-- Add new columns to nodes table
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS uptime_score DOUBLE PRECISION DEFAULT 100;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS reliability_rank INTEGER;

-- Create node_snapshots table for heartbeat data
CREATE TABLE IF NOT EXISTS node_snapshots (
  id SERIAL PRIMARY KEY,
  pubkey TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'offline')),
  ip TEXT,
  version TEXT,
  total_storage DOUBLE PRECISION,
  stoinc_earnings DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS snapshots_pubkey_idx ON node_snapshots(pubkey);
CREATE INDEX IF NOT EXISTS snapshots_timestamp_idx ON node_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS snapshots_pubkey_timestamp_idx ON node_snapshots(pubkey, timestamp DESC);

-- Optional: Add foreign key constraint (only if you want strict referential integrity)
-- ALTER TABLE node_snapshots ADD CONSTRAINT fk_node_pubkey FOREIGN KEY (pubkey) REFERENCES nodes(pubkey) ON DELETE CASCADE;

-- Create a helpful view for quick uptime queries
CREATE OR REPLACE VIEW node_uptime_summary AS
SELECT 
  n.pubkey,
  n.status as current_status,
  n.uptime_score,
  n.reliability_rank,
  COUNT(ns.id) as total_snapshots,
  SUM(CASE WHEN ns.status = 'active' THEN 1 ELSE 0 END) as active_snapshots,
  SUM(CASE WHEN ns.status = 'offline' THEN 1 ELSE 0 END) as offline_snapshots,
  MIN(ns.timestamp) as first_seen,
  MAX(ns.timestamp) as last_seen
FROM nodes n
LEFT JOIN node_snapshots ns ON n.pubkey = ns.pubkey
GROUP BY n.pubkey, n.status, n.uptime_score, n.reliability_rank;

-- Success message
SELECT 'Migration completed successfully! node_snapshots table and indexes created.' as status;
