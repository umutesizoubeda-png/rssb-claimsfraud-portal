import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('risk_score', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // Authorization: require caller email and ensure role is admin
      const callerEmail = req.headers['x-user-email'] || req.headers['X-User-Email'];
      if (!callerEmail) return res.status(401).json({ error: 'Unauthorized' });
      const { data: profile } = await supabase.from('profiles').select('role').eq('email', String(callerEmail)).maybeSingle();
      if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

      const body = req.body || {};
      const { data, error } = await supabase
        .from('providers')
        .insert({
          name: body.name,
          code: body.code,
          type: body.type,
          district: body.district,
          risk_score: body.risk_score ?? 5,
          risk_level: body.risk_level ?? 'low',
          total_claims: 0,
          flagged_claims: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('providers error:', err);
    res.status(500).json({ error: err.message });
  }
}
