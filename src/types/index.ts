export type ToleranceLevel = 'alta' | 'moderada' | 'baixa' | 'intolerante';

export type DefectSeverity = 'leve' | 'moderada' | 'severa';

export type DefectCategory = 'visual' | 'dimensional' | 'estrutural' | 'impressao' | 'costura';

export interface DefectType {
  id: string;
  name: string;
  category: DefectCategory;
  description: string;
  defaultUnitLoss: number; // R$ salvo ao evitar descarte/scrap
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  segment?: string;
  toleranceRatings: Record<string, { level: ToleranceLevel; notes?: string }>;
  overallToleranceScore: number; // 0 to 100
  avatarColor: string;
  createdAt: string;
  totalOrdersEstimate?: number;
  cnpj?: string;
  cityState?: string;
  contactName?: string;
  contactEmail?: string;
}

export interface ComplaintPhoto {
  id: string;
  url: string;
  caption: string;
  defectLocation?: string;
}

export interface Complaint {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  date: string;
  lotNumber: string;
  defectTypeId: string;
  defectTypeName: string;
  quantityAffected: number;
  severity: DefectSeverity;
  description: string;
  photos: ComplaintPhoto[];
  rootCause?: string;
  correctiveAction?: string;
  status: 'aberta' | 'em_analise' | 'resolvida' | 'devolucao_total' | 'concessao_aceita';
  origin: 'erp_sync' | 'sac_manual';
  costImpact?: number;
}

export interface ConcessionShipment {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  date: string;
  lotNumber: string;
  productName: string;
  defectTypeId: string;
  defectTypeName: string;
  quantity: number;
  severity: DefectSeverity;
  unitSavedValue: number;
  totalSavedValue: number;
  riskScore: 'baixo' | 'moderado' | 'alto' | 'critico';
  customerFeedbackStatus: 'aceito_sem_ressalvas' | 'aceito_com_observacao' | 'reclamado_posteriormente' | 'em_transito';
  technicalNotes: string;
  approvedBy: string;
  photos?: ComplaintPhoto[];
}

export interface QualityStats {
  totalConcessionsCount: number;
  totalUnitsSaved: number;
  totalSavedAmount: number;
  activeComplaintsCount: number;
  acceptanceRate: number;
  defectsVolumeMonth: Record<string, { name: string; quantity: number; amount: number; color: string }>;
  topCustomersConcessions: Array<{ customerId: string; customerName: string; totalUnits: number; totalAmount: number }>;
}

export interface RiskEvaluationResult {
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico';
  score: number; // 0 to 100 (100 = maior risco de rejeição)
  title: string;
  summary: string;
  historicalComplaintsCount: number;
  historicalConcessionsCount: number;
  recommendation: string;
  customerTolerance: ToleranceLevel;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  complaintCards?: Complaint[];
  concessionCards?: ConcessionShipment[];
  customerCard?: Customer;
  riskRecommendation?: RiskEvaluationResult;
}
