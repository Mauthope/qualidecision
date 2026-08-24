'use client';

import React, { use } from 'react';
import { useQuality } from '@/context/QualityContext';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { CustomerProfileHeader } from '@/components/clientes/CustomerProfileHeader';
import { ToleranceMatrix } from '@/components/clientes/ToleranceMatrix';
import { CustomerComplaintHistory } from '@/components/clientes/CustomerComplaintHistory';
import { CustomerConcessionsHistory } from '@/components/clientes/CustomerConcessionsHistory';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { customers, defects, complaints, concessions } = useQuality();

  const customer = customers.find(c => c.id === resolvedParams.id);

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Cliente não encontrado</h2>
        <p className="text-xs text-slate-400">O identificador informado não consta na base de dados.</p>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Clientes
        </Link>
      </div>
    );
  }

  const clientComplaints = complaints.filter(c => c.customerId === customer.id);
  const clientConcessions = concessions.filter(c => c.customerId === customer.id);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista de Clientes
        </Link>
      </div>

      {/* Profile Header */}
      <CustomerProfileHeader
        customer={customer}
        complaints={clientComplaints}
        concessions={clientConcessions}
      />

      {/* Tolerance Matrix */}
      <ToleranceMatrix
        customer={customer}
        defects={defects}
        complaints={clientComplaints}
      />

      {/* Customer Concessions Log with Red/Green feedback on subsequent complaints */}
      <CustomerConcessionsHistory
        customer={customer}
        concessions={clientConcessions}
        complaints={clientComplaints}
      />

      {/* Historical Complaints & Photos */}
      <CustomerComplaintHistory
        customer={customer}
        complaints={clientComplaints}
      />
    </div>
  );
}
