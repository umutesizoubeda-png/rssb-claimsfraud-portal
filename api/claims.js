import supabase from './db-client.js';
import { scoreClaim, computeProviderRisk } from './fraud-engine.js';

async function enrich(claims) {
  const { data: provs } = await supabase.from('providers').select('id, name, code, type, district, risk_score, risk_level');
  const { data: bens } = await supabase.from('beneficiaries').select('id, member_id, full_name, scheme, status');
  const pm = Object.fromEntries((provs || []).map((p) => [p.id, p]));
  const bm = Object.fromEntries((bens || []).map((b) => [b.id, b]));
  return claims.map((c) => ({
    ...c,
    provider: pm[c.provider_id] || null,
    beneficiary: bm[c.beneficiary_id] || null,
  }));
}

async function logAudit(action, entity, entityId, actor, details) {
  await supabase.from('audit_log').insert({ action, entity, entity_id: String(entityId), actor: actor || 'system', details });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id, status, provider_id } = req.query;
      let q = supabase.from('claims').select('*').order('created_at', { ascending: false });
      if (id) q = q.eq('id', id);
      if (status) q = q.eq('status', status);
      if (provider_id) q = q.eq('provider_id', provider_id);
      const { data, error } = await q;
      if (error) throw error;
      const enriched = await enrich(data);
      if (id) return res.status(200).json(enriched[0] || null);
      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const providerId = Number(body.provider_id);
      const beneficiaryId = Number(body.beneficiary_id);
      const serviceDate = body.service_date;
      const amount = Number(body.total_amount) || 0;
      const serviceType = body.service_type;

      // Gather context for the fraud engine
      const { data: provider } = await supabase.from('providers').select('*').eq('id', providerId).single();
      const { data: beneficiary } = await supabase.from('beneficiaries').select('*').eq('id', beneficiaryId).single();
      const { data: sameService } = await supabase.from('claims').select('total_amount').eq('service_type', serviceType);
      const { data: benRecent } = await supabase.from('claims').select('service_date').eq('beneficiary_id', beneficiaryId);
      const { data: allClaims } = await supabase
        .from('claims')
        .select('claim_number, beneficiary_id, provider_id, service_date, total_amount');

      const scored = scoreClaim(
        { beneficiary_id: beneficiaryId, provider_id: providerId, service_date: serviceDate, total_amount: amount, service_type: serviceType },
        {
          beneficiary,
          provider,
          sameServiceAmounts: (sameService || []).map((r) => Number(r.total_amount)),
          beneficiaryRecent: benRecent || [],
          existingClaims: allClaims || [],
        }
      );

      const coveragePct = beneficiary ? Number(beneficiary.coverage_percent) || 85 : 0;
      const coveredAmount = Math.round((amount * coveragePct) / 100);
      const status = scored.fraudScore >= 60 ? 'flagged' : 'submitted';
      const claimNumber = 'CLM-' + Date.now().toString().slice(-8);

      const { data, error } = await supabase
        .from('claims')
        .insert({
          claim_number: claimNumber,
          beneficiary_id: beneficiaryId,
          provider_id: providerId,
          service_date: serviceDate,
          diagnosis: body.diagnosis,
          service_type: serviceType,
          total_amount: amount,
          covered_amount: coveredAmount,
          status,
          fraud_score: scored.fraudScore,
          anomaly_score: scored.anomalyScore,
          fraud_flags: scored.flags,
          fraud_contributions: scored.contributions,
          eligibility_status: scored.eligibility,
          submitted_by: body.submitted_by || 'system',
          notes: body.notes || '',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      // Recompute provider risk profile from full history
      const { data: provClaims } = await supabase.from('claims').select('status, fraud_score').eq('provider_id', providerId);
      const risk = computeProviderRisk(provClaims || []);
      await supabase.from('providers').update(risk).eq('id', providerId);

      await logAudit('CLAIM_SUBMITTED', 'claim', data.id, body.submitted_by, `${claimNumber} scored ${scored.fraudScore} (${status})`);

      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, status, actor, notes } = req.body || {};
      const update = { status, updated_at: new Date().toISOString() };
      if (notes !== undefined) update.notes = notes;
      const { data, error } = await supabase.from('claims').update(update).eq('id', id).select().single();
      if (error) throw error;

      // Keep provider risk in sync when a claim's outcome changes
      const { data: provClaims } = await supabase.from('claims').select('status, fraud_score').eq('provider_id', data.provider_id);
      await supabase.from('providers').update(computeProviderRisk(provClaims || [])).eq('id', data.provider_id);

      await logAudit('CLAIM_' + String(status).toUpperCase(), 'claim', id, actor, `${data.claim_number} \u2192 ${status}`);
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('claims error:', err);
    res.status(500).json({ error: err.message });
  }
}
