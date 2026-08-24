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

  calculateCustomerTolerance(
    customer: Customer,
    complaints: Complaint[],
    concessions: ConcessionShipment[],
    defects: DefectType[]
  ): { overallToleranceScore: number; toleranceRatings: Record<string, { level: ToleranceLevel; notes?: string }> } {
    const clientComplaints = complaints.filter(c => c.customerId === customer.id);
    const clientConcessions = concessions.filter(c => c.customerId === customer.id);

    const totalKgClaimed = clientComplaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
    const complaintsCount = clientComplaints.length;
    const avgKgPerComplaint = complaintsCount > 0 ? totalKgClaimed / complaintsCount : 0;

    // Concession feedback
    const reclaimedConcessionsCount = clientConcessions.filter(
      c =>
        c.customerFeedbackStatus === 'reclamado_posteriormente' ||
        clientComplaints.some(
          comp => comp.defectTypeId === c.defectTypeId && new Date(comp.date) >= new Date(c.date)
        )
    ).length;

    const successfulConcessionsCount = clientConcessions.filter(
      c =>
        c.customerFeedbackStatus === 'aceito_sem_ressalvas' &&
        !clientComplaints.some(
          comp => comp.defectTypeId === c.defectTypeId && new Date(comp.date) >= new Date(c.date)
        )
    ).length;

    // 1. BASELINE SCORE CALCULATION
    let score = 96; // Pristine client baseline

    if (complaintsCount > 0) {
      // Direct penalty by complaint frequency
      if (complaintsCount >= 10) {
        score -= 65; // Heavy penalty for frequent complainers (e.g. Trouw with 12 complaints)
      } else if (complaintsCount >= 6) {
        score -= 48;
      } else if (complaintsCount >= 3) {
        score -= 32;
      } else if (complaintsCount >= 2) {
        score -= 20;
      } else {
        score -= 12;
      }

      // SENSITIVITY MULTIPLIER: Small kg claimed = Extreme Pickiness (Zero-Tolerance)
      // Clientes que reclamam de quantidades minúsculas (< 20 kg) são hiper-exigentes
      if (avgKgPerComplaint < 10) {
        score -= 16; // Reclamou até de míseros quilos (ex: média 2.6kg -> rigor extremo)
      } else if (avgKgPerComplaint < 50) {
        score -= 10;
      } else if (avgKgPerComplaint < 150) {
        score -= 5;
      }
    }

    // Impact of concessions history
    score -= reclaimedConcessionsCount * 12;
    score += successfulConcessionsCount * 5;

    // Clamp score
    const overallToleranceScore = Math.max(8, Math.min(98, Math.round(score)));

    // 2. TOLERANCE MATRIX PER DEFECT TYPE CALIBRATION
    const toleranceRatings: Record<string, { level: ToleranceLevel; notes?: string }> = {};

    // Group complaints by defect type
    const claimedDefectCounts: Record<string, { count: number; kg: number }> = {};
    clientComplaints.forEach(c => {
      if (!claimedDefectCounts[c.defectTypeId]) {
        claimedDefectCounts[c.defectTypeId] = { count: 0, kg: 0 };
      }
      claimedDefectCounts[c.defectTypeId].count += 1;
      claimedDefectCounts[c.defectTypeId].kg += c.quantityAffected || 0;
    });

    defects.forEach(defect => {
      const claimInfo = claimedDefectCounts[defect.id];

      if (claimInfo) {
        // Specifically claimed defect
        if (claimInfo.count >= 3 || claimInfo.kg > 200 || overallToleranceScore < 35) {
          toleranceRatings[defect.id] = {
            level: 'intolerante',
            notes: `🚨 Histórico de ${claimInfo.count} reclamação(ões) no ERP (${claimInfo.kg.toLocaleString('pt-BR')} kg afetados). Não enviar lotes com este desvio.`
          };
        } else {
          toleranceRatings[defect.id] = {
            level: 'baixa',
            notes: `⚠️ Reclamado ${claimInfo.count}x no ERP (${claimInfo.kg.toLocaleString('pt-BR')} kg afetados). Exige alinhamento prévio.`
          };
        }
      } else {
        // Non-claimed defect: adapt according to customer's overall rigor
        if (overallToleranceScore < 30) {
          // Extremely strict customer across the board (e.g. Trouw Nutrition)
          toleranceRatings[defect.id] = {
            level: 'baixa',
            notes: `Cliente hiper-exigente (${complaintsCount} SACs registrados, média de ${avgKgPerComplaint.toFixed(1)} kg/queixa). Baixa tolerância geral.`
          };
        } else if (overallToleranceScore < 60) {
          toleranceRatings[defect.id] = {
            level: 'moderada',
            notes: 'Tolerância moderada. Desvio leve aceitável sob monitoramento.'
          };
        } else {
          toleranceRatings[defect.id] = {
            level: 'alta',
            notes: 'Alta flexibilidade histórica. Sem registros deste defeito no ERP.'
          };
        }
      }
    });

    return { overallToleranceScore, toleranceRatings };
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

    const allCustomerComplaints = complaints.filter(c => c.customerId === customer.id);
    const totalKgClaimed = allCustomerComplaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
    const avgKg = allCustomerComplaints.length > 0 ? totalKgClaimed / allCustomerComplaints.length : 0;

    let score = 20; // baseline

    // Factor: Tolerance profile
    if (tolerance === 'intolerante') score += 55;
    else if (tolerance === 'baixa') score += 35;
    else if (tolerance === 'moderada') score += 10;
    else if (tolerance === 'alta') score -= 15;

    // Factor: Customer overall tolerance score impact
    if (customer.overallToleranceScore < 30) {
      score += 25; // Hiper-exigente (ex: Trouw)
    } else if (customer.overallToleranceScore < 50) {
      score += 15;
    } else if (customer.overallToleranceScore >= 80) {
      score -= 10;
    }

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
      summary = `Cliente categorizado como INTOLERANTE ou com sensibilidade extrema (reclamações de poucos kg registradas no ERP).`;
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
