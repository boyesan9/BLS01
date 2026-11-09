export type UserRole = 'admin' | 'staff';

export type UserStatus = 'active' | 'on_leave' | 'inactive';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  employeeId: string;
  position?: string;
  department?: string;
  phone?: string;
  status?: UserStatus;
  email?: string;
  avatarUrl?: string;
}

export type VehicleStatus = 'available' | 'issue_found' | 'maintenance';

export interface AmbulanceVehicle {
  id: string;
  code: string;            // เช่น 'BLS-01'
  plateNumber: string;     // เช่น '1กข 4589 กรุงเทพมหานคร'
  brandModel: string;      // เช่น 'Toyota Commuter 3.0 D4D'
  year: string;            // เช่น '2023'
  status: VehicleStatus;
  currentOdometer: number;
  imageUrl?: string;
  lastInspectionDate?: string;
  lastInspector?: string;
  notes?: string;
}

export type ItemStatus = 'pass' | 'warning' | 'fail';

export interface VehicleChecklistItem {
  id: string;
  categoryId: number;
  categoryTitle: string;
  subTitle: string;
  standard: string;
  status: ItemStatus;
  issueNotes: string;
}

export interface FourSidePhotos {
  front: string;
  rear: string;
  left: string;
  right: string;
}

export interface DocumentAttachment {
  name: string;
  type: 'pdf' | 'image';
  dataUrl: string;
  size?: string;
}

export type ShiftType = '24hr' | 'morning' | 'afternoon' | 'night';

export interface GoogleDriveLinks {
  folderId?: string;
  folderUrl?: string;
  frontPhotoUrl?: string;
  rearPhotoUrl?: string;
  leftPhotoUrl?: string;
  rightPhotoUrl?: string;
  documentUrl?: string;
}

export interface InspectionRecord {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  plateNumber: string;
  inspectorName: string;
  inspectorRole: UserRole;
  uploadTimestamp: string;
  shift: ShiftType;
  shiftLabel: string;
  odometerReading: number;
  photos: FourSidePhotos;
  vehicleChecklist: VehicleChecklistItem[];
  documentAttachment?: DocumentAttachment;
  overallStatus: 'normal' | 'issue_found' | 'needs_repair';
  summaryNotes: string;
  googleSheetsSyncStatus: 'synced' | 'pending' | 'failed' | 'not_connected';
  googleSheetsRowIndex?: number;
  driveLinks?: GoogleDriveLinks;
  createdAt: number;
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetName?: string;
  lastSyncedAt?: string;
  autoSync: boolean;
}

export interface SystemAuditLogEntry {
  id: string;
  timestamp: string;
  action: string;      // เช่น 'เพิ่มข้อมูล', 'แก้ไขข้อมูล', 'ลบข้อมูล', 'ตรวจสภาพรถ', 'ดึงข้อมูลคืน'
  module: string;      // เช่น 'รถกู้ชีพ BLS', 'เจ้าหน้าที่', 'ตรวจสภาพรถ', 'ระบบภาพรวม'
  targetItem: string;  // เช่น 'BLS-01 (1กข 4589)', 'สมนึก มีพร้อม'
  operator: string;    // เช่น 'พ.ต.ต. ธนกร มั่นคง (Admin)'
  details: string;     // รายละเอียดการเปลี่ยนแปลง
}

