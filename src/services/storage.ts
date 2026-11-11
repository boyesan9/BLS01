import {
  AmbulanceVehicle,
  GoogleSheetsConfig,
  InspectionRecord,
  UserProfile,
  VehicleDamageItem,
  FuelLogRecord,
} from '../types';
import { createFreshChecklist } from '../data/defaultChecklist';

const VEHICLES_STORAGE_KEY = 'bls_vehicles_fleet_v1';
const INSPECTIONS_STORAGE_KEY = 'bls_inspections_history_v1';
const CURRENT_USER_KEY = 'bls_current_user_v1';
const GSHEETS_CONFIG_KEY = 'bls_gsheets_config_v1';

// Clean SVG ambulance illustration placeholder
export function generateSvgCarPlaceholder(label: string, angle: string, color = '#2563eb'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#0f172a" />
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="1"/>
    </pattern>
    <rect width="600" height="400" fill="url(#grid)" />
    
    <!-- Vehicle Body -->
    <rect x="90" y="140" width="420" height="150" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="130" y="160" width="100" height="50" rx="8" fill="#38bdf8" opacity="0.3"/>
    <rect x="250" y="160" width="110" height="50" rx="8" fill="#38bdf8" opacity="0.3"/>
    <rect x="380" y="160" width="100" height="50" rx="8" fill="#38bdf8" opacity="0.3"/>
    
    <!-- Emergency Light Bar -->
    <rect x="230" y="120" width="140" height="20" rx="6" fill="#ef4444"/>
    <rect x="290" y="120" width="80" height="20" rx="6" fill="#3b82f6"/>
    <circle cx="260" cy="130" r="4" fill="#ffffff" opacity="0.8"/>
    <circle cx="330" cy="130" r="4" fill="#ffffff" opacity="0.8"/>
    
    <!-- Star of Life / Cross -->
    <circle cx="300" cy="225" r="28" fill="${color}" opacity="0.9"/>
    <rect x="293" y="205" width="14" height="40" fill="#ffffff" rx="2"/>
    <rect x="280" y="218" width="40" height="14" fill="#ffffff" rx="2"/>
    
    <!-- Wheels -->
    <circle cx="170" cy="290" r="34" fill="#1e293b" stroke="#475569" stroke-width="6"/>
    <circle cx="170" cy="290" r="14" fill="#94a3b8"/>
    <circle cx="430" cy="290" r="34" fill="#1e293b" stroke="#475569" stroke-width="6"/>
    <circle cx="430" cy="290" r="14" fill="#94a3b8"/>
    
    <!-- Label Banner -->
    <rect x="150" y="335" width="300" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="300" y="358" font-family="sans-serif" font-size="15" font-weight="bold" fill="#38bdf8" text-anchor="middle">
      ${label} · ${angle}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_VEHICLES: AmbulanceVehicle[] = [
  {
    id: 'veh-01',
    code: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    brandModel: 'Toyota Commuter 3.0 D4D Ambulance High-Roof',
    year: '2023',
    status: 'available',
    currentOdometer: 42150,
    imageUrl: generateSvgCarPlaceholder('BLS-01', 'รถกู้ชีพพยาบาลระดับพื้นฐาน'),
    lastInspectionDate: '07/11/2026 08:00 น.',
    lastInspector: 'สมนึก มีพร้อม (EMT-B)',
    notes: 'พร้อมปฏิบัติการเต็มระบบ ไฟไซเรนและระบบไฟรอบคันสมบูรณ์',
  },
  {
    id: 'veh-02',
    code: 'BLS-02',
    plateNumber: '2ขค 8812 กรุงเทพมหานคร',
    brandModel: 'Toyota HiAce Premio 2.8 BLS Standard',
    year: '2024',
    status: 'available',
    currentOdometer: 28400,
    imageUrl: generateSvgCarPlaceholder('BLS-02', 'รถกู้ชีพพยาบาลระดับพื้นฐาน'),
    lastInspectionDate: '06/11/2026 08:00 น.',
    lastInspector: 'วิชัย ชัยชนะ (EMT-B)',
    notes: 'รถสภาพใหม่ ตรวจเช็กระบบส่องสว่างผ่านเกณฑ์',
  },
  {
    id: 'veh-03',
    code: 'BLS-03',
    plateNumber: '3งง 7721 กรุงเทพมหานคร',
    brandModel: 'Hyundai Staria Rescue Emergency Van',
    year: '2023',
    status: 'issue_found',
    currentOdometer: 61820,
    imageUrl: generateSvgCarPlaceholder('BLS-03', 'รถกู้ชีพพยาบาลระดับพื้นฐาน', '#eab308'),
    lastInspectionDate: '05/11/2026 20:30 น.',
    lastInspector: 'ประเสริฐ ยืนยง (พนักงานขับรถ)',
    notes: 'ไฟตัดหมอกหน้าซ้ายดับ หลอดขาด รออะไหล่เปลี่ยนช่วงบ่าย',
  },
  {
    id: 'veh-04',
    code: 'BLS-04',
    plateNumber: '1ขจ 3341 กรุงเทพมหานคร',
    brandModel: 'Nissan Urvan NV350 BLS Life Support',
    year: '2022',
    status: 'maintenance',
    currentOdometer: 89310,
    imageUrl: generateSvgCarPlaceholder('BLS-04', 'รถกู้ชีพพยาบาลระดับพื้นฐาน', '#ef4444'),
    lastInspectionDate: '04/11/2026 14:00 น.',
    lastInspector: 'สมนึก มีพร้อม (EMT-B)',
    notes: 'ส่งศูนย์ซ่อมบำรุงระยะ 90,000 กม. และเปลี่ยนถ่ายน้ำมันเครื่อง',
  },
];

// Pre-seeded inspection history for immediate rich demonstration
export const INITIAL_INSPECTIONS: InspectionRecord[] = [
  {
    id: 'insp-20261107-001',
    vehicleId: 'veh-01',
    vehicleCode: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    inspectorName: 'สมนึก มีพร้อม',
    inspectorRole: 'staff',
    uploadTimestamp: '07/11/2026 08:15 น.',
    shift: '24hr',
    shiftLabel: 'เวร 24 ชั่วโมง (08:00 น. - 08:00 น. ของอีกวัน)',
    odometerReading: 42150,
    photos: {
      front: generateSvgCarPlaceholder('BLS-01', 'ด้านหน้า (Front)'),
      rear: generateSvgCarPlaceholder('BLS-01', 'ด้านหลัง (Rear)'),
      left: generateSvgCarPlaceholder('BLS-01', 'ด้านซ้าย (Left Side)'),
      right: generateSvgCarPlaceholder('BLS-01', 'ด้านขวา (Right Side)'),
    },
    vehicleChecklist: createFreshChecklist(),
    documentAttachment: {
      name: 'ใบตรวจสภาพรถประจำเวร_BLS01_07112026.pdf',
      type: 'pdf',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp...',
      size: '1.2 MB',
    },
    overallStatus: 'normal',
    summaryNotes: 'ตรวจรอบเช้า 24 ชม. รถและระบบไฟฉุกเฉินสมบูรณ์ 100% พร้อมออกรับเคส',
    googleSheetsSyncStatus: 'synced',
    googleSheetsRowIndex: 2,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'insp-20261106-002',
    vehicleId: 'veh-03',
    vehicleCode: 'BLS-03',
    plateNumber: '3งง 7721 กรุงเทพมหานคร',
    inspectorName: 'ประเสริฐ ยืนยง',
    inspectorRole: 'staff',
    uploadTimestamp: '06/11/2026 16:30 น.',
    shift: 'afternoon',
    shiftLabel: 'เวรบ่าย (16:00 น. - 24:00 น.)',
    odometerReading: 61820,
    photos: {
      front: generateSvgCarPlaceholder('BLS-03', 'ด้านหน้า (Front)', '#eab308'),
      rear: generateSvgCarPlaceholder('BLS-03', 'ด้านหลัง (Rear)', '#eab308'),
      left: generateSvgCarPlaceholder('BLS-03', 'ด้านซ้าย (Left Side)', '#eab308'),
      right: generateSvgCarPlaceholder('BLS-03', 'ด้านขวา (Right Side)', '#eab308'),
    },
    vehicleChecklist: createFreshChecklist().map((item) => {
      if (item.subTitle === 'ไฟตัดหมอก') {
        return {
          ...item,
          status: 'fail',
          issueNotes: 'หลอดไฟตัดหมอกหน้าซ้ายดับ ไม่ติดส่องสว่าง',
        };
      }
      return item;
    }),
    documentAttachment: {
      name: 'รายงานข้อบกพร่อง_BLS03_ไฟตัดหมอก.jpg',
      type: 'image',
      dataUrl: generateSvgCarPlaceholder('BLS-03', 'เอกสารบันทึกแจ้งซ่อม', '#eab308'),
      size: '850 KB',
    },
    overallStatus: 'issue_found',
    summaryNotes: 'พบไฟตัดหมอกหน้าซ้ายขาด ได้แจ้งแอดมินยานพาหนะสั่งอะไหล่เรียบร้อย',
    googleSheetsSyncStatus: 'synced',
    googleSheetsRowIndex: 3,
    createdAt: Date.now() - 3600000 * 28,
  },
];

const STAFF_STORAGE_KEY = 'bls_staff_members_v1';

export const INITIAL_STAFF: UserProfile[] = [
  {
    id: 'user-admin-01',
    name: 'พ.ต.ต. ธนกร มั่นคง',
    role: 'admin',
    employeeId: 'ADM-90210',
    position: 'หัวหน้างานกู้ชีพฉุกเฉิน',
    department: 'ฝ่ายปฏิบัติการกู้ชีพ BLS',
    phone: '081-998-1122',
    status: 'active',
    email: 'thanakorn.fleet@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-staff-01',
    name: 'สมนึก มีพร้อม',
    role: 'staff',
    employeeId: 'EMT-67041',
    position: 'เจ้าหน้าที่กู้ชีพฉุกเฉิน (EMT-B)',
    department: 'เวรปฏิบัติการ BLS ผลัด 1',
    phone: '086-442-3311',
    status: 'active',
    email: 'somnuek.bls@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-staff-02',
    name: 'วิชัย ชัยชนะ',
    role: 'staff',
    employeeId: 'EMT-67042',
    position: 'พนักงานขับรถพยาบาลฉุกเฉิน',
    department: 'เวรปฏิบัติการ BLS ผลัด 2',
    phone: '089-223-4455',
    status: 'active',
    email: 'wichai.c@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-staff-03',
    name: 'ประเสริฐ ยืนยง',
    role: 'staff',
    employeeId: 'EMT-67043',
    position: 'เจ้าหน้าที่เวชกรฉุกเฉิน',
    department: 'เวรปฏิบัติการ BLS ผลัด 3',
    phone: '084-556-7788',
    status: 'on_leave',
    email: 'prasert.y@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-admin-02',
    name: 'กัญญาณี รักษ์สุข',
    role: 'admin',
    employeeId: 'ADM-90211',
    position: 'ผู้ช่วยงานธุรการยานพาหนะ',
    department: 'ฝ่ายสนับสนุนการกู้ชีพ',
    phone: '082-334-9988',
    status: 'active',
    email: 'kanyanee.r@ems-fleet.go.th',
    avatarUrl: '',
  },
];

export const DEMO_USERS: Record<string, UserProfile> = {
  staff: INITIAL_STAFF[1],
  admin: INITIAL_STAFF[0],
};

export function getStoredStaff(): UserProfile[] {
  try {
    const data = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading staff from localStorage', e);
    return INITIAL_STAFF;
  }
}

export function saveStaff(staffList: UserProfile[]) {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
  } catch (e) {
    console.error('Error saving staff to localStorage', e);
  }
}

