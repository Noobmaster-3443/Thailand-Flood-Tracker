'use client';

import React, { useRef } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Waves,
  Maximize2,
  Minimize2
} from 'lucide-react';

export type BottomSheetState = 'collapsed' | 'intermediate' | 'expanded';

interface MobileDashboardBottomSheetProps {
  sheetState: BottomSheetState;
  onSheetStateChange: (state: BottomSheetState) => void;
  // Compact preview metrics (Collapsed state)
  activeProvinceName: string;
  criticalCount: number;
  warningCount: number;
  totalActiveStations: number;
  highTideMorningPeak?: number | null;
  highTideTime?: string | null;
  onOpenHighTide?: () => void;
  // Content rendered inside the sheet
  children: React.ReactNode;
}

export const MobileDashboardBottomSheet: React.FC<MobileDashboardBottomSheetProps> = ({
  sheetState,
  onSheetStateChange,
  activeProvinceName,
  criticalCount,
  warningCount,
  totalActiveStations,
  highTideMorningPeak,
  highTideTime,
  onOpenHighTide,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  // Height configurations:
  // Collapsed: Peek banner (~64px / h-16)
  // Intermediate: Half screen (~45vh)
  // Expanded: Almost full screen (~86vh leaving header visible)
  const getTranslateStyle = () => {
    switch (sheetState) {
      case 'collapsed':
        return 'translate-y-[calc(100%-4.25rem)]';
      case 'intermediate':
        return 'translate-y-[calc(100%-45vh)]';
      case 'expanded':
        return 'translate-y-[calc(100%-86vh)]';
    }
  };

  // Touch Handlers for smooth gesture dragging
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragStartY.current === null) return;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - dragStartY.current;

    isDragging.current = false;
    dragStartY.current = null;

    // Threshold for snapping: 45px
    if (deltaY < -45) {
      // Dragged upwards
      if (sheetState === 'collapsed') {
        onSheetStateChange('intermediate');
      } else if (sheetState === 'intermediate') {
        onSheetStateChange('expanded');
      }
    } else if (deltaY > 45) {
      // Dragged downwards
      if (sheetState === 'expanded') {
        onSheetStateChange('intermediate');
      } else if (sheetState === 'intermediate') {
        onSheetStateChange('collapsed');
      }
    }
  };

  // Quick cycle state helper on header tap
  const handleHeaderTap = (e: React.MouseEvent) => {
    // If clicking on a button inside header, don't toggle
    if ((e.target as HTMLElement).closest('button')) return;

    if (sheetState === 'collapsed') {
      onSheetStateChange('intermediate');
    } else if (sheetState === 'intermediate') {
      onSheetStateChange('collapsed');
    } else {
      onSheetStateChange('intermediate');
    }
  };

  return (
    <div
      ref={sheetRef}
      className={`fixed inset-x-0 bottom-0 z-[500] transition-transform duration-300 ease-out will-change-transform flex flex-col bg-white/95 backdrop-blur-md rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] border-t border-slate-200/90 font-sans ${getTranslateStyle()} lg:hidden`}
      style={{
        maxHeight: '90vh',
        height: '90vh',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}
    >
      {/* Draggable Handle & Quick Summary Bar */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleHeaderTap}
        className="w-full flex-shrink-0 cursor-pointer select-none px-4 pt-2 pb-2.5 bg-white/80 active:bg-slate-100/80 transition-colors rounded-t-3xl border-b border-slate-100"
      >
        {/* Grab Pill */}
        <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mx-auto mb-2 transition-colors" />

        {/* Peek Summary Header (Always visible in collapsed & intermediate) */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
            <span className="font-bold text-slate-900 truncate">
              {activeProvinceName}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ({totalActiveStations} จุดตรวจ)
            </span>
          </div>

          {/* Quick Pill Status Indicators */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {criticalCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-2xs animate-pulse">
                <span>🚨 {criticalCount} ล้นตลิ่ง</span>
              </span>
            ) : warningCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                <span>⚠️ {warningCount} จ่อล้น</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>ปกติทุกจุด</span>
              </span>
            )}

            {/* Quick State Toggle Buttons */}
            {sheetState === 'collapsed' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSheetStateChange('intermediate');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="ขยายแดชบอร์ด"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            ) : sheetState === 'intermediate' ? (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSheetStateChange('expanded');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="ขยายเต็มจอ"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSheetStateChange('collapsed');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="ยุบแดชบอร์ด"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSheetStateChange('intermediate');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="ย่อลง"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* High Tide Ribbon Quick Indicator if present */}
        {highTideMorningPeak !== undefined && highTideMorningPeak !== null && onOpenHighTide && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenHighTide();
            }}
            className="mt-1.5 flex items-center justify-between text-[11px] bg-blue-50/80 text-blue-900 px-2 py-0.5 rounded-lg border border-blue-200/60"
          >
            <div className="flex items-center gap-1 truncate">
              <Waves className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">
                น้ำหนุนเจ้าพระยา: <b>+{highTideMorningPeak} ม.รทก.</b> ({highTideTime || 'เช้าวันนี้'})
              </span>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold underline flex-shrink-0 ml-1">
              ดูตาราง
            </span>
          </div>
        )}
      </div>

      {/* Sheet Scrollable Body */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
};
