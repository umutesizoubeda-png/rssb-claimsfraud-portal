export interface DashData {
  kpis: {
    totalClaims: number; flaggedClaims: number; fraudRate: number; approvalRate: number;
    totalBilled: number; totalReimbursed: number; pendingAmount: number; atRiskAmount: number;
    avgProcessingHours: number; activeBeneficiaries: number; totalProviders: number;
    dupSignals: number; highRiskProviders: number;
    awaitingVerification: number; awaitingApproval: number; awaitingReimbursement: number; flaggedQueue: number;
  };
  statusCounts: Record<string, number>;
  trend: { month: string; claims: number; flagged: number; amount: number }[];
  byService: Record<string, number>;
  topProviders: {
    id: number; name: string; risk_score: number; risk_level: string;
    total_claims: number; flagged_claims: number; district: string; type: string;
  }[];
}

export const STATUS_COLORS: Record<string, string> = {
  submitted: '#0ea5e9', verified: '#6366f1', approved: '#10b981',
  reimbursed: '#14b8a6', rejected: '#f43f5e', flagged: '#f59e0b',
};
