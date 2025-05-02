-- Create import_history table to track all import operations
CREATE TABLE IF NOT EXISTS import_history (
  id SERIAL PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  count INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  details TEXT,
  user_id UUID,
  user VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to users table if needed
  -- FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON import_history(created_at);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(status);

-- Add comment to table
COMMENT ON TABLE import_history IS 'Tracks all data import operations including status and details';
