import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function cleanSpeechLocally(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();

  // 1. Correções fonéticas e transcrições comuns de operadores
  text = text.replace(/recalama[çc][oõ]es/gi, 'reclamações');
  text = text.replace(/recalama[çc][aã]o/gi, 'reclamação');
  text = text.replace(/defeitoo/gi, 'defeito');
  text = text.replace(/reclamac[oõ]es/gi, 'reclamações');
  text = text.replace(/reclamacao/gi, 'reclamação');
  text = text.replace(/impressao/gi, 'impressão');
  text = text.replace(/tolerancia/gi, 'tolerância');
  text = text.replace(/c\s*\.?\s*vale/gi, 'C.Vale');

  // 2. Colapsar repetição imediata de palavras usando tokens (Unicode-safe para acentos)
  let words = text.split(/\s+/).filter(Boolean);
  let deduped: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = deduped[deduped.length - 1];
    if (!prev || current.toLowerCase() !== prev.toLowerCase()) {
      deduped.push(current);
    }
  }
  words = deduped;

  // 3. Colapsar repetições sequenciais de blocos de palavras (N-grams de 6 até 1)
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (let len = Math.min(6, Math.floor(words.length / 2)); len >= 1; len--) {
      for (let i = 0; i <= words.length - len * 2; i++) {
        const chunk1 = words.slice(i, i + len).map(w => w.toLowerCase()).join(' ');
        const chunk2 = words.slice(i + len, i + len * 2).map(w => w.toLowerCase()).join(' ');
        if (chunk1 === chunk2) {
          words.splice(i + len, len);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  text = words.join(' ');

  // 4. Entidades conhecidas da Rafitec
  const knownEntities: Record<string, string> = {
    'alisul': 'Alisul',
    'copacol': 'Copacol',
    'bunge': 'Bunge',
    'aurora': 'Aurora',
    'caramuru': 'Caramuru',
    'cargill': 'Cargill',
    'ambev': 'Ambev',
    'lar': 'Lar',
    'c.vale': 'C.Vale',
    'big bag': 'Big Bag',
    'bigbag': 'Big Bag',
    'sacaria': 'sacaria',
    'erp': 'ERP',
    'sac': 'SAC'
  };

  Object.entries(knownEntities).forEach(([lower, proper]) => {
    const reg = new RegExp(`\\b${lower.replace('.', '\\.')}\\b`, 'gi');
    text = text.replace(reg, proper);
  });

  // 5. Sintetizador de Intenções para perguntas industriais naturais
  const lower = text.toLowerCase();

  // Caso: Reclamações de cliente (Ex: "reclamações do cliente alisul" ou "reclamações alisul")
  const reclamacoesMatch = text.match(/(?:quais\s+(?:as|são\s+as)\s+)?reclamações\s+(?:do\s+cliente\s+|da\s+|de\s+|para\s+o\s+cliente\s+|para\s+a\s+|do\s+)?([A-Za-zÀ-ÿ\.\s]+)/i);
  if (reclamacoesMatch && (lower.includes('reclamaç') || lower.includes('reclamac'))) {
    const cliente = reclamacoesMatch[1].trim().replace(/[?\.\,!]+$/, '').trim();
    if (cliente) {
      const properClient = knownEntities[cliente.toLowerCase()] || (cliente.charAt(0).toUpperCase() + cliente.slice(1));
      return `Quais são as reclamações registradas do cliente ${properClient}?`;
    }
  }

  // Caso: Fotos de cliente ou fotos de defeito
  if (lower.startsWith('fotos') || lower.startsWith('foto') || lower.includes('mostrar foto') || lower.includes('ver foto') || lower.includes('tem foto')) {
    let cleanSub = text.replace(/^(?:existem\s+|tem\s+|mostrar\s+|ver\s+)?fotos?\s+(?:de\s+|do\s+|da\s+|dos\s+|defeito\s+de\s+|defeito\s+)?(?:cliente\s+)?/i, '').trim();
    cleanSub = cleanSub.replace(/[?\.\,!]+$/, '').trim();
    if (cleanSub) {
      const properSub = knownEntities[cleanSub.toLowerCase()] || (cleanSub.charAt(0).toUpperCase() + cleanSub.slice(1));
      return `Existem fotos de ocorrências registradas para ${properSub}?`;
    }
    return `Existem fotos registradas para essa ocorrência?`;
  }

  // Caso: Envio de lote / Concessão
  if (lower.includes('posso enviar') || lower.includes('posso mandar') || lower.includes('liberar lote')) {
    let clean = text.replace(/posso\s+mandar/i, 'Posso enviar');
    Object.values(knownEntities).forEach(ent => {
      const regex = new RegExp(`(?<!para\\s+(?:a|o)?\\s*)\\b${ent}\\b`, 'gi');
      clean = clean.replace(regex, `para a ${ent}`);
    });
    clean = clean.replace(/\s+/g, ' ').trim();
    if (!clean.endsWith('?')) clean += '?';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  // Caso: Perfil / Tolerância de cliente
  if (lower.includes('perfil') || lower.includes('tolerância') || lower.includes('tolerancia')) {
    const match = text.match(/(?:perfil|tolerância|tolerancia)(?:\s+de\s+tolerância)?(?:\s+do\s+cliente|\s+da|\s+de)?\s+([A-Za-zÀ-ÿ\.\s]+)/i);
    if (match) {
      const client = match[1].trim().replace(/[?\.\,!]+$/, '');
      const properClient = knownEntities[client.toLowerCase()] || (client.charAt(0).toUpperCase() + client.slice(1));
      return `Qual é o perfil de tolerância e histórico do cliente ${properClient}?`;
    }
  }

  // Caso: Cuidados operacionais
  if (lower.includes('cuidados') || lower.includes('cuidado')) {
    const match = text.match(/cuidados?\s+(?:para\s+(?:o\s+cliente\s+|a\s+)?|no\s+|na\s+)?([A-Za-zÀ-ÿ\.\s]+)/i);
    if (match) {
      const target = match[1].trim().replace(/[?\.\,!]+$/, '');
      const properTarget = knownEntities[target.toLowerCase()] || (target.charAt(0).toUpperCase() + target.slice(1));
      return `Quais são os cuidados operacionais para ${properTarget}?`;
    }
  }

  // Fallback padrão: capitalizar e pontuar adequadamente
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (/^(quais|qual|como|posso|quanto|quantos|onde|tem|existe|devo)/i.test(text) && !text.endsWith('?')) {
    text += '?';
  }

  return text.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawText = (body.text || '').trim();
    const clientApiKey = body.apiKey;
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!rawText) {
      return NextResponse.json({ refinedText: '' });
    }

    const localCleaned = cleanSpeechLocally(rawText);

    // Se não tiver chave de API disponível, retorna o texto limpo e interpretado localmente
    if (!apiKey) {
      return NextResponse.json({ refinedText: localCleaned, source: 'local_cleaner' });
    }

    // Se tiver chave do Gemini, tenta os modelos em ordem de disponibilidade
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest'
    ];

    const prompt = `Você é o assistente sênior de inteligência operacional e qualidade da Rafitec (indústria de embalagens, sacarias e Big Bags).
O operador ou gestor falou por microfone no chão de fábrica: "${rawText}".

Sua missão é interpretar a intenção da fala e convertê-la em uma pergunta/consulta técnica clara, formal, direta e perfeita para ser enviada ao assistente de qualidade.
Regras fundamentais:
1. Elimine todas as repetições, gaguejos ou trechos duplicados gerados pelo motor de reconhecimento de voz (ex: "recalamações recalamações alisul" -> "Quais são as reclamações registradas do cliente Alisul?").
2. Identifique o cliente industrial (ex: Alisul, Copacol, Bunge, Aurora, Caramuru, Cargill, C.Vale, Lar, Ambev) e o assunto (reclamações, tolerância, fotos, envios, solda, vinco, refugo).
3. Formate como uma frase ou pergunta técnica bem escrita em português brasileiro.
4. Responda ESTRITAMENTE com a frase/pergunta final, sem aspas, explicações, saudações ou notas.`;

    for (const model of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 120
            }
          }),
          signal: AbortSignal.timeout(3000)
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (geminiText) {
            const cleanResult = geminiText.replace(/^["'`]+|["'`]+$/g, '').trim();
            return NextResponse.json({ refinedText: cleanResult, source: `gemini_${model}` });
          }
        }
      } catch (err) {
        // Tenta o próximo modelo
      }
    }

    return NextResponse.json({ refinedText: localCleaned, source: 'local_cleaner' });
  } catch (err: any) {
    console.error('Erro na rota refine-speech:', err);
    return NextResponse.json({ refinedText: '', error: err?.message }, { status: 500 });
  }
}
