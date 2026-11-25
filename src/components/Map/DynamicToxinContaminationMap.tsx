'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface DynamicToxinContaminationMapProps {
  onClose: () => void;
}

const ToxinContaminationMap = dynamic(
  () => import('./ToxinContaminationMap').then((mod) => mod.ToxinContaminationMap),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[1000] bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-sm font-semibold">กำลังโหลดแผนที่เฝ้าระวังสารพิษในน้ำ...</p>
      </div>
    ),
  }
);

export const DynamicToxinContaminationMap: React.FC<DynamicToxinContaminationMapProps> = (
  props
) => {
  return <ToxinContaminationMap {...props} />;
};
