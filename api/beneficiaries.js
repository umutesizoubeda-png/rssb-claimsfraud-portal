import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { member_id } = req.query;
      let q = supabase.from('beneficiaries').select('*').order('full_name', { ascending: true });
      if (member_id) q = q.eq('member_id', member_id);
      const { data, error } = await q;
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
        .from('beneficiaries')
        .insert({
          member_id: body.member_id,
          full_name: body.full_name,
          national_id: body.national_id,
          scheme: body.scheme,
          status: body.status || 'active',
          coverage_percent: body.coverage_percent ?? 85,
          valid_until: body.valid_until,
          district: body.district,
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('beneficiaries error:', err);
    res.status(500).json({ error: err.message });
  }
}
