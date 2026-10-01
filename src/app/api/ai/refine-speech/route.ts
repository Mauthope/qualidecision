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
    'c.vale': 'C.Vale',
    'cvale': 'C.Vale',
    'lar': 'Lar',
    'ambev': 'Ambev',
    'jbs': 'JBS',
    'brf': 'BRF',
    'seara': 'Seara',
    'frimesa': 'Frimesa'
  };

  const lower = text.toLowerCase();

  // Caso: Reclamações
  if (lower.includes('reclamac') || lower.includes('ocorrencia') || lower.includes('queixa')) {
    for (const [key, properName] of Object.entries(knownEntities)) {
      if (lower.includes(key)) {
        return `Quais são as reclamações registradas do cliente ${properName}?`;
      }
    }
    return 'Quais são as principais reclamações registradas no sistema?';
  }

  // Caso: Fotos de defeito
  if (lower.includes('foto') || lower.includes('imagem') || lower.includes('amostra')) {
    for (const [key, properName] of Object.entries(knownEntities)) {
      if (lower.includes(key)) {
        return `Existem fotos de ocorrências registradas para ${properName}?`;
      }
    }
    return 'Existem fotos de evidência registradas para este defeito?';
  }

  // Caso: Posso enviar lote / concessão
  if (lower.includes('posso mandar') || lower.includes('posso enviar') || lower.includes('concessao') || lower.includes('liberar')) {
    for (const [key, properName] of Object.entries(knownEntities)) {
      if (lower.includes(key)) {
        return `Posso enviar lote com desvio para ${properName}?`;
      }
    }
  }

  // Caso: Perfil de tolerância
  if (lower.includes('perfil') || lower.includes('tolerancia')) {
    for (const [key, properName] of Object.entries(knownEntities)) {
      if (lower.includes(key)) {
        return `Qual é o perfil de tolerância e histórico do cliente ${properName}?`;
      }
    }
  }

  // Fallback: capitalizar e pontuar
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (/^(quais|qual|como|posso|quanto|quantos|onde|tem|existe|devo)/i.test(text) && !text.endsWith('?')) {
    text += '?';
  }

  return text.trim();
}

/**
 * Endpoint de refinamento de voz 100% local.
 * Desconectado de IAs externas não homologadas (Gemini suspenso conforme PSI).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawText = (body.text || '').trim();

    if (!rawText) {
      return NextResponse.json({ refinedText: '' });
    }

    const localCleaned = cleanSpeechLocally(rawText);
    return NextResponse.json({ refinedText: localCleaned, source: 'local_cleaner' });
  } catch (err: any) {
    console.error('Erro na rota refine-speech:', err);
    return NextResponse.json({ refinedText: '', error: err?.message }, { status: 500 });
  }
}
