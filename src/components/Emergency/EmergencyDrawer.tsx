'use client';

import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  Copy,
  Check,
  ShieldAlert,
  HeartPulse,
  Clock,
  MapPin,
} from 'lucide-react';
import { EmergencyContact } from '@/types';
import { DEFAULT_OFFICIAL_CONTACTS } from '@/data/emergency-contacts';

interface EmergencyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyDrawer: React.FC<EmergencyDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [contacts] = useState<EmergencyContact[]>(DEFAULT_OFFICIAL_CONTACTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, phoneNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNumber.replace(/[^0-9]/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Separate official from community-approved
  const officialContacts = contacts.filter((c) => c.is_official);
  const communityApproved = contacts.filter((c) => !c.is_official);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:pt-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white w-full max-w-lg max-h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)] sm:max-h-[85dvh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 2rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between bg-red-600 text-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base leading-tight truncate">เบอร์โทรสายด่วนฉุกเฉิน</h2>
              <p className="text-xs text-red-100 truncate">บริการประชาชนตลอด 24 ชั่วโมง ฟรีทุกเครือข่าย</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-sm"
            aria-label="ปิดสายด่วนฉุกเฉิน"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* Top 2 Primary Official Hotlines (1784 & 1669) */}
          <div className="space-y-3">
            {/* 1784 DDPM */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-red-500/30">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-2xl text-red-600 tracking-tight">1784</span>
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        โทรฟรี 24 ชม.
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">สายด่วน ปภ. รับแจ้งเหตุอุทกภัย</h3>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                แจ้งเตือนสาธารณภัย น้ำท่วมฉับพลัน ขอเรือท้องแบน และอพยพเร่งด่วน
              </p>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href="tel:1784"
                  className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>โทรออก 1784 ทันที</span>
                </a>
                <button
                  onClick={(e) => handleCopy('1784', '1784', e)}
                  className="w-9 h-9 rounded-xl bg-white border border-red-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
                  title="คัดลอกเบอร์"
                >
                  {copiedId === '1784' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 1669 EMS */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/30">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-2xl text-emerald-600 tracking-tight">1669</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        โทรฟรี 24 ชม.
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">การแพทย์ฉุกเฉิน (EMS)</h3>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                รับแจ้งเหตุเจ็บป่วยฉุกเฉิน อุบัติเหตุทางน้ำ และเรียกรถพยาบาลกู้ชีพ
              </p>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href="tel:1669"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>โทรออก 1669 ทันที</span>
                </a>
                <button
                  onClick={(e) => handleCopy('1669', '1669', e)}
                  className="w-9 h-9 rounded-xl bg-white border border-emerald-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
                  title="คัดลอกเบอร์"
                >
                  {copiedId === '1669' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Approved Community Emergency Contacts (if any approved) */}
          {communityApproved.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                เบอร์กู้ภัยและหน่วยช่วยเหลือในพื้นที่ (ผ่านการอนุมัติแล้ว):
              </span>
              <div className="space-y-2">
                {communityApproved.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">{contact.name}</span>
                        {contact.district && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                            {contact.district}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{contact.description}</p>
                      <p className="font-mono font-bold text-blue-600 mt-0.5 text-xs">{contact.phone}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => handleCopy(contact.id, contact.phone, e)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center"
                      >
                        {copiedId === contact.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" /> โทร
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>กรณีฉุกเฉินเร่งด่วน โทร 1784 หรือ 1669 ได้ตลอด 24 ชั่วโมง</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
