import React, { useState, useEffect } from 'react';
import {
  AmbulanceVehicle,
  GoogleSheetsConfig,
  InspectionRecord,
  UserProfile,
  UserRole,
  VehicleStatus,
} from './types';
import {
  getStoredVehicles,
  saveVehicles,
  getStoredInspections,
  saveInspectionRecord,
  updateInspectionRecord,
  getCurrentUser,
  setCurrentUser,
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  getStoredStaff,
  saveStaff,
  deleteInspectionRecord,
  clearAllInspectionRecords,
  clearAllSystemData,
  resetToInitialDemoData,
  DEMO_USERS,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { InspectionForm } from './components/InspectionForm';
import { AdminDashboard } from './components/AdminDashboard';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { VehicleModal } from './components/VehicleModal';
import { StaffModal } from './components/StaffModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PrintReportView } from './components/PrintReportView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { initAuth, googleSignIn, getAccessToken, logoutGoogle } from './services/firebaseAuth';
import {
  appendInspectionToSheet,
  formatRecordForSheet,
  syncVehiclesToSheet,
  syncStaffToSheet,
  appendAuditLogToSheet,
  pullAllDataFromGoogleSheets,
} from './services/googleSheets';
import { uploadInspectionMediaToDrive } from './services/googleDrive';
import { syncInspectionsFromIndexedDb } from './services/storage';
import { User } from 'firebase/auth';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Logged in with default persona for instant testing
  const [currentView, setCurrentView] = useState<'form' | 'dashboard'>('form');

  const [vehicles, setVehicles] = useState<AmbulanceVehicle[]>(() => getStoredVehicles());
  const [inspections, setInspections] = useState<InspectionRecord[]>(() => getStoredInspections());

  const [selectedRecordDetail, setSelectedRecordDetail] = useState<InspectionRecord | null>(null);
  const [recordToPrint, setRecordToPrint] = useState<InspectionRecord | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<AmbulanceVehicle | null>(null);

  const [staffList, setStaffList] = useState<UserProfile[]>(() => getStoredStaff());
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<UserProfile | null>(null);

  const [googleSheetsModalOpen, setGoogleSheetsModalOpen] = useState(false);
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => getGoogleSheetsConfig());
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Admin authentication state
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);
  const [isSyncingGSheets, setIsSyncingGSheets] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
    linkUrl?: string;
    linkText?: string;
  } | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setGoogleUser(user);
        if (user) {
          setIsAdminVerified(true);
        }
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Hydrate inspections from IndexedDB on startup to safeguard full photo history
  useEffect(() => {
    syncInspectionsFromIndexedDb()
      .then((records) => {
        if (records && records.length > 0) {
          setInspections(records);
        }
      })
      .catch((err) => {
        console.warn('IndexedDB initial sync warning:', err);
      });
  }, []);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Centralized audit logger and automated Google Sheets sync
  const logSystemActivityAndSyncSheets = async (
    action: string,
    module: string,
    targetItem: string,
    details: string
  ) => {
    try {
      const spreadsheetId = googleSheetsConfig.spreadsheetId;
      if (!spreadsheetId) return;

      const token = await getAccessToken();
      if (!token) return;

      const operatorName = googleUser?.email
        ? `${currentUser?.name || 'Admin'} (${googleUser.email})`
        : `${currentUser?.name || 'Admin'} (${currentUser?.role === 'admin' ? 'Admin' : 'Staff'})`;

      await appendAuditLogToSheet(
        spreadsheetId,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('th-TH'),
          action,
          module,
          targetItem,
          operator: operatorName,
          details,
        },
        token
      );
    } catch (err) {
      console.warn('Audit logging warning:', err);
    }
  };

  // Two-way Sync Back handler from Google Sheets
  const handleSyncBackData = (data: {
    vehicles: AmbulanceVehicle[];
    staffList: UserProfile[];
    inspectionsCount: number;
  }) => {
    if (data.vehicles && data.vehicles.length > 0) {
      setVehicles(data.vehicles);
      saveVehicles(data.vehicles);
    }
    if (data.staffList && data.staffList.length > 0) {
      setStaffList(data.staffList);
      saveStaff(data.staffList);
    }
    // Also re-hydrate inspections from storage
    const storedInspections = getStoredInspections();
    setInspections(storedInspections);

    setToastNotification({
      type: 'success',
      title: 'ดึงข้อมูลคืน (Sync Back) สำเร็จ',
      message: `กู้คืนข้อมูลจาก Google Sheets เรียบร้อย (รถ ${data.vehicles.length} คัน, เจ้าหน้าที่ ${data.staffList.length} คน, บันทึกตรวจ ${data.inspectionsCount} รายการ)`,
    });
  };

  // Login handler
  const handleLogin = (user: UserProfile) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'admin') {
      setIsAdminVerified(true);
      setCurrentView('dashboard');
    } else {
      setCurrentView('form');
    }
  };

  // Switch role handler (Admin <-> Staff) with security passcode or Gmail verification
  const handleSwitchRole = (role: UserRole) => {
    if (role === 'admin') {
      // Admin requires Google login or security passcode verification
      if (!googleUser && !isAdminVerified) {
        setAdminAuthModalOpen(true);
        return;
      }
      const updated: UserProfile = {
        ...(currentUser || DEMO_USERS.admin),
        role: 'admin',
      };
      setCurrentUserState(updated);
      setCurrentUser(updated);
      setCurrentView('dashboard');
    } else {
      const updated: UserProfile = {
        ...(currentUser || DEMO_USERS.staff),
        role: 'staff',
      };
      setCurrentUserState(updated);
      setCurrentUser(updated);
      setCurrentView('form');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Google Login Trigger
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToastNotification({
          type: 'success',
          title: 'เชื่อมต่อบัญชี Google สำเร็จ',
          message: `ลงชื่อเข้าใช้ด้วย ${res.user.email} พร้อมสำหรับการซิงค์ชีต`,
        });
      }
    } catch (err: any) {
      setToastNotification({
        type: 'error',
        title: 'การเชื่อมต่อ Google ไม่สำเร็จ',
        message: err.message || 'โปรดตรวจสอบการอนุญาตสิทธิ์',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Submit Inspection Record
  const handleSubmitInspection = async (record: InspectionRecord) => {
    setIsSubmittingInspection(true);
    try {
      // 1. Save locally first
      let recordToSave = { ...record };

      // 2. Try Google Drive & Sheets Sync
      let driveSucceeded = false;
      let syncSucceeded = false;
      const targetSpreadsheetId = googleSheetsConfig.spreadsheetId;

      try {
        const token = await getAccessToken();
        if (token) {
          // Upload 4-side photos and attached document to Google Drive
          try {
            const driveLinks = await uploadInspectionMediaToDrive(token, record);
            recordToSave.driveLinks = driveLinks;
            driveSucceeded = true;
          } catch (driveErr) {
            console.warn('Google Drive upload warning:', driveErr);
          }

          // Sync row with Google Drive links to Google Sheets
          if (targetSpreadsheetId) {
            await appendInspectionToSheet(targetSpreadsheetId, recordToSave, token);
            syncSucceeded = true;
            recordToSave.googleSheetsSyncStatus = 'synced';
          }
        }
      } catch (cloudErr: any) {
        console.warn('Google Workspace sync warning:', cloudErr);
      }

      const updatedList = saveInspectionRecord(recordToSave);
      setInspections(updatedList);
      const latestVehicles = getStoredVehicles();
      setVehicles(latestVehicles);

      // Automated background mirror of updated vehicle fleet & audit trail to Google Sheets
      if (googleSheetsConfig.spreadsheetId) {
        getAccessToken().then((token) => {
          if (token && googleSheetsConfig.spreadsheetId) {
            syncVehiclesToSheet(googleSheetsConfig.spreadsheetId, latestVehicles, token).catch(console.warn);
          }
        });
      }
      logSystemActivityAndSyncSheets(
        'ตรวจสภาพรถ',
        'ตรวจสภาพรถ',
        `${record.vehicleCode} (${record.plateNumber})`,
        `ผลตรวจ: ${record.overallStatus === 'normal' ? 'ปกติ/พร้อมใช้' : record.overallStatus === 'issue_found' ? 'พบปัญหาเล็กน้อย' : 'ส่งซ่อม/ไม่พร้อมใช้'} · ไมล์: ${record.odometerReading} กม.`
      );

      const statusDesc = [];
      if (driveSucceeded) statusDesc.push('บันทึกรูปภาพและเอกสารลง Google Drive');
      if (syncSucceeded) statusDesc.push('ซิงค์ข้อมูลลง Google Sheets');

      setToastNotification({
        type: 'success',
        title: 'บันทึกการตรวจสภาพรถสำเร็จ!',
        message:
          statusDesc.length > 0
            ? `บันทึกข้อมูลรถ ${record.vehicleCode} (${record.plateNumber}) และ ${statusDesc.join(' + ')} เรียบร้อยแล้ว`
            : `บันทึกข้อมูลรถ ${record.vehicleCode} (${record.plateNumber}) ในระบบเรียบร้อย (สามารถซิงค์ขึ้น Drive/Sheets ภายหลังได้)`,
        linkUrl: recordToSave.driveLinks?.folderUrl || googleSheetsConfig.spreadsheetUrl,
        linkText: recordToSave.driveLinks?.folderUrl
          ? 'เปิดดูรูปใน Google Drive'
          : syncSucceeded
          ? 'เปิดดูใน Google Sheets'
          : undefined,
      });

      // Switch view after submitting (Admins review dashboard, Staff stay on form)
      if (currentUser?.role === 'admin') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('form');
      }
    } catch (err: any) {
      console.error(err);
      setToastNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        message: err.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  // Force single record sync to Google Drive & Sheets
  const handleSyncSingleRecord = async (record: InspectionRecord) => {
    setIsSyncingGSheets(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setGoogleUser(res.user);
        }
      }

      if (!token) throw new Error('ไม่พบ Access Token กรุณาลงชื่อเข้าใช้ Google');

      let updatedRecord = { ...record };

      // Upload media to Google Drive if not uploaded yet
      if (!updatedRecord.driveLinks?.folderUrl) {
        try {
          const driveLinks = await uploadInspectionMediaToDrive(token, updatedRecord);
          updatedRecord.driveLinks = driveLinks;
        } catch (dErr) {
          console.warn('Drive upload error:', dErr);
        }
      }

      const sheetId = googleSheetsConfig.spreadsheetId;
      if (sheetId) {
        await appendInspectionToSheet(sheetId, updatedRecord, token);
        updatedRecord.googleSheetsSyncStatus = 'synced';
      }

      updateInspectionRecord(updatedRecord);
      setInspections(getStoredInspections());
      setSelectedRecordDetail(updatedRecord);

      setToastNotification({
        type: 'success',
        title: 'ซิงค์ข้อมูลสำเร็จ',
        message: `อัปโหลดรูปภาพลง Google Drive และบันทึกผลลง Google Sheets เรียบร้อยแล้ว`,
        linkUrl: updatedRecord.driveLinks?.folderUrl || googleSheetsConfig.spreadsheetUrl,
        linkText: 'เปิดดูใน Google Drive',
      });
    } catch (err: any) {
      setToastNotification({
        type: 'error',
        title: 'ไม่สามารถซิงค์ข้อมูลได้',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    } finally {
      setIsSyncingGSheets(false);
    }
  };

  // Delete single inspection (Admin only)
  const handleDeleteInspection = (recordId: string) => {
    if (currentUser?.role !== 'admin') {
      setToastNotification({
        type: 'error',
        title: 'ไม่มีสิทธิ์ดำเนินการ',
        message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ลบประวัติการตรวจ',
      });
      return;
    }
    const targetRec = inspections.find((r) => r.id === recordId);
    const updated = deleteInspectionRecord(recordId);
    setInspections(updated);
    if (selectedRecordDetail?.id === recordId) {
      setSelectedRecordDetail(null);
    }

    logSystemActivityAndSyncSheets(
      'ลบข้อมูลการตรวจ',
      'ตรวจสภาพรถ',
      targetRec ? `${targetRec.vehicleCode} (${targetRec.plateNumber})` : recordId,
      `ลบรายการตรวจสภาพประจำวันที่ ${targetRec?.uploadTimestamp || '-'} ออกจากระบบ`
    );

    setToastNotification({
      type: 'info',
      title: 'ลบประวัติการตรวจแล้ว',
      message: 'ลบรายการบันทึกการตรวจสภาพรถออกจากระบบเรียบร้อยแล้ว',
    });
  };

  // Clear all inspections (Admin only)
  const handleClearAllInspections = () => {
    if (currentUser?.role !== 'admin') {
      setToastNotification({
        type: 'error',
        title: 'ไม่มีสิทธิ์ดำเนินการ',
        message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ล้างประวัติการตรวจ',
      });
      return;
    }
    const countBefore = inspections.length;
    const emptyList = clearAllInspectionRecords();
    setInspections(emptyList);
    setSelectedRecordDetail(null);

    logSystemActivityAndSyncSheets(
      'เคลียร์ตารางประวัติทั้งหมด',
      'ตรวจสภาพรถ',
      'ประวัติการตรวจสภาพทั้งหมด',
      `เคลียร์ประวัติการตรวจสภาพรถทั้งหมดจำนวน ${countBefore} รายการ เพื่อเตรียมทดสอบระบบ`
    );

    setToastNotification({
      type: 'info',
      title: 'ล้างประวัติการตรวจทั้งหมดแล้ว',
      message: 'เคลียร์ตารางประวัติการตรวจสภาพรถทั้งหมดเรียบร้อยแล้ว พร้อมสำหรับการทดสอบระบบใหม่',
    });
  };

  // Reset demo data
  const handleResetDemoData = () => {
    resetToInitialDemoData();
    const freshVehicles = getStoredVehicles();
    const freshInspections = getStoredInspections();
    const freshStaff = getStoredStaff();

    setVehicles(freshVehicles);
    setInspections(freshInspections);
    setStaffList(freshStaff);
    setSelectedRecordDetail(null);

    if (googleSheetsConfig.spreadsheetId) {
      getAccessToken().then((token) => {
        if (token && googleSheetsConfig.spreadsheetId) {
          syncVehiclesToSheet(googleSheetsConfig.spreadsheetId, freshVehicles, token).catch(console.warn);
          syncStaffToSheet(googleSheetsConfig.spreadsheetId, freshStaff, token).catch(console.warn);
        }
      });
    }

    logSystemActivityAndSyncSheets(
      'รีเซ็ตข้อมูลตัวอย่าง',
      'ระบบภาพรวม',
      'ฐานข้อมูลระบบ',
      'คืนค่าข้อมูลตัวอย่างรถกู้ชีพ BLS, พนักงาน และผลตรวจสภาพเริ่มต้น'
    );

    setToastNotification({
      type: 'success',
      title: 'รีเซ็ตข้อมูลตัวอย่างสำเร็จ',
      message: 'คืนค่าข้อมูลรถ, พนักงาน และตัวอย่างผลตรวจสภาพเรียบร้อยแล้ว',
    });
  };

  // Clear all data completely for fresh system testing
  const handleClearAllSystemData = (clearFleetAndStaff = false) => {
    if (currentUser?.role !== 'admin') {
      setToastNotification({
        type: 'error',
        title: 'ไม่มีสิทธิ์ดำเนินการ',
        message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ล้างข้อมูลทั้งหมด',
      });
      return;
    }
    clearAllSystemData(clearFleetAndStaff);
    setInspections([]);
    if (clearFleetAndStaff) {
      setVehicles([]);
      if (googleSheetsConfig.spreadsheetId) {
        getAccessToken().then((token) => {
          if (token && googleSheetsConfig.spreadsheetId) {
            syncVehiclesToSheet(googleSheetsConfig.spreadsheetId, [], token).catch(console.warn);
          }
        });
      }
    }
    setSelectedRecordDetail(null);
    setRecordToPrint(null);

    logSystemActivityAndSyncSheets(
      'ล้างข้อมูลระบบ',
      'ระบบภาพรวม',
      clearFleetAndStaff ? 'ข้อมูลตรวจ + กองรถ BLS' : 'ข้อมูลประวัติการตรวจ',
      clearFleetAndStaff
        ? 'ล้างข้อมูลประวัติการตรวจและรายชื่อรถทั้งหมด เพื่อเริ่มต้นทดสอบระบบจากศูนย์'
        : 'เคลียร์ประวัติการตรวจทั้งหมด พร้อมสำหรับการเริ่มบันทึกตรวจรถรอบใหม่'
    );

    setToastNotification({
      type: 'info',
      title: 'ล้างข้อมูลเพื่อทดสอบระบบแล้ว',
      message: clearFleetAndStaff
        ? 'ล้างประวัติการตรวจและรายชื่อรถทั้งหมดแล้ว พร้อมให้เริ่มทดสอบระบบตั้งแต่ศูนย์'
        : 'เคลียร์ประวัติการตรวจทั้งหมดแล้ว พร้อมสำหรับการเริ่มบันทึกตรวจรถรอบใหม่',
    });
  };

  // Vehicle CRUD with automated Google Sheets background sync & audit log
  const handleSaveVehicle = (vehicle: AmbulanceVehicle) => {
    const list = [...vehicles];
    const idx = list.findIndex((v) => v.id === vehicle.id);
    const isNew = idx < 0;
    if (!isNew) {
      list[idx] = vehicle;
    } else {
      list.push(vehicle);
    }
    setVehicles(list);
    saveVehicles(list);

    // Auto-sync fleet mirror to Google Sheets
    if (googleSheetsConfig.spreadsheetId) {
      getAccessToken().then((token) => {
        if (token && googleSheetsConfig.spreadsheetId) {
          syncVehiclesToSheet(googleSheetsConfig.spreadsheetId, list, token).catch(console.warn);
        }
      });
    }

    logSystemActivityAndSyncSheets(
      isNew ? 'เพิ่มรถกู้ชีพ' : 'แก้ไขข้อมูลรถกู้ชีพ',
      'รถกู้ชีพ BLS',
      `${vehicle.code} (${vehicle.plateNumber})`,
      `${isNew ? 'เพิ่มรถใหม่เข้าสู่ระบบ' : 'อัปเดตข้อมูลรถ'} · ยี่ห้อ/รุ่น: ${vehicle.brandModel} · สถานะ: ${vehicle.status} · ไมล์: ${vehicle.currentOdometer} กม.`
    );

    setToastNotification({
      type: 'success',
      title: 'บันทึกข้อมูลรถสำเร็จ',
      message: `บันทึกข้อมูลรถกู้ชีพ ${vehicle.code} (${vehicle.plateNumber}) และซิงค์ลง Google Sheets แล้ว`,
    });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const targetVeh = vehicles.find((v) => v.id === vehicleId);
    const filtered = vehicles.filter((v) => v.id !== vehicleId);
    setVehicles(filtered);
    saveVehicles(filtered);

    // Auto-sync fleet mirror to Google Sheets
    if (googleSheetsConfig.spreadsheetId) {
      getAccessToken().then((token) => {
        if (token && googleSheetsConfig.spreadsheetId) {
          syncVehiclesToSheet(googleSheetsConfig.spreadsheetId, filtered, token).catch(console.warn);
        }
      });
    }

    logSystemActivityAndSyncSheets(
      'ลบรถกู้ชีพ',
      'รถกู้ชีพ BLS',
      targetVeh ? `${targetVeh.code} (${targetVeh.plateNumber})` : vehicleId,
      `ลบรถกู้ชีพออกจากระบบเรียบร้อยแล้ว`
    );

    setToastNotification({
      type: 'info',
      title: 'ลบข้อมูลรถแล้ว',
      message: 'ลบรายการรถกู้ชีพออกจากระบบและอัปเดตลง Google Sheets เรียบร้อยแล้ว',
    });
  };

  const handleUpdateVehicleStatus = (vehicleId: string, status: VehicleStatus) => {
    const list = vehicles.map((v) => (v.id === vehicleId ? { ...v, status } : v));
    const targetVeh = vehicles.find((v) => v.id === vehicleId);
    setVehicles(list);
    saveVehicles(list);

    if (googleSheetsConfig.spreadsheetId) {
      getAccessToken().then((token) => {
        if (token && googleSheetsConfig.spreadsheetId) {
          syncVehiclesToSheet(googleSheetsConfig.spreadsheetId, list, token).catch(console.warn);
        }
      });
    }

    logSystemActivityAndSyncSheets(
      'เปลี่ยนสถานะรถ',
      'รถกู้ชีพ BLS',
      targetVeh ? `${targetVeh.code} (${targetVeh.plateNumber})` : vehicleId,
      `เปลี่ยนสถานะความพร้อมของรถเป็น: ${status}`
    );
  };

  // Staff CRUD with automated Google Sheets background sync & audit log
  const handleSaveStaff = (staff: UserProfile) => {
    const list = [...staffList];
    const idx = list.findIndex((s) => s.id === staff.id);
    const isNew = idx < 0;
    if (!isNew) {
      list[idx] = staff;
    } else {
      list.push(staff);
    }
    setStaffList(list);
    saveStaff(list);

    if (currentUser && currentUser.id === staff.id) {
      setCurrentUserState(staff);
      setCurrentUser(staff);
    }

    // Auto-sync staff roster mirror to Google Sheets
    if (googleSheetsConfig.spreadsheetId) {
      getAccessToken().then((token) => {
        if (token && googleSheetsConfig.spreadsheetId) {
          syncStaffToSheet(googleSheetsConfig.spreadsheetId, list, token).catch(console.warn);
        }
      });
    }

    logSystemActivityAndSyncSheets(
      isNew ? 'เพิ่มเจ้าหน้าที่' : 'แก้ไขข้อมูลเจ้าหน้าที่',
      'เจ้าหน้าที่',
      `${staff.name} (${staff.employeeId})`,
      `${isNew ? 'ลงทะเบียนเจ้าหน้าที่ใหม่' : 'แก้ไขข้อมูลเจ้าหน้าที่'} · ตำแหน่ง: ${staff.position || '-'} · แผนก: ${staff.department || '-'} · บทบาท: ${staff.role}`
    );

    setToastNotification({
      type: 'success',
      title: 'บันทึกข้อมูลพนักงานสำเร็จ',
      message: `บันทึกข้อมูล ${staff.name} (${staff.employeeId}) และซิงค์ลง Google Sheets เรียบร้อยแล้ว`,
    });
  };

  const handleDeleteStaff = (staffId: string) => {
    const targetStaff = staffList.find((s) => s.id === staffId);
    const filtered = staffList.filter((s) => s.id !== staffId);
    setStaffList(filtered);
    saveStaff(filtered);

    if (googleSheetsConfig.spreadsheetId) {
      getAccessToken().then((token) => {
        if (token && googleSheetsConfig.spreadsheetId) {
          syncStaffToSheet(googleSheetsConfig.spreadsheetId, filtered, token).catch(console.warn);
        }
      });
    }

    logSystemActivityAndSyncSheets(
      'ลบเจ้าหน้าที่',
      'เจ้าหน้าที่',
      targetStaff ? `${targetStaff.name} (${targetStaff.employeeId})` : staffId,
      `ลบเจ้าหน้าที่ออกจากฐานข้อมูลระบบ`
    );

    setToastNotification({
      type: 'info',
      title: 'ลบข้อมูลพนักงานแล้ว',
      message: 'ลบรายชื่อพนักงานออกจากระบบและอัปเดต Google Sheets เรียบร้อยแล้ว',
    });
  };

  const handleUpdateStaffStatus = (staffId: string, status: any) => {
    const list = staffList.map((s) => (s.id === staffId ? { ...s, status } : s));
    const targetStaff = staffList.find((s) => s.id === staffId);
    setStaffList(list);
    saveStaff(list);

    if (googleSheetsConfig.spreadsheetId) {
      getAccessToken().then((token) => {
        if (token && googleSheetsConfig.spreadsheetId) {
          syncStaffToSheet(googleSheetsConfig.spreadsheetId, list, token).catch(console.warn);
        }
      });
    }

    logSystemActivityAndSyncSheets(
      'เปลี่ยนสถานะเจ้าหน้าที่',
      'เจ้าหน้าที่',
      targetStaff ? `${targetStaff.name} (${targetStaff.employeeId})` : staffId,
      `เปลี่ยนสถานะการปฏิบัติงานเป็น: ${status}`
    );
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!inspections.length) {
      setToastNotification({
        type: 'info',
        title: 'ไม่มีข้อมูล',
        message: 'ยังไม่มีข้อมูลการตรวจสภาพรถสำหรับส่งออก CSV',
      });
      return;
    }

    const headers = [
      'วัน-เวลาที่ตรวจ',
      'รอบเวร',
      'รหัสรถ',
      'เลขทะเบียน',
      'ผู้ตรวจเช็ค',
      'สถานะรวม',
      'เลขไมล์ (กม.)',
      'ไฟตัวรถ',
      'ไฟฉุกเฉิน',
      'กระจก',
      'ของเหลว',
      'แบตเตอรี่',
      'เสียง',
      'ยาง',
      'ปัญหาที่พบ/หมายเหตุ',
      'เอกสารแนบ',
      'รูป 4 ด้าน',
      'รหัสบันทึก',
    ];

    const rows = inspections.map((rec) =>
      formatRecordForSheet(rec).map((val) => `"${String(val).replace(/"/g, '""')}"`)
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BLS_Vehicle_Inspections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        staffList={staffList}
        onGoogleLogin={handleGoogleLogin}
        isGoogleLoading={isGoogleLoading}
        googleUser={googleUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'dashboard' && currentUser?.role !== 'admin') {
            return;
          }
          setCurrentView(view);
        }}
        onOpenGoogleSheets={() => {
          if (currentUser?.role === 'admin') {
            setGoogleSheetsModalOpen(true);
          }
        }}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        sheetsConnected={Boolean(googleSheetsConfig.spreadsheetId)}
      />

      {/* Main Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {currentView === 'form' || currentUser?.role !== 'admin' ? (
          <InspectionForm
            currentUser={currentUser}
            vehicles={vehicles}
            staffList={staffList}
            onSubmitInspection={handleSubmitInspection}
            onCancel={currentUser?.role === 'admin' ? () => setCurrentView('dashboard') : undefined}
            isSubmitting={isSubmittingInspection}
          />
        ) : (
          <AdminDashboard
            currentUser={currentUser}
            vehicles={vehicles}
            inspections={inspections}
            staffList={staffList}
            onOpenNewInspection={() => setCurrentView('form')}
            onViewRecordDetail={(rec) => setSelectedRecordDetail(rec)}
            onOpenVehicleModal={(veh) => {
              setVehicleToEdit(veh || null);
              setVehicleModalOpen(true);
            }}
            onDeleteVehicle={handleDeleteVehicle}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onOpenStaffModal={(staff) => {
              setStaffToEdit(staff || null);
              setStaffModalOpen(true);
            }}
            onDeleteStaff={handleDeleteStaff}
            onUpdateStaffStatus={handleUpdateStaffStatus}
            onDeleteInspection={handleDeleteInspection}
            onClearAllInspections={handleClearAllInspections}
            onResetDemoData={handleResetDemoData}
            onOpenGoogleSheetsModal={() => setGoogleSheetsModalOpen(true)}
            spreadsheetUrl={googleSheetsConfig.spreadsheetUrl}
            onExportCsv={handleExportCsv}
            onPrintInspection={(rec) => setRecordToPrint(rec)}
            onClearAllSystemData={handleClearAllSystemData}
          />
        )}
      </main>

      {/* Modals */}
      {recordToPrint && (
        <PrintReportView
          record={recordToPrint}
          onClose={() => setRecordToPrint(null)}
        />
      )}

      <InspectionDetailModal
        record={selectedRecordDetail}
        onClose={() => setSelectedRecordDetail(null)}
        onSyncGSheets={handleSyncSingleRecord}
        isSyncing={isSyncingGSheets}
        isAdmin={currentUser?.role === 'admin'}
        onDeleteRecord={handleDeleteInspection}
      />

      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSave={handleSaveVehicle}
        vehicleToEdit={vehicleToEdit}
      />

      <StaffModal
        isOpen={staffModalOpen}
        onClose={() => {
          setStaffModalOpen(false);
          setStaffToEdit(null);
        }}
        onSave={handleSaveStaff}
        staffToEdit={staffToEdit}
      />

      <GoogleSheetsModal
        isOpen={googleSheetsModalOpen}
        onClose={() => setGoogleSheetsModalOpen(false)}
        config={googleSheetsConfig}
        onSaveConfig={(cfg) => {
          setGoogleSheetsConfig(cfg);
          saveGoogleSheetsConfig(cfg);
        }}
        inspections={inspections}
        onUpdateInspection={(updated) => {
          updateInspectionRecord(updated);
          setInspections(getStoredInspections());
        }}
        googleUser={googleUser}
        onGoogleLoginSuccess={(u) => setGoogleUser(u)}
        vehicles={vehicles}
        staffList={staffList}
        currentUser={currentUser}
        onSyncBackData={handleSyncBackData}
      />

      <AdminAuthModal
        isOpen={adminAuthModalOpen}
        onClose={() => setAdminAuthModalOpen(false)}
        onSuccess={() => {
          setIsAdminVerified(true);
          setAdminAuthModalOpen(false);
          const updated: UserProfile = {
            ...(currentUser || DEMO_USERS.admin),
            role: 'admin',
          };
          setCurrentUserState(updated);
          setCurrentUser(updated);
          setCurrentView('dashboard');
          setToastNotification({
            type: 'success',
            title: 'เข้าสู่ระบบผู้ดูแลเรียบร้อย',
            message: 'ยืนยันความปลอดภัยสำเร็จ ยินดีต้อนรับสู่แดชบอร์ดผู้ดูแลระบบ',
          });
        }}
        onGoogleLogin={handleGoogleLogin}
        isGoogleLoading={isGoogleLoading}
        googleUser={googleUser}
        targetUserName={currentUser?.name}
      />

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3">
          <div
            className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md ${
              toastNotification.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                : toastNotification.type === 'error'
                ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100'
                : 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/90 dark:text-sky-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {toastNotification.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h5 className="text-xs font-bold">{toastNotification.title}</h5>
                <p className="mt-0.5 text-xs opacity-90">{toastNotification.message}</p>
                {toastNotification.linkUrl && (
                  <a
                    href={toastNotification.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-bold text-xs underline"
                  >
                    <span>{toastNotification.linkText || 'เปิดดูลิงก์'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => setToastNotification(null)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
