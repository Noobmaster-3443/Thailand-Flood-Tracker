/**
 * Royal Irrigation Department (RID) Official Dam & Reservoir Provider
 * Sourced directly from official endpoint: https://app.rid.go.th/reservoir/api/dam/public
 * Real-time storage, capacity, inflow, outflow, and status for 35 major reservoirs nationwide.
 */

import { DamReservoirInfo, SeverityLevel } from '@/types/telemetry';
import { DataResult, DataStatus } from './types';

const RID_PUBLIC_DAM_URL = 'https://app.rid.go.th/reservoir/api/dam/public';

interface DamGeoMetadata {
  provinceId: string;
  district: string;
  subdistrict: string;
  lat: number;
  lng: number;
  nameEn: string;
}

const DAM_METADATA_MAP: Record<string, DamGeoMetadata> = {
  // ภาคเหนือ
  '100104': { provinceId: 'chiangmai', district: 'ดอยสะเก็ด', subdistrict: 'ลวงเหนือ', lat: 18.9167, lng: 99.1333, nameEn: 'Mae Kuang Udom Thara Dam' },
  '100105': { provinceId: 'lampang', district: 'เมืองลำปาง', subdistrict: 'บ้านแลง', lat: 18.3667, lng: 99.6167, nameEn: 'Kiew Lom Dam' },
  '100106': { provinceId: 'lampang', district: 'แจ้ห่ม', subdistrict: 'วิเชตนคร', lat: 18.7333, lng: 99.5667, nameEn: 'Kiew Kho Ma Dam' },
  '100107': { provinceId: 'phitsanulok', district: 'วัดโบสถ์', subdistrict: 'คันโช้ง', lat: 17.0667, lng: 100.4167, nameEn: 'Khwae Noi Bamrung Dan Dam' },
  '100108': { provinceId: 'sukhothai', district: 'ทุ่งเสลี่ยม', subdistrict: 'กลางดง', lat: 17.2667, lng: 99.3833, nameEn: 'Mae Mok Dam' },
  '200101': { provinceId: 'tak', district: 'สามเงา', subdistrict: 'บ้านนา', lat: 17.2433, lng: 98.9950, nameEn: 'Bhumibol Dam' },
  '200102': { provinceId: 'uttaradit', district: 'ท่าปลา', subdistrict: 'ผาเลือด', lat: 17.7667, lng: 100.5500, nameEn: 'Sirikit Dam' },
  '200103': { provinceId: 'chiangmai', district: 'แม่แตง', subdistrict: 'ช่อแล', lat: 19.1667, lng: 99.0333, nameEn: 'Mae Ngat Somboon Chon Dam' },

  // ภาคตะวันออกเฉียงเหนือ
  '100201': { provinceId: 'udonthani', district: 'กุดจับ', subdistrict: 'เมืองเพีย', lat: 17.3833, lng: 102.6167, nameEn: 'Huai Luang Dam' },
  '100202': { provinceId: 'sakonnakhon', district: 'พังโคน', subdistrict: 'แร่', lat: 17.2833, lng: 103.7333, nameEn: 'Nam Oun Dam' },
  '100206': { provinceId: 'kalasin', district: 'สหัสขันธ์', subdistrict: 'โนนบุรี', lat: 16.6333, lng: 103.5333, nameEn: 'Lam Pao Dam' },
  '100207': { provinceId: 'nakhonratchasima', district: 'สีคิ้ว', subdistrict: 'คลองไผ่', lat: 14.8667, lng: 101.5500, nameEn: 'Lam Takhong Dam' },
  '100208': { provinceId: 'nakhonratchasima', district: 'ปักธงชัย', subdistrict: 'ตะขบ', lat: 14.5667, lng: 101.9167, nameEn: 'Lam Phra Phloeng Dam' },
  '100209': { provinceId: 'nakhonratchasima', district: 'ครบุรี', subdistrict: 'จระเข้หิน', lat: 14.4333, lng: 102.1667, nameEn: 'Mun Bon Dam' },
  '100210': { provinceId: 'nakhonratchasima', district: 'ครบุรี', subdistrict: 'โคกกระชาย', lat: 14.3833, lng: 102.3167, nameEn: 'Lam Sae Dam' },
  '100211': { provinceId: 'buriram', district: 'โนนดินแดง', subdistrict: 'โนนดินแดง', lat: 14.3167, lng: 102.7333, nameEn: 'Lam Nang Rong Dam' },
  '200203': { provinceId: 'sakonnakhon', district: 'ภูพาน', subdistrict: 'โคกภู', lat: 16.9833, lng: 103.9833, nameEn: 'Nam Phung Dam' },
  '200204': { provinceId: 'chaiyaphum', district: 'คอนสาร', subdistrict: 'ทุ่งลุยลาย', lat: 16.5333, lng: 101.6500, nameEn: 'Chulabhorn Dam' },
  '200205': { provinceId: 'khonkaen', district: 'อุบลรัตน์', subdistrict: 'เขื่อนอุบลรัตน์', lat: 16.7733, lng: 102.6233, nameEn: 'Ubol Ratana Dam' },
  '200212': { provinceId: 'ubonratchathani', district: 'สิรินธร', subdistrict: 'นิคมสร้างตนเอง', lat: 15.2000, lng: 105.4333, nameEn: 'Sirindhorn Dam' },

  // ภาคกลาง
  '100301': { provinceId: 'lopburi', district: 'พัฒนานิคม', subdistrict: 'หนองบัว', lat: 14.8667, lng: 101.1000, nameEn: 'Pasak Jolasid Dam' },
  '100302': { provinceId: 'uthaithani', district: 'ลานสัก', subdistrict: 'ระบำ', lat: 15.4833, lng: 99.4500, nameEn: 'Thap Salao Dam' },
  '100303': { provinceId: 'suphanburi', district: 'ด่านช้าง', subdistrict: 'ด่านช้าง', lat: 14.8333, lng: 99.6833, nameEn: 'Krasiao Dam' },

  // ภาคตะวันตก
  '200401': { provinceId: 'kanchanaburi', district: 'ศรีสวัสดิ์', subdistrict: 'ท่ากระดาน', lat: 14.4000, lng: 99.1333, nameEn: 'Srinagarind Dam' },
  '200402': { provinceId: 'kanchanaburi', district: 'ทองผาภูมิ', subdistrict: 'ท่าขนุน', lat: 14.8000, lng: 98.6000, nameEn: 'Vajiralongkorn Dam' },

  // ภาคตะวันออก
  '100501': { provinceId: 'nakhonnayok', district: 'เมืองนครนายก', subdistrict: 'หินตั้ง', lat: 14.3167, lng: 101.3167, nameEn: 'Khun Dan Prakan Chon Dam' },
  '100502': { provinceId: 'chachoengsao', district: 'ท่าตะเกียบ', subdistrict: 'คลองตะเกรา', lat: 13.4167, lng: 101.6500, nameEn: 'Khlong Si Yat Dam' },
  '100503': { provinceId: 'chonburi', district: 'ศรีราชา', subdistrict: 'บางพระ', lat: 13.2167, lng: 100.9833, nameEn: 'Bang Phra Dam' },
  '100504': { provinceId: 'rayong', district: 'ปลวกแดง', subdistrict: 'ปลวกแดง', lat: 12.9167, lng: 101.1833, nameEn: 'Nong Pla Lai Dam' },
  '100505': { provinceId: 'rayong', district: 'วังจันทร์', subdistrict: 'ชุมแสง', lat: 13.0167, lng: 101.4667, nameEn: 'Prasae Dam' },
  '100514': { provinceId: 'prachinburi', district: 'นาดี', subdistrict: 'แก่งดินสอ', lat: 14.1625, lng: 101.9142, nameEn: 'Narubodin Jinda Dam (Huai Samong)' },

  // ภาคใต้
  '100602': { provinceId: 'prachuapkhirikhan', district: 'ปราณบุรี', subdistrict: 'หนองตาแต้ม', lat: 12.3500, lng: 99.9167, nameEn: 'Pranburi Dam' },
  '200601': { provinceId: 'phetchaburi', district: 'แก่งกระจาน', subdistrict: 'แก่งกระจาน', lat: 12.9167, lng: 99.6333, nameEn: 'Kaeng Krachan Dam' },
  '200603': { provinceId: 'suratthani', district: 'บ้านตาขุน', subdistrict: 'เขาพัง', lat: 8.9667, lng: 98.8167, nameEn: 'Rajjaprabha Dam (Cheow Lan)' },
  '200604': { provinceId: 'yala', district: 'บันนังสตา', subdistrict: 'บาเจาะ', lat: 6.1500, lng: 101.2833, nameEn: 'Bang Lang Dam' },
};