// Storage Access Functions
export function getStoredVehicles(): AmbulanceVehicle[] {
  try {
    const data = localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading vehicles from localStorage', e);
    return INITIAL_VEHICLES;
  }
}

export function saveVehicles(vehicles: AmbulanceVehicle[]) {
  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Error saving vehicles to localStorage', e);
  }
}

import {
  idbSaveInspection,
  idbGetAllInspections,
  idbDeleteInspection,
  idbClearAllInspections,
} from './indexedDb';

function safelyPersistInspections(records: InspectionRecord[]) {
  try {
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(records));
  } catch (quotaErr) {
    console.warn('LocalStorage quota warning, compressing storage payload...', quotaErr);
    try {
      // Keep full data in IndexedDB, but in localStorage strip inline base64 for records beyond the first one
      const compacted = records.slice(0, 15).map((r, idx) => {
        if (idx === 0) return r; // keep the newest one
        return {
          ...r,
          photos: {
            front: r.photos.front?.length > 4000 ? r.driveLinks?.frontPhotoUrl || '' : r.photos.front,
            rear: r.photos.rear?.length > 4000 ? r.driveLinks?.rearPhotoUrl || '' : r.photos.rear,
            left: r.photos.left?.length > 4000 ? r.driveLinks?.leftPhotoUrl || '' : r.photos.left,
            right: r.photos.right?.length > 4000 ? r.driveLinks?.rightPhotoUrl || '' : r.photos.right,
          },
          documentAttachment: r.documentAttachment
            ? { ...r.documentAttachment, dataUrl: r.driveLinks?.documentUrl || '' }
            : undefined,
        };
      });
      localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(compacted));
    } catch (err2) {
      console.warn('LocalStorage still full, storing lightweight metadata only', err2);
      try {
        const lightweight = records.slice(0, 8).map((r) => ({
          ...r,
          photos: { front: '', rear: '', left: '', right: '' },
          documentAttachment: r.documentAttachment
            ? { name: r.documentAttachment.name, type: r.documentAttachment.type, dataUrl: '' }
            : undefined,
        }));
        localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(lightweight));
      } catch (err3) {
        console.error('LocalStorage quota fully exceeded, records remain safely saved in IndexedDB', err3);
      }
    }
  }
}

