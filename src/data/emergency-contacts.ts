import { EmergencyContact } from '@/types';

export const DEFAULT_OFFICIAL_CONTACTS: EmergencyContact[] = [
  {
    id: 'ddpm-hotline',
    name: 'สายด่วน ปภ. (กรมป้องกันและบรรเทาสาธารณภัย)',
    description: 'แจ้งเตือนสาธารณภัย อุทกภัย และขอความช่วยเหลือฉุกเฉินตลอด 24 ชั่วโมง',
    phone: '1784',
    category: 'government',
    is_24h: true,
    is_approved: true,
    is_official: true,
  },
  {
    id: 'ems-hotline',
    name: 'สายด่วนกู้ชีพ-การแพทย์ฉุกเฉิน (EMS)',
    description: 'รับแจ้งเหตุเจ็บป่วยฉุกเฉิน อุบัติเหตุ และเรียกรถพยาบาลกู้ชีพตลอด 24 ชั่วโมง',
    phone: '1669',
    category: 'hospital',
    is_24h: true,
    is_approved: true,
    is_official: true,
  },
];

export const EMERGENCY_CONTACTS = DEFAULT_OFFICIAL_CONTACTS;
