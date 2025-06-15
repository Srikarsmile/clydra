-- Credit System Extension for Rivo Labs
-- Run this script AFTER the main supabase-setup.sql

-- User Credit Balances table
CREATE TABLE IF NOT EXISTS user_credit_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions table (for audit trail)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus', 'signup_bonus')),
  amount INTEGER NOT NULL, -- positive for additions, negative for usage
  balance_before INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- for storing additional info like package_id, model_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Packages table (for managing different credit packages)
CREATE TABLE IF NOT EXISTS credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Purchases table (for tracking credit purchases)
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  credits_purchased INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_provider TEXT, -- 'stripe', 'paypal', etc.
  payment_provider_id TEXT, -- external payment ID
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_status ON user_purchases(status);
CREATE INDEX IF NOT EXISTS idx_user_purchases_created_at ON user_purchases(created_at);

-- Update trigger for credit balances
CREATE TRIGGER update_user_credit_balances_updated_at 
BEFORE UPDATE ON user_credit_balances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_packages_updated_at 
BEFORE UPDATE ON credit_packages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_purchases_updated_at 
BEFORE UPDATE ON user_purchases 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Credit balance policies
CREATE POLICY "Users can view own credit balance" ON user_credit_balances
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own credit balance" ON user_credit_balances
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Credit transaction policies
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Credit packages policies (public read access)
CREATE POLICY "Anyone can view active credit packages" ON credit_packages
  FOR SELECT USING (is_active = true);

-- User purchases policies
CREATE POLICY "Users can view own purchases" ON user_purchases
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create own purchases" ON user_purchases
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Function to initialize credit balance for new users
CREATE OR REPLACE FUNCTION initialize_user_credits(user_uuid UUID, initial_credits INTEGER DEFAULT 10)
RETURNS VOID AS $$
BEGIN
  -- Create credit balance record
  INSERT INTO user_credit_balances (user_id, balance, total_purchased)
  VALUES (user_uuid, initial_credits, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Log the signup bonus transaction
  IF initial_credits > 0 THEN
    INSERT INTO credit_transactions (
      user_id, 
      type, 
      amount, 
      balance_before, 
      balance_after, 
      description,
      metadata
    ) VALUES (
      user_uuid, 
      'signup_bonus', 
      initial_credits, 
      0, 
      initial_credits, 
      'Welcome bonus credits',
      '{"source": "signup_bonus"}'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to user balance
CREATE OR REPLACE FUNCTION add_user_credits(
  user_uuid UUID, 
  credits_to_add INTEGER, 
  transaction_type TEXT DEFAULT 'purchase',
  transaction_description TEXT DEFAULT 'Credits added',
  transaction_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance 
  FROM user_credit_balances 
  WHERE user_id = user_uuid;
  
  -- If no balance record exists, create one
  IF current_balance IS NULL THEN
    PERFORM initialize_user_credits(user_uuid, 0);
    current_balance := 0;
  END IF;
  
  new_balance := current_balance + credits_to_add;
  
  -- Update balance
  UPDATE user_credit_balances 
  SET 
    balance = new_balance,
    total_purchased = CASE 
      WHEN transaction_type = 'purchase' THEN total_purchased + credits_to_add
      ELSE total_purchased
    END,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id, 
    type, 
    amount, 
    balance_before, 
    balance_after, 
    description,
    metadata
  ) VALUES (
    user_uuid, 
    transaction_type, 
    credits_to_add, 
    current_balance, 
    new_balance, 
    transaction_description,
    transaction_metadata
  );
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits from user balance
CREATE OR REPLACE FUNCTION deduct_user_credits(
  user_uuid UUID, 
  credits_to_deduct INTEGER, 
  transaction_description TEXT DEFAULT 'Credits used',
  transaction_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance 
  FROM user_credit_balances 
  WHERE user_id = user_uuid;
  
  -- Check if user has enough credits
  IF current_balance IS NULL OR current_balance < credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits. Current balance: %, Required: %', 
      COALESCE(current_balance, 0), credits_to_deduct;
  END IF;
  
  new_balance := current_balance - credits_to_deduct;
  
  -- Update balance
  UPDATE user_credit_balances 
  SET 
    balance = new_balance,
    total_used = total_used + credits_to_deduct,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id, 
    type, 
    amount, 
    balance_before, 
    balance_after, 
    description,
    metadata
  ) VALUES (
    user_uuid, 
    'usage', 
    -credits_to_deduct, 
    current_balance, 
    new_balance, 
    transaction_description,
    transaction_metadata
  );
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance 
  FROM user_credit_balances 
  WHERE user_id = user_uuid;
  
  -- If no balance record exists, initialize with signup bonus
  IF current_balance IS NULL THEN
    PERFORM initialize_user_credits(user_uuid, 10);
    RETURN 10;
  END IF;
  
  RETURN current_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default credit packages
INSERT INTO credit_packages (id, name, credits, bonus_credits, price, is_popular, description) 
VALUES 
  ('starter', 'Starter Pack', 25, 0, 2.49, false, 'Perfect for trying out our AI services'),
  ('basic', 'Basic Pack', 100, 10, 8.99, false, 'Great for regular users'),
  ('pro', 'Pro Pack', 500, 100, 39.99, true, 'Best value for power users'),
  ('enterprise', 'Enterprise Pack', 2000, 500, 149.99, false, 'For businesses and heavy users')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  price = EXCLUDED.price,
  is_popular = EXCLUDED.is_popular,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Grant necessary permissions
GRANT ALL ON user_credit_balances TO anon, authenticated;
GRANT ALL ON credit_transactions TO anon, authenticated;
GRANT ALL ON credit_packages TO anon, authenticated;
GRANT ALL ON user_purchases TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION initialize_user_credits(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits(UUID, INTEGER, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_user_credits(UUID, INTEGER, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_credit_balance(UUID) TO anon, authenticated; 