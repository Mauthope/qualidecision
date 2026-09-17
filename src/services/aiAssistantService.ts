import { Customer, DefectType, Complaint, ConcessionShipment, AiChatMessage, RiskEvaluationResult, DefectSeverity, ToleranceLevel } from '@/types';
import { qualityService } from './qualityService';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const DEFECT_SYNONYMS: Record<string, string[]> = {
  vinco: ['vinco', 'dobra', 'vincado', 'dobrado', 'marcado', 'friso'],
  impressao: ['borrao', 'borrao', 'impressao', 'tinta', 'mancha de tinta', 'legibilidade', 'leitura', 'codigo de barras', 'tonalidade', 'falha de impressao'],
  costura: ['costura', 'ponto solto', 'fio solto', 'linha', 'costura aberta', 'bainha', 'fechamento'],
  solda: ['solda', 'descolamento', 'tarja', 'fundo aberto', 'solda fraca', 'abertura de fundo'],
  oleo: ['oleo', 'graxa', 'mancha de oleo', 'contaminacao', 'sujeira', 'manchado'],
  furo: ['furo', 'rasgo', 'perfuracao', 'rompimento', 'tecido rasgado', 'perfurado'],
  dimensional: ['tamanho', 'largura', 'comprimento', 'medida', 'fora de medida', 'dimensional', 'variacao de medida'],
  gramatura: ['gramatura', 'peso', 'tecido fino', 'variacao de peso'],
  sanfona: ['sanfona', 'sanfonagem', 'abertura de sanfona'],
  alca: ['alca', 'alcas', 'falha na alca', 'costura da alca'],
  valvula: ['valvula', 'fechamento de valvula', 'vazamento na valvula'],
  desfiamento: ['desfiamento', 'refilamento', 'fiapo', 'desfiado'],
  laminacao: ['laminacao', 'delaminacao', 'filme solto', 'bolha']
};

interface ConversationContext {
  lastCustomer?: Customer;
  lastDefect?: DefectType;
  lastQuantity?: number;
  lastSeverity?: DefectSeverity;
}