function determineDamSeverity(percent: number): { severity: SeverityLevel; label: string } {
  if (percent >= 100) return { severity: 'red', label: 'วิกฤต (น้ำล้นความจุอ่าง)' };
  if (percent >= 90) return { severity: 'orange', label: 'เตือนภัย (น้ำมากเกิน 90%)' };
  if (percent >= 80) return { severity: 'yellow', label: 'เฝ้าระวัง (น้ำมาก 80-90%)' };
  return { severity: 'green', label: 'ปกติ (น้ำอยู่ในเกณฑ์ปลอดภัย)' };
}

/**
 * Fetch live official 35 dam reservoir data from RID public API
 */
export async function fetchRidDams(timeoutMs: number = 8000): Promise<DataResult<DamReservoirInfo[]>> {
  const fetchedAt = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(RID_PUBLIC_DAM_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PrachinburiFloodTracker/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    clearTimeout(timer);

    if (!res.ok) {
      return {
        data: null,
        source: 'RID Dam Reservoir API',
        sourceAgency: 'RID',
        status: 'UNAVAILABLE',
        fetchedAt,
        observedAt: null,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const json = await res.json();
    const observedDate = json?.date || fetchedAt.slice(0, 10);
    const regions: any[] = json?.data || [];

    const damsList: DamReservoirInfo[] = [];

    regions.forEach((regionItem) => {
      const dams: any[] = regionItem.dam || [];
      dams.forEach((dm) => {
        const damId = String(dm.id);
        const meta = DAM_METADATA_MAP[damId];
        const capacity = Number(dm.capacity) || 0;
        const currentStorage = Number(dm.storage) || Number(dm.volume) || 0;
        const percent = Number(dm.percent_storage) || (capacity > 0 ? (currentStorage / capacity) * 100 : 0);
        const inflow = Number(dm.inflow) || 0;
        const outflow = Number(dm.outflow) || 0;

        const { severity, label } = determineDamSeverity(percent);

        damsList.push({
          id: `dam-${damId}`,
          name_th: dm.name || 'เขื่อนชลประทาน',
          name_en: meta?.nameEn || dm.name,
          province: meta?.provinceId || 'prachinburi',
          district: meta?.district || 'เมือง',
          subdistrict: meta?.subdistrict || '',
          latitude: meta?.lat || 14.1625,
          longitude: meta?.lng || 101.9142,
          capacity_storage_mcm: capacity,
          current_storage_mcm: currentStorage,
          capacity_percentage: Math.round(percent * 10) / 10,
          inflow_mcm_day: inflow,
          outflow_mcm_day: outflow,
          severity,
          status_label: label,
          description: `กักเก็บ ${currentStorage} / ${capacity} ล้าน ลบ.ม. (${percent.toFixed(1)}%) • น้ำไหลเข้า ${inflow} ลบ.ม./วัน • ระบายน้ำ ${outflow} ลบ.ม./วัน`,
          observed_at: observedDate,
          agency: dm.owner || 'กรมชลประทาน (RID)',
          source_url: 'https://app.rid.go.th/reservoir',
          data_status: 'LIVE' as DataStatus,
        });
      });
    });

    return {
      data: damsList,
      source: 'กรมชลประทาน (ศูนย์ปฏิบัติการน้ำอัจฉริยะ SWOC / RID)',
      sourceAgency: 'RID',
      status: 'LIVE',
      fetchedAt,
      observedAt: observedDate,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      data: null,
      source: 'RID Dam Reservoir API',
      sourceAgency: 'RID',
      status: 'UNAVAILABLE',
      fetchedAt,
      observedAt: null,
      error: err?.message || 'Failed to fetch RID dams',
    };
  }
}
