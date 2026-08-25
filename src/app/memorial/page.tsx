'use client';

import React, { useState, useMemo } from 'react';
import { useQuality } from '@/context/QualityContext';
import {
  Calculator,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpenCheck,
  Scale,
  FileCode,
  Sliders,
  HelpCircle,
  Database,
  Building2,
  Package,
  Clock,
  Info,
  Check,
  ArrowDown
} from 'lucide-react';
import { DefectSeverity, ToleranceLevel } from '@/types';

export default function MemorialPage() {
  const { customers, defects, complaints, concessions } = useQuality();

  // Interactive Simulator state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedDefectId, setSelectedDefectId] = useState(defects[0]?.id || '');
  const [selectedQuantity, setSelectedQuantity] = useState(5000);
  const [selectedSeverity, setSelectedSeverity] = useState<DefectSeverity>('leve');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedDefect = defects.find(d => d.id === selectedDefectId);

  // Calculate live breakdown
  const ratingConfig = selectedCustomer?.toleranceRatings?.[selectedDefectId];
  const tolerance: ToleranceLevel = ratingConfig?.level || 'moderada';

  const clientComplaints = complaints.filter(
    c => c.customerId === selectedCustomerId && c.defectTypeId === selectedDefectId
  );
  const clientConcessions = concessions.filter(
    c => c.customerId === selectedCustomerId && c.defectTypeId === selectedDefectId
  );
  const successfulPast = clientConcessions.filter(c => c.customerFeedbackStatus === 'aceito_sem_ressalvas').length;

  // Math terms
  const baseScore = 20;

  let deltaTolerance = 10;
  if (tolerance === 'intolerante') deltaTolerance = 55;
  else if (tolerance === 'baixa') deltaTolerance = 35;
  else if (tolerance === 'moderada') deltaTolerance = 10;
  else if (tolerance === 'alta') deltaTolerance = -15;

  let deltaSeverity = 0;
  if (selectedSeverity === 'severa') deltaSeverity = 30;
  else if (selectedSeverity === 'moderada') deltaSeverity = 15;
  else if (selectedSeverity === 'leve') deltaSeverity = -5;

  const deltaComplaints = clientComplaints.length * 15;
  const deltaSuccessfulConcessions = -Math.min(successfulPast * 8, 25);

  let deltaVolume = 0;
  if (selectedQuantity > 15000) deltaVolume = 15;
  else if (selectedQuantity > 8000) deltaVolume = 8;

  // Raw Arithmetic Sum
  const rawScore = baseScore + deltaTolerance + deltaSeverity + deltaComplaints + deltaSuccessfulConcessions + deltaVolume;
  
  // Statistical Clamping
  const finalScore = Math.max(5, Math.min(98, rawScore));
  const isClampedMin = rawScore < 5;
  const isClampedMax = rawScore > 98;

  const weightKg = (selectedQuantity * 77.73) / 1000;
  const totalSavedValue = weightKg * 1.5;
  const unitSaved = (77.73 / 1000) * 1.5;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold mb-1.5">
            <Calculator className="w-3.5 h-3.5" />
            <span>Engenharia de Qualidade & Modelagem Estatística</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Memorial de Cálculo & Fórmulas Explicadas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
            Catálogo didático e transparente de cada fórmula, pontuação e número apresentado pelo sistema, com a especificação exata de <strong>onde vêm os dados e o que significam</strong>.
          </p>
        </div>
      </div>

      {/* SIMULADOR INTERATIVO COM DECOMPOSIÇÃO PASSO A PASSO (DESTAQUE NO TOPO) */}
      <div className="glow-card p-6 sm:p-7 rounded-3xl bg-slate-950 border-2 border-cyan-500/40 space-y-6 shadow-2xl shadow-cyan-500/10">
        
        {/* Simulator Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-heading flex items-center gap-2">
                <span>Simulador Interativo: Decomposição Matemática em Tempo Real</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase font-bold tracking-wider">
                  Ao Vivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Altere os campos abaixo para auditar exatamente como o sistema calcula o risco e o scrap evitado
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Fórmula 100% Auditável</span>
          </div>
        </div>

        {/* Live Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold flex items-center justify-between">
              <span>1. Cliente:</span>
              <span className="text-[10px] text-cyan-400 font-mono">Cadastro</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold flex items-center justify-between">
              <span>2. Defeito:</span>
              <span className="text-[10px] text-cyan-400 font-mono">Tabela Técnica</span>
            </label>
            <select
              value={selectedDefectId}
              onChange={e => setSelectedDefectId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500/50"
            >
              {defects.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold flex items-center justify-between">
              <span>3. Quantidade (un):</span>
              <span className="text-[10px] text-cyan-400 font-mono">Lote Atual</span>
            </label>
            <input
              type="number"
              step={1000}
              min={1}
              value={selectedQuantity}
              onChange={e => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-mono focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold flex items-center justify-between">
              <span>4. Severidade:</span>
              <span className="text-[10px] text-cyan-400 font-mono">Inspeção</span>
            </label>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value as DefectSeverity)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none"
            >
              <option value="leve">Leve (-5 pts / estético)</option>
              <option value="moderada">Moderada (+15 pts)</option>
              <option value="severa">Severa (+30 pts / funcional)</option>
            </select>
          </div>
        </div>

        {/* Live Equation Banner with Step-by-Step Arithmetic Resolution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              Resolução Aritmética Completa da Equação:
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Auditável termo a termo
            </span>
          </div>

          {/* PASSO 1: Montagem dos Termos Ponderados */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              1º Passo: Substituição dos Termos na Equação
            </div>
            <div className="font-mono text-xs sm:text-sm text-cyan-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 overflow-x-auto custom-scrollbar shadow-inner leading-relaxed">
              <span>Risco = </span>
              <span className="text-slate-400" title="Base inicial de risco neutro">{baseScore} (Base)</span>
              <span className={deltaTolerance < 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'} title="Ajuste pelo perfil do cliente">
                {' '}{deltaTolerance >= 0 ? `+ ${deltaTolerance}` : `- ${Math.abs(deltaTolerance)}`} (Tolerância {tolerance.toUpperCase()})
              </span>
              <span className={deltaSeverity < 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'} title="Ajuste pela gravidade da inspeção">
                {' '}{deltaSeverity >= 0 ? `+ ${deltaSeverity}` : `- ${Math.abs(deltaSeverity)}`} (Severidade {selectedSeverity})
              </span>
              <span className={deltaComplaints > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'} title="Penalidade por reclamações no ERP">
                {' '} + {deltaComplaints} ({clientComplaints.length} Reclamações ERP)
              </span>
              <span className={deltaSuccessfulConcessions < 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'} title="Bônus por concessões aceitas">
                {' '} {deltaSuccessfulConcessions < 0 ? `- ${Math.abs(deltaSuccessfulConcessions)}` : '+ 0'} ({successfulPast} Concessões Aceitas)
              </span>
              <span className={deltaVolume > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'} title="Ajuste pelo tamanho do lote">
                {' '} + {deltaVolume} (Volume {selectedQuantity.toLocaleString('pt-BR')} un)
              </span>
            </div>
          </div>

          {/* PASSO 2: Cálculo Aritmético Direto (Sem Trava) */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              2º Passo: Cálculo Aritmético Direto (Soma e Subtração da Esquerda para a Direita)
            </div>
            <div className="font-mono text-xs sm:text-sm text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 overflow-x-auto custom-scrollbar flex items-center flex-wrap gap-2">
              <span className="text-slate-400">{baseScore}</span>
              <span className={deltaTolerance < 0 ? 'text-emerald-400' : 'text-rose-400'}>{deltaTolerance >= 0 ? `+ ${deltaTolerance}` : `- ${Math.abs(deltaTolerance)}`}</span>
              <span className={deltaSeverity < 0 ? 'text-emerald-400' : 'text-rose-400'}>{deltaSeverity >= 0 ? `+ ${deltaSeverity}` : `- ${Math.abs(deltaSeverity)}`}</span>
              <span>+ {deltaComplaints}</span>
              <span className="text-emerald-400">{deltaSuccessfulConcessions < 0 ? `- ${Math.abs(deltaSuccessfulConcessions)}` : '+ 0'}</span>
              <span>+ {deltaVolume}</span>
              <span className="text-cyan-400 font-bold"> = {rawScore} pontos brutos</span>
            </div>
          </div>

          {/* PASSO 3: Aplicação da Trava de Segurança Estatística */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>3º Passo: Ajuste de Piso de Segurança Estatística na Vida Real</span>
            </div>
            
            <div className={`p-4 rounded-xl border text-xs sm:text-sm ${
              isClampedMin ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300' :
              isClampedMax ? 'bg-rose-950/25 border-rose-500/40 text-rose-300' :
              'bg-cyan-950/25 border-cyan-500/40 text-cyan-300'
            }`}>
              <div className="font-mono font-bold text-sm flex items-center gap-2">
                <span>Score Final = max(5, min(98, {rawScore})) ➔</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-black/40 border border-current text-white font-extrabold text-base">
                  {finalScore} / 100
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
                {isClampedMin ? (
                  <>
                    💡 <strong>Por que virou {finalScore}?</strong> O resultado bruto deu <strong>{rawScore} (negativo)</strong> porque as condições são ultra favoráveis. Como na vida real <em>não existe risco negativo</em> (menor que zero), o sistema aplica a trava do <strong>Piso de Segurança Mínimo de 5%</strong> (a menor nota possível de risco).
                  </>
                ) : isClampedMax ? (
                  <>
                    ⚠️ <strong>Por que virou {finalScore}?</strong> O resultado bruto deu <strong>{rawScore}</strong>. O sistema delimita o teto em <strong>98%</strong> de risco estatístico crítico.
                  </>
                ) : (
                  <>
                    ✅ <strong>Resultado exato:</strong> Como o resultado bruto de <strong>{rawScore}</strong> está dentro da faixa industrial válida [5 a 98], ele é adotado diretamente como o Score Final de {finalScore}/100.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* 3 Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Classificação de Risco:</div>
              <div className={`text-base font-bold font-mono mt-0.5 ${
                finalScore >= 75 ? 'text-rose-400' :
                finalScore >= 50 ? 'text-orange-400' :
                finalScore >= 30 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {finalScore >= 75 ? '🔴 Risco Crítico (Não Enviar)' :
                 finalScore >= 50 ? '🟠 Risco Elevado' :
                 finalScore >= 30 ? '🟡 Risco Moderado' : '🟢 Baixo Risco (Liberado)'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Scrap Evitado neste Lote:</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                R$ {totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Score Geral do Cliente:</div>
              <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                {selectedCustomer?.overallToleranceScore}% ({selectedCustomer?.name.split(' ')[0]})
              </div>
            </div>
          </div>
        </div>

        {/* DETALHAMENTO DIDÁTICO: DE ONDE VEM CADA NÚMERO DA EQUAÇÃO */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <BookOpenCheck className="w-4 h-4 text-cyan-400" />
            <span>📖 Dicionário Didático: De onde vem cada número e o que ele significa?</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            
            {/* Card 1: 20 Base */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 font-mono text-sm">20 (Base Inicial)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  Constante
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>O que é:</strong> Ponto de partida neutro atribuído a qualquer lote fabril antes da análise dos fatores específicos.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <strong>De onde vem:</strong> Padrão estatístico do sistema que representa o risco operacional inerente mínimo de 20%.
              </div>
            </div>

            {/* Card 2: Tolerância do Cliente */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-bold font-mono text-sm ${deltaTolerance < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {deltaTolerance >= 0 ? `+${deltaTolerance}` : deltaTolerance} (Tolerância {tolerance.toUpperCase()})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                  Cadastro Cliente
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>O que é:</strong> O impacto do perfil de tolerância cadastrado para o cliente <strong>{selectedCustomer?.name.split(' ')[0]}</strong> para o defeito <em>{selectedDefect?.name}</em>.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <strong>Regra:</strong> Alta Tolerância reduz o risco em <strong>-15 pts</strong>, Moderada soma <strong>+10 pts</strong>, Baixa soma <strong>+35 pts</strong> e Intolerante soma <strong>+55 pts</strong>.
              </div>
            </div>

            {/* Card 3: Severidade */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-bold font-mono text-sm ${deltaSeverity < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {deltaSeverity >= 0 ? `+${deltaSeverity}` : deltaSeverity} (Severidade {selectedSeverity.toUpperCase()})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
                  Inspeção Lote
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>O que é:</strong> Grau de intensidade do defeito apurado pelo controle de qualidade durante a inspeção física do lote.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <strong>Regra:</strong> Defeito leve (estético) bonifica <strong>-5 pts</strong>; moderado soma <strong>+15 pts</strong>; severo (risco funcional) soma <strong>+30 pts</strong>.
              </div>
            </div>

            {/* Card 4: Reclamações ERP */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-bold font-mono text-sm ${deltaComplaints > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  +{deltaComplaints} ({clientComplaints.length} Reclamações ERP)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-mono border border-rose-500/20">
                  Base ERP SAC
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>O que é:</strong> Penalidade por reincidência. Conta quantas vezes este cliente já reclamou formalmente deste mesmo defeito no passado.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <strong>Regra:</strong> Cada reclamação histórica registrada soma <strong>+15 pontos</strong> de penalidade direta no risco.
              </div>
            </div>

            {/* Card 5: Concessões Aceitas */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-bold font-mono text-sm ${deltaSuccessfulConcessions < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {deltaSuccessfulConcessions < 0 ? `${deltaSuccessfulConcessions}` : '+0'} ({successfulPast} Concessões Aceitas)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                  Histórico Envios
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>O que é:</strong> Bonificação por sucesso empírico. Conta quantos lotes anteriores foram expedidos com esse defeito e o cliente aceitou sem problemas.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <strong>Regra:</strong> Cada lote aceito sem queixa reduz o risco em <strong>-8 pts</strong> (até o limite de bonificação de -25 pts).
              </div>
            </div>

            {/* Card 6: Volume */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-bold font-mono text-sm ${deltaVolume > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  +{deltaVolume} (Volume {selectedQuantity.toLocaleString('pt-BR')} un)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 font-mono border border-purple-500/20">
                  Exposição Lote
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>O que é:</strong> Ajuste de exposição. Lotes de grande porte aumentam a probabilidade de detecção e o prejuízo em caso de devolução.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <strong>Regra:</strong> Até 8.000 un = <strong>+0 pts</strong>; de 8.001 a 15.000 un = <strong>+8 pts</strong>; acima de 15.000 un = <strong>+15 pts</strong>.
              </div>
            </div>

            {/* Card 7: Scrap Evitado */}
            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  R$ {totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                  Lucro Salvo
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>De onde vem o valor:</strong> Conversão da quantidade (<strong>{selectedQuantity.toLocaleString('pt-BR')} un</strong>) pelo peso médio padrão de <strong>77,73g por saco</strong> (<strong className="text-cyan-300 font-mono">{weightKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</strong>) multiplicado pelo fator de lucratividade de <strong>1,5×</strong>.
              </p>
              <div className="text-[11px] text-emerald-400/90 pt-1 border-t border-emerald-500/30 font-semibold font-mono">
                Fórmula: {selectedQuantity.toLocaleString('pt-BR')} un × 0,07773 kg × 1,5 = R$ {totalSavedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Card 8: Score Geral do Cliente */}
            <div className="p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 font-mono text-sm">
                  {selectedCustomer?.overallToleranceScore}% ({selectedCustomer?.name.split(' ')[0]})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                  Média Geral
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>De onde vem a porcentagem:</strong> Média calibrada de tolerância do perfil da {selectedCustomer?.name.split(' ')[0]} baseada no histórico de SACs.
              </p>
              <div className="text-[11px] text-cyan-400/90 pt-1 border-t border-cyan-500/30 font-semibold">
                Score &gt; 75%: Flexível | 50% a 74%: Moderado | &lt; 50%: Rígido / Baixa Tolerância.
              </div>
            </div>

            {/* Card 9: Recomendação Final da IA */}
            <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 text-sm flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Decisão Recomendada
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono">
                  Parecer IA
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {finalScore < 30 ? '✅ Lote seguro para liberação sem ressalvas.' :
                 finalScore < 50 ? '⚠️ Liberação autorizada com monitoramento pós-entrega.' :
                 finalScore < 75 ? '🟠 Notificar comprador antes de despachar.' :
                 '⛔ NÃO ENVIAR! Risco crítico de rejeição. Redirecionar lote.'}
              </p>
              <div className="text-[11px] text-purple-300/90 pt-1 border-t border-purple-500/30 font-semibold">
                Baseado em inteligência cruzada de qualidade e dados históricos.
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SECTION 1: Detalhamento do Índice Geral de Tolerância */}
      <div className="glow-card p-6 sm:p-7 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
              1. Índice Geral de Tolerância do Cliente (0 a 100%)
            </h2>
            <p className="text-xs text-slate-400">
              Algoritmo de calibração que afere o rigor do cliente conforme a frequência e a sensibilidade a baixos quilos reclamados
            </p>
          </div>
        </div>

        {/* Weights Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                <th className="pb-3 pr-4">Classificação Cadastrada</th>
                <th className="pb-3 px-4 text-center">Pontos Atribuídos (P_i)</th>
                <th className="pb-3 px-4">Significado Técnico no Chão de Fábrica</th>
                <th className="pb-3 pl-4 text-center">Diretriz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 pr-4 font-bold text-emerald-400">🟢 Alta Tolerância</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">100 pontos</td>
                <td className="py-3 px-4 text-slate-300">Cliente aceita o desvio sem restrições ou impacto no processo de envase.</td>
                <td className="py-3 pl-4 text-center text-emerald-400 font-semibold text-[11px]">Envio Liberado</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 pr-4 font-bold text-amber-400">🟡 Tolerância Moderada</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">70 pontos</td>
                <td className="py-3 px-4 text-slate-300">Aceita com ressalvas desde que o defeito seja leve/estético.</td>
                <td className="py-3 pl-4 text-center text-amber-400 font-semibold text-[11px]">Monitorar Entrega</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 pr-4 font-bold text-orange-400">🟠 Baixa Tolerância</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">40 pontos</td>
                <td className="py-3 px-4 text-slate-300">Risco elevado de devolução; requer alinhamento prévio ou validação da qualidade.</td>
                <td className="py-3 pl-4 text-center text-orange-400 font-semibold text-[11px]">Alinhamento Prévio</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 pr-4 font-bold text-rose-400">🔴 Zero Tolerância / Intolerante</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">10 pontos</td>
                <td className="py-3 px-4 text-slate-300">Rejeição imediata por comprometer estanqueidade, embalagem ou esteiras automáticas.</td>
                <td className="py-3 pl-4 text-center text-rose-400 font-semibold text-[11px]">Bloqueado / Não Enviar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Fórmula de Conversão de Peso e Lucratividade Salva */}
      <div className="glow-card p-6 sm:p-7 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-heading">
              2. Modelo de Lucro Estimado & Conversão de Peso (77,73g / Saco × 1,5)
            </h2>
            <p className="text-xs text-slate-400">
              Metodologia de conversão ponderada de unidades para quilos e apuração do valor financeiro de scrap evitado
            </p>
          </div>
        </div>

        {/* Formula Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">Passo 1 • Média de Peso Padrão</span>
            <div className="text-base font-extrabold font-mono text-white">77,73 g / saco</div>
            <p className="text-slate-400 leading-relaxed">
              Cada sacaria possui peso médio calibrado de <strong>77,73 gramas</strong> (ou <strong>0,07773 kg</strong> por unidade).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Passo 2 • Conversão de Volume para Kg</span>
            <div className="text-base font-extrabold font-mono text-emerald-300">Kg = Qtd × 0,07773</div>
            <p className="text-slate-400 leading-relaxed">
              O volume concedido em unidades é transformado na massa total equivalente de resina e polipropileno preservados.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Passo 3 • Fator de Lucro Salvo</span>
            <div className="text-base font-extrabold font-mono text-purple-300">Lucro (R$) = Kg × 1,5</div>
            <p className="text-slate-400 leading-relaxed">
              Aplica-se o fator multiplicador de <strong>1,5×</strong> sobre o peso em kg para apurar o lucro aproximado de scrap evitado.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
