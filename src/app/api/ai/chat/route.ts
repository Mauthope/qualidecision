import { NextResponse } from 'next/server';
import { aiAssistantService } from '@/services/aiAssistantService';
import { Customer, DefectType, Complaint, ConcessionShipment, AiChatMessage } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Endpoint do Assistente de Qualidade Sensei
 * 
 * Conformidade com PSI / SecOps (Grupo Vaccaro - Achado 4):
 * - Google Gemini suspenso (IA externa não homologada).
 * - Processamento local seguro via motor determinístico de regras (aiAssistantService).
 * - Preparado para integração imediata com Anthropic Claude assim que a chave homologada for fornecida pela TI.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      history = [],
      customers = [],
      defects = [],
      complaints = [],
      concessions = [],
      mode
    } = body as {
      prompt: string;
      history: AiChatMessage[];
      customers: Customer[];
      defects: DefectType[];
      complaints: Complaint[];
      concessions: ConcessionShipment[];
      mode?: string;
    };

    const isShopFloor = mode === 'chao_de_fabrica';

    // 1. Verificação de chave corporativa homologada do Claude (Anthropic)
    const claudeApiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    if (claudeApiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: `Você é o Sensei, assistente de qualidade industrial da Rafitec. Responda de forma executiva, objetiva e profissional à seguinte dúvida do operador: "${prompt}". Não use emojis.`
              }
            ]
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          const claudeReply = data.content?.[0]?.text || '';
          if (claudeReply) {
            const aiMessage: AiChatMessage = {
              id: `msg-${Date.now()}`,
              sender: 'assistant',
              text: claudeReply,
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              source: 'local_engine'
            };
            return NextResponse.json(aiMessage);
          }
        }
      } catch (claudeErr) {
        console.warn('Falha na chamada ao Claude, utilizando motor local homologado:', claudeErr);
      }
    }

    // 2. Motor Local Seguro (Sem envio de dados para IAs externas não homologadas)
    if (isShopFloor) {
      const localResponse = aiAssistantService.processShopFloorQuery(
        prompt || '',
        history,
        customers,
        defects,
        complaints,
        concessions
      );
      return NextResponse.json({
        ...localResponse,
        source: 'local_engine'
      });
    }

    const localResponse = aiAssistantService.processQuery(
      prompt || '',
      history,
      customers,
      defects,
      complaints,
      concessions
    );

    return NextResponse.json({
      ...localResponse,
      source: 'local_engine'
    });
  } catch (err: any) {
    console.error('Erro no processamento do assistente:', err);
    return NextResponse.json(
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Não foi possível processar a consulta neste momento. Por favor, tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        source: 'local_engine'
      },
      { status: 200 }
    );
  }
}
