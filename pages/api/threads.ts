// @threads - Thread management API endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user from Supabase
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('threads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.status(200).json(data || []);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  } else if (req.method === 'POST') {
    try {
      const { data, error } = await supabaseAdmin
        .from('threads')
        .insert({ user_id: user.id })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({ id: data.id });
    } catch (error) {
      console.error('Failed to create thread:', error);
      res.status(500).json({ error: 'Failed to create thread' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
} 