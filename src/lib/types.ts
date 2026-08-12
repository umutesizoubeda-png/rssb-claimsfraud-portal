export type Role = 'admin' | 'provider' | 'investigator' | 'analyst';

export interface Provider {
  id: number;
  name: string;
  code: string;
  type: string;
  district: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  total_claims: number;
  flagged_claims: number;
}

export interface Beneficiary {
  id: number;
  member_id: string;
  full_name: string;
  national_id: string;
  scheme: string;
  status: 'active' | 'suspended' | 'expired';
  coverage_percent: number;
  valid_until: string;
  district: string;
}

export interface Claim {
  id: number;
  claim_number: string;
  beneficiary_id: number;
  provider_id: number;
  service_date: string;
  diagnosis: string;
  service_type: string;
  total_amount: number;
  covered_amount: number;
  status: 'submitted' | 'verified' | 'approved' | 'rejected' | 'reimbursed' | 'flagged';
  fraud_score: number;
  anomaly_score: number;
  fraud_flags: string[];
  fraud_contributions: { feature: string; weight: number }[];
  eligibility_status: string;
  submitted_by: string;
  notes: string;
  created_at: string;
  updated_at: string;
  provider?: Provider | null;
  beneficiary?: Beneficiary | null;
}

export interface Profile {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  provider_id: number | null;
}
