import { NextRequest, NextResponse } from 'next/server';

function cleanSpeechLocally(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();

  // 1. Corrigir erros fonéticos comuns
  text = text.replace(/recalama[çc][oõ]es/gi, 'reclamações');
  text = text.replace(/recalama[çc][aã]o/gi, 'reclamação');
  text = text.replace(/defeitoo/gi, 'defeito');

  // 2. Colapsar repetição imediata de palavras: "palavra palavra palavra" -> "palavra"
  text = text.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');

  // 3. Colapsar repetição sequencial de frases/blocos de palavras
  // Ex: "do cliente alisul reclamações do cliente alisul" -> "reclamações do cliente alisul"
  for (let len = 5; len >= 2; len--) {
    const tokens = text.split(/\s+/);
    if (tokens.length >= len * 2) {
      for (let i = 0; i <= tokens.length - len * 2; i++) {
        const chunk1 = tokens.slice(i, i + len).join(' ').toLowerCase();
        const chunk2 = tokens.slice(i + len, i + len * 2).join(' ').toLowerCase();
        if (chunk1 === chunk2) {
          tokens.splice(i + len, len);
          text = tokens.join(' ');
          break;
        }
      }
    }
  }

  // 4. Capitalizar entidades industriais e clientes conhecidos
  const knownEntities: Record<string, string> = {
    'alisul': 'Alisul',
    'copacol': 'Copacol',
    'bunge': 'Bunge',
    'aurora': 'Aurora',
    'caramuru': 'Caramuru',
    'cargill': 'Cargill',
    'ambev': 'Ambev',
    'lar': 'Lar',
    'cvale': 'C.Vale',
    'c.vale': 'C.Vale',
    'big bag': 'Big Bag',
    'bigbag': 'Big Bag',
    'sacaria': 'sacaria',
    'erp': 'ERP',
    'sac': 'SAC'
  };

  Object.entries(knownEntities).forEach(([lower, proper]) => {
    const reg = new RegExp(`\\b${lower}\\b`, 'gi');
    text = text.replace(reg, proper);
  });

  // 5. Capitalizar primeira letra
  text = text.charAt(0).toUpperCase() + text.slice(1);

  // 6. Pontuação de pergunta se começar com termos interrogativos
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

    // Se não tiver chave de API disponível, retorna o texto limpo localmente de imediato
    if (!apiKey) {
      return NextResponse.json({ refinedText: localCleaned, source: 'local_cleaner' });
    }

    // Se tiver chave do Gemini, solicita refinamento contextual de alta precisão
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const prompt = `Você é o refinador de voz do sistema de qualidade da Rafitec.
O operador de fábrica ou gestor falou por microfone, e o motor de áudio produziu o seguinte texto bruto (podendo conter repetições de palavras, gaguejos, ausência de pontuação ou nomes em minúsculo):

TEXTO BRUTO DO ÁUDIO: "${rawText}"

SUA MISSÃO:
1. Elimine todas as repetições e duplicações acidentais de palavras ou frases (ex: "recalamações recalamações do cliente alisul" -> "Quais as reclamações do cliente Alisul?").
2. Ajuste a concordância gramatical, pontuação e nomes próprios industriais (Alisul, Copacol, Bunge, Aurora, Caramuru, Big Bag, sacaria, vinco, refugo, concessão).
3. Responda APENAS com a frase final limpa e pronta para ser enviada, sem explicações, aspas ou introduções.`;

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
            maxOutputTokens: 128
          }
        }),
        signal: AbortSignal.timeout(3500)
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (geminiText) {
          // Remove aspas que o modelo às vezes coloca
          const cleanResult = geminiText.replace(/^["'`]+|["'`]+$/g, '').trim();
          return NextResponse.json({ refinedText: cleanResult, source: 'gemini' });
        }
      }
    } catch (geminiErr) {
      console.warn('Falha no refinamento via Gemini, usando cleaner local:', geminiErr);
    }

    return NextResponse.json({ refinedText: localCleaned, source: 'local_cleaner' });
  } catch (err: any) {
    console.error('Erro na rota refine-speech:', err);
    return NextResponse.json({ refinedText: '', error: err?.message }, { status: 500 });
  }
}
