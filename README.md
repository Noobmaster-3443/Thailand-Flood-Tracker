# Thailand Flood Tracker (ระบบติดตามสถานการณ์น้ำและอุทกภัยทั่วประเทศไทย)

[ภาษาไทย](#ภาษาไทย) | [English](#english)

---

<a id="ภาษาไทย"></a>
## ภาษาไทย

### เกี่ยวกับโครงการ
Thailand Flood Tracker เป็นเว็บแอปพลิเคชันสำหรับรวบรวม ประมวลผล และแสดงผลข้อมูลสถานการณ์น้ำ ปริมาณน้ำฝน สภาพเขื่อน จุดเสี่ยงทางหลวง และน้ำท่วมผิวจราจรทั่วประเทศไทย นำมาจัดแสดงร่วมกันบนแผนที่เชิงโต้ตอบแบบรวมศูนย์ เพื่อให้ประชาชนและผู้สนใจสามารถติดตามเฝ้าระวังสถานการณ์น้ำในแต่ละพื้นที่ได้อย่างสะดวก รวดเร็ว และรอบด้านในจุดเดียว

โครงการนี้ริเริ่มพัฒนาขึ้นจากโครงงานระดับประกาศนียบัตรวิชาชีพ (ปวช.) เพื่อแก้ปัญหาข้อมูลด้านทรัพยากรน้ำของภาครัฐที่มักกระจายอยู่ตามเว็บไซต์ของแต่ละหน่วยงานอย่างเป็นเอกเทศ และได้รับการปรับปรุงพัฒนาอย่างต่อเนื่องจนก้าวสู่เวอร์ชัน 2.0 โดยเน้นความเสถียรของระบบ ความโปร่งใสของข้อมูล และความสะดวกในการใช้งานบนโทรศัพท์มือถือ

เข้าชมเว็บไซต์: [https://thailand-flood-tracker.vercel.app](https://thailand-flood-tracker.vercel.app)

---

### ความสามารถหลักของระบบ

1. **แผนที่สถานการณ์น้ำเชิงโต้ตอบ (Interactive Telemetry Map)**
   - แสดงสถานีโทรมาตรระดับน้ำและปริมาณฝนสะสม 24 ชม. ทั่วประเทศ (77 จังหวัด) พร้อมระบบรวมกลุ่มหมุด (Marker Clustering) เพื่อความลื่นไหลในการแสดงผล
   - จุดตรวจวัดน้ำท่วมขังบนผิวจราจรในเขตกรุงเทพมหานคร 254 จุด จากสำนักการระบายน้ำ กทม.
   - ข้อมูลปริมาณน้ำ ความจุ และอัตราการระบายของอ่างเก็บน้ำ/เขื่อนขนาดใหญ่ 35 แห่งทั่วประเทศ
   - โครงข่ายแม่น้ำ 2 ระดับ (Progressive River Network) พร้อมแอนิเมชันลูกคลื่นแสดงทิศทางการไหลของน้ำตามแรงโน้มถ่วงจริง (Downstream Flow Animation):
     - **ระดับที่ 1 (Tier 1):** แม่น้ำสายหลัก 772 ช่วงลำน้ำ แสดงผลตั้งแต่ระดับภาพรวมประเทศ
     - **ระดับที่ 2 (Tier 2):** ลำน้ำสาขาและคลองสายสำคัญ 1,000 ช่วงลำน้ำ โหลดเพิ่มขึ้นเมื่อซูมเข้าระดับลุ่มน้ำและจังหวัด
   - แผนที่เรดาร์ตรวจจับกลุ่มฝนแบบเคลื่อนไหวตามช่วงเวลา (RainViewer Radar Time-lapse) และภาพเรดาร์ตรวจจับฝนของ กทม.
   - จุดแจ้งเตือนน้ำท่วมทางหลวงและผิวจราจร พร้อมระบุสถานะรถยนต์สามารถสัญจรผ่านได้หรือไม่ได้

2. **ประสบการณ์ใช้งานที่ออกแบบสำหรับมือถือ (Mobile-First Experience)**
   - แถบนำทางด้านบนแบบลอยตัว (Floating Telemetry Navbar) พร้อมแถบเลือกจังหวัดและตัวกรองข้อมูลแบบบรรทัดเดียว (Single-row Filter Bar) ที่ใช้งานง่าย
   - หน้าต่างแดชบอร์ดด้านล่าง (Mobile Dashboard Bottom Sheet) ปรับระดับได้ 3 ระดับ: ย่อดูสรุปย่อ, เปิดครึ่งจอเพื่อดูรายการสถานี, และขยายเต็มจอ
   - ระบบตรวจจับและซ่อนปุ่มควบคุมแผนที่อัตโนมัติเมื่อเปิด Bottom Sheet เต็มจอ เพื่อไม่ให้บดบังเนื้อหา
   - รองรับการย่อขยายแผนที่ด้วยสองนิ้ว (Pinch-to-zoom) อย่างเป็นธรรมชาติบนสมาร์ตโฟน

3. **ความต่อเนื่องของระบบและความโปร่งใสของข้อมูล (Resilience & Transparency)**
   - **การแยกความล้มเหลวอิสระ (Failure Isolation):** เรียกข้อมูลจากแหล่งต่าง ๆ แบบคู่ขนานด้วย `Promise.allSettled` หากมี API แหล่งใดล่มหรือหมดเวลาเชื่อมต่อ จะไม่ส่งผลกระทบต่อแหล่งอื่น
   - **แคชในหน่วยความจำเซิร์ฟเวอร์ (In-Memory Cache):** กำหนดอายุข้อมูล (TTL) แยกตามความถี่จริงของแต่ละหน่วยงาน เพื่อลดภาระของ API ต้นทางและเพิ่มความเร็วในการโหลด
   - **ป้ายระบุสถานะข้อมูล 4 ระดับ:** ระบุความสดใหม่ของข้อมูลอย่างตรงไปตรงมา ได้แก่ ข้อมูลสด (LIVE), ข้อมูลล่าช้า (STALE), ข้อมูลโครงสร้างอ้างอิง (STATIC) และข้อมูลไม่พร้อมใช้งาน (UNAVAILABLE)
   - **ความถูกต้องของข้อมูล:** ปิดการแสดงผลข้อมูลจำลองเก่าที่อาจก่อให้เกิดความสับสน (เช่น จุดเตือนภัยน้ำป่าหลากในอดีต) และยกเลิกการฝังเวลาแบบตายตัว หากไม่พบเวลาจริงจะแสดงข้อความแจ้งอย่างตรงไปตรงมา

4. **ศูนย์ประสานงานฉุกเฉินและพยากรณ์อากาศ**
   - รวมเบอร์โทรศัพท์สายด่วนเหตุฉุกเฉินและสาธารณภัย (ปภ. 1784, กู้ชีพฉุกเฉิน 1669) พร้อมเปิดโทรออกได้ทันที
   - ตรวจสอบพยากรณ์อากาศล่วงหน้า 7 วัน (อุณหภูมิ, โอกาสฝน, ปริมาณฝน) สำหรับพื้นที่ต่าง ๆ ทั่วประเทศ

---

### เทคโนโลยีที่ใช้ในการพัฒนา

- **แกนหลักของระบบ (Framework & Runtime):** [Next.js](https://nextjs.org/) 15 (App Router, Server-side API Routes), [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) 5
- **แผนที่และข้อมูลเชิงพื้นที่ (Mapping & Geospatial):** [Leaflet](https://leafletjs.com/) 1.9, [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) 1.5, GeoJSON
- **การจัดสไตล์และส่วนติดต่อผู้ใช้ (UI & Styling):** [Tailwind CSS](https://tailwindcss.com/) 3.4, [Lucide React](https://lucide.dev/) (Icons), `clsx`, `tailwind-merge`
- **การติดตั้งและส่งมอบ (Deployment):** [Vercel](https://vercel.com/) (Edge Network & Serverless Functions)

---

### แหล่งข้อมูลและสถานะการเชื่อมต่อ

| แหล่งข้อมูล / หน่วยงาน | ข้อมูลที่นำมาประมวลผล | สถานะในระบบ | การทำงาน |
|:---|:---|:---:|:---|
| **สถาบันสารสนเทศทรัพยากรน้ำ (สสน. / ThaiWater)** | โทรมาตรระดับน้ำ (ม.รทก.), % ความจุลำน้ำ, ปริมาณฝน 24 ชม. | **LIVE** | Public Open Data API พร้อมระบบชุดข้อมูลสำรองเมื่อ API ขัดข้อง |
| **กรมชลประทาน (RID)** | สภาพน้ำในอ่างเก็บน้ำ/เขื่อนขนาดใหญ่ 35 แห่ง, ความจุ, น้ำไหลเข้า-ออก | **LIVE** | Reservoir API พร้อมระบบชุดข้อมูลสำรองเมื่อ API ขัดข้อง |
| **สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS)** | เซนเซอร์ตรวจวัดน้ำท่วมขังบนผิวถนน กทม. 254 จุด และภาพเรดาร์ | **LIVE** | Flood Warning API ของสำนักการระบายน้ำ กทม. |
| **Open-Meteo** | พยากรณ์อากาศล่วงหน้า 7 วัน (อุณหภูมิ, โอกาสเกิดฝน, ปริมาณฝน) | **LIVE** | Open-Meteo Weather Forecast API |
| **RainViewer** | ชั้นแผนที่เรดาร์ตรวจจับกลุ่มฝนและเฟรมภาพเคลื่อนไหว | **LIVE** | RainViewer Weather Radar API |
| **OpenStreetMap & HOT / HDX** | โครงข่ายเส้นทางแม่น้ำและลำน้ำทั่วประเทศ | **STATIC** | ข้อมูล ODbL จากโครงการ Humanitarian OpenStreetMap Team |
| **กรมทางหลวง (DOH)** | จุดเฝ้าระวังน้ำท่วมทางหลวงและสถานะการสัญจร | **LIVE / STATIC** | ดึงข้อมูลสดเมื่อกำหนด `DOH_API_URL` หรือใช้ชุดข้อมูลอ้างอิง |
| **กรมอุตุนิยมวิทยา (TMD)** | ประกาศเตือนภัยสภาพอากาศและพายุ | **LIVE / STATIC** | ดึงข้อมูลสดเมื่อกำหนด `TMD_API_UID` และ `TMD_API_KEY` |
| **สำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ (GISTDA)** | ขอบเขตพื้นที่น้ำท่วมจากดาวเทียม | **LIVE / STATIC** | ดึงข้อมูลสดเมื่อกำหนด `GISTDA_API_KEY` หรือใช้ชุดข้อมูลอ้างอิง |
| **กรมอุทกศาสตร์ กองทัพเรือ** | ตารางน้ำทำนายและระดับน้ำทะเลหนุนสูงสุด | **STATIC** | ข้อมูลตารางน้ำทำนายรายวันตามรอบน้ำหนุน |
| **กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)** | ข้อมูลและพิกัดศูนย์พักพิงชั่วคราว | **STATIC** | ข้อมูลทะเบียนศูนย์พักพิงอ้างอิง |

---

### เกณฑ์ประเมินสถานะรายจังหวัด (Province Status Logic)

ระบบมีกลไกประเมินระดับความเสี่ยงของแต่ละจังหวัดในเบื้องต้น เพื่อช่วยสรุปภาพรวมสถานการณ์ โดยมีลำดับเงื่อนไขดังนี้:

1. **วิกฤต / ล้นตลิ่ง (CRITICAL):** มีสถานีโทรมาตรรายงานน้ำล้นตลิ่ง หรือมีทางหลวงถูกตัดขาดไม่สามารถสัญจรได้
2. **เสี่ยงภัยสูง (FLOODING):** มีสถานีโทรมาตรรายงานระดับเตือนภัย หรือเขื่อนหลักในพื้นที่กักเก็บน้ำเกิน 95%
3. **เตือนภัย (WARNING):** มีสถานีโทรมาตรรายงานระดับเฝ้าระวัง หรือเขื่อนหลักในพื้นที่มีปริมาณน้ำเกิน 85%
4. **เฝ้าระวัง (WATCH):** มีฝนสะสม 24 ชม. สูงสุดตั้งแต่ 35 มม. ขึ้นไป หรือมีรายงานจุดเสี่ยงน้ำท่วมทางหลวง
5. **ปกติ (NORMAL):** ทุกสถานีและตัวชี้วัดอยู่ในเกณฑ์ปกติ

*หมายเหตุ: ปริมาณน้ำฝนสะสมเพียงอย่างเดียว แม้จะสูงถึงระดับฝนตกหนักมาก (>= 90 มม.) จะปรับสถานะจังหวัดได้สูงสุดเพียงระดับ "เฝ้าระวัง (WATCH)" เท่านั้น การปรับสู่ระดับเตือนภัยหรือวิกฤตจะอิงจากระดับน้ำจริงของสถานีโทรมาตรและเขื่อนเท่านั้น*

---

### การติดตั้งและทดสอบบนเครื่องพัฒนา (Local Setup)

#### 1. ความต้องการเบื้องต้น
- Node.js 18.18 หรือสูงกว่า
- npm, pnpm หรือ yarn

#### 2. ขั้นตอนการติดตั้ง
```bash
# คัดลอกโปรเจกต์
git clone https://github.com/Noobmaster-3443/Thailand-Flood-Tracker.git
cd Thailand-Flood-Tracker

# ติดตั้งแพ็กเกจ
npm install

# เริ่มต้นเซิร์ฟเวอร์สำหรับพัฒนา
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

#### 3. การทดสอบตรวจสอบการ Build
```bash
npm run build
```

#### 4. ตัวแปรสภาพแวดล้อม (Environment Variables)
ระบบถูกออกแบบให้สามารถรันได้ทันทีโดยไม่ต้องตั้งค่า Environment Variables เพิ่มเติม แต่หากมี API Key ของหน่วยงานเฉพาะ สามารถสร้างไฟล์ `.env.local` เพื่อเปิดใช้งานโหมดดึงข้อมูลสดเพิ่มเติม:
```env
# กรมอุตุนิยมวิทยา (TMD)
TMD_API_UID=
TMD_API_KEY=

# GISTDA
GISTDA_API_KEY=
GISTDA_API_URL=

# กรมทางหลวง (DOH)
DOH_API_URL=
```

---

### ข้อจำกัดและข้อควรระวัง (Disclaimer)

- ข้อมูลทั้งหมดที่นำเสนอในระบบนี้มีวัตถุประสงค์เพื่อการติดตามและเฝ้าระวังสถานการณ์น้ำในเบื้องต้นเท่านั้น
- เกณฑ์ประเมินสถานะรายจังหวัดเป็นสูตรการคำนวณภายในของโครงการ มิใช่ประกาศแจ้งเตือนภัยอย่างเป็นทางการจากทางราชการ
- โปรดติดตามและยึดถือประกาศเตือนภัยทางการจากกรมป้องกันและบรรเทาสาธารณภัย (ปภ.), สำนักการระบายน้ำ กทม., กรมอุตุนิยมวิทยา หรือหน่วยงานภาครัฐในพื้นที่เป็นหลัก

**ช่องทางติดต่อเหตุฉุกเฉินและขอความช่วยเหลือ 24 ชั่วโมง:**
- สายด่วนนิรภัย กรมป้องกันและบรรเทาสาธารณภัย (ปภ.): **1784**
- สถาบันการแพทย์ฉุกเฉินแห่งชาติ (กู้ชีพ): **1669**

---

### เครดิตและคำขอบคุณ (Credits & Attributions)

ขอขอบคุณหน่วยงานและบริการเปิดที่เอื้อเฟื้อข้อมูลและเทคโนโลยีสำหรับโครงการนี้:
- **สถาบันสารสนเทศทรัพยากรน้ำ (องค์การมหาชน) (สสน. / HII):** ข้อมูลโทรมาตรระดับน้ำและฝนผ่านระบบ [ThaiWater](https://www.thaiwater.net)
- **กรมชลประทาน (RID):** ข้อมูลสถานการณ์น้ำในเขื่อนและอ่างเก็บน้ำขนาดใหญ่ [RID Reservoir Service](https://app.rid.go.th/reservoir)
- **สำนักการระบายน้ำ กรุงเทพมหานคร:** ข้อมูลเซนเซอร์ตรวจวัดน้ำท่วมขังบนผิวจราจร [BMA Flood Monitoring](https://floodbangkok.bangkok.go.th)
- **OpenStreetMap contributors & Humanitarian OpenStreetMap Team (HOT):** ชุดข้อมูลเส้นทางน้ำและแม่น้ำของประเทศไทย (*Waterways of Thailand*) ผ่านแพลตฟอร์ม [Humanitarian Data Exchange (HDX)](https://data.humdata.org/dataset/hotosm_tha_waterways) ภายใต้สัญญาอนุญาต Open Database License (ODbL 1.0)
- **กรมอุตุนิยมวิทยา (TMD):** ประกาศเตือนภัยสภาพอากาศและพยากรณ์อากาศ [TMD Portal](https://www.tmd.go.th)
- **สำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ (GISTDA):** ข้อมูลขอบเขตพื้นที่น้ำท่วมจากดาวเทียม [GISTDA Disaster](https://disaster.gistda.or.th)
- **กรมทางหลวง (DOH):** ข้อมูลจุดเตือนภัยน้ำท่วมบนสายทางหลวง [DOH Portal](https://www.doh.go.th)
- **กรมอุทกศาสตร์ กองทัพเรือ:** ข้อมูลตารางน้ำทำนายและสภาวะน้ำทะเลหนุน [Hydrographic Department](https://www.navy.mi.th/hydro)
- **กรมป้องกันและบรรเทาสาธารณภัย (ปภ.):** ทะเบียนศูนย์พักพิงชั่วคราวและสายด่วนสาธารณภัย 1784 [DDPM](https://www.disaster.go.th)
- **Open-Meteo:** บริการข้อมูลพยากรณ์อากาศแบบเปิด [Open-Meteo API](https://open-meteo.com)
- **RainViewer:** บริการข้อมูลภาพเรดาร์ตรวจจับฝน [RainViewer API](https://www.rainviewer.com)
- **Leaflet & Leaflet.markercluster:** ไลบรารีแผนที่โอเพนซอร์สสำหรับการแสดงผลข้อมูลเชิงพื้นที่
- **Vercel:** แพลตฟอร์มการประมวลผลบนคลาวด์และการส่งมอบเว็บไซต์

---

<a id="english"></a>
## English

### About the Project
Thailand Flood Tracker is a full-stack web application designed to collect, process, and visualize nationwide hydrological telemetry, rainfall, dam capacities, road inundation, and weather radar data across Thailand on an interactive, centralized map. The primary objective is to provide the public and researchers with a reliable, unified vantage point to monitor flood conditions nationwide.

The project originated as a vocational certificate diploma project (Vocational Certificate level / ปวช.) aimed at overcoming the fragmentation of open water data across various government portals. It has since matured into version 2.0 with an emphasis on system resilience, transparent data provenance, and a refined mobile-first dashboard experience.

Live Website: [https://thailand-flood-tracker.vercel.app](https://thailand-flood-tracker.vercel.app)

---

### Core Capabilities

1. **Interactive Telemetry Map**
   - Displays real-time water levels and 24-hour accumulated rainfall from hydrological telemetry stations across all 77 provinces, utilizing marker clustering for fast rendering.
   - Monitors 254 road flood sensors in the Bangkok Metropolitan Area provided by the BMA Department of Drainage and Sewerage.
   - Tracks storage capacity, inflow, and outflow for 35 major reservoirs and dams operated by the Royal Irrigation Department (RID).
   - Features a 2-tier progressive river network with animated downstream flow pulses based on natural hydrological gradient:
     - **Tier 1 (Major Rivers):** 772 verified river segments rendered at national zoom levels.
     - **Tier 2 (Tributaries & Canals):** 1,000 waterway segments dynamically loaded when zooming into basin and provincial views.
   - Integrated animated rain radar player powered by RainViewer, alongside Bangkok radar scans.
   - Real-time road alerts and flood hazards from the Department of Highways (DOH), highlighting passable and impassable routes.

2. **Mobile-First Experience**
   - Floating telemetry navigation bar paired with an ergonomic, single-row province selector and type filter bar.
   - Multi-stage mobile dashboard bottom sheet with three snap states: collapsed peek summary, half-screen list view, and expanded view.
   - Intelligent UI management that hides conflicting map controls when the bottom sheet is fully expanded to prevent clutter.
   - Native pinch-to-zoom support optimized for handheld touch devices.

3. **Resilience & Data Provenance**
   - **Failure Isolation:** Every upstream provider is fetched in parallel via `Promise.allSettled`. If one agency's endpoint times out or fails, the rest of the application continues to operate uninterrupted.
   - **Server-Side In-Memory Caching:** Distinct Time-to-Live (TTL) policies tailored to each data source's refresh cycle (ranging from 3 minutes for road sensors to 1 hour for dam storage and satellite extents).
   - **4-Level Data Status:** Plainly displays data freshness for every station and layer: `LIVE`, `STALE`, `STATIC` (reference fallback), or `UNAVAILABLE`.
   - **Data Integrity:** Legacy static mock fallbacks (such as outdated flash flood points) and hardcoded historical timestamps have been removed to avoid misleading users during real events.

4. **Emergency & Weather Tools**
   - Quick-dial access to official 24/7 disaster hotlines (DDPM 1784, EMS 1669) alongside evacuation shelter information.
   - 7-day local meteorological forecasts (temperature, precipitation probability, and rainfall amount) powered by Open-Meteo.

---

### Tech Stack

- **Framework & Core:** [Next.js](https://nextjs.org/) 15 (App Router, Server Actions, API Routes), [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) 5
- **Mapping & Geospatial:** [Leaflet](https://leafletjs.com/) 1.9, [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) 1.5, GeoJSON
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/) 3.4, [Lucide React](https://lucide.dev/) (Icons), `clsx`, `tailwind-merge`
- **Hosting & Infrastructure:** [Vercel](https://vercel.com/) (Edge Network & Serverless Functions)

---

### Data Sources & Operating Status

| Provider / Agency | Ingested Data | Status | Implementation Details |
|:---|:---|:---:|:---|
| **Hydro and Agro Informatics Institute (HII / ThaiWater)** | River telemetry (m MSL), % river capacity, 24h rainfall | **LIVE** | Public Open Data API with reference fallback |
| **Royal Irrigation Department (RID)** | 35 major reservoirs, total storage, inflow/outflow | **LIVE** | RID Reservoir API with reference fallback |
| **Bangkok Drainage and Sewerage Dept (BMA DDS)** | 254 road flood depth sensors and radar imagery | **LIVE** | BMA Flood Warning API |
| **Open-Meteo** | 7-day weather forecast (temperature, rain prob, precipitation) | **LIVE** | Open-Meteo Weather Forecast API |
| **RainViewer** | Live precipitation radar tiles and time-series frames | **LIVE** | RainViewer Weather Radar API |
| **OpenStreetMap & HOT / HDX** | Nationwide river networks and watercourses | **STATIC** | ODbL dataset from Humanitarian OpenStreetMap Team |
| **Department of Highways (DOH)** | Highway flood alerts and vehicle passability | **LIVE / STATIC** | Live via `DOH_API_URL` or reference fallback |
| **Thai Meteorological Department (TMD)** | Weather warnings and storm advisories | **LIVE / STATIC** | Live via `TMD_API_UID` and `TMD_API_KEY` |
| **GISTDA** | Satellite flood extent boundaries | **LIVE / STATIC** | Live via `GISTDA_API_KEY` or reference fallback |
| **Hydrographic Department, Royal Thai Navy** | Daily tidal predictions and high tide levels | **STATIC** | Official daily tidal prediction tables |
| **Department of Disaster Prevention and Mitigation (DDPM)** | Evacuation shelter registry | **STATIC** | Official shelter registry database |

---

### Province Status Calculation Logic

To offer an immediate nationwide overview, the system evaluates provincial flood risk using the following priority rules:

1. **CRITICAL:** Telemetry stations report water overflowing riverbanks (`overflowStations > 0`) or major highway segments are impassable (`impassableHighways > 0`).
2. **FLOODING:** Telemetry stations trigger flood warning levels (`warningStations > 0`) or major reservoirs exceed 95% storage capacity.
3. **WARNING:** Telemetry stations report watch levels (`watchStations > 0`) or reservoirs exceed 85% storage capacity.
4. **WATCH:** Maximum 24h rainfall reaches or exceeds 35 mm, or flooded highway locations are reported within the province.
5. **NORMAL:** All indicators remain within baseline thresholds.

*Note: Rainfall volume alone—even extreme rainfall (>= 90 mm)—can elevate a province only up to "WATCH" status. Higher warning tiers require verified physical sensor triggers from river stations or reservoirs.*

---

### Local Development Setup

#### Prerequisites
- Node.js 18.18+
- npm, pnpm, or yarn

#### Installation Steps
```bash
# Clone the repository
git clone https://github.com/Noobmaster-3443/Thailand-Flood-Tracker.git
cd Thailand-Flood-Tracker

# Install dependencies
npm install

# Run the local development server
npm run dev
```
Open `http://localhost:3000` in your web browser.

#### Production Build Check
```bash
npm run build
```

#### Optional Environment Variables
The application runs out of the box with open APIs and resilience fallbacks. If you hold official developer credentials, configure a `.env.local` file:
```env
# Thai Meteorological Department (TMD)
TMD_API_UID=
TMD_API_KEY=

# GISTDA
GISTDA_API_KEY=
GISTDA_API_URL=

# Department of Highways (DOH)
DOH_API_URL=
```

---

### Disclaimer & Emergency Contacts

- All data presented in this system is intended solely for situational awareness and preliminary flood monitoring.
- The provincial risk classification is computed algorithmically by this project and does not constitute an official government alert.
- Always consult and adhere to official advisories from the Department of Disaster Prevention and Mitigation (DDPM), BMA Drainage Department, and the Thai Meteorological Department.

**24/7 Emergency Numbers in Thailand:**
- Department of Disaster Prevention and Mitigation (DDPM hotline): **1784**
- Emergency Medical Services (EMS Ambulance): **1669**

---

### Credits & Attributions

We express our gratitude to the agencies and open data initiatives that make this project possible:
- **Hydro and Agro Informatics Institute (Public Organization) - HII / ThaiWater:** Hydrological telemetry and rainfall measurements via [ThaiWater](https://www.thaiwater.net).
- **Royal Irrigation Department (RID):** Major dam and reservoir capacity metrics via [RID Reservoir Service](https://app.rid.go.th/reservoir).
- **Bangkok Metropolitan Administration (BMA DDS):** Road surface flood sensor data via [BMA Flood Monitoring](https://floodbangkok.bangkok.go.th).
- **OpenStreetMap contributors & Humanitarian OpenStreetMap Team (HOT):** *Waterways of Thailand* dataset curated on the [Humanitarian Data Exchange (HDX)](https://data.humdata.org/dataset/hotosm_tha_waterways), licensed under the Open Database License (ODbL 1.0).
- **Thai Meteorological Department (TMD):** Severe weather alerts and advisories via [TMD Portal](https://www.tmd.go.th).
- **Geo-Informatics and Space Technology Development Agency (GISTDA):** Satellite flood extent mapping via [GISTDA Disaster](https://disaster.gistda.or.th).
- **Department of Highways (DOH):** Road hazard and traffic passability data via [DOH Portal](https://www.doh.go.th).
- **Hydrographic Department, Royal Thai Navy:** Tidal forecast tables and coastal observation data via [Hydrographic Department](https://www.navy.mi.th/hydro).
- **Department of Disaster Prevention and Mitigation (DDPM):** Shelter directory and 24/7 emergency dispatch service via [DDPM](https://www.disaster.go.th).
- **Open-Meteo:** Open-access meteorological forecast API via [Open-Meteo](https://open-meteo.com).
- **RainViewer:** Weather radar tile services via [RainViewer API](https://www.rainviewer.com).
- **Leaflet & Leaflet.markercluster:** Open-source geospatial mapping libraries.
- **Vercel:** Cloud hosting and serverless edge infrastructure.
