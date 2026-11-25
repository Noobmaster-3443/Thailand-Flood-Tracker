export type ToxinContaminationStatus =
  | 'detected'
  | 'downstream_watch'
  | 'ongoing_risk'
  | 'legacy_scar'
  | 'warehouse_waste'
  | 'no_data';

export type ToxinTypeId =
  | 'all'
  | 'lead'
  | 'cadmium'
  | 'arsenic'
  | 'industrial_waste';

export interface ToxinStatusMeta {
  id: ToxinContaminationStatus;
  label_th: string;
  shortDesc_th: string;
  color: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  pattern?: 'dots' | 'stripes' | 'solid';
}

export interface ToxinTypeMeta {
  id: ToxinTypeId;
  name_th: string;
  name_en: string;
  symbol?: string;
  description_th: string;
  safeLimitNote_th?: string;
}

export interface ProvinceToxinRecord {
  provinceNameTh: string;
  status: ToxinContaminationStatus;
  toxins: Exclude<ToxinTypeId, 'all'>[];
  rivers: string[];
  summary_th: string;
  detailNote_th: string;
  sources: string[];
}

export interface ToxinHealthSection {
  title_th: string;
  icon: 'alert' | 'shield' | 'phone' | 'medical';
  items: string[];
}

export interface ToxinHotline {
  name_th: string;
  number: string;
  description_th: string;
}
