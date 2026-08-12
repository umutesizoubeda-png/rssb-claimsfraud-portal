// ---------------------------------------------------------------------------
// ML-inspired Fraud Detection Engine
// Emulates the behaviour of the trained models described in the research:
//   - Random Forest  -> fraud probability + provider risk profiling
//   - Isolation Forest -> anomaly detection (statistical outliers)
// Runs server-side over historical + real-time claims data BEFORE payment.
// ---------------------------------------------------------------------------

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

function daysBetween(a, b) {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

// Core scoring routine.
// claim: the incoming claim { beneficiary_id, provider_id, service_date, total_amount, service_type }
// ctx:   { beneficiary, provider, sameServiceAmounts:[], beneficiaryRecent:[], existingClaims:[] }
export function scoreClaim(claim, ctx) {
  const flags = [];
  const contributions = []; // Random Forest "feature importances" for explainability
  let fraudScore = 0;

  const amount = Number(claim.total_amount) || 0;

  // --- Feature 1: Duplicate submission detection ------------------------
  const dup = (ctx.existingClaims || []).find(
    (c) =>
      c.beneficiary_id === claim.beneficiary_id &&
      c.provider_id === claim.provider_id &&
      c.service_date === claim.service_date &&
      Math.abs(Number(c.total_amount) - amount) < 1
  );
  if (dup) {
    fraudScore += 42;
    flags.push(`Duplicate submission (matches claim ${dup.claim_number})`);
    contributions.push({ feature: 'Duplicate submission', weight: 42 });
  }

  // --- Feature 2: Abnormal billing amount (Isolation Forest style) ------
  const amounts = (ctx.sameServiceAmounts || []).filter((n) => n > 0);
  const m = mean(amounts);
  const sd = stddev(amounts);
  let anomalyZ = 0;
  if (sd > 0) {
    anomalyZ = (amount - m) / sd;
    if (anomalyZ >= 2.5) {
      fraudScore += 26;
      flags.push(
        `Abnormally high billing (RWF ${amount.toLocaleString()} vs avg RWF ${Math.round(m).toLocaleString()})`
      );
      contributions.push({ feature: 'Abnormal amount', weight: 26 });
    }
  } else if (m > 0 && amount > m * 4) {
    fraudScore += 20;
    flags.push('Billing amount far above service-type norm');
    contributions.push({ feature: 'Abnormal amount', weight: 20 });
  }
  // Isolation Forest anomaly score mapped to 0..1 (higher = more isolated)
  const anomalyScore = Math.max(0, Math.min(1, Math.abs(anomalyZ) / 4));

  // --- Feature 3: High claim frequency for beneficiary ------------------
  const recent = (ctx.beneficiaryRecent || []).filter(
    (c) => daysBetween(c.service_date, claim.service_date) <= 7
  );
  if (recent.length >= 3) {
    fraudScore += 16;
    flags.push(`High claim frequency (${recent.length + 1} claims in 7 days)`);
    contributions.push({ feature: 'Claim frequency', weight: 16 });
  }

  // --- Feature 4: Provider risk profiling -------------------------------
  const provRisk = Number(ctx.provider?.risk_score) || 0;
  if (provRisk >= 60) {
    fraudScore += 14;
    flags.push(`High-risk provider (risk score ${Math.round(provRisk)})`);
    contributions.push({ feature: 'Provider risk', weight: 14 });
  } else if (provRisk >= 35) {
    fraudScore += 7;
    contributions.push({ feature: 'Provider risk', weight: 7 });
  }

  // --- Feature 5: Eligibility / coverage anomalies ----------------------
  const b = ctx.beneficiary;
  let eligibility = 'eligible';
  if (!b) {
    eligibility = 'unknown';
    fraudScore += 18;
    flags.push('Beneficiary not found in registry');
    contributions.push({ feature: 'Eligibility', weight: 18 });
  } else {
    if (b.status !== 'active') {
      eligibility = 'ineligible';
      fraudScore += 22;
      flags.push(`Beneficiary membership is ${b.status}`);
      contributions.push({ feature: 'Eligibility', weight: 22 });
    }
    if (b.valid_until && new Date(b.valid_until) < new Date(claim.service_date)) {
      eligibility = 'expired';
      fraudScore += 20;
      flags.push('Service date is after coverage expiry');
      contributions.push({ feature: 'Eligibility', weight: 20 });
    }
  }

  // --- Feature 6: Future-dated / impossible service date ----------------
  if (new Date(claim.service_date) > new Date()) {
    fraudScore += 12;
    flags.push('Service date is in the future');
    contributions.push({ feature: 'Invalid date', weight: 12 });
  }

  fraudScore = Math.max(0, Math.min(100, Math.round(fraudScore)));

  // Ensemble decision (Random Forest majority-vote analogue)
  let riskLevel = 'low';
  if (fraudScore >= 60) riskLevel = 'high';
  else if (fraudScore >= 30) riskLevel = 'medium';

  return {
    fraudScore,
    anomalyScore: Number(anomalyScore.toFixed(3)),
    flags,
    contributions,
    riskLevel,
    eligibility,
  };
}

// Recompute a provider's risk profile from its claim history.
export function computeProviderRisk(claims) {
  const total = claims.length;
  if (!total) return { risk_score: 5, risk_level: 'low', total_claims: 0, flagged_claims: 0 };
  const flagged = claims.filter(
    (c) => c.status === 'flagged' || Number(c.fraud_score) >= 60
  ).length;
  const avgFraud = mean(claims.map((c) => Number(c.fraud_score) || 0));
  const flagRate = (flagged / total) * 100;
  const risk = Math.max(0, Math.min(100, Math.round(flagRate * 0.6 + avgFraud * 0.4)));
  let level = 'low';
  if (risk >= 60) level = 'high';
  else if (risk >= 35) level = 'medium';
  return { risk_score: risk, risk_level: level, total_claims: total, flagged_claims: flagged };
}
