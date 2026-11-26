# Thailand Flood Tracker (ระบบติดตามสถานการณ์น้ำและอุทกภัยทั่วประเทศไทย)

[ภาษาไทย](#ภาษาไทย) | [English](#english)

---

<a id="ภาษาไทย"></a>
## ภาษาไทย

### เกี่ยวกับโครงการ
Thailand Flood Tracker เป็นเว็บแอปพลิเคชันสำหรับรวบรวม ประมวลผล และแสดงผลข้อมูลสถานการณ์น้ำ ปริมาณน้ำฝน สภาพเขื่อน จุดเสี่ยงทางหลวง น้ำท่วมผิวจราจร และแผนที่เฝ้าระวังสารพิษปนเปื้อนในแหล่งน้ำทั่วประเทศไทย นำมาจัดแสดงร่วมกันบนแผนที่เชิงโต้ตอบแบบรวมศูนย์ทั้งในโหมด **2D** และ **3D Terrain** เพื่อให้ประชาชนและผู้สนใจสามารถติดตามเฝ้าระวังสถานการณ์น้ำในแต่ละพื้นที่ได้อย่างสะดวก รวดเร็ว และรอบด้านในจุดเดียว

โครงการนี้ริเริ่มพัฒนาขึ้นจากโครงงานระดับประกาศนียบัตรวิชาชีพ (ปวช.) เพื่อแก้ปัญหาข้อมูลด้านทรัพยากรน้ำของภาครัฐที่มักกระจายอยู่ตามเว็บไซต์ของแต่ละหน่วยงานอย่างเป็นเอกเทศ และได้รับการปรับปรุงพัฒนาอย่างต่อเนื่องจนก้าวสู่เวอร์ชัน 2.0 โดยเน้นความเสถียรของระบบ ความโปร่งใสของข้อมูล การแสดงผลแผนที่ 3 มิติ และความสะดวกในการใช้งานบนโทรศัพท์มือถือ

เข้าชมเว็บไซต์: [https://thailand-flood-tracker.vercel.app](https://thailand-flood-tracker.vercel.app)

---

### ความสามารถหลักของระบบ

1. **แผนที่สถานการณ์น้ำเชิงโต้ตอบ 2D และ 3D Terrain (Interactive 2D/3D Telemetry Map)**
   - **แผนที่ 2 มิติ (Leaflet & MarkerCluster):** แสดงสถานีโทรมาตรระดับน้ำและปริมาณฝนสะสม 24 ชม. ทั่วประเทศ (77 จังหวัด) พร้อมระบบรวมกลุ่มหมุด (Marker Clustering) เพื่อความลื่นไหลในการแสดงผล
   - **แผนที่ภูมิประเทศ 3 มิติ (MapLibre GL 3D Terrain):** รองรับการสลับเข้าสู่โหมดแผนที่ 3 มิติ พร้อมซิงก์มุมมอง (Viewport Synchronization) กับแผนที่ 2 มิติ และใช้ WebGL Clustered Pins ที่เกาะติดไปกับระดับความสูงของภูมิประเทศ
   - **โหมดแผนที่เฝ้าระวังสารพิษปนเปื้อนในน้ำ (Water Toxin Contamination Map):** แผนที่แยกเฉพาะสำหรับติดตามจุดเฝ้าระวังสารพิษปนเปื้อนในแหล่งน้ำ พร้อมตรวจสอบสถานะจาก `/api/water-toxins`
   - **เซนเซอร์น้ำท่วมผิวจราจร กทม.:** จุดตรวจวัดน้ำท่วมขังบนผิวจราจรในเขตกรุงเทพมหานคร 254 จุด จากสำนักการระบายน้ำ กทม. (แสดงผลเฉพาะเมื่อเลือกพื้นที่กรุงเทพมหานคร) พร้อม API เฉพาะ `/api/bkk-road-flood`
   - **ข้อมูลเขื่อนและอ่างเก็บน้ำ (RID):** ปริมาณน้ำเก็บกัก ความจุระดับเก็บกักปกติ และอัตราการไหลเข้า-ระบายออก (ล้าน ลบ.ม./วัน) ของอ่างเก็บน้ำ/เขื่อนขนาดใหญ่ 35 แห่งทั่วประเทศ
   - **เรดาร์ฝน:** แผนที่เรดาร์ตรวจจับกลุ่มฝนแบบเคลื่อนไหวตามช่วงเวลา (RainViewer Radar Time-lapse) และภาพเรดาร์ตรวจจับฝนของ กทม.
   - **จุดแจ้งเตือนน้ำท่วมทางหลวง (DOH):** แสดงสถานะเส้นทางที่รถยนต์สามารถสัญจรผ่านได้หรือไม่ได้

2. **ประสบการณ์ใช้งานที่ออกแบบสำหรับมือถือและ Command Center UI**
   - **Command Center Toolbar & Navbar:** แถบนำทางด้านบนแบบลอยตัว (Floating Telemetry Navbar) พร้อมตัวนับสถิติแบบโต้ตอบได้ (Live Metric Pills), แถบเลือกจังหวัด และตัวกรองข้อมูลแบบบรรทัดเดียว (Single-row Filter Bar)
   - **เมนูตรวจสอบสถานะ API (API & System Health Status):** แสดงสถานะการเชื่อมต่อของ API แต่ละหน่วยงานแบบเรียลไทม์ทั้งบนเดสก์ท็อปและรูปแบบ Bottom Sheet บนมือถือ
   - **หน้าต่างแดชบอร์ดด้านล่าง (Mobile Dashboard Bottom Sheet):** ปรับระดับได้ 3 ระดับ (ย่อดูสรุปย่อ, เปิดครึ่งจอเพื่อดูรายการสถานี, และขยายเต็มจอ) พร้อมซ่อนปุ่มควบคุมแผนที่อัตโนมัติเมื่อขยายเต็มจอ
   - รองรับการย่อขยายแผนที่ด้วยสองนิ้ว (Pinch-to-zoom) อย่างเป็นธรรมชาติบนสมาร์ตโฟน

3. **ความต่อเนื่องของระบบและความโปร่งใสของข้อมูล (Resilience & Transparency)**
   - **การแยกความล้มเหลวอิสระ (Failure Isolation):** เรียกข้อมูลจากแหล่งต่าง ๆ แบบคู่ขนานด้วย `Promise.allSettled` หากมี API แหล่งใดล่มหรือหมดเวลาเชื่อมต่อ จะไม่ส่งผลกระทบต่อแหล่งอื่น
   - **แคชในหน่วยความจำเซิร์ฟเวอร์ (In-Memory Cache):** กำหนดอายุข้อมูล (TTL) แยกตามความถี่จริงของแต่ละหน่วยงาน (เช่น 180 วินาทีสำหรับ BMA DDS, 300 วินาทีสำหรับ ThaiWater, 3,600 วินาทีสำหรับเขื่อน RID) เพื่อลดภาระของ API ต้นทางและเพิ่มความเร็วในการโหลด
   - **ป้ายระบุสถานะข้อมูล 4 ระดับ:** ระบุความสดใหม่ของข้อมูลอย่างตรงไปตรงมา ได้แก่ ข้อมูลสด (`LIVE`), ข้อมูลล่าช้า (`STALE`), ข้อมูลโครงสร้างอ้างอิง (`STATIC`) และไม่มีข้อมูลสด (`UNAVAILABLE`)
   - **ความถูกต้องของข้อมูล:** คัดกรองข้อมูล `STATIC` ออกจากการคำนวณสถานะจังหวัดและตัวนับสด ปิดการแสดงผลข้อมูลจำลองเก่าที่อาจก่อให้เกิดความสับสน และแปลงเวลาตรวจวัดให้อยู่ในเขตเวลาประเทศไทยอย่างถูกต้อง

4. **ศูนย์ประสานงานฉุกเฉินและพยากรณ์อากาศ**
   - รวมเบอร์โทรศัพท์สายด่วนเหตุฉุกเฉินและสาธารณภัย (ปภ. 1784, กู้ชีพฉุกเฉิน 1669) พร้อมเปิดโทรออกได้ทันที
   - ตรวจสอบพยากรณ์อากาศล่วงหน้า 7 วัน (อุณหภูมิ, โอกาสฝน, ปริมาณฝน) สำหรับพื้นที่ต่าง ๆ ทั่วประเทศ

---

### เทคโนโลยีที่ใช้ในการพัฒนา

- **แกนหลักของระบบ (Framework & Runtime):** [Next.js](https://nextjs.org/) `15.5.28` (App Router, Server-side API Routes), [React](https://react.dev/) `19.0.0`, [TypeScript](https://www.typescriptlang.org/) `5.6.3`
- **แผนที่ 2D/3D และข้อมูลเชิงพื้นที่:** [Leaflet](https://leafletjs.com/) `1.9.4`, [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) `1.5.3`, [MapLibre GL](https://maplibre.org/) `6.19.0` (WebGL 3D Terrain & Clustering), GeoJSON
- **การจัดสไตล์และส่วนติดต่อผู้ใช้ (UI & Styling):** [Tailwind CSS](https://tailwindcss.com/) `3.4.14`, [Lucide React](https://lucide.dev/) `0.453.0`, `clsx`, `tailwind-merge`
- **การติดตั้งและส่งมอบ (Deployment):** [Vercel](https://vercel.com/) (Edge Network & Serverless Functions ใน Region `sin1` สิงคโปร์)

---

### แหล่งข้อมูลและสถานะการเชื่อมต่อ

| แหล่งข้อมูล / หน่วยงาน | ข้อมูลที่นำมาประมวลผล | สถานะในระบบ | การทำงาน |
|:---|:---|:---:|:---|
| **สถาบันสารสนเทศทรัพยากรน้ำ (สสน. / ThaiWater)** | โทรมาตรระดับน้ำ (ม.รทก.), % ความจุลำน้ำ, ปริมาณฝน 24 ชม. | **LIVE** | Public Open Data API พร้อมระบบชุดข้อมูลสำรองเมื่อ API ขัดข้อง |
| **กรมชลประทาน (RID)** | สภาพน้ำในอ่างเก็บน้ำ/เขื่อนขนาดใหญ่ 35 แห่ง, ความจุปกติ, น้ำไหลเข้า-ออก | **LIVE** | Reservoir API พร้อมระบบชุดข้อมูลสำรองเมื่อ API ขัดข้อง |
| **สำนักการระบายน้ำ กรุงเทพมหานคร (BMA DDS)** | เซนเซอร์ตรวจวัดน้ำท่วมขังบนผิวถนน กทม. 254 จุด และภาพเรดาร์ | **LIVE** | Flood Warning API พร้อม Retry, กรองข้อมูลเก่า และ `/api/bkk-road-flood` |
| **Open-Meteo** | พยากรณ์อากาศล่วงหน้า 7 วัน (อุณหภูมิ, โอกาสเกิดฝน, ปริมาณฝน) | **LIVE** | Open-Meteo Weather Forecast API |
| **RainViewer** | ชั้นแผนที่เรดาร์ตรวจจับกลุ่มฝนและเฟรมภาพเคลื่อนไหว | **LIVE** | RainViewer Weather Radar API |
| **กรมทางหลวง (DOH)** | จุดเฝ้าระวังน้ำท่วมทางหลวงและสถานะการสัญจร | **LIVE / STATIC** | ดึงข้อมูลสดเมื่อกำหนด `DOH_API_URL` (ปิดการแสดงชุดอ้างอิงโดยค่าเริ่มต้น) |
| **กรมอุตุนิยมวิทยา (TMD)** | ประกาศเตือนภัยสภาพอากาศและพายุ | **LIVE / STATIC** | ดึงข้อมูลสดเมื่อกำหนด `TMD_API_UID` และ `TMD_API_KEY` |
| **สำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ (GISTDA)** | ขอบเขตพื้นที่น้ำท่วมจากดาวเทียม | **LIVE / STATIC** | ดึงข้อมูลสดเมื่อกำหนด `GISTDA_API_KEY` (ปิดการแสดงชุดอ้างอิงโดยค่าเริ่มต้น) |
| **กรมอุทกศาสตร์ กองทัพเรือ** | ตารางน้ำทำนายและระดับน้ำทะเลหนุนสูงสุด | **STATIC** | ข้อมูลตารางน้ำทำนายรายวันตามรอบน้ำหนุน |
| **กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)** | ข้อมูลและพิกัดศูนย์พักพิงชั่วคราว | **STATIC** | ข้อมูลทะเบียนศูนย์พักพิงอ้างอิง |
| **Open Data Thailand (`data.go.th`) & ชุดข้อมูลสารพิษ** | ข้อมูลตรวจสอบชุดข้อมูลคุณภาพน้ำและจุดเฝ้าระวังสารพิษปนเปื้อน | **LIVE / STATIC** | เชื่อมต่อผ่าน `/api/water-toxins` |

---

### เกณฑ์ประเมินสถานะรายจังหวัด (Province Status Logic)

ระบบมีกลไกประเมินระดับความเสี่ยงของแต่ละจังหวัดในเบื้องต้นจากข้อมูลโทรมาตรสด (`data_status !== 'STATIC'`) โดยมีลำดับเงื่อนไขดังนี้:

1. **ไม่มีข้อมูลสด (UNAVAILABLE):** ไม่พบข้อมูลโทรมาตรระดับน้ำ ปริมาณฝน หรือเขื่อนที่เป็นข้อมูลสด/ล่าช้าในจังหวัดนั้น
2. **วิกฤต / ล้นตลิ่ง (CRITICAL):** มีสถานีโทรมาตรรายงานน้ำล้นตลิ่ง หรือมีทางหลวงถูกตัดขาดไม่สามารถสัญจรได้
3. **เสี่ยงภัยสูง (FLOODING):** มีสถานีโทรมาตรรายงานระดับเตือนภัย หรือเขื่อนหลักในพื้นที่กักเก็บน้ำตั้งแต่ 95% ขึ้นไป
4. **เตือนภัย (WARNING):** มีสถานีโทรมาตรรายงานระดับเฝ้าระวัง หรือเขื่อนหลักในพื้นที่มีปริมาณน้ำตั้งแต่ 85% ขึ้นไป
5. **เฝ้าระวัง (WATCH):** มีฝนสะสม 24 ชม. สูงสุดตั้งแต่ 35 มม. ขึ้นไป หรือมีรายงานจุดเสี่ยงน้ำท่วมทางหลวง
6. **ปกติ (NORMAL):** มีข้อมูลตรวจวัดสดและตัวชี้วัดทั้งหมดอยู่ในเกณฑ์ปกติ

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

#### 3. คำสั่งเพิ่มเติมสำหรับการตรวจสอบและ Build
```bash
npm run build   # สร้างชุดไฟล์ Production
npm run start   # รัน Production Server
npm run lint    # ตรวจสอบคุณภาพโค้ดด้วย ESLint
```

#### 4. ตัวแปรสภาพแวดล้อม (Environment Variables)
ระบบถูกออกแบบให้สามารถรันได้ทันทีโดยไม่ต้องตั้งค่า Environment Variables เพิ่มเติม แต่หากมี API Key ของหน่วยงานเฉพาะ สามารถคัดลอก `.env.example` เป็น `.env.local` เพื่อเปิดใช้งานโหมดดึงข้อมูลสดเพิ่มเติม:
```env
# กรมอุตุนิยมวิทยา (TMD)
TMD_API_UID=
TMD_API_KEY=

# GISTDA
GISTDA_API_KEY=
GISTDA_API_URL=https://disaster.gistda.or.th/api/v1/flood/extent

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
- **กรมอุตุนิยมวิทยา (TMD):** ประกาศเตือนภัยสภาพอากาศและพยากรณ์อากาศ [TMD Portal](https://www.tmd.go.th)
- **สำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ (GISTDA):** ข้อมูลขอบเขตพื้นที่น้ำท่วมจากดาวเทียม [GISTDA Disaster](https://disaster.gistda.or.th)
- **กรมทางหลวง (DOH):** ข้อมูลจุดเตือนภัยน้ำท่วมบนสายทางหลวง [DOH Portal](https://www.doh.go.th)
- **กรมอุทกศาสตร์ กองทัพเรือ:** ข้อมูลตารางน้ำทำนายและสภาวะน้ำทะเลหนุน [Hydrographic Department](https://www.navy.mi.th/hydro)
- **กรมป้องกันและบรรเทาสาธารณภัย (ปภ.):** ทะเบียนศูนย์พักพิงชั่วคราวและสายด่วนสาธารณภัย 1784 [DDPM](https://www.disaster.go.th)
- **Open-Meteo:** บริการข้อมูลพยากรณ์อากาศแบบเปิด [Open-Meteo API](https://open-meteo.com)
- **RainViewer:** บริการข้อมูลภาพเรดาร์ตรวจจับฝน [RainViewer API](https://www.rainviewer.com)
- **Leaflet, Leaflet.markercluster & MapLibre GL:** ไลบรารีแผนที่โอเพนซอร์สสำหรับการแสดงผลข้อมูลเชิงพื้นที่ 2D และ 3D
- **Vercel:** แพลตฟอร์มการประมวลผลบนคลาวด์และการส่งมอบเว็บไซต์

---

<a id="english"></a>
## English

### About the Project
Thailand Flood Tracker is a full-stack web application designed to collect, process, and visualize nationwide hydrological telemetry, rainfall, dam capacities, road inundation, weather radar, and water toxin contamination monitoring across Thailand on an interactive, centralized **2D and 3D terrain** map. The primary objective is to provide the public and researchers with a reliable, unified vantage point to monitor flood conditions nationwide.

The project originated as a vocational certificate diploma project (Vocational Certificate level / ปวช.) aimed at overcoming the fragmentation of open water data across various government portals. It has since matured into version 2.0 with an emphasis on system resilience, transparent data provenance, WebGL 3D terrain visualization, and a refined mobile-first dashboard experience.

Live Website: [https://thailand-flood-tracker.vercel.app](https://thailand-flood-tracker.vercel.app)

---

### Core Capabilities

1. **Interactive 2D & 3D Terrain Telemetry Map**
   - **2D Map (Leaflet & MarkerCluster):** Displays real-time water levels and 24-hour accumulated rainfall from hydrological telemetry stations across all 77 provinces, utilizing marker clustering for fast rendering.
   - **3D Terrain Map Mode (MapLibre GL):** Supports toggling into a 3D terrain & satellite/OSM view with synchronized viewport state and WebGL clustered pins clamped to terrain elevation.
   - **Water Toxin Contamination Map Mode:** Dedicated isolated map mode (`ToxinContaminationMap`) backed by `/api/water-toxins` for monitoring water contamination alerts.
   - **Bangkok Road Flood Sensors:** Monitors 254 road flood sensors in the Bangkok Metropolitan Area provided by BMA DDS (shown specifically when Bangkok is selected), plus a dedicated `/api/bkk-road-flood` endpoint.
   - **Reservoirs & Dams (RID):** Tracks live volume, normal storage capacity, and inflow/outflow rates (MCM/day) for 35 major reservoirs and dams operated by the Royal Irrigation Department (RID).
   - **Weather Radar:** Integrated animated rain radar player powered by RainViewer, alongside Bangkok radar scans.
   - **Highway Alerts (DOH):** Road alerts and flood hazards highlighting passable and impassable routes.

2. **Mobile-First Experience & Command Center UI**
   - **Command Center Toolbar & Navbar:** Floating telemetry navigation bar paired with interactive live metric pills, a single-row province selector, and type filter bar.
   - **API & System Health Status Menu:** Real-time upstream API status popover on desktop and bottom sheet on mobile (`ApiStatusMenu`).
   - **Mobile Dashboard Bottom Sheet:** Multi-stage bottom sheet with three snap states (collapsed peek summary, half-screen list view, and expanded view) that automatically hides overlapping map controls when fully expanded.
   - Native pinch-to-zoom support optimized for handheld touch devices.

3. **Resilience & Data Provenance**
   - **Failure Isolation:** Every upstream provider is fetched in parallel via `Promise.allSettled`. If one agency's endpoint times out or fails, the rest of the application continues to operate uninterrupted.
   - **Server-Side In-Memory Caching:** Distinct Time-to-Live (TTL) policies tailored to each data source's refresh cycle (180s for BMA DDS, 300s for ThaiWater, 3,600s for RID dams and GISTDA extents).
   - **4-Level Data Status:** Plainly displays data freshness for every station and layer: `LIVE`, `STALE`, `STATIC` (reference fallback), or `UNAVAILABLE`.
   - **Data Integrity:** Excludes `STATIC` records from active provincial status counts, disables legacy static mock overlays by default, and normalizes upstream timestamps to Bangkok time (`Asia/Bangkok`).

4. **Emergency & Weather Tools**
   - Quick-dial access to official 24/7 disaster hotlines (DDPM 1784, EMS 1669) alongside evacuation shelter information.
   - 7-day local meteorological forecasts (temperature, precipitation probability, and rainfall amount) powered by Open-Meteo.

---

### Tech Stack

- **Framework & Core:** [Next.js](https://nextjs.org/) `15.5.28` (App Router, API Routes), [React](https://react.dev/) `19.0.0`, [TypeScript](https://www.typescriptlang.org/) `5.6.3`
- **Mapping & Geospatial (2D & 3D):** [Leaflet](https://leafletjs.com/) `1.9.4`, [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) `1.5.3`, [MapLibre GL](https://maplibre.org/) `6.19.0`, GeoJSON
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/) `3.4.14`, [Lucide React](https://lucide.dev/) `0.453.0`, `clsx`, `tailwind-merge`
- **Hosting & Infrastructure:** [Vercel](https://vercel.com/) (Edge Network & Serverless Functions configured in `sin1` Singapore region)

---

### Data Sources & Operating Status

| Provider / Agency | Ingested Data | Status | Implementation Details |
|:---|:---|:---:|:---|
| **Hydro and Agro Informatics Institute (HII / ThaiWater)** | River telemetry (m MSL), % river capacity, 24h rainfall | **LIVE** | Public Open Data API with reference fallback |
| **Royal Irrigation Department (RID)** | 35 major reservoirs, normal storage capacity, inflow/outflow (MCM/day) | **LIVE** | RID Reservoir API with reference fallback |
| **Bangkok Drainage and Sewerage Dept (BMA DDS)** | 254 road flood depth sensors and radar imagery | **LIVE** | BMA Flood Warning API with retry, staleness filter & `/api/bkk-road-flood` |
| **Open-Meteo** | 7-day weather forecast (temperature, rain prob, precipitation) | **LIVE** | Open-Meteo Weather Forecast API |
| **RainViewer** | Live precipitation radar tiles and time-series frames | **LIVE** | RainViewer Weather Radar API |
| **Department of Highways (DOH)** | Highway flood alerts and vehicle passability | **LIVE / STATIC** | Live via `DOH_API_URL` (static fallback hidden by default) |
| **Thai Meteorological Department (TMD)** | Weather warnings and storm advisories | **LIVE / STATIC** | Live via `TMD_API_UID` and `TMD_API_KEY` |
| **GISTDA** | Satellite flood extent boundaries | **LIVE / STATIC** | Live via `GISTDA_API_KEY` (static fallback hidden by default) |
| **Hydrographic Department, Royal Thai Navy** | Daily tidal predictions and high tide levels | **STATIC** | Official daily tidal prediction tables |
| **Department of Disaster Prevention and Mitigation (DDPM)** | Evacuation shelter registry | **STATIC** | Official shelter registry database |
| **Open Data Thailand (`data.go.th`) & Toxin Dataset** | Water quality dataset check & toxin contamination points | **LIVE / STATIC** | Served via `/api/water-toxins` |

---

### Province Status Calculation Logic

To offer an immediate nationwide overview, the system evaluates provincial flood risk strictly from non-`STATIC` observations (`data_status !== 'STATIC'`) using the following priority rules:

1. **UNAVAILABLE:** No live or stale telemetry, rainfall, or dam observations are available for the province.
2. **CRITICAL:** Telemetry stations report water overflowing riverbanks (`overflowStations > 0`) or major highway segments are impassable (`impassableHighways > 0`).
3. **FLOODING:** Telemetry stations trigger flood warning levels (`warningStations > 0`) or major reservoirs reach or exceed 95% storage capacity.
4. **WARNING:** Telemetry stations report watch levels (`watchStations > 0`) or reservoirs reach or exceed 85% storage capacity.
5. **WATCH:** Maximum 24h rainfall reaches or exceeds 35 mm, or flooded highway locations are reported within the province.
6. **NORMAL:** Live indicators are present and remain within baseline thresholds.

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

#### Build & Verification Commands
```bash
npm run build   # Build production bundle
npm run start   # Start production server
npm run lint    # Run ESLint checks
```

#### Optional Environment Variables
The application runs out of the box with open APIs and resilience fallbacks. If you hold official developer credentials, copy `.env.example` to `.env.local`:
```env
# Thai Meteorological Department (TMD)
TMD_API_UID=
TMD_API_KEY=

# GISTDA
GISTDA_API_KEY=
GISTDA_API_URL=https://disaster.gistda.or.th/api/v1/flood/extent

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
- **Thai Meteorological Department (TMD):** Severe weather alerts and advisories via [TMD Portal](https://www.tmd.go.th).
- **Geo-Informatics and Space Technology Development Agency (GISTDA):** Satellite flood extent mapping via [GISTDA Disaster](https://disaster.gistda.or.th).
- **Department of Highways (DOH):** Road hazard and traffic passability data via [DOH Portal](https://www.doh.go.th).
- **Hydrographic Department, Royal Thai Navy:** Tidal forecast tables and coastal observation data via [Hydrographic Department](https://www.navy.mi.th/hydro).
- **Department of Disaster Prevention and Mitigation (DDPM):** Shelter directory and 24/7 emergency dispatch service via [DDPM](https://www.disaster.go.th).
- **Open-Meteo:** Open-access meteorological forecast API via [Open-Meteo](https://open-meteo.com).
- **RainViewer:** Weather radar tile services via [RainViewer API](https://www.rainviewer.com).
- **Leaflet, Leaflet.markercluster & MapLibre GL:** Open-source 2D and 3D geospatial mapping libraries.
- **Vercel:** Cloud hosting and serverless edge infrastructure.
