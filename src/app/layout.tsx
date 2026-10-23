import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบติดตามสถานการณ์น้ำและอุทกภัย กรุงเทพมหานคร และทั่วประเทศ 77 จังหวัด | Bangkok & Thailand Flood Tracker",
  description:
    "แผนที่และระบบติดตามสถานการณ์น้ำ ระดับน้ำแม่น้ำเจ้าพระยาและคลอง กทม. ปริมาณฝน เรดาร์ตรวจฝน และสถานะเขื่อน เน้นกรุงเทพมหานคร (เมืองหลวง) และครอบคลุม 77 จังหวัดทั่วไทย จากสำนักการระบายน้ำ กทม. (DDS), กรมอุทกศาสตร์ กองทัพเรือ, สสน. ThaiWater, และกรมชลประทาน",
  keywords: [
    "น้ำท่วมกรุงเทพ",
    "ระดับน้ำเจ้าพระยา",
    "สำนักการระบายน้ำ กทม",
    "DDS BMA",
    "เรดาร์ฝน กทม",
    "น้ำทะเลหนุน กทม",
    "น้ำท่วมทั่วประเทศ",
    "Thailand Flood Tracker",
    "สถานการณ์น้ำแม่น้ำเจ้าพระยา",
    "รายงานน้ำท่วม 77 จังหวัด",
    "กรมชลประทาน",
    "สสน.",
    "ThaiWater",
  ],
  authors: [{ name: "Bangkok & Thailand Open Water Data Community" }],
  openGraph: {
    title: "ระบบติดตามสถานการณ์น้ำและอุทกภัย กรุงเทพมหานคร และ 77 จังหวัด (Bangkok & Thailand Flood Tracker)",
    description: "เช็กระดับน้ำเจ้าพระยา-คลอง กทม. โทรมาตรสด ปริมาณฝน 24 ชม. และเส้นทางสัญจร",
    type: "website",
    locale: "th_TH",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${ibmPlex.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
