import { Customer, DefectType, Complaint, ConcessionShipment, QualityStats, RiskEvaluationResult, ToleranceLevel, DefectSeverity } from '@/types';

export const qualityService = {
  calculateStats(
    customers: Customer[],
    defects: DefectType[],
    complaints: Complaint[],
    concessions: ConcessionShipment[]
  ): QualityStats {
    const totalConcessionsCount = concessions.length;
    const totalUnitsSaved = concessions.reduce((acc, c) => acc + (c.quantity || 0), 0);
    const totalSavedAmount = concessions.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);
    const activeComplaintsCount = complaints.filter(c => c.status === 'aberta' || c.status === 'em_analise').length;

    // Acceptance rate
    const acceptedCount = concessions.filter(c => c.customerFeedbackStatus === 'aceito_sem_ressalvas' || c.customerFeedbackStatus === 'aceito_com_observacao').length;
    const resolvedOrTestedCount = concessions.filter(c => c.customerFeedbackStatus !== 'em_transito').length;
    const acceptanceRate = resolvedOrTestedCount > 0 ? (acceptedCount / resolvedOrTestedCount) * 100 : 100;

    // Defect volume by defect type
    const defectsVolumeMonth: Record<string, { name: string; quantity: number; amount: number; color: string }> = {};

    defects.forEach(defect => {
      defectsVolumeMonth[defect.id] = {
        name: defect.name,
        quantity: 0,
        amount: 0,
        color: defect.color
      };
    });

    concessions.forEach(c => {
      if (defectsVolumeMonth[c.defectTypeId]) {
        defectsVolumeMonth[c.defectTypeId].quantity += c.quantity || 0;
        defectsVolumeMonth[c.defectTypeId].amount += c.totalSavedValue || 0;
      } else {
        defectsVolumeMonth[c.defectTypeId] = {
          name: c.defectTypeName || 'Outro',
          quantity: c.quantity || 0,
          amount: c.totalSavedValue || 0,
          color: '#06b6d4'
        };
      }
    });

    // Top customers concessions
    const customerMap: Record<string, { customerId: string; customerName: string; totalUnits: number; totalAmount: number }> = {};
    concessions.forEach(c => {
      if (!customerMap[c.customerId]) {
        customerMap[c.customerId] = {
          customerId: c.customerId,
          customerName: c.customerName,
          totalUnits: 0,
          totalAmount: 0
        };
      }
      customerMap[c.customerId].totalUnits += c.quantity || 0;
      customerMap[c.customerId].totalAmount += c.totalSavedValue || 0;
    });

    const topCustomersConcessions = Object.values(customerMap).sort((a, b) => b.totalUnits - a.totalUnits);

    return {
      totalConcessionsCount,
      totalUnitsSaved,
      totalSavedAmount,
      activeComplaintsCount,
      acceptanceRate,
      defectsVolumeMonth,
      topCustomersConcessions
    };
  },

  evaluateConcessionRisk(
    customer: Customer,
    defect: DefectType,
    quantity: number,
    severity: DefectSeverity,
    complaints: Complaint[],
    concessions: ConcessionShipment[]
  ): RiskEvaluationResult {
    // 1. Check customer tolerance config
    const ratingConfig = customer.toleranceRatings?.[defect.id];
    const tolerance: ToleranceLevel = ratingConfig?.level || 'moderada';

    // 2. Historical complaints with this defect
    const clientComplaints = complaints.filter(
      c => c.customerId === customer.id && c.defectTypeId === defect.id
    );

    // 3. Historical concessions with this defect
    const clientConcessions = concessions.filter(
      c => c.customerId === customer.id && c.defectTypeId === defect.id
    );

    let score = 20; // baseline

    // Factor: Tolerance profile
    if (tolerance === 'intolerante') score += 55;
    else if (tolerance === 'baixa') score += 35;
    else if (tolerance === 'moderada') score += 10;
    else if (tolerance === 'alta') score -= 15;

    // Factor: Severity
    if (severity === 'severa') score += 30;
    else if (severity === 'moderada') score += 15;
    else if (severity === 'leve') score -= 5;

    // Factor: Past complaints penalty
    if (clientComplaints.length > 0) {
      score += clientComplaints.length * 15;
    }

    // Factor: Successful concessions bonus
    const successfulPast = clientConcessions.filter(c => c.customerFeedbackStatus === 'aceito_sem_ressalvas').length;
    if (successfulPast > 0) {
      score -= Math.min(successfulPast * 8, 25);
    }

    // Factor: Volume scale
    if (quantity > 15000) score += 15;
    else if (quantity > 8000) score += 8;

    // Clamp score
    score = Math.max(5, Math.min(98, score));

    // Determine level
    let riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico' = 'baixo';
    let title = 'Liberação Recomendada (Baixo Risco)';
    let summary = `O cliente ${customer.name} possui perfil tolerante para ${defect.name}.`;
    let recommendation = 'Liberar lote com identificação de lote padrão e arquivar registro de concessão.';

    if (score >= 75) {
      riskLevel = 'critico';
      title = 'RISCO CRÍTICO: Não Enviar (Alta Probabilidade de Devolução)';
      summary = `Cliente categorizado como INTOLERANTE ou com histórico recente de devoluções para ${defect.name}.`;
      recommendation = `Rejeitar envio deste lote para ${customer.name}. Sugere-se retrabalhar ou direcionar este lote para clientes de alta tolerância (ex: Yara Fertilizantes ou Bunge).`;
    } else if (score >= 50) {
      riskLevel = 'alto';
      title = 'Risco Elevado: Requer Alinhamento Prévio com o Cliente';
      summary = `Existe histórico de atenção ou reclamação anterior registrada para ${defect.name} neste cliente.`;
      recommendation = `Contatar o cliente (${customer.name}) antes da expedição para validar amostra ou enviar com desconto acordado.`;
    } else if (score >= 30) {
      riskLevel = 'moderado';
      title = 'Risco Moderado: Liberação Condicionada com Monitoramento';
      summary = `Cliente possui tolerância moderada. O desvio é aceitável desde que respeitada a gravidade ${severity}.`;
      recommendation = 'Liberar envio e programar acompanhamento pós-entrega com o SAC da empresa.';
    }

    return {
      riskLevel,
      score,
      title,
      summary,
      historicalComplaintsCount: clientComplaints.length,
      historicalConcessionsCount: clientConcessions.length,
      recommendation,
      customerTolerance: tolerance
    };
  }
};
