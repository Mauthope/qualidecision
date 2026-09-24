import { NextResponse } from 'next/server';
import { aiAssistantService } from '@/services/aiAssistantService';
import { qualityService } from '@/services/qualityService';
import { Customer, DefectType, Complaint, ConcessionShipment, AiChatMessage, RiskEvaluationResult } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const modelCache = new Map<string, { targets: { version: string; model: string }[]; expires: number }>();

async function getAvailableGeminiModels(apiKey: string): Promise<{ version: string; model: string }[]> {
  const cached = modelCache.get(apiKey);
  if (cached && Date.now() < cached.expires) {
    return cached.targets;
  }

  const versions = ['v1beta', 'v1'];
  for (const ver of versions) {
    try {
      const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        const validModels = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''));

        if (validModels.length > 0) {
          // Ordena por preferência de modelos rápidos e modernos
          const preferences = [
            'gemini-1.5-flash-latest',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-002',
            'gemini-1.5-flash-001',
            'gemini-2.5-flash',
            'gemini-1.5-pro-latest',
            'gemini-1.5-pro',
            'gemini-pro'
          ];
          const sorted = [...validModels].sort((a, b) => {
            const idxA = preferences.findIndex(p => a === p || a.includes(p));
            const idxB = preferences.findIndex(p => b === p || b.includes(p));
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });
          const targets = sorted.map(m => ({ version: ver, model: m }));
          modelCache.set(apiKey, { targets, expires: Date.now() + 10 * 60 * 1000 });
          return targets;
        }
      }
    } catch (err) {
      console.warn(`ListModels error on ${ver}:`, err);
    }
  }

  // Fallback padrão se ListModels não responder ou for bloqueado
  const fallback = [
    { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
    { version: 'v1beta', model: 'gemini-2.0-flash' },
    { version: 'v1', model: 'gemini-1.5-flash' },
    { version: 'v1beta', model: 'gemini-1.5-flash-002' },
    { version: 'v1beta', model: 'gemini-1.5-flash-001' },
    { version: 'v1beta', model: 'gemini-1.5-flash' },
    { version: 'v1beta', model: 'gemini-1.5-pro-latest' },
    { version: 'v1', model: 'gemini-pro' },
    { version: 'v1beta', model: 'gemini-pro' }
  ];
  modelCache.set(apiKey, { targets: fallback, expires: Date.now() + 60 * 1000 });
  return fallback;
}

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

    // 1. Resolução profunda da chave da API do Gemini (Cliente ou Servidor Vercel)
    let rawApiKey = (body as any).apiKey ? String((body as any).apiKey) : '';

    if (!rawApiKey) {
      const standardKeys = [
        process.env.GEMINI_API_KEY,
        process.env.GOOGLE_API_KEY,
        process.env.GOOGLE_GEMINI_API_KEY,
        process.env.GEMINI_KEY,
        process.env.GOOGLE_AI_KEY,
        process.env.GEMINI_AI_KEY,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      ];
      for (const k of standardKeys) {
        if (k && typeof k === 'string' && k.trim().length > 5) {
          rawApiKey = k;
          break;
        }
      }

      // Se ainda não achou, varre dinamicamente process.env por qualquer chave que mencione gemini ou google
      if (!rawApiKey) {
        for (const [k, v] of Object.entries(process.env)) {
          if (/gemini|google.*ai|ai.*key/i.test(k) && v && typeof v === 'string' && v.trim().length > 10) {
            rawApiKey = v;
            break;
          }
        }
      }
    }

    const apiKey = rawApiKey ? String(rawApiKey).trim().replace(/^['"]|['"]$/g, '') : '';

    // AÇÃO DE DIAGNÓSTICO E TESTE DE CONEXÃO
    if ((body as any).action === 'test_connection') {
      if (!apiKey) {
        return NextResponse.json({
          ok: false,
          error: 'Nenhuma chave de API encontrada. Cole sua chave no campo acima ou cadastre a variável GEMINI_API_KEY no painel da Vercel.',
          keyFound: false
        });
      }

      try {
        const availableTargets = await getAvailableGeminiModels(apiKey);
        let lastErrText = '';
        let lastStatus = 400;

        for (const target of availableTargets) {
          try {
            const testUrl = `https://generativelanguage.googleapis.com/${target.version}/models/${target.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const testRes = await fetch(testUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
              },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Teste de conexão. Responda apenas "Conexão OK".' }] }]
              }),
              signal: AbortSignal.timeout(8000)
            });

            if (testRes.ok) {
              const testData = await testRes.json();
              const reply = testData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Conexão OK';
              return NextResponse.json({
                ok: true,
                status: 200,
                reply,
                model: target.model,
                version: target.version,
                discoveredModels: availableTargets.map(t => `${t.model} (${t.version})`).slice(0, 6),
                keyPrefix: apiKey.slice(0, 6) + '...' + apiKey.slice(-4),
                source: (body as any).apiKey ? 'Chave salva no navegador' : 'Variável de ambiente da Vercel'
              });
            } else {
              lastStatus = testRes.status;
              const errText = await testRes.text();
              let parsedMessage = errText;
              try {
                const parsed = JSON.parse(errText);
                parsedMessage = parsed.error?.message || errText;
              } catch {}
              lastErrText = `(${target.version}/${target.model}) ${parsedMessage}`;
            }
          } catch (err: any) {
            lastErrText = `(${target.version}/${target.model}) ${err.message || String(err)}`;
          }
        }

        return NextResponse.json({
          ok: false,
          status: lastStatus,
          error: lastErrText || 'Nenhum dos modelos disponíveis respondeu ao teste.',
          keyPrefix: apiKey.slice(0, 6) + '...' + apiKey.slice(-4),
          source: (body as any).apiKey ? 'Chave salva no navegador' : 'Variável de ambiente da Vercel'
        });
      } catch (err: any) {
        return NextResponse.json({
          ok: false,
          error: err.message || 'Falha de rede ao contatar a API do Google Gemini'
        });
      }
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 });
    }

    const isShopFloor = (body as any).mode === 'chao_de_fabrica';

    // Se nenhuma chave do Gemini estiver configurada na Vercel ou .env, processa via motor analítico local
    if (!apiKey) {
      if (isShopFloor) {
        const localResponse = aiAssistantService.processShopFloorQuery(
          prompt,
          history,
          customers,
          defects,
          complaints,
          concessions
        );
        return NextResponse.json({ ...localResponse, source: 'local_engine' });
      }
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

    // Cálculo de risco é feito apenas no modo padrão ERP corporativo, nunca no chão de fábrica
    if (!isShopFloor && activeCustomer && activeDefect) {
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
    const systemPrompt = isShopFloor
      ? `Você é o Sensei, o Assistente Especialista de Qualidade e Prevenção Operacional do Chão de Fábrica da Rafitec / Qualidecision (Desenvolvido por Mauricio Grigol).
Seu público-alvo são os operadores de máquinas, revisores, líderes de turno e inspetores de qualidade no chão de fábrica.

FILOSOFIA OBRIGATÓRIA: ENGENHARIA VISUAL DIRETA AO PONTO (BATER O OLHO E ACHAR A RESPOSTA).
Operadores no chão de fábrica NÃO têm tempo para ler textos longos ou parágrafos complexos. Seja cirúrgico, estruturado, visual e focado na máquina.

REGRAS ESTRITAS DE INTEGRIDADE (ZERO ALUCINAÇÃO):
1. PROIBIDO INVENTAR: Utilize APENAS e EXCLUSIVAMENTE os dados reais presentes no [CLIENTE EM CONTEXTO DETALHADO] ou no histórico oficial do ERP.
2. Se o cliente possui reclamações listadas nos dados, mencione APENAS aquelas ocorrências reais (com o código REC, OP e laudo reais).
3. Se o cliente NÃO possui reclamações listadas nos dados (0 queixas), NUNCA invente nada! Diga claramente: "✅ ZERO RECLAMAÇÕES NO SAC: Este cliente não possui histórico de não-conformidades registradas no sistema."
4. EVIDÊNCIAS FOTOGRÁFICAS: Sempre informe se as fotos reais de evidência estão disponíveis e anexadas nos cards abaixo da mensagem para conferência imediata na bancada.
5. PROIBIDO APROVAR CONCESSÕES PELO CHÃO DE FÁBRICA: Deixe claro que qualquer desvio deve ser sempre mostrado e avaliado pelo líder de turno e inspeção da qualidade antes de prosseguir.

ESTRUTURA VISUAL OBRIGATÓRIA DA RESPOSTA (UTILIZE EXATAMENTE ESTES BLOCOS VISUAIS CURTOS):

🏭 **CLIENTE:** [Nome do Cliente] • Cód: **[Código ERP]** | ⚠️ **RANKING [A / B / C]** (Tolerância: **[X]/100**)

🚨 **HISTÓRICO REAL DE RECLAMAÇÕES SAC:**
(Se houver queixas reais nos dados):
• ❌ **[REC-XXXX]** OP: \`[OP]\` | 📅 [DATA]
  ↳ **Defeito:** [Defeito] ([Qtd] kg) • *"[Laudo real do ERP]"*
(Se NÃO houver queixas):
• ✅ **ZERO RECLAMAÇÕES NO SAC:** Nenhuma ocorrência registrada no ERP para este cliente.

🛡️ **VISLUMBRE DE TOLERÂNCIA (O QUE ELE ACEITA):**
• 💡 **Flexibilidade Comprovada:** [Desvios aceitos com base nas concessões ou tolerância real, sem tabelas nem R$].
• ⚠️ **Regra Operacional:** Qualquer desvio fora do padrão deve ser mostrado ao **líder de turno e à inspeção de qualidade** antes de liberar.

📋 **CUIDADOS NA MÁQUINA (BATER O OLHO):**
• 🛑 **Atenção Crítica:** [Ação preventiva direta na máquina focada em evitar que o defeito real se repita]
• 🔍 **Inspeção na Linha:** [Frequência e ponto exato de checagem do operador]
• 📦 **Enfardamento:** [Cuidado com amarração e identificação da OP]

📷 **EVIDÊNCIAS FOTOGRÁFICAS:**
Fotos reais de inspeção/SAC disponíveis nos cards abaixo (toque para ampliar em tela cheia na bancada).

SUGESTOES: ["Pergunta 1", "Pergunta 2", "Pergunta 3"]`
      : `Você é o Sensei, o Diretor/Engenheiro Chefe de Qualidade e Decisão Industrial da Rafitec / Qualidecision.
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

    let groundingContext = '';

    if (isShopFloor) {
      groundingContext = `[DADOS OFICIAIS DO SISTEMA QUALIDECISION / ERP - MODO CHÃO DE FÁBRICA]\n`;
      groundingContext += `- Data Atual: ${new Date().toISOString().split('T')[0]}\n`;
      groundingContext += `- Total de Clientes Cadastrados: ${customers.length}\n`;
      groundingContext += `- Total de Defeitos Catalogados: ${defects.length}\n\n`;

      groundingContext += `[HISTÓRICO CONSOLIDADO DE RECLAMAÇÕES SAC]:\n`;
      groundingContext += `- Total Geral de Queixas SAC: ${complaints.length} reclamações (${complaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0).toLocaleString('pt-BR')} kg afetados)\n`;
      groundingContext += `- Ocorrências em 2025: ${comp2025.length} queixas\n`;
      groundingContext += `- Ocorrências em 2024: ${comp2024.length} queixas\n`;
      groundingContext += `- Severidade Geral: ${complaints.filter(c => c.severity === 'leve').length} Leves, ${complaints.filter(c => c.severity === 'moderada').length} Moderadas, ${complaints.filter(c => c.severity === 'severa').length} Severas (críticas)\n\n`;

      if (activeCustomer) {
        const custComplaints = complaints.filter(c => c.customerId === activeCustomer!.id || (c.customerName && activeCustomer && c.customerName.toLowerCase().includes(activeCustomer.name.toLowerCase())));
        const custConcessions = concessions.filter(c => c.customerId === activeCustomer!.id || (c.customerName && activeCustomer && c.customerName.toLowerCase().includes(activeCustomer.name.toLowerCase())));
        const acceptedDefectNames = Array.from(new Set(custConcessions.map(c => c.defectTypeName).filter(Boolean)));

        groundingContext += `[CLIENTE EM CONTEXTO DETALHADO]: ${activeCustomer.name} (Código ERP: ${activeCustomer.code || 'N/A'})\n`;
        groundingContext += `- Segmento: ${activeCustomer.segment || 'Geral'}\n`;
        groundingContext += `- Nível de Exigência / Score: ${activeCustomer.overallToleranceScore}/100\n`;
        groundingContext += `- Total de Queixas SAC deste cliente: ${custComplaints.length} reclamações registradas no ERP\n`;
        if (custComplaints.length > 0) {
          groundingContext += `  Detalhamento de cada reclamação SAC registrada para este cliente:\n`;
          custComplaints.forEach((c, idx) => {
            groundingContext += `  • [${c.code}] Data: ${c.date} | Defeito: ${c.defectTypeName} (Severidade: ${c.severity}) | OP: ${c.opNumber || (c as any).op_number || c.lotNumber || 'N/D'} | Afetado: ${c.quantityAffected} kg | Laudo ERP: ${c.description || 'N/A'} | Causa: ${c.rootCause || 'N/A'} | Ação: ${c.correctiveAction || 'N/A'} | Fotos anexadas: ${c.photos?.length || 0}\n`;
          });
        }
        groundingContext += `- Concessões Históricas (Envios sob Concessão Recebidos): ${custConcessions.length} lotes. Desvios aceitos no histórico: ${acceptedDefectNames.length > 0 ? acceptedDefectNames.join(', ') : 'Nenhum desvio específico aceito sob concessão'}.\n`;
        groundingContext += `  (Atenção: NÃO traga dados como tabelas ou valores em R$, traga apenas um vislumbre e orientação operacional, ex: "o cliente aceita um leve desvio de ${acceptedDefectNames.join(', ') || 'pequenas variações'}, mas mostre ao líder e à inspeção da qualidade qualquer desvio para que eles avaliem").\n\n`;
      }

      if (activeDefect) {
        const defComplaints = complaints.filter(c => c.defectTypeId === activeDefect!.id || c.defectTypeName === activeDefect!.name);
        groundingContext += `[DEFEITO EM CONTEXTO]: ${activeDefect.name} (Categoria: ${activeDefect.category})\n`;
        groundingContext += `- Descrição: ${activeDefect.description}\n`;
        groundingContext += `- Total de queixas SAC com este defeito: ${defComplaints.length}\n`;
        if (defComplaints.length > 0) {
          groundingContext += `- Clientes que reclamaram: ${Array.from(new Set(defComplaints.map(c => c.customerName))).join(', ')}\n`;
        }
        groundingContext += `\n`;
      }
    } else {
      groundingContext = `[DADOS OFICIAIS DO SISTEMA QUALIDECISION / ERP]\n`;
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
      // Agrupamento dinâmico real dos top clientes reclamantes e top defeitos
      const compByCust: Record<string, number> = {};
      const compByDefect: Record<string, number> = {};
      complaints.forEach(c => {
        if (c.customerName) compByCust[c.customerName] = (compByCust[c.customerName] || 0) + 1;
        if (c.defectTypeName) compByDefect[c.defectTypeName] = (compByDefect[c.defectTypeName] || 0) + 1;
      });
      const topCustList = Object.entries(compByCust).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, q]) => `${n} (${q})`).join(', ');
      const topDefList = Object.entries(compByDefect).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, q]) => `${n} (${q})`).join(', ');

      const concByCust: Record<string, number> = {};
      const concByDefect: Record<string, number> = {};
      concessions.forEach(c => {
        if (c.customerName) concByCust[c.customerName] = (concByCust[c.customerName] || 0) + 1;
        if (c.defectTypeName) concByDefect[c.defectTypeName] = (concByDefect[c.defectTypeName] || 0) + 1;
      });
      const topConcCustList = Object.entries(concByCust).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, q]) => `${n} (${q})`).join(', ');
      const topConcDefList = Object.entries(concByDefect).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, q]) => `${n} (${q})`).join(', ');

      groundingContext += `- Ano Base Consolidado (2025): ${conc2025.length} concessões, ${conc2025.reduce((acc, c) => acc + (c.quantity || 0), 0).toLocaleString('pt-BR')} unidades, R$ ${conc2025.reduce((acc, c) => acc + (c.totalSavedValue || 0), 0).toFixed(2)} economizados.\n`;
      if (topConcCustList) groundingContext += `  Top Clientes com Concessões: ${topConcCustList}.\n`;
      if (topConcDefList) groundingContext += `  Top Desvios Liberados: ${topConcDefList}.\n\n`;

      groundingContext += `[HISTÓRICO DE RECLAMAÇÕES SAC]:\n`;
      groundingContext += `- Total Geral de Queixas: ${complaints.length} reclamações (${complaints.reduce((acc, c) => acc + (c.quantityAffected || 0), 0).toLocaleString('pt-BR')} kg afetados)\n`;
      groundingContext += `- Ocorrências em 2025: ${comp2025.length} queixas\n`;
      groundingContext += `- Ocorrências em 2024: ${comp2024.length} queixas\n`;
      groundingContext += `- Severidade Geral: ${complaints.filter(c => c.severity === 'leve').length} Leves, ${complaints.filter(c => c.severity === 'moderada').length} Moderadas, ${complaints.filter(c => c.severity === 'severa').length} Severas (críticas)\n`;
      if (topDefList) groundingContext += `- Top Defeitos Reclamados: ${topDefList}\n`;
      if (topCustList) groundingContext += `- Top Clientes Reclamantes: ${topCustList}\n\n`;

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
    }

    // Montagem das mensagens alternadas estritamente válidas para a API do Gemini
    const cleanTurns: Array<{ role: 'user' | 'model'; text: string }> = [];

    const previousMessages = (history || [])
      .filter(m => m.text && m.text.trim().length > 0)
      .slice(-4);

    for (const msg of previousMessages) {
      if (msg.sender === 'user' && msg.text.trim() === prompt.trim()) {
        continue;
      }
      const role: 'user' | 'model' = msg.sender === 'assistant' ? 'model' : 'user';
      if (cleanTurns.length === 0 && role !== 'user') {
        continue;
      }
      if (cleanTurns.length > 0 && cleanTurns[cleanTurns.length - 1].role === role) {
        cleanTurns[cleanTurns.length - 1].text += `\n${msg.text.trim().slice(0, 1000)}`;
      } else {
        cleanTurns.push({ role, text: msg.text.trim().slice(0, 1000) });
      }
    }

    if (cleanTurns.length > 0 && cleanTurns[cleanTurns.length - 1].role === 'user') {
      cleanTurns[cleanTurns.length - 1].text = prompt.trim();
    } else {
      cleanTurns.push({ role: 'user', text: prompt.trim() });
    }

    const geminiContents = cleanTurns.map(t => ({
      role: t.role,
      parts: [{ text: t.text }]
    }));

    const fullSystemInstruction = `${systemPrompt}\n\n${groundingContext}`;

    // Tenta modelos disponíveis do Gemini com resolução dinâmica e fallback automático
    const availableTargets = await getAvailableGeminiModels(apiKey);
    let rawReply = '';
    let lastGeminiErrorDetails = '';

    for (const target of availableTargets.slice(0, 4)) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/${target.version}/models/${target.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const contentsCopy: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = JSON.parse(JSON.stringify(geminiContents));
        const bodyPayload: any = {
          contents: contentsCopy,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024
          }
        };

        if (target.version === 'v1beta' && !target.model.includes('gemini-pro')) {
          bodyPayload.system_instruction = {
            parts: [{ text: fullSystemInstruction }]
          };
        } else {
          if (contentsCopy.length > 0 && contentsCopy[0].role === 'user') {
            contentsCopy[0].parts[0].text = `${fullSystemInstruction}\n\n${contentsCopy[0].parts[0].text}`;
          }
        }

        let geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(8000)
        });

        // Se der erro 400 (ex: system_instruction não aceita ou estrutura de cabeçalho), tenta embutindo as instruções no prompt
        if (!geminiRes.ok && geminiRes.status === 400 && bodyPayload.system_instruction) {
          const retryContents = JSON.parse(JSON.stringify(geminiContents));
          retryContents[0].parts[0].text = `${fullSystemInstruction}\n\n${retryContents[0].parts[0].text}`;
          geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: retryContents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024
              }
            }),
            signal: AbortSignal.timeout(8000)
          });
        }

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          rawReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawReply.trim()) {
            break;
          }
        } else {
          const errorText = await geminiRes.text();
          let parsedMessage = errorText;
          try {
            const parsed = JSON.parse(errorText);
            parsedMessage = parsed.error?.message || errorText;
          } catch {}
          lastGeminiErrorDetails = `HTTP ${geminiRes.status} (${target.version}/${target.model}): ${parsedMessage}`;
          console.warn(`Gemini (${target.version}/${target.model}) API Warning: ${geminiRes.status}`, errorText);
        }
      } catch (err: any) {
        lastGeminiErrorDetails = `Erro (${target.version}/${target.model}): ${err?.message || String(err)}`;
        console.warn(`Gemini (${target.version}/${target.model}) connection error:`, err);
      }
    }

    if (!rawReply.trim()) {
      console.warn('Gemini não retornou texto ou falhou em todos os modelos. Recorrendo ao motor analítico local.');
      if (isShopFloor) {
        const localResponse = aiAssistantService.processShopFloorQuery(
          prompt,
          history,
          customers,
          defects,
          complaints,
          concessions
        );
        return NextResponse.json({
          ...localResponse,
          source: 'local_engine',
          geminiError: lastGeminiErrorDetails || 'A API do Google Gemini não respondeu com sucesso.'
        });
      }
      const localResponse = aiAssistantService.processQuery(
        prompt,
        history,
        customers,
        defects,
        complaints,
        concessions
      );
      return NextResponse.json({
        ...localResponse,
        source: 'local_engine',
        geminiError: lastGeminiErrorDetails || 'A API do Google Gemini não respondeu com sucesso.'
      });
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
      if (isShopFloor) {
        if (activeCustomer) {
          suggestedPrompts = [
            `Quais os defeitos mais críticos na costura?`,
            `Histórico de reclamações da ${activeCustomer.name.split(' ')[0]}`,
            `Cuidados com solda e valvulado`
          ];
        } else {
          suggestedPrompts = [
            'Quais os cuidados para a Copacol?',
            'Quais os cuidados para a Bunge?',
            'Defeitos mais reclamados no SAC'
          ];
        }
      } else {
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
    }

    // Botão de ação direta para abrir concessão pré-preenchida se seguro (apenas no ERP corporativo)
    let actionButton = undefined;
    if (!isShopFloor && activeCustomer && activeDefect && calculatedRisk && (calculatedRisk.riskLevel === 'baixo' || calculatedRisk.riskLevel === 'moderado')) {
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

    let attachedComplaints: Complaint[] | undefined = undefined;
    let attachedConcessions: ConcessionShipment[] | undefined = undefined;

    if (activeCustomer) {
      const custComps = complaints.filter(
        c => c.customerId === activeCustomer!.id || (c.customerName && activeCustomer && c.customerName.toLowerCase().includes(activeCustomer.name.toLowerCase()))
      );
      const custConcs = concessions.filter(
        c => c.customerId === activeCustomer!.id || (c.customerName && activeCustomer && c.customerName.toLowerCase().includes(activeCustomer.name.toLowerCase()))
      );

      const compsWithPhotos = custComps.filter(c => c.photos && c.photos.length > 0);
      const concsWithPhotos = custConcs.filter(c => c.photos && c.photos.length > 0);

      if (compsWithPhotos.length > 0) {
        attachedComplaints = compsWithPhotos;
      } else if (custComps.length > 0) {
        attachedComplaints = custComps.slice(0, 3);
      }

      if (concsWithPhotos.length > 0) {
        attachedConcessions = concsWithPhotos.slice(0, 3);
      }

      // Se nem as queixas nem as concessões do cliente possuem fotos, mas o cliente reclamou de defeitos específicos,
      // buscar fotos de referência da fábrica desse mesmo defeito para exibir visualmente na bancada
      const totalPhotos = (attachedComplaints?.reduce((acc, c) => acc + (c.photos?.length || 0), 0) || 0) +
                          (attachedConcessions?.reduce((acc, c) => acc + (c.photos?.length || 0), 0) || 0);

      if (totalPhotos === 0 && custComps.length > 0) {
        const defectIds = Array.from(new Set(custComps.map(c => c.defectTypeId)));
        const refCompsWithPhotos = complaints.filter(c => defectIds.includes(c.defectTypeId) && c.photos && c.photos.length > 0);
        const refConcsWithPhotos = concessions.filter(c => defectIds.includes(c.defectTypeId) && c.photos && c.photos.length > 0);

        if (refCompsWithPhotos.length > 0) {
          attachedComplaints = (attachedComplaints || []).concat(refCompsWithPhotos.slice(0, 2));
        } else if (refConcsWithPhotos.length > 0) {
          attachedConcessions = refConcsWithPhotos.slice(0, 3);
        }
      }
    } else if (activeDefect) {
      const defComps = complaints.filter(
        c => c.defectTypeId === activeDefect!.id || (c.defectTypeName && c.defectTypeName.toLowerCase().includes(activeDefect!.name.toLowerCase()))
      );
      const defConcs = concessions.filter(
        c => c.defectTypeId === activeDefect!.id || (c.defectTypeName && c.defectTypeName.toLowerCase().includes(activeDefect!.name.toLowerCase()))
      );

      const compsWithPhotos = defComps.filter(c => c.photos && c.photos.length > 0);
      const concsWithPhotos = defConcs.filter(c => c.photos && c.photos.length > 0);

      if (compsWithPhotos.length > 0) {
        attachedComplaints = compsWithPhotos.slice(0, 3);
      }
      if (concsWithPhotos.length > 0) {
        attachedConcessions = concsWithPhotos.slice(0, 3);
      }
    }

    const aiMessage: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: rawReply,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      customerCard: activeCustomer,
      complaintCards: attachedComplaints,
      concessionCards: attachedConcessions,
      riskRecommendation: isShopFloor ? undefined : (calculatedRisk || undefined),
      suggestedPrompts,
      actionButton,
      source: 'gemini'
    };

    return NextResponse.json(aiMessage);
  } catch (err) {
    console.error('Erro no processamento da IA:', err);
    try {
      const body = await req.json().catch(() => ({}));
      const isShopFloor = (body as any)?.mode === 'chao_de_fabrica';
      if (isShopFloor) {
        const localResponse = aiAssistantService.processShopFloorQuery(
          body.prompt || '',
          body.history || [],
          body.customers || [],
          body.defects || [],
          body.complaints || [],
          body.concessions || []
        );
        return NextResponse.json({ ...localResponse, source: 'local_engine' });
      }
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
