'use client';

import React from 'react';
import { QuickSearchHero } from '@/components/dashboard/QuickSearchHero';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { DefectDistributionChart } from '@/components/dashboard/DefectDistributionChart';
import { RecentConcessionsTable } from '@/components/dashboard/RecentConcessionsTable';
import { QuickToleranceGrid } from '@/components/dashboard/QuickToleranceGrid';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero Section & Quick Search Hub */}
      <QuickSearchHero />

      {/* KPI Cards */}
      <KpiCards />

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 gap-6">
        <DefectDistributionChart />
      </div>

      {/* Customer Tolerance Grid & Recent Concessions */}
      <div className="space-y-6">
        <QuickToleranceGrid />
        <RecentConcessionsTable />
      </div>
    </div>
  );
}
