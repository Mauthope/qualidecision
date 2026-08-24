import { Customer, DefectType, Complaint, ConcessionShipment, AiChatMessage, RiskEvaluationResult } from '@/types';
import { qualityService } from './qualityService';

export const aiAssistantService = {
  processQuery(
    prompt: string,
    customers: Customer[],
    defects: DefectType[],
    complaints: Complaint[],
    concessions: ConcessionShipment[]
  ): AiChatMessage {
    const query = prompt.toLowerCase().trim();
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Detect mentioned Customer
    const matchedCustomer = customers.find(c => {
      const nameParts = c.name.toLowerCase().split(' ');
      const codeMatch = query.includes(c.code.toLowerCase());
      const nameMatch = nameParts.some(p => p.length > 3 && query.includes(p));
      return codeMatch || nameMatch;
    });

    // 2. Detect mentioned Defect
    const matchedDefect = defects.find(d => {
      const defectKeywords = d.name.toLowerCase().split(/[\s/]+/);
      return defectKeywords.some(kw => kw.length > 3 && query.includes(kw));
    });

    // 3. Question Type: Decision / "Posso enviar...?" / "Podemos mandar...?"
    const isDecisionQuery = /posso\s+(enviar|mandar|liberar)|podemos\s+(enviar|mandar|liberar)|liberação|liberar|risco|devo\s+enviar/i.test(query);

    // 4. Question Type: Complaints / "Quais foram as reclamações...?" / "histórico de reclamações"
    const isComplaintQuery = /reclamaç|reclamac|queixa|devolu|defeito|problema|nao conformidade|não conformidade/i.test(query);

    // 5. Question Type: Indicators / Profitability / "quantos sacos..." / "lucro" / "indicador"
    const isIndicatorQuery = /lucro|lucratividade|indicador|total|quantos|volume|scrap|refugo|econom/i.test(query);

    // SCENARIO A: Decision simulation for a customer and defect
    if (isDecisionQuery && matchedCustomer && matchedDefect) {
      // Extract quantity if any
      const qtyMatch = query.match(/\d+[\d.]*/);
      const qty = qtyMatch ? parseInt(qtyMatch[0].replace(/\./g, '')) : 5000;
      const severity = query.includes('sever') ? 'severa' : query.includes('moderad') ? 'moderada' : 'leve';

      const riskResult: RiskEvaluationResult = qualityService.evaluateConcessionRisk(
        matchedCustomer,
        matchedDefect,
        qty,
        severity,
        complaints,
        concessions
      );

      const customerComplaints = complaints.filter(c => c.customerId === matchedCustomer.id && c.defectTypeId === matchedDefect.id);

      let text = `Analisei o perfil e histórico de **${matchedCustomer.name}** para o desvio **${matchedDefect.name}** (${qty.toLocaleString('pt-BR')} unidades, severidade ${severity.toUpperCase()}).\n\n`;

      if (riskResult.riskLevel === 'baixo') {
        text += `✅ **Parecer da IA: LIBERAÇÃO AUTORIZADA (Baixo Risco)**\n` +
          `• **Perfil do Cliente:** Tolerância ALTA cadastrada para este tipo de desvio.\n` +
          `• **Histórico:** O cliente já recebeu concessões similares sem registrar queixas.\n` +
          `• **Recomendação:** Pode expedir o lote normalmente. Custo evitado estimado de R$ ${(qty * matchedDefect.defaultUnitLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      } else if (riskResult.riskLevel === 'moderado') {
        text += `⚠️ **Parecer da IA: LIBERAÇÃO CONDICIONADA (Risco Moderado)**\n` +
          `• **Perfil do Cliente:** Tolerância MODERADA.\n` +
          `• **Recomendação:** A liberação é viável se o defeito for apenas superficial/leve. Notifique a equipe de atendimento para monitoramento pós-entrega.`;
      } else {
        text += `⛔ **Parecer da IA: NÃO RECOMENDADO O ENVIO (Risco ${riskResult.riskLevel.toUpperCase()})**\n` +
          `• **Alerta Crítico:** ${matchedCustomer.name} possui perfil rígido/intolerante para este defeito (${customerComplaints.length} reclamações anteriores registradas).\n` +
          `• **Risco:** Grande probabilidade de devolução de lote e custo de frete reverso.\n` +
          `• **Sugestão:** Direcionar este lote para clientes como **Yara Fertilizantes** ou **Bunge Brasil** que possuem alta tolerância para este tipo de não-conformidade.`;
      }

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: matchedCustomer,
        complaintCards: customerComplaints,
        riskRecommendation: riskResult
      };
    }

    // SCENARIO B: Complaints query for a specific customer (e.g., "quais foram as reclamações do cliente Alisul?")
    if (matchedCustomer && (isComplaintQuery || query.includes(matchedCustomer.name.toLowerCase().slice(0, 5)) || !matchedDefect)) {
      const clientComplaints = complaints.filter(c => c.customerId === matchedCustomer.id);
      const clientConcessions = concessions.filter(c => c.customerId === matchedCustomer.id);

      if (clientComplaints.length === 0) {
        return {
          id: messageId,
          sender: 'assistant',
          text: `Varri a base de dados de qualidade e **não encontrei nenhuma reclamação registrada** para o cliente **${matchedCustomer.name}** (${matchedCustomer.code}).\n\n` +
            `• **Score de Tolerância Geral:** ${matchedCustomer.overallToleranceScore}/100 (Cliente flexível)\n` +
            `• **Concessões já enviadas e aceitas:** ${clientConcessions.length} lotes expedidos sem queixas.`,
          timestamp,
          customerCard: matchedCustomer,
          concessionCards: clientConcessions
        };
      }

      const totalPhotos = clientComplaints.reduce((acc, c) => acc + (c.photos?.length || 0), 0);

      let text = `Encontrei **${clientComplaints.length} reclamações** registradas no banco de dados para **${matchedCustomer.name}** (com ${totalPhotos} fotos e laudos anexados):\n\n`;

      clientComplaints.forEach((c, idx) => {
        text += `**${idx + 1}. [${c.code}] Lote ${c.lotNumber}** (${new Date(c.date).toLocaleDateString('pt-BR')}):\n` +
          `• **Defeito:** ${c.defectTypeName} (Gravidade: *${c.severity.toUpperCase()}*)\n` +
          `• **Descrição do Cliente:** "${c.description}"\n` +
          `• **Causa Raiz & Ação:** ${c.rootCause || 'Em investigação'} | *${c.status.replace('_', ' ').toUpperCase()}*\n\n`;
      });

      text += `💡 **Perfil de Tolerância Resumido:**\n` +
        `O cliente tolera bem **Vincos e Pequenas Variações Dimensionais**, porém é **muito rigoroso com Falhas de Costura e Borrões de Impressão**. Veja os cards e fotos abaixo:`;

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        customerCard: matchedCustomer,
        complaintCards: clientComplaints
      };
    }

    // SCENARIO C: Indicators & Profitability query
    if (isIndicatorQuery || query.includes('vinco') || query.includes('borr') || query.includes('indicad')) {
      const stats = qualityService.calculateStats(customers, defects, complaints, concessions);

      let text = `📊 **Resumo de Indicadores de Qualidade & Lucratividade:**\n\n` +
        `• **Total de Sacarias/Bags Salvos no Período:** **${stats.totalUnitsSaved.toLocaleString('pt-BR')} unidades**\n` +
        `• **Lucro Preservado / Refugo Evitado (Scrap Avoided):** **R$ ${stats.totalSavedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
        `• **Taxa de Aceitação de Concessões:** **${stats.acceptanceRate.toFixed(1)}%**\n` +
        `• **Reclamações Ativas em Análise:** **${stats.activeComplaintsCount}**\n\n` +
        `**Detalhamento de Volumes Enviados por Defeito:**\n`;

      Object.values(stats.defectsVolumeMonth).forEach(d => {
        if (d.quantity > 0) {
          text += `• **${d.name}:** ${d.quantity.toLocaleString('pt-BR')} unidades (R$ ${d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} salvos)\n`;
        }
      });

      return {
        id: messageId,
        sender: 'assistant',
        text,
        timestamp,
        concessionCards: concessions.slice(0, 3)
      };
    }

    // SCENARIO D: General helpful query
    return {
      id: messageId,
      sender: 'assistant',
      text: `Olá! Sou a **IA de Inteligência de Qualidade & Decisão**. Posso te ajudar com:\n\n` +
        `1. **Consultar Reclamações de Clientes:** Ex: *"Quais foram as reclamações do cliente Alisul?"* ou *"Histórico da Copacol"*\n` +
        `2. **Simular Decisão de Envio:** Ex: *"Posso enviar 10.000 sacos com vinco para a Alisul?"* ou *"Risco de enviar borrão para o JBS"*\n` +
        `3. **Indicadores de Lucratividade:** Ex: *"Quantos sacos com defeito enviamos este mês?"* ou *"Qual o valor de scrap evitado?"*\n` +
        `4. **Ver Fotos e Laudos:** A IA busca automaticamente todas as fotos anexadas às reclamações e concessões.`,
      timestamp
    };
  }
};
