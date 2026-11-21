'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  X, 
  ShieldCheck,
  Waves,
  Car,
  Droplets,
  Navigation,
  Anchor,
  CloudRain
} from 'lucide-react';
import { NationwideCoverageSummary, DataStatus } from '@/lib/providers/types';

interface ApiStatusMenuProps {
  coverage?: NationwideCoverageSummary | null;
  lastUpdated?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isMobileTrigger?: boolean;
}

interface ServiceStatusItem {
  id: string;
  name: string;
  agency: string;
  scope: string;
  status: DataStatus;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ApiStatusMenu: React.FC<ApiStatusMenuProps> = ({
  coverage,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  isMobileTrigger = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside (for desktop dropdown popover)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const providers = coverage?.providers;

  // 6 Essential Government Open Data APIs
  const services: ServiceStatusItem[] = [
    {
      id: 'thaiwater',
      name: 'คลังข้อมูลน้ำแห่งชาติ',
      agency: 'สถาบันสารสนเทศทรัพยากรน้ำ (สสน.)',
      scope: 'โทรมาตรระดับน้ำ & ฝนสะสม 77 จังหวัด',
      status: providers?.thaiwater ?? 'LIVE',
      url: 'https://www.thaiwater.net',
      icon: Waves,
    },
    {
      id: 'bma',
      name: 'สำนักการระบายน้ำ กทม.',
      agency: 'กรุงเทพมหานคร (DDS)',
      scope: 'เซนเซอร์น้ำท่วมขังถนน & อุโมงค์ 248 จุด',
      status: providers?.bma ?? 'LIVE',
      url: 'https://dds.bangkok.go.th',
      icon: Car,
    },
    {
      id: 'rid',
      name: 'กรมชลประทาน (RID)',
      agency: 'กระทรวงเกษตรและสหกรณ์',
      scope: 'ปริมาตรน้ำอ่างเก็บน้ำและเขื่อนหลัก 35 แห่ง',
      status: providers?.rid ?? 'LIVE',
      url: 'https://water.rid.go.th',
      icon: Droplets,
    },
    {
      id: 'doh',
      name: 'กรมทางหลวง (DOH)',
      agency: 'กระทรวงคมนาคม',
      scope: 'จุดเตือนภัยน้ำท่วมทางหลวงและเส้นทางสัญจร',
      status: providers?.doh ?? 'STATIC',
      url: 'https://www.doh.go.th',
      icon: Navigation,
    },
    {
      id: 'navyTide',
      name: 'กรมอุทกศาสตร์ กองทัพเรือ',
      agency: 'กองทัพเรือ',
      scope: 'ระดับน้ำทะเลหนุนสูง ป้อมพระจุลจอมเกล้า',
      status: providers?.navyTide ?? 'STATIC',
      url: 'https://www.hydro.navy.mi.th',
      icon: Anchor,
    },
    {
      id: 'tmd',
      name: 'กรมอุตุนิยมวิทยา (TMD)',
      agency: 'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม',
      scope: 'การแจ้งเตือนภัยสภาพอากาศ & ฝนตกหนัก',
      status: providers?.tmd ?? 'LIVE',
      url: 'https://www.tmd.go.th',
      icon: CloudRain,
    },
  ];

  // Calculate overall health summary
  const hasUnavailable = services.some((s) => s.status === 'UNAVAILABLE');
  const hasStale = services.some((s) => s.status === 'STALE');
  const liveCount = services.filter((s) => s.status === 'LIVE' || s.status === 'STATIC').length;

  let overallStatus: 'HEALTHY' | 'STALE' | 'DEGRADED' = 'HEALTHY';
  let pillText = 'API ปกติ';
  let pillBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/90';
  let dotPingClass = 'bg-emerald-400';
  let dotClass = 'bg-emerald-500';

  if (hasUnavailable) {
    overallStatus = 'DEGRADED';
    pillText = 'API ขัดข้องบางส่วน';
    pillBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/90';
    dotPingClass = 'bg-rose-400';
    dotClass = 'bg-rose-500';
  } else if (hasStale) {
    overallStatus = 'STALE';
    pillText = 'API ข้อมูลล่าช้า';
    pillBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/90';
    dotPingClass = 'bg-amber-400';
    dotClass = 'bg-amber-500';
  }

  const getStatusBadge = (status: DataStatus) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>เชื่อมต่อสด</span>
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>ข้อมูลล่าช้า</span>
          </span>
        );
      case 'STATIC':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>เชื่อมต่อข้อมูลฐาน</span>
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>ไม่พร้อมใช้งาน</span>
          </span>
        );
    }
  };

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
    : 'ล่าสุด';

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* 1. Trigger Button */}
      {isMobileTrigger ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex-shrink-0 active:scale-95"
          title="ตรวจสอบสถานะการเชื่อมต่อ API (System Health)"
          aria-label="ตรวจสอบสถานะการเชื่อมต่อ API"
        >
          <Activity className={`w-4 h-4 ${overallStatus === 'DEGRADED' ? 'text-rose-600' : overallStatus === 'STALE' ? 'text-amber-600' : 'text-emerald-600'}`} />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotPingClass}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`} />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 shadow-2xs ${pillBadgeClass}`}
          title="คลิกเพื่อดูสถานะการเชื่อมต่อ API ภาครัฐทั้ง 6 แหล่ง"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotPingClass}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`} />
          </span>
          <Activity className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">{pillText}</span>
        </button>
      )}

      {/* 2. Dropdown Popover on Desktop / Responsive Sheet on Mobile */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[1000] lg:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`
              fixed lg:absolute z-[1001]
              bottom-4 inset-x-3 sm:inset-x-auto sm:right-0 sm:bottom-auto lg:bottom-auto
              lg:top-full lg:right-0 lg:mt-2
              w-auto sm:w-[420px] max-w-[calc(100vw-1.5rem)]
              bg-white rounded-2xl shadow-2xl border border-slate-200/95
              p-4 font-sans text-left animate-in fade-in zoom-in-95 duration-150
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    สถานะเชื่อมต่อ API ภาครัฐ
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    ความสมบูรณ์ของระบบโทรมาตรและข้อมูลสด
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overall System Health Status Banner */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${overallStatus === 'DEGRADED' ? 'text-rose-500' : 'text-emerald-600'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {overallStatus === 'HEALTHY' 
                      ? `ระบบพร้อมใช้งาน ${liveCount}/${services.length} บริการ (100%)` 
                      : `ระบบทำงาน ${liveCount}/${services.length} บริการ`}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>ซิงค์ข้อมูลล่าสุด {formattedTime}</span>
                  </div>
                </div>
              </div>

              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200/90 shadow-2xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex-shrink-0"
                  title="กดเพื่อตรวจวัดสัญญาณชีพ API ใหม่ทันที"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="text-[11px]">{isRefreshing ? 'กำลังซิงค์...' : 'Sync Now'}</span>
                </button>
              )}
            </div>

            {/* List of 6 Official Services */}
            <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div
                    key={service.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-800">
                            {service.name}
                          </span>
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 inline-flex items-center"
                            title={`เปิดเว็บไซต์ต้นทาง ${service.name}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {service.scope}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {service.agency}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Transparency Notice */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>ดึงข้อมูลตรงจาก Open Data ภาครัฐ</span>
              </span>
              <span>แคช 1-5 นาที</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
