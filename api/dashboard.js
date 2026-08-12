import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const providerId = req.query.provider_id ? Number(req.query.provider_id) : null;

    let claimQ = supabase.from('claims').select('*');
    if (providerId) claimQ = claimQ.eq('provider_id', providerId);
    const { data: claims } = await claimQ;
    const { data: providers } = await supabase.from('providers').select('*');
    const { data: beneficiaries } = await supabase.from('beneficiaries').select('id, status');

    const list = claims || [];
    const total = list.length;
    const flagged = list.filter((c) => c.status === 'flagged' || Number(c.fraud_score) >= 60).length;
    const reimbursed = list.filter((c) => c.status === 'reimbursed');
    const approved = list.filter((c) => c.status === 'approved' || c.status === 'reimbursed');

    const totalBilled = list.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
    const totalReimbursed = reimbursed.reduce((s, c) => s + (Number(c.covered_amount) || 0), 0);
    const pendingAmount = list
      .filter((c) => ['submitted', 'verified', 'approved'].includes(c.status))
      .reduce((s, c) => s + (Number(c.covered_amount) || 0), 0);
    const atRiskAmount = list
      .filter((c) => c.status === 'flagged' || Number(c.fraud_score) >= 60)
      .reduce((s, c) => s + (Number(c.total_amount) || 0), 0);

    const resolved = list.filter((c) => c.updated_at && c.created_at && c.status !== 'submitted');
    const avgHours = resolved.length
      ? resolved.reduce((s, c) => s + Math.max(0, (new Date(c.updated_at) - new Date(c.created_at)) / 3600000), 0) / resolved.length
      : 0;

    const statusCounts = {};
    for (const c of list) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    const byMonth = {};
    for (const c of list) {
      const key = (c.service_date || c.created_at || '').slice(0, 7);
      if (!key) continue;
      byMonth[key] = byMonth[key] || { month: key, claims: 0, flagged: 0, amount: 0 };
      byMonth[key].claims += 1;
      byMonth[key].amount += Number(c.total_amount) || 0;
      if (c.status === 'flagged' || Number(c.fraud_score) >= 60) byMonth[key].flagged += 1;
    }
    const trend = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

    const byService = {};
    for (const c of list) byService[c.service_type] = (byService[c.service_type] || 0) + 1;

    const topProviders = (providers || [])
      .slice()
      .sort((a, b) => Number(b.risk_score) - Number(a.risk_score))
      .slice(0, 6);

    const dupSignals = list.filter((c) => (c.fraud_flags || []).some((f) => String(f).toLowerCase().includes('duplicate'))).length;

    return res.status(200).json({
      kpis: {
        totalClaims: total,
        flaggedClaims: flagged,
        fraudRate: total ? Number(((flagged / total) * 100).toFixed(1)) : 0,
        approvalRate: total ? Number(((approved.length / total) * 100).toFixed(1)) : 0,
        totalBilled,
        totalReimbursed,
        pendingAmount,
        atRiskAmount,
        avgProcessingHours: Number(avgHours.toFixed(1)),
        activeBeneficiaries: (beneficiaries || []).filter((b) => b.status === 'active').length,
        totalProviders: (providers || []).length,
        dupSignals,
        highRiskProviders: (providers || []).filter((p) => Number(p.risk_score) >= 60).length,
        // workflow queues
        awaitingVerification: (statusCounts['submitted'] || 0),
        awaitingApproval: (statusCounts['verified'] || 0),
        awaitingReimbursement: (statusCounts['approved'] || 0),
        flaggedQueue: (statusCounts['flagged'] || 0),
      },
      statusCounts,
      trend,
      byService,
      topProviders,
    });
  } catch (err) {
    console.error('dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
}