export function getStoredInspections(): InspectionRecord[] {
  try {
    const data = localStorage.getItem(INSPECTIONS_STORAGE_KEY);
    if (!data) {
      safelyPersistInspections(INITIAL_INSPECTIONS);
      return INITIAL_INSPECTIONS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading inspections from localStorage', e);
    return INITIAL_INSPECTIONS;
  }
}

export function saveInspectionRecord(record: InspectionRecord): InspectionRecord[] {
  const current = getStoredInspections();
  const updated = [record, ...current.filter((r) => r.id !== record.id)];

  // Always save to IndexedDB (safe from quota limitations)
  idbSaveInspection(record).catch((err) => console.warn('IDB save warning:', err));

  // Safely persist to localStorage with quota protection
  safelyPersistInspections(updated);

  // Update vehicle's last inspection date and status
  const vehicles = getStoredVehicles();
  const targetVeh = vehicles.find((v) => v.id === record.vehicleId);
  if (targetVeh) {
    targetVeh.lastInspectionDate = record.uploadTimestamp;
    targetVeh.lastInspector = `${record.inspectorName} (${record.inspectorRole === 'admin' ? 'Admin' : 'Staff'})`;
    targetVeh.currentOdometer = record.odometerReading;
    if (record.overallStatus === 'needs_repair') {
      targetVeh.status = 'maintenance';
    } else if (record.overallStatus === 'issue_found') {
      targetVeh.status = 'issue_found';
    } else {
      targetVeh.status = 'available';
    }
    saveVehicles(vehicles);
  }

  return updated;
}

export function updateInspectionRecord(updatedRecord: InspectionRecord) {
  const list = getStoredInspections();
  const idx = list.findIndex((r) => r.id === updatedRecord.id);
  if (idx >= 0) {
    list[idx] = updatedRecord;
    safelyPersistInspections(list);
    idbSaveInspection(updatedRecord).catch((err) => console.warn('IDB update warning:', err));
  }
}

export function deleteInspectionRecord(recordId: string): InspectionRecord[] {
  const list = getStoredInspections().filter((r) => r.id !== recordId);
  safelyPersistInspections(list);
  idbDeleteInspection(recordId).catch((err) => console.warn('IDB delete warning:', err));
  return list;
}

export function clearAllInspectionRecords(): InspectionRecord[] {
  safelyPersistInspections([]);
  idbClearAllInspections().catch((err) => console.warn('IDB clear warning:', err));
  return [];
}

export async function syncInspectionsFromIndexedDb(): Promise<InspectionRecord[]> {
  try {
    const idbRecords = await idbGetAllInspections();
    if (idbRecords && idbRecords.length > 0) {
      return idbRecords;
    }
  } catch (e) {
    console.warn('Sync from IDB error:', e);
  }
  return getStoredInspections();
}

export function clearAllSystemData(clearVehiclesAndStaff = false) {
  try {
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify([]));
    if (clearVehiclesAndStaff) {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify([]));
    }
  } catch (e) {
    console.error(e);
  }
}

