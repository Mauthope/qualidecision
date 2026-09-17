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

    // Aceita múltiplos nomes de variável de ambiente para flexibilidade
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Se nenhuma chave do Gemini estiver configurada na Vercel ou .env, processa via motor de regras local
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
Seu objetivo é dar orientações técnicas de alta precisão sobre liberação de lotes com desvios de qualidade (concessões), avaliação de risco de refugo, histórico de reclamações SAC e perfis de tolerância de clientes industriais.

DIRETRIZES:
1. Responda em português brasileiro com tom profissional, técnico, objetivo, empático e resolutivo.
2. Use formatação Markdown limpa (tópicos, negrito, badges com emojis 🟢 Liberação Recomendada, 🟡 Liberação Condicionada, 🔴 Risco Crítico / Bloquear Envio).
3. Seja sempre fundamentado em engenharia de processos e embalagens (ex: desvios estruturais/costura afetam resistência mecânica e estanqueidade; desvios visuais/impressão/vinco são predominantemente estéticos).
4. Se o usuário perguntar se pode enviar um desvio para um cliente, apresente:
   - Veredito claro logo no início.
   - Análise de risco técnico e perfil do cliente.
   - Recomendações e cuidados necessários na expedição/uso.
   - Se o risco for alto ou proibitivo, sugira clientes alternativos disponíveis na base.
5. NO FINAL DA SUA RESPOSTA, forneça exatamente uma linha com 2 a 3 sugestões de perguntas subsequentes no formato:
SUGESTOES: ["Pergunta 1", "Pergunta 2", "Pergunta 3"]`;

    // Grounding Context - Injeção de dados reais da fábrica
    let groundingContext = `[DADOS DO SISTEMA QUALIDECISION]\n`;
    groundingContext += `- Total de Clientes Cadastrados: ${customers.length}\n`;
    groundingContext += `- Total de Defeitos Catalogados: ${defects.length}\n`;
    groundingContext += `- Reclamações SAC registradas: ${complaints.length}\n`;
    groundingContext += `- Envios com Concessão no histórico: ${concessions.length}\n`;

    if (activeCustomer) {
      const custComplaints = complaints.filter(c => c.customerId === activeCustomer!.id);
      groundingContext += `\n[CLIENTE EM CONTEXTO]: ${activeCustomer.name} (${activeCustomer.code})\n`;
      groundingContext += `- Segmento: ${activeCustomer.segment}\n`;
      groundingContext += `- Score de Tolerância Geral: ${activeCustomer.overallToleranceScore}/100\n`;
      groundingContext += `- Histórico de Reclamações SAC deste cliente: ${custComplaints.length}\n`;
    }

    if (activeDefect) {
      groundingContext += `\n[DEFEITO EM CONTEXTO]: ${activeDefect.name} (Categoria: ${activeDefect.category})\n`;
      groundingContext += `- Descrição: ${activeDefect.description}\n`;
      groundingContext += `- Custo Unitário de Refugo: R$ ${activeDefect.defaultUnitLoss.toFixed(2)}\n`;
      if (activeCustomer) {
        const tol = activeCustomer.toleranceRatings[activeDefect.id]?.level || 'moderada';
        groundingContext += `- Tolerância do cliente para este defeito: ${tol.toUpperCase()}\n`;
      }
    }

    if (calculatedRisk) {
      groundingContext += `\n[CÁLCULO TÉCNICO DE RISCO]:\n`;
      groundingContext += `- Nível de Risco: ${calculatedRisk.riskLevel.toUpperCase()} (Score: ${calculatedRisk.score}/100)\n`;
      groundingContext += `- Veredito do Algoritmo: ${calculatedRisk.title}\n`;
      groundingContext += `- Reclamações SAC anteriores para este defeito/cliente: ${calculatedRisk.historicalComplaintsCount}\n`;
      groundingContext += `- Concessões anteriores com sucesso: ${calculatedRisk.historicalConcessionsCount}\n`;
      if (alternativeCustomers.length > 0) {
        groundingContext += `- Clientes alternativos recomendados com alta tolerância: ${alternativeCustomers.join(', ')}\n`;
      }
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
        parts: [{ text: geminiContents.length === 0 ? `${groundingContext}\n\nPERGUNTA DO USUÁRIO: ${prompt}` : prompt }]
      });
    }

    // Chamada à API Google Gemini (usando gemini-1.5-flash com fallback)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024
        }
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.warn('Gemini API Warning (falling back to local engine):', geminiRes.status, errorText);

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

    const geminiData = await geminiRes.json();
    let rawReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawReply.trim()) {
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
