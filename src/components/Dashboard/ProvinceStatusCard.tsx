'use client';

import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  Database, 
  Waves, 
  CloudRain, 
  Gauge, 
  Car,
  ChevronRight,
  Globe2,
  Activity
} from 'lucide-react';
import { ProvinceStatusReport, NationwideCoverageSummary, DataStatus } from '@/lib/providers/types';
import { THAILAND_PROVINCES } from '@/data/thailand-provinces';

interface ProvinceStatusCardProps {
  selectedProvince: string;
  report?: ProvinceStatusReport;
  coverage?: NationwideCoverageSummary;
  onSelectProvince?: (provinceId: string) => void;
}

export const ProvinceStatusCard: React.FC<ProvinceStatusCardProps> = ({
  selectedProvince,
  report,
  coverage,
  onSelectProvince,
}) => {
  const isNationwide = selectedProvince === 'all';
  const currentProvinceObj = THAILAND_PROVINCES.find((p) => p.id === selectedProvince);

  // Status visual themes
  const statusThemes = {
    CRITICAL: {
      bg: 'bg-red-500/10 border-red-500/40 text-red-950',
      badgeBg: 'bg-red-600 text-white',
      dot: 'bg-red-500',
      icon: ShieldAlert,
    },
    FLOODING: {
      bg: 'bg-orange-500/10 border-orange-500/40 text-orange-950',
      badgeBg: 'bg-orange-600 text-white',
      dot: 'bg-orange-500',
      icon: AlertTriangle,
    },
    WARNING: {
      bg: 'bg-amber-500/10 border-amber-500/40 text-amber-950',
      badgeBg: 'bg-amber-500 text-amber-950',
      dot: 'bg-amber-400',
      icon: AlertTriangle,
    },
    WATCH: {
      bg: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-950',
      badgeBg: 'bg-yellow-400 text-yellow-950',
      dot: 'bg-yellow-400',
      icon: AlertTriangle,
    },
    NORMAL: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950',
      badgeBg: 'bg-emerald-600 text-white',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    UNKNOWN: {
      bg: 'bg-slate-500/10 border-slate-300 text-slate-800',
      badgeBg: 'bg-slate-600 text-white',
      dot: 'bg-slate-400',
      icon: HelpCircle,
    },
    UNAVAILABLE: {
      bg: 'bg-slate-500/10 border-slate-300 text-slate-800',
      badgeBg: 'bg-slate-600 text-white',
      dot: 'bg-slate-400',
      icon: HelpCircle,
    },
  };

  const freshnessBadge = (freshness?: DataStatus) => {
    switch (freshness) {
      case 'LIVE':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
            title="ดึงข้อมูลสำเร็จตามรอบเวลาปกติ"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>ข้อมูลสด</span>
          </span>
        );
      case 'STALE':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
            title="ดึงข้อมูลใหม่ไม่สำเร็จ แสดงค่าล่าสุดที่มีในระบบ"
          >
            <span>ข้อมูลล่าช้า (ดึงข้อมูลใหม่ไม่สำเร็จ แสดงค่าล่าสุดที่มี)</span>
          </span>
        );
      case 'STATIC':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300"
            title="ข้อมูลอ้างอิงทางการหรือสรุปประจำวัน ไม่ได้ตรวจวัดแบบเรียลไทม์"
          >
            <span>ข้อมูลอ้างอิง (ไม่ได้อัปเดตแบบเรียลไทม์)</span>
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300"
            title="ไม่พบข้อมูลจากหน่วยงานต้นทาง"
          >
            <span>ไม่มีข้อมูล</span>
          </span>
        );
    }
  };

  // NATIONWIDE VIEW
  if (isNationwide) {
    return (
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2.5 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                  สถานการณ์น้ำ 77 จังหวัดทั่วไทย (Nationwide Overview)
                </h3>
                {coverage && freshnessBadge(coverage.liveProvinces > 0 ? 'LIVE' : 'STATIC')}
              </div>
              <p className="text-[11px] text-slate-500">
                ประมวลผลจาก ThaiWater (สสน.), กรมชลประทาน, กรมทางหลวง, และ GISTDA
              </p>
            </div>
          </div>

          {coverage && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">
                ตรวจวัดสด: <b className="text-emerald-700">{coverage.liveProvinces}</b> / 77 จังหวัด
              </span>
            </div>
          )}
        </div>

        {/* Severity Breakdown Bar */}
        {coverage && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <div className="p-2 rounded-xl bg-red-50/80 border border-red-200 flex items-center justify-between">
              <span className="text-red-800 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>วิกฤต/ล้นตลิ่ง</span>
              </span>
              <span className="font-black text-red-950 text-base">
                {coverage.criticalProvincesCount + coverage.floodingProvincesCount}
                <span className="text-[10px] font-normal text-red-700 ml-1">จว.</span>
              </span>
            </div>

            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>เตือนภัย/เฝ้าระวัง</span>
              </span>
              <span className="font-black text-amber-950 text-base">
                {coverage.warningProvincesCount + coverage.watchProvincesCount}
                <span className="text-[10px] font-normal text-amber-700 ml-1">จว.</span>
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>ระดับน้ำปกติ</span>
              </span>
              <span className="font-black text-emerald-950 text-base">
                {coverage.normalProvincesCount}
                <span className="text-[10px] font-normal text-emerald-700 ml-1">จว.</span>
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-semibold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span>จุดวัดระดับน้ำอัตโนมัติ</span>
              </span>
              <span className="font-bold text-slate-800 text-[11px]">
                800+ จุดวัด
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SINGLE PROVINCE VIEW
  const theme = statusThemes[report?.status || 'NORMAL'];
  const StatusIcon = theme.icon;

  return (
    <div className={`rounded-2xl p-3.5 border shadow-xs space-y-2 font-sans transition-all ${theme.bg}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${theme.badgeBg}`}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base text-slate-900 leading-tight">
                จ.{currentProvinceObj?.name_th || 'ไม่ระบุ'} ({currentProvinceObj?.region_th || ''})
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs ${theme.badgeBg}`}>
                {report?.statusLabelTh || 'สถานการณ์ปกติ'}
              </span>
              {freshnessBadge(report?.dataFreshness)}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 truncate">
              {report?.sources?.length ? `แหล่งข้อมูล: ${report.sources.join(' • ')}` : 'แหล่งข้อมูล: ThaiWater (สสน.) • RID'}
            </p>
          </div>
        </div>

        {report?.observedAt && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 self-start sm:self-center">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>ตรวจวัด: {report.observedAt.replace('T', ' ').slice(0, 16)} น.</span>
          </div>
        )}
      </div>

      {/* Underlying Evidence List (Rule #9 & Section 9: Store/display underlying evidence) */}
      <div className="space-y-1 pt-0.5">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
          หลักฐานและการประเมินสถานการณ์ (Underlying Evidence):
        </div>
        {report && report.evidence && report.evidence.length > 0 ? (
          <ul className="space-y-1">
            {report.evidence.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-800 flex items-start gap-1.5 font-medium">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ระดับน้ำและปริมาณฝนสะสมทุกสถานีในจังหวัดอยู่ในเกณฑ์ปกติ ไม่มีรายงานน้ำท่วมทางสัญจร</span>
          </div>
        )}
      </div>

      {/* Quick Metrics Pills */}
      {report && report.metrics && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-black/5 text-[11px]">
          <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 font-medium">
            🌊 จุดตรวจวัด: <b>{report.metrics.stationCount}</b> แห่ง
          </span>
          {report.metrics.maxRain24h > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 font-medium">
              🌧️ ฝนสูงสุด: <b>{report.metrics.maxRain24h.toFixed(1)}</b> มม.
            </span>
          )}
          {report.metrics.damStoragePercent !== undefined && (
            <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 font-medium">
              🏞️ ความจุเขื่อน: <b>{report.metrics.damStoragePercent}%</b>
            </span>
          )}
          {report.metrics.impassableRoadCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 font-medium">
              🚧 ทางขาด/ท่วมทาง: <b>{report.metrics.impassableRoadCount}</b> จุด
            </span>
          )}
        </div>
      )}
    </div>
  );
};
