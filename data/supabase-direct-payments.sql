-- Direct Payments System for Rivo Labs
-- This replaces the credit system with direct per-generation payments

-- Payments table to track all direct payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL, -- Dollar amount (e.g., 0.10, 0.70)
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_provider TEXT NOT NULL, -- 'stripe', 'paypal', 'test', etc.
  payment_provider_id TEXT NOT NULL, -- External payment ID from provider
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Store model_id, prompt info, etc.
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the api_requests table to include payment_id
ALTER TABLE api_requests 
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_payment_id ON api_requests(payment_id);

-- Update trigger for payments
CREATE TRIGGER update_payments_updated_at 
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Users can create their own payments (through API)
CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Grant necessary permissions
GRANT ALL ON payments TO anon, authenticated;

-- Create a view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as day,
  payment_provider,
  status,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM payments
GROUP BY day, payment_provider, status
ORDER BY day DESC;

-- Grant access to the analytics view
GRANT SELECT ON payment_analytics TO anon, authenticated;

-- Function to get user's payment history
CREATE OR REPLACE FUNCTION get_user_payments(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  amount DECIMAL(10,2),
  currency TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.amount,
    p.currency,
    p.description,
    p.status,
    p.created_at
  FROM payments p
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_payments(UUID, INTEGER) TO anon, authenticated;

-- Insert some sample pricing data for reference
INSERT INTO payments (user_id, amount, currency, payment_provider, payment_provider_id, description, status, metadata) 
VALUES 
  -- These are just examples - real data will be inserted by the API
  ('00000000-0000-0000-0000-000000000000', 0.10, 'USD', 'example', 'example_001', 'Example: AI Image Generation', 'completed', '{"model_id": "fal-ai/imagen4/preview", "type": "example"}')
ON CONFLICT DO NOTHING;

-- Clean up the example data immediately
DELETE FROM payments WHERE user_id = '00000000-0000-0000-0000-000000000000'; 