'use client';

import React, { useState } from 'react';
import { X, RefreshCw, Radio, ExternalLink, ShieldCheck, ZoomIn, ZoomOut, Maximize2, AlertTriangle } from 'lucide-react';

interface BmaRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BmaRadarModal: React.FC<BmaRadarModalProps> = ({ isOpen, onClose }) => {
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasError(false);
    setIsLoaded(false);
    setRefreshKey(Date.now());
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:pt-4 bg-slate-950/80 backdrop-blur-md font-sans animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden text-white"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 2rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  เรดาร์ตรวจฝน กทม. (สำนักการระบายน้ำ)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ภาพโทรมาตรสด</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                สถานีเรดาร์หนองจอก • ครอบคลุมพื้นที่กรุงเทพมหานครและปริมณฑล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 active:scale-95 flex items-center gap-1 text-xs font-semibold"
              title="รีเฟรชภาพสด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden md:inline">รีเฟรช</span>
            </button>

            <a
              href="https://weather.bangkok.go.th/radar"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white transition-all cursor-pointer border border-indigo-500/40 flex items-center gap-1 text-xs font-semibold"
              title="เปิดดูบนเว็บทางการ DDS กทม."
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ต้นทาง DDS</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Radar Image Viewer Area */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 bg-slate-950 flex flex-col items-center justify-center relative min-h-[380px] sm:min-h-[500px]">
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 z-10">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">กำลังโหลดภาพเรดาร์ กทม. สด...</span>
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">ไม่สามารถโหลดภาพเรดาร์ได้ชั่วคราว</p>
                <p className="text-xs text-slate-400 mt-1">เซิร์ฟเวอร์ต้นทาง BMA/TMD อาจปิดให้บริการชั่วคราว</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  ลองโหลดใหม่
                </button>
                <a
                  href="https://weather.bangkok.go.th/radar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ดูบนเว็บ DDS ทางการ
                </a>
              </div>
            </div>
          ) : (
            <div 
              className="relative transition-transform duration-200 ease-out select-none"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={refreshKey}
                src={`/api/bma/radar?t=${refreshKey}`}
                alt="เรดาร์ตรวจฝนหนองจอก สำนักการระบายน้ำ กทม."
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                className="max-h-[70vh] w-auto rounded-2xl shadow-2xl border border-slate-800 object-contain mx-auto"
              />
            </div>
          )}

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-2xl border border-slate-700 shadow-xl">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.8, prev - 0.2))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="ซูมออก"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-300 px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(2.0, prev + 0.2))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="ซูมเข้า"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-white border-l border-slate-700 pl-2 transition-colors text-[10px] font-bold"
              title="รีเซ็ตขนาด"
            >
              รีเซ็ต
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
            <span>แหล่งข้อมูลทางการ: สำนักการระบายน้ำ กรุงเทพมหานคร (DDS) • สถานีเรดาร์หนองจอก</span>
          </div>
          <span className="text-slate-500">อัปเดตอัตโนมัติทุก 3-5 นาที</span>
        </div>
      </div>
    </div>
  );
};