export function resetToInitialDemoData() {
  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(INITIAL_INSPECTIONS));
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF));
  } catch (e) {
    console.error(e);
  }
}

export function getCurrentUser(): UserProfile {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) {
      return DEMO_USERS.staff;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEMO_USERS.staff;
  }
}

export function setCurrentUser(user: UserProfile) {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error(e);
  }
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const data = localStorage.getItem(GSHEETS_CONFIG_KEY);
    if (!data) {
      return { autoSync: true };
    }
    return JSON.parse(data);
  } catch (e) {
    return { autoSync: true };
  }
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig) {
  try {
    localStorage.setItem(GSHEETS_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

// ============================================
// รอยรอบตัวรถ (Damage Records) Persistence
// ============================================
const DAMAGE_RECORDS_KEY = 'bls_vehicle_damages_v1';

export function generateSvgDamagePlaceholder(area: string, description: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="#1e293b" />
    <circle cx="300" cy="190" r="100" fill="#334155" stroke="#f59e0b" stroke-width="4" stroke-dasharray="8 6"/>
    <path d="M 240 170 Q 290 220 360 180 M 270 150 L 330 230" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>
    <text x="300" y="330" fill="#f8fafc" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">
      ตำแหน่ง: ${area}
    </text>
    <text x="300" y="365" fill="#94a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">
      ${description}
    </text>
    <rect x="20" y="20" width="130" height="32" rx="6" fill="#ef4444" opacity="0.9"/>
    <text x="85" y="41" fill="#ffffff" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">
      รอยแผลตัวรถ
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_DAMAGE_ITEMS: VehicleDamageItem[] = [
  {
    id: 'dmg-01',
    vehicleId: 'veh-01',
    vehicleCode: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    positionArea: 'กันชนหน้าด้านขวา',
    description: 'รอยขูดขีดสีถลอกยาวประมาณ 10 ซม. จากกิ่งไม้ขณะเข้าพื้นที่ชุมชนซอยแคบ',
    severity: 'minor_scratch',
    photoUrl: generateSvgDamagePlaceholder('กันชนหน้าขวา', 'รอยขูดขีดสีถลอก 10 ซม.'),
    createdAt: '08/11/2569 09:30',
    inspectorName: 'พ.ต.ต. ธนกร มั่นคง',
    inspectorRole: 'admin',
    odometerAtReport: 142320,
    resolved: false,
  },
  {
    id: 'dmg-02',
    vehicleId: 'veh-02',
    vehicleCode: 'BLS-02',
    plateNumber: '3ฒภ 9812 กรุงเทพมหานคร',
    positionArea: 'ซุ้มล้อหลังซ้าย',
    description: 'รอยบุบเล็กน้อยและสีถลอกจากการเลี้ยวเฉียดขอบทางเท้า',
    severity: 'dent',
    photoUrl: generateSvgDamagePlaceholder('ซุ้มล้อหลังซ้าย', 'รอยบุบและสีถลอก'),
    createdAt: '07/11/2569 16:15',
    inspectorName: 'วิชัย ชาญวิทย์',
    inspectorRole: 'staff',
    odometerAtReport: 98100,
    resolved: false,
  },
  {
    id: 'dmg-03',
    vehicleId: 'veh-03',
    vehicleCode: 'BLS-03',
    plateNumber: '2ขค 7714 กรุงเทพมหานคร',
    positionArea: 'ฝากระโปรงหน้า',
    description: 'รอยสะเก็ดหินดีดใส่ผิวสีเป็นจุดเล็กๆ 3 จุด',
    severity: 'paint_chip',
    photoUrl: generateSvgDamagePlaceholder('ฝากระโปรงหน้า', 'รอยสะเก็ดหินดีด'),
    createdAt: '09/11/2569 11:20',
    inspectorName: 'ประเสริฐ ยืนยง',
    inspectorRole: 'staff',
    odometerAtReport: 188950,
    resolved: false,
  },
];

export function getStoredDamageRecords(): VehicleDamageItem[] {
  try {
    const data = localStorage.getItem(DAMAGE_RECORDS_KEY);
    if (!data) {
      localStorage.setItem(DAMAGE_RECORDS_KEY, JSON.stringify(INITIAL_DAMAGE_ITEMS));
      return INITIAL_DAMAGE_ITEMS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading damage records', e);
    return INITIAL_DAMAGE_ITEMS;
  }
}

export function saveDamageRecord(item: VehicleDamageItem): VehicleDamageItem[] {
  try {
    const list = getStoredDamageRecords();
    const idx = list.findIndex((d) => d.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(DAMAGE_RECORDS_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Error saving damage record', e);
    return getStoredDamageRecords();
  }
}

export function deleteDamageRecord(id: string): VehicleDamageItem[] {
  try {
    const list = getStoredDamageRecords().filter((d) => d.id !== id);
    localStorage.setItem(DAMAGE_RECORDS_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Error deleting damage record', e);
    return getStoredDamageRecords();
  }
}

// ============================================
// ประวัติการเติมน้ำมัน (Fuel Log) Persistence
// ============================================
const FUEL_LOGS_KEY = 'bls_fuel_logs_v1';

export const INITIAL_FUEL_LOGS: FuelLogRecord[] = [
  {
    id: 'fuel-01',
    vehicleId: 'veh-01',
    vehicleCode: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    fuelDate: '02/11/2569 08:30',
    odometer: 141750,
    liters: 55.0,
    totalCost: 1760,
    pricePerLiter: 32.0,
    fuelType: 'ดีเซล B7',
    gasStation: 'ปตท. สำนักงานใหญ่',
    driverName: 'สมนึก มีพร้อม',
    notes: 'เติมเต็มถังก่อนเริ่มผลัดเวรประจำเดือน',
    createdAt: Date.now() - 3600000 * 24 * 8,
  },
  {
    id: 'fuel-02',
    vehicleId: 'veh-01',
    vehicleCode: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    fuelDate: '06/11/2569 14:15',
    odometer: 142300,
    previousOdometer: 141750,
    distanceDriven: 550,
    liters: 52.4,
    totalCost: 1676,
    pricePerLiter: 32.0,
    fuelType: 'ดีเซล B7',
    gasStation: 'บางจาก พระราม 9',
    driverName: 'วิชัย ชาญวิทย์',
    kmPerLiter: 10.5,
    costPerKm: 3.05,
    notes: 'วิ่งออกเหตุฉุกเฉินโซนตะวันออก 14 เที่ยว',
    createdAt: Date.now() - 3600000 * 24 * 4,
  },
  {
    id: 'fuel-03',
    vehicleId: 'veh-01',
    vehicleCode: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    fuelDate: '09/11/2569 17:40',
    odometer: 142850,
    previousOdometer: 142300,
    distanceDriven: 550,
    liters: 53.0,
    totalCost: 1696,
    pricePerLiter: 32.0,
    fuelType: 'ดีเซล B7',
    gasStation: 'ปตท. แจ้งวัฒนะ',
    driverName: 'สมนึก มีพร้อม',
    kmPerLiter: 10.38,
    costPerKm: 3.08,
    notes: 'เติมเต็มถังหลังส่งเวร 24 ชม.',
    createdAt: Date.now() - 3600000 * 24 * 1,
  },
  {
    id: 'fuel-04',
    vehicleId: 'veh-02',
    vehicleCode: 'BLS-02',
    plateNumber: '3ฒภ 9812 กรุงเทพมหานคร',
    fuelDate: '04/11/2569 10:00',
    odometer: 97850,
    liters: 50.0,
    totalCost: 1600,
    pricePerLiter: 32.0,
    fuelType: 'ดีเซล B7',
    gasStation: 'เชลล์ วิภาวดี',
    driverName: 'วิชัย ชาญวิทย์',
    createdAt: Date.now() - 3600000 * 24 * 6,
  },
  {
    id: 'fuel-05',
    vehicleId: 'veh-02',
    vehicleCode: 'BLS-02',
    plateNumber: '3ฒภ 9812 กรุงเทพมหานคร',
    fuelDate: '08/11/2569 16:30',
    odometer: 98420,
    previousOdometer: 97850,
    distanceDriven: 570,
    liters: 51.5,
    totalCost: 1648,
    pricePerLiter: 32.0,
    fuelType: 'ดีเซล B7',
    gasStation: 'ปตท. ดอนเมือง',
    driverName: 'วิชัย ชาญวิทย์',
    kmPerLiter: 11.07,
    costPerKm: 2.89,
    notes: 'อัตราสิ้นเปลืองประหยัด วิ่งสายเหนือคล่องตัว',
    createdAt: Date.now() - 3600000 * 24 * 2,
  },
];

export function getStoredFuelLogs(): FuelLogRecord[] {
  try {
    const data = localStorage.getItem(FUEL_LOGS_KEY);
    if (!data) {
      localStorage.setItem(FUEL_LOGS_KEY, JSON.stringify(INITIAL_FUEL_LOGS));
      return INITIAL_FUEL_LOGS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading fuel logs', e);
    return INITIAL_FUEL_LOGS;
  }
}

/**
 * Get the latest recorded fuel odometer for a given vehicle
 */
export function getLatestFuelOdometer(vehicleId: string): number | null {
  const logs = getStoredFuelLogs().filter((l) => l.vehicleId === vehicleId);
  if (logs.length === 0) return null;
  // Sort descending by odometer
  logs.sort((a, b) => b.odometer - a.odometer);
  return logs[0].odometer;
}

export function saveFuelLog(record: FuelLogRecord): FuelLogRecord[] {
  try {
    const list = getStoredFuelLogs();
    const idx = list.findIndex((f) => f.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(FUEL_LOGS_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Error saving fuel log', e);
    return getStoredFuelLogs();
  }
}

export function deleteFuelLog(id: string): FuelLogRecord[] {
  try {
    const list = getStoredFuelLogs().filter((f) => f.id !== id);
    localStorage.setItem(FUEL_LOGS_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Error deleting fuel log', e);
    return getStoredFuelLogs();
  }
}
