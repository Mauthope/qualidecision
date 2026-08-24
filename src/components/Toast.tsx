'use client';

import React from 'react';
import { useQuality } from '@/context/QualityContext';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toasts } = useQuality();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
      {toasts.map(toast => {
        let icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
        let borderColor = 'border-cyan-500/30';
        let bgColor = 'bg-slate-900/95';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderColor = 'border-emerald-500/30';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/30';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl ${bgColor} border ${borderColor} text-slate-100 shadow-xl shadow-black/50 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200`}
          >
            {icon}
            <div className="text-xs sm:text-sm font-medium leading-snug flex-1">
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );
};
