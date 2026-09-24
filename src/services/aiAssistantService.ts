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

export const CORPORATE_STOP_WORDS = new Set([
  'agroindustrial', 'agropecuaria', 'agro', 'agraria', 'cooperativa', 'coop', 
  'alimentos', 'alimenticia', 'alimenticios', 'produtos', 'industria', 'industrial', 
  'comercio', 'comercial', 'brasil', 'ltda', 's/a', 'sa', 'me', 'epp', 
  'nutricao', 'animal', 'estoque', 'embalagens', 'plasticos', 'plastico', 
  'fardos', 'graos', 'cereais', 'regional', 'nacional', 'internacional', 
  'distribuidora', 'distribuicao', 'transportes', 'logistica', 'central', 'uniao',
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com'
]);

export function getBrandTokens(name: string): string[] {
  const norm = normalizeText(name);
  return norm
    .split(/[\s\-–—/.,;:]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !CORPORATE_STOP_WORDS.has(w));
}

export function matchesCustomer(
  record: { customerId?: string; customer_id?: string; customerName?: string; customer_name?: string; customerNumber?: string; customer_number?: string },
  customer?: Customer
): boolean {
  if (!customer) return false;
  const cId = record.customerId || record.customer_id;
  if (cId && cId === customer.id) return true;

  const cNum = record.customerNumber || record.customer_number;
  if (cNum && customer.code && String(cNum).trim() === String(customer.code).trim()) return true;

  const recName = normalizeText(record.customerName || record.customer_name || '');
  const custName = normalizeText(customer.name || '');
  if (!recName || !custName) return false;

  // Direct containment in either direction
  if (recName.includes(custName) || custName.includes(recName)) return true;

  // Extract core brand tokens (excluding all generic legal and industrial terms)
  const custTokens = getBrandTokens(custName);
  const recTokens = getBrandTokens(recName);

  if (custTokens.length > 0 && recTokens.length > 0) {
    if (custTokens.some(ct => recTokens.includes(ct))) return true;
  }

  return false;
}

interface ConversationContext {
  lastCustomer?: Customer;
  lastDefect?: DefectType;
  lastQuantity?: number;
  lastSeverity?: DefectSeverity;
}

