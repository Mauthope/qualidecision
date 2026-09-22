import { NextResponse } from 'next/server';
import { aiAssistantService } from '@/services/aiAssistantService';
import { qualityService } from '@/services/qualityService';
import { Customer, DefectType, Complaint, ConcessionShipment, AiChatMessage, RiskEvaluationResult } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, history = [], customers = [], defects = [], complaints = [], concessions = [] } = body as {
      prompt: string;
      history: AiChatMessage[];
      customers: Customer[];
      defects: DefectType[];
      complaints: Complaint[];
      concessions: ConcessionShipment[];
    };

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 });
    }

    // Aceita múltiplos nomes de variável de ambiente ou chave enviada pelo cliente com sanitização
    const rawApiKey =
      (body as any).apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GEMINI_AI_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    const apiKey = rawApiKey ? String(rawApiKey).trim().replace(/^['"]|['"]$/g, '') : '';

    // Se nenhuma chave do Gemini estiver configurada na Vercel ou .env, processa via motor analítico local
    if (!apiKey) {
      const localResponse = aiAssistantService.processQuery(
        prompt,
        history,
        customers,
        defects,
        complaints,
        concessions
      );
      return NextResponse.json({ ...localResponse, source: 'local_engine' });
    }

    // Resolução de contexto e entidades no histórico e mensagem
    const ctx = aiAssistantService.extractContextFromHistory(history, customers, defects);
    let activeCustomer = aiAssistantService.findCustomer(prompt, customers);
    let activeDefect = aiAssistantService.findDefect(prompt, defects);

    if (!activeCustomer && ctx.lastCustomer) activeCustomer = ctx.lastCustomer;
    if (!activeDefect && ctx.lastDefect) activeDefect = ctx.lastDefect;

    const activeQuantity = aiAssistantService.extractQuantity(prompt, ctx.lastQuantity || 5000);
    const activeSeverity = aiAssistantService.extractSeverity(prompt, ctx.lastSeverity || 'moderada');

    let calculatedRisk: RiskEvaluationResult | null = null;
    let alternativeCustomers: string[] = [];

    if (activeCustomer && activeDefect) {
      calculatedRisk = qualityService.evaluateConcessionRisk(
        activeCustomer,
        activeDefect,
        activeQuantity,
        activeSeverity,
        complaints,
        concessions
      );

      // Se o risco for alto ou crítico, busca clientes com alta tolerância para o defeito
      if (calculatedRisk.riskLevel === 'alto' || calculatedRisk.riskLevel === 'critico') {
        alternativeCustomers = customers
          .filter(c => c.id !== activeCustomer!.id && c.toleranceRatings[activeDefect!.id]?.level === 'alta')
          .slice(0, 3)
          .map(c => `${c.name} (${c.code})`);
      }
    }

    // Diretrizes da persona especializada
    const systemPrompt = `Você é o Diretor/Engenheiro Chefe de Qualidade e Decisão Industrial da Rafitec / Qualidecision.
Sua especialidade é embalagens industriais de polipropileno (sacaria convencional, sacaria valvulada, Big Bags / FIBC, tecidos e fitas).
Seu objetivo é dar orientações técnicas de alta precisão sobre liberação de lotes com desvios de qualidade (concessões), avaliação de risco de refugo, histórico de reclamações SAC, envios realizados por período (2026 ano corrente, 2025 histórico consolidado) e perfis de tolerância de clientes industriais.

DIRETRIZES:
1. Responda em português brasileiro com tom profissional, técnico, objetivo, empático e resolutivo.
2. Use formatação Markdown limpa (tópicos, negrito, tabelas ou listas estruturadas com emojis explicativos).
3. Se perguntado sobre "resumo do que foi enviado este ano" ou períodos, apresente os números de 2026 (ano corrente) e contextualize com 2025 (ano base consolidado), detalhando clientes, volumes e valores de scrap salvos.
4. Se o usuário perguntar se pode enviar um desvio para um cliente, apresente:
   - Veredito claro logo no início (🟢 Liberação Recomendada, 🟡 Liberação Condicionada, 🔴 Não Enviar).
   - Análise de risco técnico e perfil do cliente.
   - Recomendações e cuidados necessários na expedição/uso.
   - Se o risco for alto ou proibitivo, sugira clientes alternativos disponíveis na base.
5. NO FINAL DA SUA RESPOSTA, forneça exatamente uma linha com 2 a 3 sugestões de perguntas subsequentes no formato:
SUGESTOES: ["Pergunta 1", "Pergunta 2", "Pergunta 3"]`;

    // Grounding Context - Injeção de dados reais consolidados da fábrica
    const currentYear = new Date().getFullYear();
    const conc2026 = concessions.filter(c => c.date?.startsWith('2026'));
    const conc2025 = concessions.filter(c => c.date?.startsWith('2025'));
    const comp2025 = complaints.filter(c => c.date?.startsWith('2025'));
    const comp2024 = complaints.filter(c => c.date?.startsWith('2024'));

    let groundingContext = `[DADOS OFICIAIS DO SISTEMA QUALIDECISION / ERP]\n`;
    groundingContext += `- Data Atual do Sistema: ${new Date().toISOString().split('T')[0]} (Ano corrente: ${currentYear})\n`;
    groundingContext += `- Total de Clientes Cadastrados: ${customers.length}\n`;
    groundingContext += `- Total de Defeitos Catalogados: ${defects.length}\n\n`;

    groundingContext += `[HISTÓRICO DE ENVIOS COM CONCESSÃO]:\n`;
    groundingContext += `- Total Geral Acumulado: ${concessions.length} concessões (${concessions.reduce((acc, c) => acc + (c.quantity || 0), 0).toLocaleString('pt-BR')} unidades, R$ ${concessions.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0).toFixed(2)} salvos)\n`;
    groundingContext += `- Ano Atual (2026): ${conc2026.length} concessões, ${conc2026.reduce((acc, c) => acc + (c.quantity || 0), 0).toLocaleString('pt-BR')} unidades, R$ ${conc2026.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0).toFixed(2)} economizados.\n`;
    if (conc2026.length > 0) {
      groundingContext += `  Envios detalhados de 2026:\n`;
      conc2026.forEach(c => {
        groundingContext += `  • [${c.code}] ${c.date} | Cliente: ${c.customerName} | Desvio: ${c.defectTypeName} (${c.severity}) | Qtd: ${c.quantity} un | Fardos: ${c.bales?.join(', ') || c.lotNumber || 'N/A'} | Scrap Salvo: R$ ${c.totalSavedValue.toFixed(2)} | Status: ${c.customerFeedbackStatus}\n`;
      });
    }
    groundingContext += `- Ano Base Consolidado (2025): ${conc2025.length} concessões, ${conc2025.reduce((acc, c) => acc + (c.quantity || 0), 0).toLocaleString('pt-BR')} unidades, R$ ${conc2025.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0).toFixed(2)} economizados.\n`;
    groundingContext += `  Top Clientes 2025: Copacol (12 envios), Bunge (9 envios), Aurora (8 envios), Alisul (7 envios).\n`;
    groundingContext += `  Top Desvios 2025: Vinco (28 lotes), Borrão de impressão (24 lotes), Tonalidade (18 lotes).\n\n`;

    groundingContext += `[HISTÓRICO DE RECLAMAÇÕES SAC]:\n`;
    groundingContext += `- Total Geral de Queixas: ${complaints.length} reclamações (${complaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0).toLocaleString('pt-BR')} kg afetados)\n`;
    groundingContext += `- Ocorrências em 2025: ${comp2025.length} queixas\n`;
    groundingContext += `- Ocorrências em 2024: ${comp2024.length} queixas\n`;
    groundingContext += `- Severidade Geral: ${complaints.filter(c => c.severity === 'leve').length} Leves, ${complaints.filter(c => c.severity === 'moderada').length} Moderadas, ${complaints.filter(c => c.severity === 'severa').length} Severas (críticas)\n`;
    groundingContext += `- Top Defeitos Reclamados: Refilada (13), Falhas de impressão (11), Solda fraca (10), Raspado (9), Falta de embalagem (6)\n`;
    groundingContext += `- Top Clientes Reclamantes: Alisul (8), Copacol (7), Bunge (6), Aurora (6), JBS (5)\n\n`;

    if (activeCustomer) {
      const custComplaints = complaints.filter(c => c.customerId === activeCustomer!.id);
      const custConcessions = concessions.filter(c => c.customerId === activeCustomer!.id);
      groundingContext += `[CLIENTE EM CONTEXTO]: ${activeCustomer.name} (${activeCustomer.code})\n`;
      groundingContext += `- Segmento: ${activeCustomer.segment || 'Geral'}\n`;
      groundingContext += `- Score de Tolerância Geral: ${activeCustomer.overallToleranceScore}/100\n`;
      groundingContext += `- Concessões já recebidas por este cliente: ${custConcessions.length} lotes (${custConcessions.reduce((acc, c) => acc + (c.quantity || 0), 0).toLocaleString('pt-BR')} un)\n`;
      groundingContext += `- Reclamações SAC deste cliente: ${custComplaints.length} queixas\n\n`;
    }

    if (activeDefect) {
      groundingContext += `[DEFEITO EM CONTEXTO]: ${activeDefect.name} (Categoria: ${activeDefect.category})\n`;
      groundingContext += `- Descrição: ${activeDefect.description}\n`;
      groundingContext += `- Custo Unitário de Refugo: R$ ${activeDefect.defaultUnitLoss.toFixed(2)}\n`;
      if (activeCustomer) {
        const tol = activeCustomer.toleranceRatings[activeDefect.id]?.level || 'moderada';
        groundingContext += `- Tolerância do cliente para este defeito: ${tol.toUpperCase()}\n`;
      }
      groundingContext += '\n';
    }

    if (calculatedRisk) {
      groundingContext += `[CÁLCULO TÉCNICO DE RISCO]:\n`;
      groundingContext += `- Nível de Risco: ${calculatedRisk.riskLevel.toUpperCase()} (Score: ${calculatedRisk.score}/100)\n`;
      groundingContext += `- Veredito do Algoritmo: ${calculatedRisk.title}\n`;
      groundingContext += `- Reclamações SAC anteriores para este defeito/cliente: ${calculatedRisk.historicalComplaintsCount}\n`;
      groundingContext += `- Concessões anteriores com sucesso: ${calculatedRisk.historicalConcessionsCount}\n`;
      if (alternativeCustomers.length > 0) {
        groundingContext += `- Clientes alternativos recomendados com alta tolerância: ${alternativeCustomers.join(', ')}\n`;
      }
      groundingContext += '\n';
    }

    // Montagem das mensagens alternadas exigidas pela API do Gemini
    const geminiContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    const recentHistory = history.filter(m => m.text && m.text.trim().length > 0).slice(-6);

    for (const msg of recentHistory) {
      if (msg.sender === 'user') {
        const text = geminiContents.length === 0 ? `${groundingContext}\n\nPERGUNTA DO USUÁRIO: ${msg.text}` : msg.text;
        geminiContents.push({
          role: 'user',
          parts: [{ text }]
        });
      } else if (msg.sender === 'assistant') {
        if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'user') {
          geminiContents.push({
            role: 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
    }

    // Garante que o último item seja o prompt atual do usuário
    if (geminiContents.length === 0 || geminiContents[geminiContents.length - 1].role !== 'user') {
      geminiContents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });
    }

    const fullSystemInstruction = `${systemPrompt}\n\n${groundingContext}`;

    // Tenta modelos disponíveis do Gemini com fallback automático
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
    let rawReply = '';

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: fullSystemInstruction }]
            },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1024
            }
          }),
          signal: AbortSignal.timeout(12000)
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          rawReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawReply.trim()) {
            break;
          }
        } else {
          const errorText = await geminiRes.text();
          console.warn(`Gemini (${model}) API Warning: ${geminiRes.status}`, errorText);
        }
      } catch (err) {
        console.warn(`Gemini (${model}) connection error:`, err);
      }
    }

    if (!rawReply.trim()) {
      console.warn('Gemini não retornou texto ou falhou em todos os modelos. Recorrendo ao motor analítico local.');
      const localResponse = aiAssistantService.processQuery(
        prompt,
        history,
        customers,
        defects,
        complaints,
        concessions
      );
      return NextResponse.json({ ...localResponse, source: 'local_engine' });
    }

    // Extrai SUGESTOES se fornecidas pelo Gemini
    let suggestedPrompts: string[] | undefined = undefined;
    const suggestionsMatch = rawReply.match(/SUGESTOES:\s*(\[[^\]]+\])/i);
    if (suggestionsMatch) {
      try {
        suggestedPrompts = JSON.parse(suggestionsMatch[1]);
        rawReply = rawReply.replace(suggestionsMatch[0], '').trim();
      } catch {
        // Ignora erro de parse
      }
    }

    // Sugestões de fallback inteligentes caso o Gemini não tenha retornado a linha
    if (!suggestedPrompts || suggestedPrompts.length === 0) {
      if (activeCustomer && activeDefect) {
        suggestedPrompts = [
          `E se a gravidade for leve?`,
          `Quais clientes alternativos aceitam ${activeDefect.name}?`,
          `Ver histórico de SAC da ${activeCustomer.name}`
        ];
      } else {
        suggestedPrompts = [
          'Posso enviar 10.000 sacos com vinco para a Copacol?',
          'Qual cliente aceita falha de solda?',
          'Quanto de refugo foi evitado este mês?'
        ];
      }
    }

    // Botão de ação direta para abrir concessão pré-preenchida se seguro
    let actionButton = undefined;
    if (activeCustomer && activeDefect && calculatedRisk && (calculatedRisk.riskLevel === 'baixo' || calculatedRisk.riskLevel === 'moderado')) {
      actionButton = {
        label: `Criar Envio com Concessão (${activeCustomer.name})`,
        type: 'open_concession' as const,
        payload: {
          customerId: activeCustomer.id,
          defectTypeId: activeDefect.id,
          quantity: activeQuantity,
          severity: activeSeverity
        }
      };
    }

    const aiMessage: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: rawReply,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      customerCard: activeCustomer,
      riskRecommendation: calculatedRisk || undefined,
      suggestedPrompts,
      actionButton,
      source: 'gemini'
    };

    return NextResponse.json(aiMessage);
  } catch (err) {
    console.error('Erro no processamento da IA:', err);
    try {
      const body = await req.json().catch(() => ({}));
      const localResponse = aiAssistantService.processQuery(
        body.prompt || '',
        body.history || [],
        body.customers || [],
        body.defects || [],
        body.complaints || [],
        body.concessions || []
      );
      return NextResponse.json({ ...localResponse, source: 'local_engine' });
    } catch {
      return NextResponse.json(
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: 'Ocorreu uma instabilidade na consulta. Por favor, tente novamente.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          source: 'local_engine'
        },
        { status: 200 }
      );
    }
  }
}
