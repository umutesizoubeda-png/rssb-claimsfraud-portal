import supabase from './db-client.js';

// Aggregates a full reporting payload: KPI summary, per-status/service/provider
// breakdowns, and a timestamped audit trail for every flagged claim.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { data: claims } = await supabase.from('claims').select('*');
    const { data: providers } = await supabase.from('providers').select('*');
    const { data: beneficiaries } = await supabase.from('beneficiaries').select('id, member_id, full_name, status');
    const { data: audit } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false });

    const list = claims || [];
    const pm = Object.fromEntries((providers || []).map((p) => [p.id, p]));
    const bm = Object.fromEntries((beneficiaries || []).map((b) => [b.id, b]));

    const total = list.length;
    const flaggedClaims = list.filter((c) => c.status === 'flagged' || Number(c.fraud_score) >= 60);
    const reimbursed = list.filter((c) => c.status === 'reimbursed');
    const approved = list.filter((c) => c.status === 'approved' || c.status === 'reimbursed');
    const rejected = list.filter((c) => c.status === 'rejected');

    const totalBilled = list.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
    const totalReimbursed = reimbursed.reduce((s, c) => s + (Number(c.covered_amount) || 0), 0);
    const atRiskAmount = flaggedClaims.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);

    const resolved = list.filter((c) => c.updated_at && c.created_at && c.status !== 'submitted');
    const avgHours = resolved.length
      ? resolved.reduce((s, c) => s + Math.max(0, (new Date(c.updated_at) - new Date(c.created_at)) / 3600000), 0) / resolved.length
      : 0;

    const statusCounts = {};
    for (const c of list) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    const byService = {};
    for (const c of list) {
      byService[c.service_type] = byService[c.service_type] || { count: 0, amount: 0 };
      byService[c.service_type].count += 1;
      byService[c.service_type].amount += Number(c.total_amount) || 0;
    }

    // Per-flagged-claim audit trail: link related audit_log rows + inline the signals.
    const flaggedReport = flaggedClaims
      .sort((a, b) => Number(b.fraud_score) - Number(a.fraud_score))
      .map((c) => {
        const trail = (audit || [])
          .filter((a) => a.entity === 'claim' && String(a.entity_id) === String(c.id))
          .map((a) => ({ action: a.action, actor: a.actor, details: a.details, timestamp: a.created_at }));
        return {
          claim_number: c.claim_number,
          beneficiary: bm[c.beneficiary_id]?.full_name || 'Unknown',
          member_id: bm[c.beneficiary_id]?.member_id || '',
          provider: pm[c.provider_id]?.name || 'Unknown',
          provider_risk: pm[c.provider_id]?.risk_score ?? 0,
          service_type: c.service_type,
          service_date: c.service_date,
          total_amount: Number(c.total_amount) || 0,
          fraud_score: Number(c.fraud_score) || 0,
          anomaly_score: Number(c.anomaly_score) || 0,
          eligibility: c.eligibility_status,
          status: c.status,
          flags: c.fraud_flags || [],
          submitted_at: c.created_at,
          last_updated: c.updated_at,
          audit_trail: trail,
        };
      });

    const providerReport = (providers || [])
      .slice()
      .sort((a, b) => Number(b.risk_score) - Number(a.risk_score))
      .map((p) => ({
        name: p.name, code: p.code, type: p.type, district: p.district,
        risk_score: Number(p.risk_score) || 0, risk_level: p.risk_level,
        total_claims: p.total_claims || 0, flagged_claims: p.flagged_claims || 0,
      }));

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalClaims: total,
        flaggedClaims: flaggedClaims.length,
        fraudRate: total ? Number(((flaggedClaims.length / total) * 100).toFixed(1)) : 0,
        approvedClaims: approved.length,
        rejectedClaims: rejected.length,
        approvalRate: total ? Number(((approved.length / total) * 100).toFixed(1)) : 0,
        totalBilled,
        totalReimbursed,
        atRiskAmount,
        avgProcessingHours: Number(avgHours.toFixed(1)),
        activeBeneficiaries: (beneficiaries || []).filter((b) => b.status === 'active').length,
        totalProviders: (providers || []).length,
        highRiskProviders: (providers || []).filter((p) => Number(p.risk_score) >= 60).length,
      },
      statusCounts,
      byService,
      flaggedReport,
      providerReport,
      auditCount: (audit || []).length,
    });
  } catch (err) {
    console.error('reports error:', err);
    res.status(500).json({ error: err.message });
  }
}