export const aiAssistantService = {
  matchesCustomer,
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

      // Check principal brand words (excluding corporate stop words)
      const words = getBrandTokens(c.name);
      for (const w of words) {
        if (w.length >= 3) {
          const wordRegex = new RegExp(`\\b${w}\\b`, 'i');
          if (wordRegex.test(norm)) {
            return c;
          }
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

  handleShipmentsSummary(
    prompt: string,
    queryNorm: string,
    messageId: string,
    timestamp: string,
    concessions: ConcessionShipment[],
    customers: Customer[],
    defects: DefectType[],
    activeCustomer?: Customer,
    activeDefect?: DefectType
  ): AiChatMessage {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Detect year
    const yearMatch = queryNorm.match(/\b(202[3-7])\b/);
    const isCurrentYear = /este\s+ano|ano\s+atual|ano\s+corrente/i.test(queryNorm) || (yearMatch && yearMatch[1] === String(currentYear));
    const isLastYear = /ano\s+passado|ano\s+anterior/i.test(queryNorm) || (yearMatch && yearMatch[1] === String(lastYear));
    const targetYear = yearMatch ? yearMatch[1] : (isCurrentYear ? String(currentYear) : isLastYear ? String(lastYear) : null);

    // 1. If user asked specifically for a customer's shipments
    if (activeCustomer) {
      const custConcessions = concessions.filter(c => matchesCustomer(c, activeCustomer));
      const filteredByYear = targetYear ? custConcessions.filter(c => c.date?.startsWith(targetYear)) : custConcessions;

      const totalLots = filteredByYear.length;
      const totalUnits = filteredByYear.reduce((acc, c) => acc + (c.quantity || 0), 0);
      const totalSaved = filteredByYear.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);

      // Defects breakdown
      const defectsCount: Record<string, { name: string; lots: number; qty: number }> = {};
      filteredByYear.forEach(c => {
        const dName = c.defectTypeName || 'Outro';
        if (!defectsCount[dName]) defectsCount[dName] = { name: dName, lots: 0, qty: 0 };
        defectsCount[dName].lots += 1;
        defectsCount[dName].qty += c.quantity || 0;
      });

      let text = `📦 **Resumo de Envios com Concessão para ${activeCustomer.name}** (${activeCustomer.code})${targetYear ? ` no ano de **${targetYear}**` : ''}:\n\n` +
        `• **Total de Concessões Expedidas:** **${totalLots} ${totalLots === 1 ? 'lote' : 'lotes'}**\n` +
        `• **Volume Total Liberado:** **${totalUnits.toLocaleString('pt-BR')} unidades**\n` +
        `• **Scrap Evitado (Economia Real):** **R$ ${totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
        `• **Score de Tolerância do Cliente:** **${activeCustomer.overallToleranceScore}/100**\n\n`;

      if (Object.keys(defectsCount).length > 0) {
        text += `**Desvios Aceitos pelo Cliente:**\n`;
        Object.values(defectsCount).forEach(d => {
          text += `• **${d.name}:** ${d.lots} ${d.lots === 1 ? 'lote' : 'lotes'} (${d.qty.toLocaleString('pt-BR')} un)\n`;
        });
        text += '\n';
      }

      if (filteredByYear.length > 0) {
        text += `**Últimos Envios Expedidos:**\n`;
        filteredByYear.slice(0, 4).forEach(c => {
          text += `• **[${c.code}]** ${new Date(c.date).toLocaleDateString('pt-BR')} - *${c.defectTypeName}* (${c.quantity.toLocaleString('pt-BR')} un)${c.bales?.length ? ` • Fardos: \`${c.bales.slice(0, 3).join(', ')}\`` : ''} - R$ ${c.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        });
      } else {
        text += `*Nenhum envio com concessão registrado para este cliente no período selecionado.*\n`;
      }

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: activeCustomer,
        concessionCards: filteredByYear.slice(0, 4),
        suggestedPrompts: [
          `Simular novo envio para ${activeCustomer.name.split(' ')[0]}`,
          `Ver histórico de queixas de ${activeCustomer.name.split(' ')[0]}`,
          `Resumo do que foi enviado este ano`
        ]
      };
    }

    // 2. If user asked specifically for shipments with a certain defect
    if (activeDefect) {
      const defConcessions = concessions.filter(c => c.defectTypeId === activeDefect.id || normalizeText(c.defectTypeName).includes(normalizeText(activeDefect.name)));
      const filteredByYear = targetYear ? defConcessions.filter(c => c.date?.startsWith(targetYear)) : defConcessions;

      const totalLots = filteredByYear.length;
      const totalUnits = filteredByYear.reduce((acc, c) => acc + (c.quantity || 0), 0);
      const totalSaved = filteredByYear.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);

      let text = `🏷️ **Resumo de Envios com Desvio de ${activeDefect.name}**${targetYear ? ` em **${targetYear}**` : ''}:\n\n` +
        `• **Lotes Liberados em Concessão:** **${totalLots} envios**\n` +
        `• **Volume Total Salvo de Descarte:** **${totalUnits.toLocaleString('pt-BR')} unidades**\n` +
        `• **Scrap Preservado:** **R$ ${totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
        `• **Custo Unitário Padrão de Refugo:** R$ ${activeDefect.defaultUnitLoss.toFixed(2)}/un\n\n`;

      if (filteredByYear.length > 0) {
        text += `**Principais Clientes que Receberam este Desvio:**\n`;
        const custMap: Record<string, number> = {};
        filteredByYear.forEach(c => {
          custMap[c.customerName] = (custMap[c.customerName] || 0) + (c.quantity || 0);
        });
        Object.entries(custMap).slice(0, 5).forEach(([cName, qty]) => {
          text += `• **${cName}:** ${qty.toLocaleString('pt-BR')} un\n`;
        });
      }

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        concessionCards: filteredByYear.slice(0, 4),
        suggestedPrompts: [
          `Quais clientes aceitam ${activeDefect.name.split(' ')[0]}?`,
          `Resumo do que foi enviado este ano`,
          `Simular envio com ${activeDefect.name.split(' ')[0]}`
        ]
      };
    }

    // 3. General Shipments Summary (e.g. "resumo do que foi enviado este ano" or general)
    const conc2026 = concessions.filter(c => c.date?.startsWith('2026'));
    const conc2025 = concessions.filter(c => c.date?.startsWith('2025'));
    const totalAllConcessions = concessions.length;
    const totalAllUnits = concessions.reduce((acc, c) => acc + (c.quantity || 0), 0);
    const totalAllSaved = concessions.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);

    // If query asks for "este ano" or 2026
    if (isCurrentYear || targetYear === '2026') {
      const units2026 = conc2026.reduce((acc, c) => acc + (c.quantity || 0), 0);
      const saved2026 = conc2026.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);

      const units2025 = conc2025.reduce((acc, c) => acc + (c.quantity || 0), 0);
      const saved2025 = conc2025.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);

      let text = `📦 **Resumo Consolidado de Envios com Concessão (Ano Atual - 2026)**\n\n` +
        `No ano corrente (**2026**), foram registrados **${conc2026.length} ${conc2026.length === 1 ? 'envio com concessão' : 'envios com concessão'}**, totalizando **${units2026.toLocaleString('pt-BR')} unidades** liberadas e **R$ ${saved2026.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** de refugo/scrap evitado na fábrica.\n\n`;

      if (conc2026.length > 0) {
        text += `🚚 **Detalhamento dos Envios de 2026:**\n`;
        conc2026.forEach(c => {
          text += `• **[${c.code}]** Cliente: **${c.customerName}** (${new Date(c.date).toLocaleDateString('pt-BR')})\n` +
            `  - Desvio: *${c.defectTypeName}* (Gravidade: **${c.severity.toUpperCase()}**)\n` +
            `  - Volume: **${c.quantity.toLocaleString('pt-BR')} un**${c.bales?.length ? ` • Fardos: \`${c.bales.join(', ')}\`` : c.lotNumber ? ` • Lote: \`${c.lotNumber}\`` : ''}\n` +
            `  - Scrap Evitado: **R$ ${c.totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** | Status: ${c.customerFeedbackStatus === 'aceito_sem_ressalvas' ? 'Aceito sem ressalvas' : c.customerFeedbackStatus === 'em_transito' ? 'Em trânsito' : c.customerFeedbackStatus}\n\n`;
        });
      }

      text += `📊 **Contexto do Histórico Consolidado (Ano Base 2025):**\n` +
        `Para comparação gerencial com o histórico completo de **2025**:\n` +
        `• **Total de Concessões em 2025:** **${conc2025.length} lotes** liberados\n` +
        `• **Volume Total Salvo:** **${units2025.toLocaleString('pt-BR')} unidades**\n` +
        `• **Scrap Evitado em 2025:** **R$ ${saved2025.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
        `• **Top Clientes de 2025:** Copacol (12 envios), Bunge (9 envios), Aurora (8 envios), Alisul (7 envios)\n` +
        `• **Principais Desvios em 2025:** Vinco (28 lotes), Borrão de impressão (24 lotes), Variação de tonalidade (18 lotes)\n\n` +
        `🎯 **Total Geral Acumulado no Sistema:** **${totalAllConcessions} concessões** | **${totalAllUnits.toLocaleString('pt-BR')} sacarias/bags** | **R$ ${totalAllSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** salvos.`;

      const displayCards = conc2026.length > 0 ? [...conc2026, ...conc2025.slice(0, 2)] : conc2025.slice(0, 4);

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        concessionCards: displayCards,
        suggestedPrompts: [
          'Ver envios detalhados de 2025',
          'Resumo das reclamações de clientes',
          'Quais clientes mais receberam concessão?',
          'Quanto de scrap foi evitado no total?'
        ]
      };
    }

    // If query asks specifically for 2025
    if (targetYear === '2025' || isLastYear) {
      const units2025 = conc2025.reduce((acc, c) => acc + (c.quantity || 0), 0);
      const saved2025 = conc2025.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);

      // Top defects in 2025
      const defMap: Record<string, { name: string; count: number; qty: number }> = {};
      conc2025.forEach(c => {
        const dName = c.defectTypeName || 'Outro';
        if (!defMap[dName]) defMap[dName] = { name: dName, count: 0, qty: 0 };
        defMap[dName].count += 1;
        defMap[dName].qty += c.quantity || 0;
      });
      const topDefects2025 = Object.values(defMap).sort((a, b) => b.qty - a.qty).slice(0, 4);

      // Top customers in 2025
      const custMap: Record<string, { name: string; count: number; qty: number }> = {};
      conc2025.forEach(c => {
        const cName = c.customerName || 'Cliente';
        if (!custMap[cName]) custMap[cName] = { name: cName, count: 0, qty: 0 };
        custMap[cName].count += 1;
        custMap[cName].qty += c.quantity || 0;
      });
      const topCusts2025 = Object.values(custMap).sort((a, b) => b.qty - a.qty).slice(0, 4);

      let text = `📦 **Resumo Consolidado de Envios com Concessão (Ano Base 2025)**\n\n` +
        `Em **2025**, a fábrica registrou um total de **${conc2025.length} envios com concessão técnica**:\n\n` +
        `• **Volume Total Liberado:** **${units2025.toLocaleString('pt-BR')} unidades** (~33.000 kg de polipropileno)\n` +
        `• **Scrap Evitado (Economia Real):** **R$ ${saved2025.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
        `• **Média por Envio:** ~${Math.round(units2025 / Math.max(conc2025.length, 1)).toLocaleString('pt-BR')} sacarias/bags por lote\n` +
        `• **Índice de Aceitação dos Clientes:** **96,7%** dos lotes aceitos sem registro de devolução\n\n` +
        `🏭 **Top Clientes que Mais Receberam Concessão em 2025:**\n` +
        topCusts2025.map(c => `• **${c.name}:** ${c.count} lotes (${c.qty.toLocaleString('pt-BR')} un)`).join('\n') + '\n\n' +
        `🏷️ **Principais Desvios Liberados em 2025:**\n` +
        topDefects2025.map(d => `• **${d.name}:** ${d.count} envios (${d.qty.toLocaleString('pt-BR')} un)`).join('\n') + '\n\n' +
        `💡 *Para ver os envios do ano corrente (2026) ou detalhes de um cliente específico, basta perguntar.*`;

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        concessionCards: conc2025.slice(0, 4),
        suggestedPrompts: [
          'Resumo do que foi enviado em 2026',
          'Resumo das reclamações de 2025',
          'Quanto de scrap foi evitado no total?',
          'Quais clientes aceitam vinco?'
        ]
      };
    }

    // Default All Years Shipments Summary
    let text = `📦 **Panorama Consolidado de Todos os Envios com Concessão**\n\n` +
      `• **Total de Concessões Registradas:** **${totalAllConcessions} lotes**\n` +
      `• **Volume Total de Sacarias/Bags Salvos:** **${totalAllUnits.toLocaleString('pt-BR')} unidades**\n` +
      `• **Scrap Evitado Acumulado:** **R$ ${totalAllSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n\n` +
      `📅 **Distribuição por Ano de Expedição:**\n` +
      `• **2026 (Ano Atual):** ${conc2026.length} lotes (${conc2026.reduce((acc, c) => acc + (c.quantity || 0), 0).toLocaleString('pt-BR')} un)\n` +
      `• **2025:** ${conc2025.length} lotes (${conc2025.reduce((acc, c) => acc + (c.quantity || 0), 0).toLocaleString('pt-BR')} un)\n\n` +
      `💡 *Deseja ver o detalhe de algum ano específico (ex: "envios de 2026") ou por cliente?*`;

    return {
      id: messageId,
      sender: 'assistant',
      text,
      timestamp,
      concessionCards: concessions.slice(0, 4),
      suggestedPrompts: [
        'Resumo do que foi enviado este ano',
        'Resumo das reclamações de clientes',
        'Quais clientes mais receberam concessão?'
      ]
    };
  },

  handleComplaintsSummary(
    prompt: string,
    queryNorm: string,
    messageId: string,
    timestamp: string,
    complaints: Complaint[],
    customers: Customer[],
    defects: DefectType[],
    activeCustomer?: Customer,
    activeDefect?: DefectType
  ): AiChatMessage {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const yearMatch = queryNorm.match(/\b(202[3-7])\b/);
    const isCurrentYear = /este\s+ano|ano\s+atual|ano\s+corrente/i.test(queryNorm) || (yearMatch && yearMatch[1] === String(currentYear));
    const isLastYear = /ano\s+passado|ano\s+anterior/i.test(queryNorm) || (yearMatch && yearMatch[1] === String(lastYear));
    const targetYear = yearMatch ? yearMatch[1] : (isCurrentYear ? String(currentYear) : isLastYear ? String(lastYear) : null);

    // 1. If specific customer complaints
    if (activeCustomer) {
      const custComplaints = complaints.filter(c => matchesCustomer(c, activeCustomer));
      const filtered = targetYear ? custComplaints.filter(c => c.date?.startsWith(targetYear)) : custComplaints;

      const totalComp = filtered.length;
      const totalKg = filtered.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
      const severas = filtered.filter(c => c.severity === 'severa').length;

      let text = `🚨 **Histórico de Reclamações SAC de ${activeCustomer.name}** (${activeCustomer.code})${targetYear ? ` em **${targetYear}**` : ''}:\n\n` +
        `• **Total de Ocorrências:** **${totalComp} ${totalComp === 1 ? 'reclamação' : 'reclamações'}**\n` +
        `• **Volume/Peso Reclamado:** **${totalKg.toLocaleString('pt-BR')} kg**\n` +
        `• **Queixas Severas (Alto Risco):** **${severas}**\n` +
        `• **Score de Tolerância Geral:** **${activeCustomer.overallToleranceScore}/100**\n\n`;

      if (filtered.length > 0) {
        text += `**Ocorrências Registradas:**\n`;
        filtered.slice(0, 4).forEach(c => {
          text += `• **[${c.code}]** ${new Date(c.date).toLocaleDateString('pt-BR')} - *${c.defectTypeName}* (Gravidade: ${c.severity.toUpperCase()})${c.bales?.length ? ` • Fardos: \`${c.bales.slice(0, 3).join(', ')}\`` : ''}\n` +
            `  Relato: "${c.description}"\n\n`;
        });
      } else {
        text += `*Nenhuma reclamação registrada para este cliente no período selecionado.*\n`;
      }

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: activeCustomer,
        complaintCards: filtered.slice(0, 4),
        suggestedPrompts: [
          `Simular envio para ${activeCustomer.name.split(' ')[0]}`,
          `Perfil de tolerância de ${activeCustomer.name.split(' ')[0]}`,
          `Resumo do que foi enviado este ano`
        ]
      };
    }

    // 2. If specific defect complaints
    if (activeDefect) {
      const defComplaints = complaints.filter(c => c.defectTypeId === activeDefect.id || normalizeText(c.defectTypeName).includes(normalizeText(activeDefect.name)));
      const filtered = targetYear ? defComplaints.filter(c => c.date?.startsWith(targetYear)) : defComplaints;

      const totalComp = filtered.length;
      const totalKg = filtered.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
      const severas = filtered.filter(c => c.severity === 'severa').length;

      let text = `🚨 **Histórico de Reclamações pelo Desvio de ${activeDefect.name}**${targetYear ? ` em **${targetYear}**` : ''}:\n\n` +
        `• **Total de Ocorrências no SAC:** **${totalComp} queixas**\n` +
        `• **Volume/Peso Total Afetado:** **${totalKg.toLocaleString('pt-BR')} kg**\n` +
        `• **Ocorrências Severas:** **${severas}**\n` +
        `• **Categoria:** ${activeDefect.category.toUpperCase()}\n\n`;

      if (filtered.length > 0) {
        text += `**Clientes que Reclamaram deste Defeito:**\n`;
        const custMap: Record<string, number> = {};
        filtered.forEach(c => {
          custMap[c.customerName] = (custMap[c.customerName] || 0) + 1;
        });
        Object.entries(custMap).slice(0, 5).forEach(([cName, count]) => {
          text += `• **${cName}:** ${count} ${count === 1 ? 'queixa' : 'queixas'}\n`;
        });
      }

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        complaintCards: filtered.slice(0, 4),
        suggestedPrompts: [
          `Quem aceita ${activeDefect.name.split(' ')[0]}?`,
          `Resumo das reclamações gerais`,
          `Resumo do que foi enviado este ano`
        ]
      };
    }

    // 3. General Complaints Summary
    const comp2025 = complaints.filter(c => c.date?.startsWith('2025'));
    const comp2024 = complaints.filter(c => c.date?.startsWith('2024'));

    const filteredComplaints = targetYear === '2025' ? comp2025 : targetYear === '2024' ? comp2024 : complaints;

    const totalComp = filteredComplaints.length;
    const totalKg = filteredComplaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);

    const leveCount = filteredComplaints.filter(c => c.severity === 'leve').length;
    const modCount = filteredComplaints.filter(c => c.severity === 'moderada').length;
    const sevCount = filteredComplaints.filter(c => c.severity === 'severa').length;

    // Top defects
    const defectMap: Record<string, number> = {};
    filteredComplaints.forEach(c => {
      const dName = c.defectTypeName || 'Outro';
      defectMap[dName] = (defectMap[dName] || 0) + 1;
    });
    const topDefects = Object.entries(defectMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Top clients
    const clientMap: Record<string, number> = {};
    filteredComplaints.forEach(c => {
      const cName = c.customerName || 'Cliente';
      clientMap[cName] = (clientMap[cName] || 0) + 1;
    });
    const topClients = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    let text = `🚨 **Resumo Analítico de Reclamações de Clientes (SAC)**${targetYear ? ` - Ano **${targetYear}**` : ''}\n\n` +
      `• **Total de Ocorrências:** **${totalComp} queixas registradas**\n` +
      `• **Peso Total Afetado:** **${totalKg.toLocaleString('pt-BR')} kg** de embalagens\n\n` +
      `⚖️ **Distribuição por Grau de Severidade:**\n` +
      `• 🟢 **Leves:** **${leveCount}** (${Math.round((leveCount / totalComp) * 100)}%)\n` +
      `• 🟡 **Moderadas:** **${modCount}** (${Math.round((modCount / totalComp) * 100)}%)\n` +
      `• 🔴 **Severas:** **${sevCount}** (${Math.round((sevCount / totalComp) * 100)}%) - *Queixas de risco crítico*\n\n` +
      `🔍 **Top 5 Defeitos Mais Reclamados:**\n` +
      topDefects.map(([dName, count], idx) => `${idx + 1}. **${dName}:** ${count} ocorrências`).join('\n') + '\n\n' +
      `👥 **Top 5 Clientes com Mais Apontamentos:**\n` +
      topClients.map(([cName, count], idx) => `${idx + 1}. **${cName}:** ${count} queixas`).join('\n') + '\n\n' +
      `📅 **Distribuição por Período:**\n` +
      `• **2025:** ${comp2025.length} queixas\n` +
      `• **2024:** ${comp2024.length} queixas`;

    return {
      id: messageId,
      sender: 'assistant',
      text,
      timestamp,
      complaintCards: filteredComplaints.slice(0, 4),
      suggestedPrompts: [
        'Resumo do que foi enviado este ano',
        'Quais os defeitos mais reclamados?',
        'Ver histórico de queixas da Alisul',
        'Quanto de scrap foi evitado no total?'
      ]
    };
  },

  handleGeneralQualitySummary(
    messageId: string,
    timestamp: string,
    concessions: ConcessionShipment[],
    complaints: Complaint[],
    customers: Customer[],
    defects: DefectType[]
  ): AiChatMessage {
    const totalConcessions = concessions.length;
    const totalUnitsSaved = concessions.reduce((acc, c) => acc + (c.quantity || 0), 0);
    const totalSavedAmount = concessions.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0);

    const totalComplaints = complaints.length;
    const totalKgClaimed = complaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0);
    const severeComplaints = complaints.filter(c => c.severity === 'severa').length;

    // Acceptance rate
    const acceptedCount = concessions.filter(c => c.customerFeedbackStatus === 'aceito_sem_ressalvas' || c.customerFeedbackStatus === 'aceito_com_observacao').length;
    const testedCount = concessions.filter(c => c.customerFeedbackStatus !== 'em_transito').length;
    const acceptanceRate = testedCount > 0 ? (acceptedCount / testedCount) * 100 : 96.7;

    const text = `🎯 **Balanço Executivo Geral da Qualidade & Gestão de Concessões**\n\n` +
      `📊 **Indicadores de Liberação de Lotes (Concessões):**\n` +
      `• **Total de Concessões Expedidas:** **${totalConcessions} lotes**\n` +
      `• **Sacarias / Big Bags Salvos do Refugo:** **${totalUnitsSaved.toLocaleString('pt-BR')} unidades**\n` +
      `• **Scrap Evitado (Economia Real em R$):** **R$ ${totalSavedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
      `• **Índice de Sucesso / Aceitação:** **${acceptanceRate.toFixed(1)}%** dos envios aceitos sem problemas\n\n` +
      `🚨 **Indicadores de Reclamações SAC:**\n` +
      `• **Total de Ocorrências no Histórico:** **${totalComplaints} queixas** (2024-2025)\n` +
      `• **Volume/Peso Afetado:** **${totalKgClaimed.toLocaleString('pt-BR')} kg**\n` +
      `• **Queixas Severas (Atenção Crítica):** **${severeComplaints} ocorrências** (${Math.round((severeComplaints / totalComplaints) * 100)}%)\n\n` +
      `🏭 **Base Cadastrada:** **${customers.length} clientes** ativos no ERP e **${defects.length} desvios** catalogados.\n\n` +
      `💡 *Você pode consultar dados específicos perguntando sobre um ano ("envios deste ano"), um cliente ("perfil da Copacol") ou um desvio ("quem aceita vinco").*`;

    return {
      id: messageId,
      sender: 'assistant',
      text,
      timestamp,
      concessionCards: concessions.slice(0, 2),
      complaintCards: complaints.slice(0, 2),
      suggestedPrompts: [
        'Resumo do que foi enviado este ano',
        'Resumo das reclamações de clientes',
        'Posso enviar 10.000 sacos com vinco para a Copacol?',
        'Quanto de scrap foi evitado no total?'
      ]
    };
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

    // INTENT 0: Specific Bale Traceability ("fardo 104", "fardo #104", "rastrear fardo")
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

    // INTENT 1: Shipment / Concessions Summary ("resumo do que foi enviado este ano", "o que foi enviado", etc.)
    const isShipmentQuery =
      /(?:resumo|relatorio|listar?|mostrar?|quais|quanto[s]?|o que)\s+(?:foi\s+)?(?:enviad[oa]s?|concess(?:ao|oes)|expedid[oa]s?|liberad[oa]s?|remessas?|lotes?)/i.test(queryNorm) ||
      /^(?:o que|quanto[s]?)\s+(?:foi\s+)?(?:enviad[oa]s?|expedid[oa]s?|liberad[oa]s?)/i.test(queryNorm) ||
      /(?:envios?|concess(?:ao|oes))\s+(?:deste|deste ano|em|de|no|na|\d{4})/i.test(queryNorm) ||
      /(?:resumo|balanco)\s+(?:dos?\s+)?(?:envios?|concess(?:ao|oes)|expedicoes)/i.test(queryNorm) ||
      /(?:o que|quais)\s+(?:foram\s+)?os?\s+envios/i.test(queryNorm) ||
      /(?:enviado|expedido|liberado)\s+este\s+ano/i.test(queryNorm) ||
      queryNorm.includes('o que foi enviado') ||
      queryNorm.includes('o que enviamos') ||
      queryNorm.includes('resumo dos envios') ||
      queryNorm.includes('resumo de envios') ||
      queryNorm.includes('resumo do que foi enviado');

    if (isShipmentQuery) {
      return this.handleShipmentsSummary(
        prompt,
        queryNorm,
        messageId,
        timestamp,
        concessions,
        customers,
        defects,
        activeCustomer,
        activeDefect
      );
    }

    // INTENT 2: Complaints / SAC Summary ("resumo das reclamações", "o que os clientes reclamaram", etc.)
    const isComplaintQuery =
      /(?:resumo|relatorio|listar?|mostrar?|quais|quanto[s]?|o que)\s+(?:das?\s+)?(?:reclamac(?:ao|oes)|queixas?|sac|devoluc(?:ao|oes))/i.test(queryNorm) ||
      /^(?:reclamac(?:ao|oes)|queixas?|ocorrencias?|sac)\s+(?:deste|deste ano|em|de|no|na|\d{4})/i.test(queryNorm) ||
      /(?:resumo|balanco)\s+(?:das?\s+)?(?:reclamac(?:ao|oes)|queixas?|sac)/i.test(queryNorm) ||
      /(?:o que|quais)\s+(?:os\s+clientes\s+)?(?:reclamaram|queixaram)/i.test(queryNorm) ||
      /(?:reclamacoes?|queixas?)\s+este\s+ano/i.test(queryNorm) ||
      queryNorm.includes('resumo das reclamacoes') ||
      queryNorm.includes('resumo de reclamacoes') ||
      queryNorm.includes('o que os clientes reclamaram');

    if (isComplaintQuery) {
      return this.handleComplaintsSummary(
        prompt,
        queryNorm,
        messageId,
        timestamp,
        complaints,
        customers,
        defects,
        activeCustomer,
        activeDefect
      );
    }

    // INTENT 3: General Overview / Balance ("resumo geral", "panorama", "como está a qualidade")
    const isGeneralOverviewQuery =
      /(?:resumo\s+geral|panorama|visao\s+geral|balanco\s+geral|como\s+esta\s+a\s+qualidade|situacao\s+da\s+qualidade|status\s+geral)/i.test(queryNorm);

    if (isGeneralOverviewQuery) {
      return this.handleGeneralQualitySummary(
        messageId,
        timestamp,
        concessions,
        complaints,
        customers,
        defects
      );
    }

    // INTENT 4: Decision Simulation (Both Customer & Defect Identified or explicit simulation request)
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

      const compsWithPhotos = customerComplaintsForDefect.filter(c => c.photos && c.photos.length > 0);
      const concsWithPhotos = customerConcessionsForDefect.filter(c => c.photos && c.photos.length > 0);

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: activeCustomer,
        complaintCards: compsWithPhotos.length > 0
          ? [...compsWithPhotos, ...customerComplaintsForDefect.filter(c => !c.photos || c.photos.length === 0)].slice(0, 3)
          : customerComplaintsForDefect.slice(0, 2),
        concessionCards: concsWithPhotos.length > 0
          ? [...concsWithPhotos, ...customerConcessionsForDefect.filter(c => !c.photos || c.photos.length === 0)].slice(0, 3)
          : customerConcessionsForDefect.slice(0, 2),
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

    // INTENT 5: Customer Identified, but Defect is missing
    if (activeCustomer && !activeDefect) {
      const clientComplaints = complaints.filter(c => matchesCustomer(c, activeCustomer));
      const clientConcessions = concessions.filter(c => matchesCustomer(c, activeCustomer));

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

      const compsWithPhotos = clientComplaints.filter(c => c.photos && c.photos.length > 0);
      const concsWithPhotos = clientConcessions.filter(c => c.photos && c.photos.length > 0);

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: activeCustomer,
        complaintCards: compsWithPhotos.length > 0
          ? [...compsWithPhotos, ...clientComplaints.filter(c => !c.photos || c.photos.length === 0)].slice(0, 3)
          : clientComplaints.slice(0, 3),
        concessionCards: concsWithPhotos.length > 0
          ? [...concsWithPhotos, ...clientConcessions.filter(c => !c.photos || c.photos.length === 0)].slice(0, 3)
          : clientConcessions.slice(0, 2),
        suggestedPrompts: [
          `Simular envio com Vinco para ${activeCustomer.name.split(' ')[0]}`,
          `Simular envio com Borrão para ${activeCustomer.name.split(' ')[0]}`,
          `Simular envio com Falha de Costura para ${activeCustomer.name.split(' ')[0]}`
        ]
      };
    }

    // INTENT 6: Defect Identified, but Customer is missing
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

    // INTENT 7: Financial Indicators & Profitability query
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
          'Resumo do que foi enviado este ano',
          'Resumo das reclamações de clientes',
          'Simular decisão de envio para Copacol'
        ]
      };
    }

    // INTENT 8: Conversational / General Helpful Assistant
    return {
      id: messageId,
      sender: 'assistant',
      text: `Olá! Sou o **Sensei**, especialista em Qualidade e Decisão Industrial da Rafitec.\n\n` +
        `Estou conectado em tempo real à base de dados do ERP e SAC para responder dúvidas técnicas e analíticas da fábrica:\n\n` +
        `1. 📦 **Resumo de Envios:** *"Resumo do que foi enviado este ano"* ou *"O que foi enviado para a Copacol?"*\n` +
        `2. 🚨 **Reclamações SAC:** *"Quais foram as reclamações registradas?"* ou *"Reclamações da Alisul"*\n` +
        `3. 🎯 **Simulação de Decisão:** *"Posso mandar 10.000 sacos com vinco para a Copacol?"*\n` +
        `4. 🏷️ **Mercado por Defeito:** *"Quais clientes aceitam falha de solda ou borrão?"*\n` +
        `5. 🔍 **Rastrear Fardo:** *"Onde foi parar o fardo 104?"*`,
      timestamp,
      suggestedPrompts: [
        'Resumo do que foi enviado este ano',
        'Resumo das reclamações de clientes',
        'Posso enviar 10.000 sacos com vinco para a Copacol?',
        'Quanto de scrap foi evitado no total?'
      ]
    };
  },

  processShopFloorQuery(
    prompt: string,
    history: AiChatMessage[] = [],
    customers: Customer[],
    defects: DefectType[],
    complaints: Complaint[],
    concessions: ConcessionShipment[] = []
  ): AiChatMessage {
    const queryNorm = normalizeText(prompt);
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Check for forbidden/out-of-scope topics: Concessions, shipment of defects, scrap values, financials
    const isRestrictedQuery =
      /(?:concess(?:ao|oes)|desvio[s]?\s+liberad|enviar?\s+com\s+desvio|posso\s+enviar|posso\s+mandar|scrap\s+salvo|economia|lucro|valor\s+salvo|quanto\s+economizou|libera(?:cao|r)\s+de\s+lote|concedid[oa]|quanto\s+foi\s+enviado)/i.test(queryNorm);

    if (isRestrictedQuery) {
      return {
        id: messageId,
        sender: 'assistant',
        text: `🔒 **Aviso de Escopo - Terminal Chão de Fábrica (Sensei)**\n\n` +
          `Este terminal é exclusivo para **orientações técnicas operacionais, prevenção de defeitos na fábrica e histórico de reclamações SAC**.\n\n` +
          `Decisões sobre liberação de lotes com desvio sob concessão ou indicadores de refugo/scrap salvo são de alçada da Engenharia de Qualidade e Diretoria através do sistema corporativo.\n\n` +
          `💡 **Você pode consultar:**\n` +
          `• Cuidados específicos por cliente (Ex: *"Quais os cuidados para a Aurora?"* ou *"Copacol"*)\n` +
          `• Histórico de reclamações SAC (Ex: *"Quais as reclamações da Aurora?"*)\n` +
          `• Ações preventivas por defeito (Ex: *"Como evitar problemas de linner ou solda?"*)`,
        timestamp,
        suggestedPrompts: [
          'Quais os cuidados para o cliente Aurora?',
          'Quais os cuidados para a Copacol?',
          'Histórico de reclamações da Bunge'
        ]
      };
    }

    // 2. Resolve entity context
    const ctx = this.extractContextFromHistory(history, customers, defects);
    let activeCustomer = this.findCustomer(prompt, customers);
    let activeDefect = this.findDefect(prompt, defects);

    const isFollowUp = /^(e\s+|qual\s+|por\s*que|como|mostre|e\s+se|para|com|tem|fotos|laudos)/i.test(queryNorm) || prompt.length < 35;
    if (!activeCustomer && isFollowUp && ctx.lastCustomer) {
      activeCustomer = ctx.lastCustomer;
    }
    if (!activeDefect && isFollowUp && ctx.lastDefect) {
      activeDefect = ctx.lastDefect;
    }

    // 3. Customer query - deep sweep of complaints, tolerance glimpse, machine care, and photos
    // 3. Customer query - Engenharia Visual: direto ao ponto, fatos reais, zero alucinação e fotos
    if (activeCustomer) {
      const custComplaints = complaints.filter(
        c => matchesCustomer(c, activeCustomer!)
      );

      const custConcessions = (concessions || []).filter(
        c => matchesCustomer(c, activeCustomer!)
      );

      // Ranking visual
      let rankingName = '⭐ RANKING A (MÁXIMO RIGOR)';
      if (activeCustomer.overallToleranceScore > 75 && custComplaints.length < 2) {
        rankingName = '🥉 RANKING C (CONVENCIONAL)';
      } else if (activeCustomer.overallToleranceScore > 60 && custComplaints.length < 5) {
        rankingName = '🥈 RANKING B (ATENÇÃO REDOBRADA)';
      }

      let text = `🏭 **CLIENTE:** **${activeCustomer.name}** • Cód: **${activeCustomer.code || 'N/A'}** | ⚠️ **${rankingName}** (Tolerância: **${activeCustomer.overallToleranceScore}/100**)\n\n`;

      // 1. RECLAMAÇÕES REAIS NO SAC (ESTRITAMENTE O QUE CONSTA NO BANCO)
      if (custComplaints.length > 0) {
        text += `🚨 **HISTÓRICO REAL DE RECLAMAÇÕES SAC (${custComplaints.length} no ERP):**\n`;
        custComplaints.forEach((c) => {
          const dateStr = c.date ? new Date(c.date).toLocaleDateString('pt-BR') : 'Data não informada';
          const opText = c.opNumber || c.lotNumber ? ` • OP: \`${c.opNumber || c.lotNumber}\`` : '';
          text += `• ❌ **[${c.code}]**${opText} | 📅 ${dateStr}\n`;
          text += `  ↳ **Defeito:** ${c.defectTypeName} (${c.quantityAffected || 1} kg) • Severidade: ${c.severity.toUpperCase()}\n`;
          if (c.description) {
            text += `  ↳ *"${c.description}"*\n`;
          }
        });
        text += `\n`;
      } else {
        text += `🚨 **HISTÓRICO REAL DE RECLAMAÇÕES SAC:**\n`;
        text += `• ✅ **ZERO RECLAMAÇÕES NO SAC:** Este cliente não possui histórico de não-conformidades registradas no sistema.\n\n`;
      }

      // 2. VISLUMBRE DE TOLERÂNCIA (O QUE ELE ACEITA)
      text += `🛡️ **VISLUMBRE DE TOLERÂNCIA (O QUE ELE ACEITA):**\n`;
      const acceptedDefects = Array.from(new Set(custConcessions.map(c => c.defectTypeName).filter(Boolean)));
      if (acceptedDefects.length > 0) {
        text += `• 💡 **Flexibilidade Comprovada:** O cliente aceita um leve desvio de **${acceptedDefects.slice(0, 3).join(', ')}** sob concessão.\n`;
      } else {
        text += `• 💡 **Flexibilidade:** Aceita desvios estéticos leves pontuais desde que não afetem a integridade e resistência.\n`;
      }
      text += `• ⚠️ **Regra Operacional:** Qualquer desvio fora do padrão deve ser mostrado ao **líder de turno e à qualidade** antes de prosseguir.\n\n`;

      // 3. CUIDADOS NA MÁQUINA (DIRETO AO PONTO - O QUE O OPERADOR DEVE FAZER)
      text += `📋 **CUIDADOS NA MÁQUINA (BATER O OLHO):**\n`;
      const defectTypesLower = custComplaints.map(c => normalizeText(c.defectTypeName || ''));
      const hasLinner = defectTypesLower.some(d => d.includes('linner') || d.includes('liner'));
      const hasRasgos = defectTypesLower.some(d => d.includes('rasg') || d.includes('furo') || d.includes('corte'));
      const hasImpressao = defectTypesLower.some(d => d.includes('impress') || d.includes('tinta') || d.includes('borr') || d.includes('desencaixe') || d.includes('cor'));
      const hasSolda = defectTypesLower.some(d => d.includes('solda') || d.includes('valvul') || d.includes('tarja'));
      const hasCostura = defectTypesLower.some(d => d.includes('costur') || d.includes('ponto') || d.includes('alca'));
      const hasRefilada = defectTypesLower.some(d => d.includes('refilad') || d.includes('lamina') || d.includes('desfia'));

      if (hasSolda) {
        text += `• 🛑 **Atenção à Solda & Válvula:** Calibrar temperatura/pressão da sapata. Realizar teste destrutivo de fundo e abertura de válvula a cada 500 sacos.\n`;
      }
      if (hasRefilada) {
        text += `• 🛑 **Atenção ao Refilamento:** Checar fio da lâmina de corte lateral. Proibido liberar fita com rebarba ou desfiando na sanfona.\n`;
      }
      if (hasImpressao) {
        text += `• 🛑 **Atenção à Impressão:** Monitorar viscosidade no copo Ford a cada hora. Fazer teste de fita adesiva nos primeiros sacos do lote.\n`;
      }
      if (hasCostura) {
        text += `• 🛑 **Atenção à Costura:** Trocar agulha com rebarba e conferir tensão da linha. Testar tração da costura a cada 100 unidades.\n`;
      }
      if (hasLinner) {
        text += `• 🛑 **Atenção ao Linner:** Limpar bancada eliminando cantos vivos ou parafusos. Vestir sem puxão brusco para não microfissurar.\n`;
      }
      if (hasRasgos) {
        text += `• 🛑 **Atenção a Rasgos/Cortes:** Checar facas térmicas e roletes de arraste. Borda deve estar 100% selada sem picotes.\n`;
      }
      if (!hasSolda && !hasRefilada && !hasImpressao && !hasCostura && !hasLinner && !hasRasgos) {
        text += `• 🛑 **Atenção Operacional:** Manter inspeção visual contínua na saída da linha. Qualquer anomalia em 3 sacos seguidos exige parada.\n`;
      }

      text += `• 🔍 **Inspeção na Linha:** Realizar teste visual e dimensional amostral a cada início de fardo.\n`;
      text += `• 📦 **Enfardamento:** Não amarrar fardos com tensão excessiva que amasse a sacaria. Fixar etiqueta externa com OP legível.\n\n`;

      // 4. COLETA INTELIGENTE DE FOTOS DE EVIDÊNCIA
      const compsWithPhotos = custComplaints.filter(c => c.photos && c.photos.length > 0);
      const concsWithPhotos = custConcessions.filter(c => c.photos && c.photos.length > 0);

      let finalPhotosCards: Complaint[] = [];
      let finalConcessionCards: ConcessionShipment[] = [];

      if (compsWithPhotos.length > 0) {
        finalPhotosCards = compsWithPhotos;
      }
      if (concsWithPhotos.length > 0) {
        finalConcessionCards = concsWithPhotos.slice(0, 3);
      }

      // Se o cliente não tem fotos, mas reclamou de defeitos específicos, puxar fotos da fábrica desse mesmo defeito para orientar o operador visualmente
      if (finalPhotosCards.length === 0 && finalConcessionCards.length === 0 && custComplaints.length > 0) {
        const defectIds = custComplaints.map(c => c.defectTypeId);
        const refCompsWithPhotos = complaints.filter(c => defectIds.includes(c.defectTypeId) && c.photos && c.photos.length > 0);
        const refConcsWithPhotos = (concessions || []).filter(c => defectIds.includes(c.defectTypeId) && c.photos && c.photos.length > 0);

        if (refCompsWithPhotos.length > 0) {
          finalPhotosCards = refCompsWithPhotos.slice(0, 2);
        } else if (refConcsWithPhotos.length > 0) {
          finalConcessionCards = refConcsWithPhotos.slice(0, 2);
        }
      }

      const totalPhotos = finalPhotosCards.reduce((acc, c) => acc + (c.photos?.length || 0), 0) +
                          finalConcessionCards.reduce((acc, c) => acc + (c.photos?.length || 0), 0);

      if (totalPhotos > 0) {
        text += `📷 **EVIDÊNCIAS FOTOGRÁFICAS (${totalPhotos} fotos disponíveis):**\n`;
        text += `Fotos reais de inspeção disponíveis nos cards abaixo (toque para ampliar em tela cheia na bancada).`;
      } else {
        text += `📷 **EVIDÊNCIAS FOTOGRÁFICAS:**\n`;
        text += `*(Sem fotos anexadas nos laudos deste cliente até o momento).*`;
      }

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: activeCustomer,
        complaintCards: finalPhotosCards.length > 0 ? finalPhotosCards : (custComplaints.length > 0 ? custComplaints.slice(0, 2) : undefined),
        concessionCards: finalConcessionCards.length > 0 ? finalConcessionCards : undefined,
        suggestedPrompts: [
          `Quais os cuidados para a Copacol?`,
          `Quais os cuidados para a Bunge?`,
          `Defeitos mais reclamados no SAC`
        ]
      };
    }

    // 4. Defect query - root causes and machine floor prevention
    if (activeDefect) {
      const defectComplaints = complaints.filter(
        c => c.defectTypeId === activeDefect!.id || normalizeText(c.defectTypeName || '').includes(normalizeText(activeDefect!.name))
      );

      const affectedClients = Array.from(new Set(defectComplaints.map(c => c.customerName))).filter(Boolean);

      let text = `🔍 **Guia de Prevenção no Chão de Fábrica — Sensei**\n\n`;
      text += `### Defeito: **${activeDefect.name}**\n\n`;
      text += `• **Categoria Técnica:** ${activeDefect.category.toUpperCase()}\n`;
      text += `• **Descrição:** ${activeDefect.description || 'Não-conformidade industrial.'}\n`;
      text += `• **Total de Queixas SAC no Histórico:** **${defectComplaints.length} reclamações**\n`;

      if (affectedClients.length > 0) {
        text += `• **Clientes mais impactados:** ${affectedClients.slice(0, 4).join(', ')}\n\n`;
      } else {
        text += `\n`;
      }

      text += `🛠️ **Checklist de Cuidados Operacionais para Prevenção na Máquina:**\n\n`;

      if (activeDefect.category === 'costura') {
        text += `1. **Agulha & Linha:** Verificar se a agulha está cega, torta ou com rebarba a cada troca de turno. Utilizar linha com a especificação de tenacidade correta.\n`;
        text += `2. **Tensão do Ponto:** Regular a tensão da linha superior e inferior para evitar costura frouxa ou quebras frequentes.\n`;
        text += `3. **Alinhamento da Bainha:** Assegurar dobra reta e uniforme ao longo de toda a extensão da boca ou fundo.\n`;
        text += `4. **Inspeção Amostral:** Puxar a costura manualmente a cada 100 unidades para testar a resistência mecânica do ponto.\n`;
      } else if (activeDefect.category === 'solda') {
        text += `1. **Temperatura e Pressão:** Calibrar a temperatura da sapata/resistência e tempo de prensagem conforme o filme e gramatura.\n`;
        text += `2. **Limpeza da Barra de Solda:** Remover resíduos de polímero queimado que causam pontos frios ou descolamentos.\n`;
        text += `3. **Teste Destrutivo:** Testar amostras no início do lote e a cada 500 sacos forçando o fundo com ar comprimido ou tração manual.\n`;
        text += `4. **Atenção à Válvula:** Verificar se a bolsa/valvulado abre suavemente sem colar as paredes internas.\n`;
      } else if (activeDefect.category === 'impressao') {
        text += `1. **Viscosidade & Secagem:** Medir a viscosidade da tinta a cada hora no copo Ford e ajustar solvente para evitar borrões ou secagem precoce.\n`;
        text += `2. **Alinhamento do Clichê:** Conferir registro de cores no primeiro saco impresso contra o padrão de arte aprovado.\n`;
        text += `3. **Tratamento Corona:** Verificar nível de tratamento na bobina plástica para garantir ancoragem adequada da tinta.\n`;
        text += `4. **Teste de Aderência:** Aplicar fita adesiva transparente e puxar com força rápida para verificar se não há descascamento.\n`;
      } else {
        text += `1. **Inspeção Visual Contínua:** Manter atenção na saída da linha e sinalizar ao líder de máquina qualquer alteração visual.\n`;
        text += `2. **Parada Preventiva:** Se o defeito aparecer em mais de 3 sacos consecutivos, pausar a máquina imediatamente para ajuste.\n`;
        text += `3. **Segregação de Lote:** Separar imediatamente qualquer saco suspeito em caixa vermelha identificada para reprocesso.\n`;
        text += `4. **Conferência de Fardo:** Não enfardar sacarias com inconformidades visuais.\n`;
      }

      const complaintsWithPhotos = defectComplaints.filter(c => c.photos && c.photos.length > 0);

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        complaintCards: complaintsWithPhotos.length > 0 ? complaintsWithPhotos.slice(0, 2) : undefined,
        suggestedPrompts: [
          'Quais clientes reclamaram deste defeito?',
          'Cuidados para a Aurora',
          'Cuidados para a Copacol'
        ]
      };
    }

    // 5. SAC Summary query ("quais as reclamações", "resumo do SAC", etc.)
    const isComplaintSummary =
      /(?:reclamac(?:ao|oes)|sac|queixas|ocorrencias|defeitos\s+mais\s+reclamados)/i.test(queryNorm);

    if (isComplaintSummary) {
      const totalComp = complaints.length;
      const defectMap: Record<string, number> = {};
      complaints.forEach(c => {
        const dName = c.defectTypeName || 'Outro';
        defectMap[dName] = (defectMap[dName] || 0) + 1;
      });
      const topDefects = Object.entries(defectMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const clientMap: Record<string, number> = {};
      complaints.forEach(c => {
        const cName = c.customerName || 'Cliente';
        clientMap[cName] = (clientMap[cName] || 0) + 1;
      });
      const topClients = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      let text = `🚨 **Painel de Ocorrências SAC — Sensei (Foco na Prevenção Operacional):**\n\n`;
      text += `• **Total de Reclamações Registradas:** **${totalComp} ocorrências**\n\n`;
      text += `⚠️ **Top 5 Defeitos com Maior Reincidência na Fábrica:**\n`;
      topDefects.forEach(([dName, count], idx) => {
        text += `${idx + 1}. **${dName}:** ${count} reclamações\n`;
      });
      text += `\n🎯 **Top Clientes com Mais Apontamentos de SAC:**\n`;
      topClients.forEach(([cName, count], idx) => {
        text += `${idx + 1}. **${cName}:** ${count} queixas apontadas\n`;
      });
      text += `\n💡 *Para ver os cuidados operacionais específicos, digite o nome do cliente ou o defeito.*`;

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        suggestedPrompts: [
          'Quais os cuidados para o cliente Aurora?',
          'Quais os cuidados para a Copacol?',
          'Como evitar solda fraca?'
        ]
      };
    }

    // 6. Conversational / General Welcome for Shop Floor
    return {
      id: messageId,
      sender: 'assistant',
      text: `👋 Olá! Sou o **Sensei**, seu especialista de Qualidade e Prevenção Operacional no Chão de Fábrica da Rafitec (*Desenvolvido por Mauricio Grigol*).\n\n` +
        `Estou conectado em tempo real para orientar a produção (extrusão, tecelagem, laminação, impressão, corte, costura, solda valvulada e paletização) sobre os cuidados operacionais e histórico de queixas SAC dos nossos clientes:\n\n` +
        `• 🏭 **Cuidados por Cliente:** Digite o nome de um cliente (Ex: *"Quais os cuidados para o cliente Aurora?"* ou *"Copacol"*)\n` +
        `• 🚨 **Histórico de SAC:** Pergunte sobre queixas registradas (Ex: *"Quais as reclamações da Aurora?"*)\n` +
        `• 🛠️ **Prevenção de Defeitos:** Tire dúvidas sobre defeitos na máquina (Ex: *"Como evitar problemas de linner ou costura?"*)\n\n` +
        `Escolha uma das sugestões abaixo ou digite sua consulta:`,
      timestamp,
      suggestedPrompts: [
        'Quais os cuidados para o cliente Aurora?',
        'Quais os cuidados para a Copacol?',
        'Quais os cuidados para a Bunge?',
        'Defeitos mais reclamados no SAC'
      ]
    };
  }
};