export const aiAssistantService = {
  extractContextFromHistory(
    history: AiChatMessage[],
    customers: Customer[],
    defects: DefectType[]
  ): ConversationContext {
    const context: ConversationContext = {};

    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];

      if (!context.lastCustomer && msg.customerCard) {
        context.lastCustomer = msg.customerCard;
      }
      if (!context.lastCustomer && msg.riskRecommendation) {
        // Find customer by recommendation title/summary
        const foundCust = customers.find(c => msg.text.toLowerCase().includes(c.name.toLowerCase()));
        if (foundCust) context.lastCustomer = foundCust;
      }

      if (!context.lastDefect) {
        const foundDef = defects.find(d => msg.text.toLowerCase().includes(d.name.toLowerCase()));
        if (foundDef) context.lastDefect = foundDef;
      }

      if (!context.lastQuantity) {
        const qMatch = msg.text.match(/(\d+(?:\.\d+)?)\s*(?:unidades|sacos|sacarias|un)/i);
        if (qMatch) {
          context.lastQuantity = parseInt(qMatch[1].replace(/\./g, ''), 10);
        }
      }

      if (!context.lastSeverity) {
        if (/severa|critica/i.test(msg.text)) context.lastSeverity = 'severa';
        else if (/moderada|media/i.test(msg.text)) context.lastSeverity = 'moderada';
        else if (/leve|suave/i.test(msg.text)) context.lastSeverity = 'leve';
      }

      if (context.lastCustomer && context.lastDefect) break;
    }

    return context;
  },

  findCustomer(text: string, customers: Customer[]): Customer | undefined {
    const norm = normalizeText(text);

    // 1. Direct code match (ex: CUST-001 or 001)
    for (const c of customers) {
      if (c.code && norm.includes(normalizeText(c.code))) {
        return c;
      }
    }

    // 2. Full or strong substring name match
    // Sort customers by name length descending so longer specific names match first
    const sorted = [...customers].sort((a, b) => b.name.length - a.name.length);
    for (const c of sorted) {
      const normName = normalizeText(c.name);
      if (norm.includes(normName)) {
        return c;
      }

      // Check principal brand words (min 4 chars)
      const words = normName.split(/[\s\-–—/]+/).filter(w => w.length >= 4 && !['agro', 'alimentos', 'brasil', 'industria', 'comercio', 'cooperativa', 'ltda', 's/a', 'nutricao'].includes(w));
      for (const w of words) {
        const wordRegex = new RegExp(`\\b${w}\\b`, 'i');
        if (wordRegex.test(norm)) {
          return c;
        }
      }
    }

    return undefined;
  },

  findDefect(text: string, defects: DefectType[]): DefectType | undefined {
    const norm = normalizeText(text);

    // 1. Direct name match in defect catalog
    for (const d of defects) {
      const normName = normalizeText(d.name);
      if (norm.includes(normName)) {
        return d;
      }
    }

    // 2. Synonyms map
    for (const [key, syns] of Object.entries(DEFECT_SYNONYMS)) {
      for (const syn of syns) {
        const regex = new RegExp(`\\b${normalizeText(syn)}\\b`, 'i');
        if (regex.test(norm)) {
          // Find closest defect matching this category/synonym
          const matched = defects.find(d => {
            const dNorm = normalizeText(d.name);
            return dNorm.includes(key) || dNorm.includes(normalizeText(syn));
          });
          if (matched) return matched;
        }
      }
    }

    return undefined;
  },

  extractQuantity(text: string, defaultQty: number = 5000): number {
    const norm = normalizeText(text);

    // Fardos to sacos: "20 fardos" -> 20 * 500 = 10000
    const baleMatch = norm.match(/(\d+)\s*fardo/);
    if (baleMatch) {
      return parseInt(baleMatch[1], 10) * 500;
    }

    // "10k" or "10 mil"
    const kMatch = norm.match(/(\d+(?:[.,]\d+)?)\s*(?:k|mil)/);
    if (kMatch) {
      return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000);
    }

    // Explicit numbers: "10.000", "5000"
    const numMatch = norm.match(/\b(\d{1,3}(?:\.\d{3})+|\d{2,7})\b/);
    if (numMatch) {
      const val = parseInt(numMatch[1].replace(/\./g, ''), 10);
      if (val > 10) return val;
    }

    return defaultQty;
  },

  extractSeverity(text: string, defaultSeverity: DefectSeverity = 'moderada'): DefectSeverity {
    const norm = normalizeText(text);
    if (/sever[ao]|grave|pesad[ao]|critica|intensa/i.test(norm)) return 'severa';
    if (/leve|suave|pouco|pouca|superficial|pequen[ao]/i.test(norm)) return 'leve';
    if (/moderad[ao]|media|medio|padrao/i.test(norm)) return 'moderada';
    return defaultSeverity;
  },

  processQuery(
    prompt: string,
    history: AiChatMessage[] = [],
    customers: Customer[],
    defects: DefectType[],
    complaints: Complaint[],
    concessions: ConcessionShipment[]
  ): AiChatMessage {
    const queryNorm = normalizeText(prompt);
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Extract prior conversational context
    const ctx = this.extractContextFromHistory(history, customers, defects);

    // 1. Detect entities in CURRENT message
    let activeCustomer = this.findCustomer(prompt, customers);
    let activeDefect = this.findDefect(prompt, defects);

    // If follow-up without explicit mentions, inherit context
    const isFollowUp = /^(e\s+|qual\s+|por\s*que|como|mostre|simule|e\s+se|para|com|quanto|tem|fotos|laudos)/i.test(queryNorm) || prompt.length < 35;
    if (!activeCustomer && isFollowUp && ctx.lastCustomer) {
      activeCustomer = ctx.lastCustomer;
    }
    if (!activeDefect && isFollowUp && ctx.lastDefect) {
      activeDefect = ctx.lastDefect;
    }

    // Extract quantity & severity
    const activeQuantity = this.extractQuantity(prompt, ctx.lastQuantity || 5000);
    const activeSeverity = this.extractSeverity(prompt, ctx.lastSeverity || 'moderada');

    // SCENARIO 0: Specific Bale Traceability ("fardo 104", "fardo #104", "rastrear fardo")
    const baleMatch = queryNorm.match(/fardo(?:s)?\s*(?:#|n[ºo]\s*)?([a-z0-9-]+)/i);
    if (baleMatch) {
      const targetBale = baleMatch[1].toLowerCase();
      const matchingConc = concessions.filter(c => c.bales && c.bales.some(b => b.toLowerCase() === targetBale || b.toLowerCase().includes(targetBale)));
      const matchingComp = complaints.filter(c => c.bales && c.bales.some(b => b.toLowerCase() === targetBale || b.toLowerCase().includes(targetBale)));

      if (matchingConc.length > 0 || matchingComp.length > 0) {
        let text = `📦 **Rastreabilidade Completa do Fardo #${targetBale.toUpperCase()}:**\n\n`;

        if (matchingConc.length > 0) {
          text += `**🚚 Envios com Concessão / Desvio Encontrados (${matchingConc.length}):**\n`;
          matchingConc.forEach(c => {
            text += `• **[${c.code}]** Expedido em **${new Date(c.date).toLocaleDateString('pt-BR')}** para o cliente **${c.customerName}**\n` +
              `  - Lote: \`${c.lotNumber}\`${c.opNumber ? ` • OP: \`${c.opNumber}\`` : ''}\n` +
              `  - Desvio: *${c.defectTypeName}* (Gravidade: ${c.severity.toUpperCase()})\n` +
              `  - Fardos deste envio: ${c.bales?.join(', ') || 'N/A'}\n` +
              `  - Scrap evitado: R$ ${c.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
          });
        }

        if (matchingComp.length > 0) {
          text += `**⚠️ Reclamações SAC Encontradas para este Fardo (${matchingComp.length}):**\n`;
          matchingComp.forEach(c => {
            text += `• **[${c.code}]** Aberta em **${new Date(c.date).toLocaleDateString('pt-BR')}** por **${c.customerName}**\n` +
              `  - Lote reclamado: \`${c.lotNumber}\` • Defeito: *${c.defectTypeName}*\n` +
              `  - Relato: "${c.description}"\n` +
              `  - Status: ${c.status.toUpperCase()}\n\n`;
          });
        }

        return {
          id: messageId,
          sender: 'assistant',
          text,
          timestamp,
          concessionCards: matchingConc,
          complaintCards: matchingComp,
          suggestedPrompts: [
            matchingConc[0] ? `Ver histórico do cliente ${matchingConc[0].customerName}` : 'Consultar indicadores de scrap',
            'Simular nova decisão de envio'
          ]
        };
      } else {
        return {
          id: messageId,
          sender: 'assistant',
          text: `🔍 Pesquisei na base de dados e o **Fardo #${targetBale.toUpperCase()}** não possui registro de concessão nem reclamação associada.\n\n` +
            `Ele pode fazer parte de um lote padrão sem desvio, ou o número do fardo não foi lançado individualmente.\n\n` +
            `Deseja buscar por número de **Lote**, **OP** ou simular uma decisão para este fardo?`,
          timestamp,
          suggestedPrompts: [
            'Simular decisão com desvio',
            'Consultar clientes tolerantes'
          ]
        };
      }
    }

    // SCENARIO 1: Complete Decision Simulation (Both Customer & Defect Identified)
    const isDecisionQuery = /posso|podemos|devo|liberar|libera|enviar|envio|mandar|risco|decisao|simular|avaliar|concessao|autorizar/i.test(queryNorm) ||
      (activeCustomer && activeDefect);

    if (isDecisionQuery && activeCustomer && activeDefect) {
      const riskResult = qualityService.evaluateConcessionRisk(
        activeCustomer,
        activeDefect,
        activeQuantity,
        activeSeverity,
        complaints,
        concessions
      );

      const customerComplaintsForDefect = complaints.filter(
        c => c.customerId === activeCustomer!.id && c.defectTypeId === activeDefect!.id
      );
      const customerConcessionsForDefect = concessions.filter(
        c => c.customerId === activeCustomer!.id && c.defectTypeId === activeDefect!.id
      );

      const savedProfit = qualityService.calculateSavedProfit(activeQuantity);
      const sackWeightKg = qualityService.calculateSackWeightKg(activeQuantity);
      const toleranceLevel: ToleranceLevel = activeCustomer.toleranceRatings?.[activeDefect.id]?.level || 'moderada';

      // Find alternative clients with HIGH tolerance for this defect
      const alternativeCustomers = customers
        .filter(c => c.id !== activeCustomer!.id)
        .filter(c => {
          const tol = c.toleranceRatings?.[activeDefect!.id]?.level;
          return tol === 'alta' || c.overallToleranceScore >= 75;
        })
        .slice(0, 3);

      let text = `🎯 **Simulação de Decisão & Avaliação de Risco da Qualidade**\n\n`;
      text += `• **Cliente Destino:** **${activeCustomer.name}** (${activeCustomer.code})\n`;
      text += `• **Desvio / Não-Conformidade:** **${activeDefect.name}**\n`;
      text += `• **Volume Simulado:** **${activeQuantity.toLocaleString('pt-BR')} unidades** (~${sackWeightKg.toFixed(1)} kg) | Severidade: **${activeSeverity.toUpperCase()}**\n`;
      text += `• **Scrap Evitado (Economia Estimada):** **R$ ${savedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n\n`;

      if (riskResult.riskLevel === 'baixo') {
        text += `🟢 **PARECER DA IA: LIBERAÇÃO RECOMENDADA (Baixo Risco de Rejeição)**\n\n` +
          `1. **Tolerância Cadastrada:** O cliente possui perfil de tolerância **${toleranceLevel.toUpperCase()}** para este desvio (Score Geral: ${activeCustomer.overallToleranceScore}/100).\n` +
          `2. **Histórico no ERP:** ${customerComplaintsForDefect.length === 0 ? 'Nenhuma queixa anterior registrada deste defeito.' : `Apenas ${customerComplaintsForDefect.length} queixa isolada com resolução amigável.`}\n` +
          `3. **Concessões Anteriores:** ${customerConcessionsForDefect.length > 0 ? `${customerConcessionsForDefect.length} lotes com desvio já foram recebidos e aceitos sem ressalvas.` : 'Cliente costuma receber embalagens industriais sem apontamentos operacionais.'}\n` +
          `4. **Recomendação Técnica:** Pode liberar para expedição. Registrar o envio no sistema para manter o histórico de rastreabilidade de fardos ativo.`;
      } else if (riskResult.riskLevel === 'moderado') {
        text += `🟡 **PARECER DA IA: LIBERAÇÃO CONDICIONADA (Risco Moderado - Ações Preventivas)**\n\n` +
          `1. **Tolerância Cadastrada:** Perfil **${toleranceLevel.toUpperCase()}** para este desvio (Score Geral: ${activeCustomer.overallToleranceScore}/100).\n` +
          `2. **Ponto de Atenção:** O volume de ${activeQuantity.toLocaleString('pt-BR')} unidades ou a severidade requer cautela.\n` +
          `3. **Plano de Ação Recomendado:**\n` +
          `   - Realizar amostragem nos fardos antes do carregamento.\n` +
          `   - Notificar o comercial/atendimento para alinhar previamente a aceitação do desvio com o cliente.\n` +
          `   - Acompanhar a entrega e obter confirmação no ato do recebimento.`;
      } else {
        text += `🔴 **PARECER DA IA: NÃO ENVIAR / CONCESSÃO NÃO RECOMENDADA (Risco ${riskResult.riskLevel.toUpperCase()})**\n\n` +
          `1. **Alerta de Intolerância:** **${activeCustomer.name}** possui classificação rígida para este tipo de problema (${customerComplaintsForDefect.length} reclamações anteriores registradas no ERP).\n` +
          `2. **Risco Operacional e Financeiro:** Alta probabilidade de devolução total do lote, custos de frete reverso e desgaste comercial.\n` +
          `3. **Alternativa Recomendada:** Direcionar este lote com desvio de *${activeDefect.name}* para clientes com perfil flexível/tolerante que utilizam o produto para ração/fertilizante:\n`;

        if (alternativeCustomers.length > 0) {
          alternativeCustomers.forEach(ac => {
            text += `   - **${ac.name}** (Tolerância Geral: ${ac.overallToleranceScore}%)\n`;
          });
        } else {
          text += `   - Sugere-se reclassificar o lote para consumo interno ou retrabalho.\n`;
        }
      }

      text += `\n📝 **Sugestão de Parecer Técnico para o Envio:**\n` +
        `*"Envio autorizado em regime de concessão técnica controlada com desvio de ${activeDefect.name} (${activeSeverity}). Lote inspecionado e liberado para consumo seguro."*`;

      const suggestedPrompts: string[] = [];
      if (alternativeCustomers.length > 0) {
        suggestedPrompts.push(`Simular para ${alternativeCustomers[0].name.split(' ')[0]}`);
      }
      if (activeSeverity !== 'leve') {
        suggestedPrompts.push(`E se o defeito for leve?`);
      }
      suggestedPrompts.push(`Ver histórico de queixas de ${activeCustomer.name.split(' ')[0]}`);

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: activeCustomer,
        complaintCards: customerComplaintsForDefect.slice(0, 2),
        concessionCards: customerConcessionsForDefect.slice(0, 2),
        riskRecommendation: riskResult,
        suggestedPrompts,
        actionButton: {
          label: '🚀 Criar Envio com Concessão (Pré-Preenchido)',
          type: 'open_concession',
          payload: {
            customerId: activeCustomer.id,
            defectTypeId: activeDefect.id,
            quantity: activeQuantity,
            severity: activeSeverity
          }
        }
      };
    }

    // SCENARIO 2: Customer Identified, but Defect is missing
    if (activeCustomer && !activeDefect) {
      const clientComplaints = complaints.filter(c => c.customerId === activeCustomer!.id);
      const clientConcessions = concessions.filter(c => c.customerId === activeCustomer!.id);

      // Top defects complained vs tolerated
      const toleratedDefects = Object.entries(activeCustomer.toleranceRatings || {})
        .filter(([_, r]) => r.level === 'alta')
        .map(([defId]) => defects.find(d => d.id === defId)?.name)
        .filter(Boolean);

      const strictDefects = Object.entries(activeCustomer.toleranceRatings || {})
        .filter(([_, r]) => r.level === 'intolerante' || r.level === 'baixa')
        .map(([defId]) => defects.find(d => d.id === defId)?.name)
        .filter(Boolean);

      let text = `👤 **Perfil de Tolerância & Histórico de ${activeCustomer.name}** (${activeCustomer.code}):\n\n` +
        `• **Score de Tolerância Geral:** **${activeCustomer.overallToleranceScore}/100** ${activeCustomer.overallToleranceScore >= 70 ? '🟢 (Cliente Flexível)' : activeCustomer.overallToleranceScore >= 45 ? '🟡 (Moderado)' : '🔴 (Exigente/Rígido)'}\n` +
        `• **Reclamações Registradas no ERP:** **${clientComplaints.length} ocorrências**\n` +
        `• **Concessões Já Recebidas:** **${clientConcessions.length} lotes** aceitos com desvio\n\n`;

      if (toleratedDefects.length > 0) {
        text += `✅ **Desvios com Alta Aceitação:** ${toleratedDefects.slice(0, 4).join(', ')}.\n`;
      }
      if (strictDefects.length > 0) {
        text += `⚠️ **Desvios Críticos / Intolerantes:** ${strictDefects.slice(0, 4).join(', ')}.\n\n`;
      }

      text += `💡 **Qual desvio você gostaria de simular para ${activeCustomer.name}?**\n` +
        `Informe o defeito e quantidade (ex: *"Posso mandar 5.000 sacos com vinco?"* ou *"E se for borrão de impressão?"*).`;

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: activeCustomer,
        complaintCards: clientComplaints.slice(0, 3),
        concessionCards: clientConcessions.slice(0, 2),
        suggestedPrompts: [
          `Simular envio com Vinco para ${activeCustomer.name.split(' ')[0]}`,
          `Simular envio com Borrão para ${activeCustomer.name.split(' ')[0]}`,
          `Simular envio com Falha de Costura para ${activeCustomer.name.split(' ')[0]}`
        ]
      };
    }

    // SCENARIO 3: Defect Identified, but Customer is missing
    if (!activeCustomer && activeDefect) {
      const topTolerant = customers
        .filter(c => c.toleranceRatings?.[activeDefect!.id]?.level === 'alta' || c.overallToleranceScore >= 80)
        .slice(0, 4);

      const topIntolerant = customers
        .filter(c => c.toleranceRatings?.[activeDefect!.id]?.level === 'intolerante' || c.overallToleranceScore < 40)
        .slice(0, 4);

      let text = `🏷️ **Análise de Mercado para o Desvio: ${activeDefect.name}**\n\n` +
        `• **Categoria:** ${activeDefect.category.toUpperCase()} • Custo Médio Unitário de Refugo: R$ ${activeDefect.defaultUnitLoss.toFixed(2)}\n` +
        `• **Descrição:** ${activeDefect.description || 'Não-conformidade de processo industrial'}\n\n`;

      if (topTolerant.length > 0) {
        text += `🟢 **Clientes Mais Tolerantes (Ideais para Concessão deste Desvio):**\n` +
          topTolerant.map(c => `• **${c.name}** (Tolerância: ${c.overallToleranceScore}%)`).join('\n') + '\n\n';
      }

      if (topIntolerant.length > 0) {
        text += `🔴 **Clientes com Maior Risco de Rejeição para este Defeito:**\n` +
          topIntolerant.map(c => `• **${c.name}** (Perfil Exigente - ${c.overallToleranceScore}%)`).join('\n') + '\n\n';
      }

      text += `💡 **Para qual cliente você pretende enviar o lote com ${activeDefect.name}?**\n` +
        `Você pode clicar em uma das opções abaixo ou digitar o nome do cliente:`;

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        suggestedPrompts: topTolerant.slice(0, 3).map(c => `Simular envio de ${activeDefect!.name.split(' ')[0]} para ${c.name.split(' ')[0]}`)
      };
    }

    // SCENARIO 4: Financial Indicators & Profitability query
    if (/lucro|indicador|scrap|refugo|economia|volume|kpi|estatistica/i.test(queryNorm)) {
      const stats = qualityService.calculateStats(customers, defects, complaints, concessions);

      let text = `📊 **Painel Executivo de Qualidade & Lucro Preservado:**\n\n` +
        `• **Sacarias/Bags Salvos de Refugo:** **${stats.totalUnitsSaved.toLocaleString('pt-BR')} unidades**\n` +
        `• **Scrap Evitado (Economia Real em R$):** **R$ ${stats.totalSavedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
        `• **Índice de Aceitação dos Envios com Desvio:** **${stats.acceptanceRate.toFixed(1)}%**\n` +
        `• **Ocorrências Ativas no SAC:** **${stats.activeComplaintsCount} em tratativa**\n\n` +
        `**Principais Desvios Liberados em Concessão:**\n`;

      Object.values(stats.defectsVolumeMonth).slice(0, 5).forEach(d => {
        if (d.quantity > 0) {
          text += `• **${d.name}:** ${d.quantity.toLocaleString('pt-BR')} un (R$ ${d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} salvos)\n`;
        }
      });

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        concessionCards: concessions.slice(0, 3),
        suggestedPrompts: [
          'Simular decisão de envio para Copacol',
          'Simular decisão de envio para Alisul',
          'Quais clientes aceitam vinco?'
        ]
      };
    }

    // SCENARIO 5: Conversational / General Helpful Assistant
    return {
      id: messageId,
      sender: 'assistant',
      text: `Olá! Sou o **Especialista em Inteligência de Qualidade e Decisão**.\n\n` +
        `Como posso te orientar na liberação de lotes hoje?\n\n` +
        `1. **Simular Decisão de Envio:** Ex: *"Posso mandar 10.000 sacos com vinco para a Copacol?"*\n` +
        `2. **Rastrear Fardos:** Ex: *"Onde foi parar o fardo 104?"*\n` +
        `3. **Perfil de Cliente:** Ex: *"Qual o perfil de tolerância da Alisul?"*\n` +
        `4. **Clientes para Defeito:** Ex: *"Quais clientes aceitam borrão de impressão?"*`,
      timestamp,
      suggestedPrompts: [
        'Posso enviar 10.000 sacos com vinco para a Copacol?',
        'Qual o perfil de tolerância da Alisul?',
        'Quais clientes aceitam borrão de impressão?',
        'Quanto de refugo foi evitado este mês?'
      ]
    };
  }
};
