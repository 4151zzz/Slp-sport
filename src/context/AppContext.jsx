import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_EQUIPMENT, INITIAL_BORROWERS, INITIAL_LOANS, INITIAL_FOLLOWUPS } from '../data/seedData';
import { playScanSound } from '../utils/barcodeAudio';
import { supabaseApi } from '../lib/supabase';

const AppContext = createContext();

const STORAGE_KEYS = {
  EQUIPMENT: 'sportequip_items_v3_prod',
  BORROWERS: 'sportequip_borrowers_v3_prod',
  LOANS: 'sportequip_loans_v3_prod',
  FOLLOWUPS: 'sportequip_followups_v3_prod',
  GRADE_CONFIG: 'sportequip_grades_v4_saluang',
  TEACHER_PIN: 'sportequip_teacher_pin_v2_2569'
};

const DEFAULT_TEACHER_PIN = '2569';

const DEFAULT_GRADES = [
  'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ครู / บุคลากร'
];

const DEFAULT_ROOMS = Array.from({ length: 15 }, (_, i) => String(i + 1));

export function AppProvider({ children }) {
  // 1. Data States
  const [gradeConfig, setGradeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRADE_CONFIG);
      return saved ? JSON.parse(saved) : { grades: DEFAULT_GRADES, rooms: DEFAULT_ROOMS };
    } catch {
      return { grades: DEFAULT_GRADES, rooms: DEFAULT_ROOMS };
    }
  });

  const [equipment, setEquipment] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
      return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
    } catch {
      return INITIAL_EQUIPMENT;
    }
  });

  const [borrowers, setBorrowers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BORROWERS);
      return saved ? JSON.parse(saved) : INITIAL_BORROWERS;
    } catch {
      return INITIAL_BORROWERS;
    }
  });

  const [loans, setLoans] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      const raw = saved ? JSON.parse(saved) : INITIAL_LOANS;
      const now = new Date();
      return raw.map(l => {
        if (l.status === 'active' && new Date(l.dueDate) < now) {
          return { ...l, status: 'overdue' };
        }
        return l;
      });
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [followups, setFollowups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLLOWUPS);
      return saved ? JSON.parse(saved) : INITIAL_FOLLOWUPS;
    } catch {
      return INITIAL_FOLLOWUPS;
    }
  });

  // 2. Navigation & View State (Persist across refreshes)
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('sportequip_active_tab_v1') || 'dashboard';
  });
  const [toasts, setToasts] = useState([]);

  // 3. Teacher Mode State (Persist across refreshes in current session)
  const [isTeacherMode, setIsTeacherMode] = useState(() => {
    return sessionStorage.getItem('sportequip_teacher_logged_in_v1') === 'true';
  });
  const [teacherPin, setTeacherPin] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_PIN) || DEFAULT_TEACHER_PIN;
  });

  // Sync activeTab to sessionStorage
  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('sportequip_active_tab_v1', activeTab);
    }
  }, [activeTab]);

  // Sync isTeacherMode to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('sportequip_teacher_logged_in_v1', isTeacherMode ? 'true' : 'false');
  }, [isTeacherMode]);

  // 3. Borrowing Basket / Cart State
  const [cart, setCart] = useState([]);

  // 4. Modals State
  const [scannerConfig, setScannerConfig] = useState({
    isOpen: false,
    title: 'สแกน Barcode / QR Code',
    onScan: null
  });

  const [selectedLabelItem, setSelectedLabelItem] = useState(null);
  const [receiptLoan, setReceiptLoan] = useState(null);
  const [selectedReminderLoan, setSelectedReminderLoan] = useState(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(borrowers));
  }, [borrowers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(followups));
  }, [followups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRADE_CONFIG, JSON.stringify(gradeConfig));
  }, [gradeConfig]);

  // ☁️ Multi-Device Real-time Supabase Cloud Synchronization
  useEffect(() => {
    let isMounted = true;

    async function syncFromCloud() {
      try {
        const { data: cloudLoans } = await supabaseApi.get('loans', 'order=borrow_date.desc&limit=100');
        if (isMounted && cloudLoans && Array.isArray(cloudLoans) && cloudLoans.length > 0) {
          setLoans(prev => {
            const merged = [...prev];
            cloudLoans.forEach(cLoan => {
              const existingIdx = merged.findIndex(l => l.id === cLoan.id);
              const formattedLoan = {
                id: cLoan.id,
                studentId: cLoan.borrower_id || '',
                borrowerStudentId: cLoan.borrower_id || '',
                borrowerName: cLoan.borrower_name || 'นักเรียน',
                studentName: (cLoan.borrower_name || '').split(' (')[0],
                grade: cLoan.grade || 'ม.1',
                room: cLoan.room || '1',
                phone: cLoan.phone || '',
                lineId: cLoan.line_id || '',
                borrowDate: cLoan.borrow_date || cLoan.created_at,
                dueDate: cLoan.return_due || new Date().toISOString(),
                returnDate: cLoan.return_date,
                status: cLoan.status || 'active',
                items: [
                  {
                    equipmentId: cLoan.item_id || 'SP-01',
                    code: cLoan.item_barcode || '',
                    name: cLoan.item_name || 'อุปกรณ์กีฬา',
                    image: cLoan.item_image || '⚽',
                    qty: 1
                  }
                ]
              };
              if (existingIdx >= 0) {
                merged[existingIdx] = { ...merged[existingIdx], ...formattedLoan };
              } else {
                merged.unshift(formattedLoan);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.warn('Supabase auto-sync notification:', err);
      }
    }

    syncFromCloud();
    const interval = setInterval(syncFromCloud, 4000); // Poll every 4 seconds
    window.addEventListener('focus', syncFromCloud);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', syncFromCloud);
    };
  }, []);

  const updateGradeConfig = (newConfig) => {
    setGradeConfig(prev => ({ ...prev, ...newConfig }));
    showToast('บันทึกการตั้งค่าระดับชั้นและห้องเรียบร้อยแล้ว', 'success');
  };

  const resetGradeConfig = () => {
    setGradeConfig({ grades: DEFAULT_GRADES, rooms: DEFAULT_ROOMS });
    showToast('รีเซ็ตระดับชั้นและห้องเป็นค่าเริ่มต้นแล้ว', 'info');
  };

  // Toast Notification helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Teacher Mode Functions
  const loginTeacher = (pin) => {
    if (pin === teacherPin) {
      setIsTeacherMode(true);
      sessionStorage.setItem('sportequip_teacher_logged_in_v1', 'true');
      showToast('เข้าสู่ระบบคุณครู/เจ้าหน้าที่สำเร็จ', 'success');
      return true;
    } else {
      showToast('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่', 'error');
      return false;
    }
  };

  const logoutTeacher = () => {
    setIsTeacherMode(false);
    sessionStorage.setItem('sportequip_teacher_logged_in_v1', 'false');
    showToast('ออกจากระบบคุณครูแล้ว', 'info');
  };

  const changeTeacherPin = (oldPin, newPin) => {
    if (oldPin !== teacherPin) {
      showToast('รหัสเดิมไม่ถูกต้อง', 'error');
      return false;
    }
    if (!newPin || newPin.length < 4) {
      showToast('รหัสใหม่ต้องมีอย่างน้อย 4 หลัก', 'warning');
      return false;
    }
    setTeacherPin(newPin);
    localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, newPin);
    showToast('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย', 'success');
    return true;
  };

  // Force light theme always
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
  }, []);

  // Hardware Scanner Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (timeDiff > 80) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          const code = buffer.trim();
          buffer = '';
          playScanSound('success');
          handleScannedCode(code);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [equipment, activeTab]);

  // Global Scanned Code Dispatcher
  const handleScannedCode = (code) => {
    const item = equipment.find(
      eq => eq.code.toLowerCase() === code.toLowerCase() || eq.id.toLowerCase() === code.toLowerCase()
    );

    if (item) {
      showToast(`พบอุปกรณ์: ${item.name}`, 'success');
      if (activeTab === 'borrow') {
        addToCart(item);
      } else if (activeTab === 'return') {
        // Handled in Return component
      } else {
        addToCart(item);
        setActiveTab('borrow');
      }
    } else {
      showToast(`ไม่พบอุปกรณ์รหัส: ${code}`, 'error');
      playScanSound('error');
    }
  };

  // Cart operations
  const addToCart = (item, qty = 1) => {
    const existing = cart.find(c => c.id === item.id);
    const available = item.availableQty;

    if (available <= 0) {
      showToast(`อุปกรณ์ "${item.name}" สินค้าในคลังไม่พร้อมให้ยืม`, 'warning');
      return;
    }

    if (existing) {
      if (existing.qty + qty > available) {
        showToast(`จำนวนเกินของคงเหลือในคลัง (${available} ชิ้น)`, 'warning');
        return;
      }
      setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty + qty } : c));
    } else {
      setCart(prev => [...prev, { ...item, qty: Math.min(qty, available) }]);
    }
    showToast(`เพิ่ม "${item.name}" ลงในรายการเบิกแล้ว`, 'success');
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const updateCartQty = (itemId, newQty) => {
    const item = equipment.find(eq => eq.id === itemId);
    if (!item) return;

    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    if (newQty > item.availableQty) {
      showToast(`จำนวนคงเหลือสูงสุดคือ ${item.availableQty} ชิ้น`, 'warning');
      return;
    }

    setCart(prev => prev.map(c => c.id === itemId ? { ...c, qty: newQty } : c));
  };

  const clearCart = () => setCart([]);

  // Create Loan
  const createLoan = (loanData) => {
    const newId = `LN-${new Date().getFullYear()}-${String(loans.length + 1).padStart(3, '0')}`;
    const newLoan = {
      id: newId,
      borrowDate: new Date().toISOString(),
      status: 'active',
      returnDate: null,
      returnCondition: null,
      returnNotes: '',
      followupCount: 0,
      ...loanData
    };

    // Deduct available stock
    setEquipment(prev => {
      return prev.map(eq => {
        const borrowed = newLoan.items.find(i => i.equipmentId === eq.id);
        if (borrowed) {
          return {
            ...eq,
            availableQty: Math.max(0, eq.availableQty - borrowed.qty)
          };
        }
        return eq;
      });
    });

    setLoans(prev => [newLoan, ...prev]);
    clearCart();
    setReceiptLoan(newLoan);
    showToast(`ทำรายการเบิกสำเร็จ รหัส ${newId}`, 'success');
    return newLoan;
  };

  // Return Loan
  const processReturn = (loanId, returnDetails) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return false;

    const condition = returnDetails.condition || 'สมบูรณ์ (Good)';
    const notes = returnDetails.notes || '';
    const nowIso = new Date().toISOString();

    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          status: 'returned',
          returnDate: nowIso,
          returnCondition: condition,
          returnNotes: notes,
          receivedBy: returnDetails.receivedBy || 'เจ้าหน้าที่ห้องพัสดุ'
        };
      }
      return l;
    }));

    // Restore stock
    setEquipment(prev => prev.map(eq => {
      const returnedItem = targetLoan.items.find(i => i.equipmentId === eq.id);
      if (returnedItem) {
        let newQty = eq.availableQty;
        if (condition !== 'สูญหาย (Lost)') {
          newQty = Math.min(eq.totalQty, eq.availableQty + returnedItem.qty);
        }
        return {
          ...eq,
          availableQty: newQty,
          condition: condition === 'ชำรุด (Damaged)' ? 'ชำรุด (รอซ่อม)' : eq.condition
        };
      }
      return eq;
    }));

    showToast(`รับคืนอุปกรณ์รหัส ${loanId} เรียบร้อยแล้ว`, 'success');

    // Sync return to Supabase Cloud
    supabaseApi.patch('loans', `id=eq.${loanId}`, {
      status: 'returned',
      return_date: nowIso
    }).catch(err => console.warn('Supabase return sync error:', err));

    return true;
  };

  // Report Return Issue (Cannot return due to lost, damaged, handover, etc.)
  const reportReturnIssue = (loanId, { reason, notes, reportedBy }) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return false;

    const nowIso = new Date().toISOString();
    const isLost = reason.includes('สูญหาย') || reason.includes('Lost');
    const isDamaged = reason.includes('ชำรุด') || reason.includes('Damaged');

    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          status: 'issue_reported',
          issueReason: reason,
          issueNotes: notes || '',
          issueReportedAt: nowIso,
          returnDate: nowIso,
          returnCondition: isLost ? 'สูญหาย (Lost)' : isDamaged ? 'ชำรุด (Damaged)' : 'มีปัญหา / รอตรวจสอบ',
          returnNotes: `[แจ้งปัญหา: ${reason}] ${notes || ''}`.trim()
        };
      }
      return l;
    }));

    if (isDamaged) {
      setEquipment(prev => prev.map(eq => {
        const item = targetLoan.items.find(i => i.equipmentId === eq.id);
        if (item) {
          return {
            ...eq,
            availableQty: Math.min(eq.totalQty, eq.availableQty + item.qty),
            condition: 'ชำรุด (รอซ่อม)'
          };
        }
        return eq;
      }));
    }

    const newFollowup = {
      id: `FU-${String(followups.length + 1).padStart(3, '0')}`,
      loanId,
      timestamp: nowIso,
      action: `แจ้งปัญหาการคืน: ${reason}`,
      note: notes || 'นักเรียนแจ้งไม่สามารถคืนตามปกติได้',
      contactPerson: reportedBy || targetLoan.borrowerName
    };
    setFollowups(prev => [newFollowup, ...prev]);

    showToast(`บันทึกการแจ้งปัญหา "${reason}" เรียบร้อยแล้ว`, 'info');
    return true;
  };

  // Transfer Loan to Another Student / Handover Flow
  const transferStudentLoan = (currentLoanId, { targetStudentId, targetStudentName, targetGrade, targetRoom, notes }) => {
    const currentLoan = loans.find(l => l.id === currentLoanId);
    if (!currentLoan) {
      showToast('ไม่พบรายการยืมเดิม', 'error');
      return { success: false, message: 'ไม่พบรายการยืมเดิม' };
    }

    const cleanTargetId = targetStudentId ? targetStudentId.trim() : '';
    if (!cleanTargetId) {
      showToast('กรุณากรอกรหัสนักเรียนของเพื่อนที่จะยืมต่อ', 'warning');
      return { success: false, message: 'กรุณากรอกรหัสนักเรียนของเพื่อน' };
    }
    if (!targetStudentName || !targetStudentName.trim()) {
      showToast('กรุณากรอกชื่อ-นามสกุลของเพื่อนที่จะยืมต่อ', 'warning');
      return { success: false, message: 'กรุณากรอกชื่อเพื่อน' };
    }

    // Check if target student already has active loan
    const activeLoanForTarget = getActiveLoanByStudent(cleanTargetId);
    if (activeLoanForTarget) {
      const activeItemName = activeLoanForTarget.items?.[0]?.name || 'อุปกรณ์';
      showToast(`เพื่อนรหัส ${cleanTargetId} มีรายการค้างยืม "${activeItemName}" อยู่แล้ว`, 'error');
      return { 
        success: false, 
        message: `เพื่อนรหัส ${cleanTargetId} (${activeLoanForTarget.borrowerName}) มียอดค้างยืม "${activeItemName}" อยู่แล้ว ไม่สามารถรับโอนต่อได้ (1 คนยืมได้ 1 ชิ้น)` 
      };
    }

    const nowIso = new Date().toISOString();
    const todayDue = new Date();
    todayDue.setHours(17, 0, 0, 0);

    const prevBorrower = currentLoan.borrowerName;
    const targetDept = `ชั้น ${targetGrade || 'ม.1'}/${targetRoom || '1'}`;

    // 1. Create new active loan for the new student
    const newId = `LN-${new Date().getFullYear()}-${String(loans.length + 1).padStart(3, '0')}`;
    const newLoan = {
      id: newId,
      borrowDate: nowIso,
      dueDate: todayDue.toISOString(),
      status: 'active',
      studentId: cleanTargetId,
      borrowerStudentId: cleanTargetId,
      borrowerName: `${targetStudentName.trim()} (${targetGrade || 'ม.1'}/${targetRoom || '1'})`,
      studentName: targetStudentName.trim(),
      grade: targetGrade || 'ม.1',
      room: targetRoom || '1',
      borrowerType: 'นักเรียน',
      borrowerDepartment: targetDept,
      purpose: `รับโอนต่อจาก ${prevBorrower}`,
      items: currentLoan.items,
      returnDate: null,
      returnCondition: null,
      returnNotes: '',
      followupCount: 0,
      transferredFrom: {
        loanId: currentLoan.id,
        studentName: prevBorrower,
        time: nowIso
      }
    };

    // 2. Mark old loan as transferred
    setLoans(prev => [
      newLoan,
      ...prev.map(l => {
        if (l.id === currentLoanId) {
          return {
            ...l,
            status: 'transferred',
            returnDate: nowIso,
            returnCondition: 'ส่งต่อให้เพื่อนยืมต่อ',
            returnNotes: `[ส่งต่อให้: ${targetStudentName.trim()} (${cleanTargetId})] ${notes || ''}`.trim(),
            transferredTo: {
              loanId: newId,
              studentId: cleanTargetId,
              studentName: targetStudentName.trim()
            }
          };
        }
        return l;
      })
    ]);

    // 3. Update borrower database for the target student
    setBorrowers(prev => {
      const existing = prev.find(b => b.studentId === cleanTargetId || b.id === cleanTargetId);
      if (existing) {
        return prev.map(b => (b.studentId === cleanTargetId || b.id === cleanTargetId) ? {
          ...b,
          name: targetStudentName.trim(),
          department: targetDept,
          grade: targetGrade,
          room: targetRoom
        } : b);
      } else {
        return [{
          id: `BR-${cleanTargetId}`,
          studentId: cleanTargetId,
          name: targetStudentName.trim(),
          type: 'นักเรียน',
          department: targetDept,
          grade: targetGrade,
          room: targetRoom,
          avatar: '👨‍🎓',
          status: 'normal',
          overdueCount: 0
        }, ...prev];
      }
    });

    // 4. Add follow-up log
    const newFollowup = {
      id: `FU-${String(followups.length + 1).padStart(3, '0')}`,
      loanId: currentLoanId,
      timestamp: nowIso,
      action: `ส่งต่ออุปกรณ์ให้: ${targetStudentName.trim()} (${cleanTargetId})`,
      note: notes || 'ส่งต่ออุปกรณ์ให้เพื่อนยืมต่อ',
      contactPerson: prevBorrower
    };
    setFollowups(prev => [newFollowup, ...prev]);

    showToast(`ส่งต่อให้ ${targetStudentName} สำเร็จเรียบร้อย!`, 'success');
    return { success: true, newLoan };
  };

  // Student Kiosk Specific Logic (1 Active Loan per Student Rule)
  const getActiveLoanByStudent = (studentId) => {
    if (!studentId || !studentId.trim()) return null;
    const cleanId = studentId.trim().toLowerCase();
    return loans.find(l => 
      (l.status === 'active' || l.status === 'overdue') &&
      ((l.studentId && l.studentId.trim().toLowerCase() === cleanId) || 
       (l.borrowerId && l.borrowerId.trim().toLowerCase() === cleanId) ||
       (l.borrowerStudentId && l.borrowerStudentId.trim().toLowerCase() === cleanId))
    ) || null;
  };

  const createStudentLoan = ({ studentId, name, grade, room, item, phone, lineId }) => {
    const cleanStudentId = studentId ? studentId.trim() : '';
    if (!cleanStudentId) {
      showToast('กรุณาระบุรหัสนักเรียน', 'warning');
      return { success: false, message: 'กรุณาระบุรหัสนักเรียน' };
    }
    if (!name || !name.trim()) {
      showToast('กรุณาระบุชื่อ-นามสกุล', 'warning');
      return { success: false, message: 'กรุณาระบุชื่อ-นามสกุล' };
    }
    if (!item) {
      showToast('กรุณาสแกนหรือเลือกอุปกรณ์ที่ต้องการยืม', 'warning');
      return { success: false, message: 'กรุณาเลือกอุปกรณ์' };
    }

    // 1 Person 1 Item Rule Check
    const activeLoan = getActiveLoanByStudent(cleanStudentId);
    if (activeLoan) {
      const activeItemName = activeLoan.items?.[0]?.name || 'อุปกรณ์';
      showToast(`นักเรียนมีรายการค้างยืม: "${activeItemName}" กรุณาคืนของเดิมก่อน`, 'error');
      return { 
        success: false, 
        message: `มีรายการค้างยืม "${activeItemName}" (รหัส ${activeLoan.id}) กรุณาคืนก่อนยืมใหม่`,
        activeLoan 
      };
    }

    // Check stock
    const targetEq = equipment.find(eq => eq.id === item.id || eq.code === item.code);
    if (!targetEq || targetEq.availableQty <= 0) {
      showToast(`ขออภัย อุปกรณ์ "${item.name}" ในคลังหมดแล้ว`, 'error');
      return { success: false, message: 'อุปกรณ์ในคลังหมดแล้ว' };
    }

    const todayDue = new Date();
    todayDue.setHours(17, 0, 0, 0); // Due 17:00 today

    const newId = `LN-${new Date().getFullYear()}-${String(loans.length + 1).padStart(3, '0')}`;
    const newLoan = {
      id: newId,
      borrowDate: new Date().toISOString(),
      dueDate: todayDue.toISOString(),
      status: 'active',
      studentId: cleanStudentId,
      borrowerStudentId: cleanStudentId,
      borrowerName: `${name.trim()} (${grade}/${room})`,
      studentName: name.trim(),
      grade: grade || 'ม.1',
      room: room || '1',
      borrowerPhone: phone ? phone.trim() : '',
      borrowerLineId: lineId ? lineId.trim() : '',
      phone: phone ? phone.trim() : '',
      lineId: lineId ? lineId.trim() : '',
      borrowerType: 'นักเรียน',
      borrowerDepartment: `ชั้น ${grade}/${room}`,
      purpose: 'ยืมเล่นกีฬา / คาบพละศึกษา',
      items: [
        {
          equipmentId: targetEq.id,
          code: targetEq.code,
          name: targetEq.name,
          category: targetEq.category,
          qty: 1,
          image: targetEq.image
        }
      ],
      returnDate: null,
      returnCondition: null,
      returnNotes: '',
      followupCount: 0
    };

    // Deduct stock
    setEquipment(prev => prev.map(eq => {
      if (eq.id === targetEq.id) {
        return { ...eq, availableQty: Math.max(0, eq.availableQty - 1) };
      }
      return eq;
    }));

    // Auto update / add borrower to registry
    setBorrowers(prev => {
      const existing = prev.find(b => b.studentId === cleanStudentId || b.id === cleanStudentId);
      if (existing) {
        return prev.map(b => (b.studentId === cleanStudentId || b.id === cleanStudentId) ? {
          ...b,
          name: name.trim(),
          department: `ชั้น ${grade}/${room}`,
          grade,
          room,
          phone: phone ? phone.trim() : b.phone,
          lineId: lineId ? lineId.trim() : b.lineId
        } : b);
      } else {
        return [{
          id: `BR-${cleanStudentId}`,
          studentId: cleanStudentId,
          name: name.trim(),
          phone: phone ? phone.trim() : '',
          lineId: lineId ? lineId.trim() : '',
          type: 'นักเรียน',
          department: `ชั้น ${grade}/${room}`,
          grade,
          room,
          avatar: '👨‍🎓',
          status: 'normal',
          overdueCount: 0
        }, ...prev];
      }
    });

    setLoans(prev => [newLoan, ...prev]);
    setReceiptLoan(newLoan);
    showToast(`ยืม "${targetEq.name}" สำเร็จเรียบร้อย!`, 'success');

    // ☁️ Sync new loan to Supabase Cloud Database (Live to all devices)
    supabaseApi.upsert('loans', {
      id: newId,
      borrower_id: cleanStudentId,
      borrower_name: `${name.trim()} (${grade}/${room})`,
      grade: grade || 'ม.1',
      room: room || '1',
      phone: phone ? phone.trim() : '',
      line_id: lineId ? lineId.trim() : '',
      item_id: targetEq.id,
      item_name: targetEq.name,
      item_image: targetEq.image,
      item_barcode: targetEq.code,
      borrow_date: newLoan.borrowDate,
      return_due: newLoan.dueDate,
      status: 'active'
    }).catch(err => console.warn('Supabase loan creation sync error:', err));

    return { success: true, loan: newLoan };
  };

  const findLoanForReturn = (queryCode) => {
    if (!queryCode || !queryCode.trim()) return null;
    const clean = queryCode.trim().toLowerCase();
    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
    
    // Match by student ID, loan ID, equipment code, or equipment ID
    return activeLoans.find(l => 
      (l.studentId && l.studentId.toLowerCase() === clean) ||
      (l.borrowerStudentId && l.borrowerStudentId.toLowerCase() === clean) ||
      (l.id && l.id.toLowerCase() === clean) ||
      l.items.some(i => 
        (i.code && i.code.toLowerCase() === clean) || 
        (i.equipmentId && i.equipmentId.toLowerCase() === clean)
      )
    ) || null;
  };

  // Equipment CRUD
  const addEquipment = (item) => {
    const newId = `EQ-${1000 + equipment.length + 1}`;
    const code = item.code || `EQ-${Date.now().toString().slice(-6)}`;
    const newItem = {
      id: newId,
      code,
      availableQty: Number(item.totalQty) || 1,
      totalQty: Number(item.totalQty) || 1,
      status: 'available',
      image: item.image || '📦',
      price: Number(item.price) || 0,
      condition: 'สมบูรณ์ (Good)',
      ...item
    };
    setEquipment(prev => [newItem, ...prev]);
    showToast(`เพิ่มอุปกรณ์ "${newItem.name}" เรียบร้อยแล้ว`, 'success');
    return newItem;
  };

  const updateEquipment = (id, updatedFields) => {
    setEquipment(prev => prev.map(eq => eq.id === id ? { ...eq, ...updatedFields } : eq));
    showToast(`อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว`, 'success');
  };

  const deleteEquipment = (id) => {
    setEquipment(prev => prev.filter(eq => eq.id !== id));
    showToast(`ลบอุปกรณ์ออกจากระบบแล้ว`, 'info');
  };

  // Borrower CRUD
  const addBorrower = (borrower) => {
    const newId = `BR-${650100 + borrowers.length + 1}`;
    const newBorrower = {
      id: newId,
      avatar: borrower.type?.includes('Staff') || borrower.type?.includes('อาจารย์') ? '👨‍🏫' : '👨‍🎓',
      status: 'normal',
      overdueCount: 0,
      ...borrower
    };
    setBorrowers(prev => [newBorrower, ...prev]);
    showToast(`เพิ่มข้อมูลผู้ยืม "${newBorrower.name}" เรียบร้อยแล้ว`, 'success');
    return newBorrower;
  };

  const deleteBorrower = (id) => {
    setBorrowers(prev => prev.filter(b => b.id !== id));
    showToast(`ลบข้อมูลผู้ยืมออกจากระบบแล้ว`, 'info');
  };

  const clearAllBorrowers = () => {
    setBorrowers([]);
    showToast(`ล้างข้อมูลผู้ยืมทั้งหมดเรียบร้อยแล้ว`, 'info');
  };

  // Follow-up Logs
  const addFollowup = (followupData) => {
    const newId = `FU-${String(followups.length + 1).padStart(3, '0')}`;
    const newFollowup = {
      id: newId,
      timestamp: new Date().toISOString(),
      ...followupData
    };
    setFollowups(prev => [newFollowup, ...prev]);

    setLoans(prev => prev.map(l => {
      if (l.id === followupData.loanId) {
        return { ...l, followupCount: (l.followupCount || 0) + 1 };
      }
      return l;
    }));

    showToast('บันทึกประวัติการทวงถามเรียบร้อยแล้ว', 'success');
    return newFollowup;
  };

  // Scanner modal triggers
  const openScanner = (onScan, title = 'สแกน Barcode / QR Code') => {
    setScannerConfig({
      isOpen: true,
      title,
      onScan: (code) => {
        playScanSound('success');
        if (onScan) onScan(code);
        closeScanner();
      }
    });
  };

  const closeScanner = () => {
    setScannerConfig(prev => ({ ...prev, isOpen: false, onScan: null }));
  };

  // Reset & Backup
  const resetDatabase = () => {
    setEquipment(INITIAL_EQUIPMENT);
    setBorrowers(INITIAL_BORROWERS);
    setLoans(INITIAL_LOANS);
    setFollowups(INITIAL_FOLLOWUPS);
    setCart([]);
    showToast('รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว', 'info');
  };

  const exportDatabase = () => {
    const data = {
      equipment,
      borrowers,
      loans,
      followups,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SportEquip_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว', 'success');
  };

  const importDatabase = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.equipment) setEquipment(parsed.equipment);
      if (parsed.borrowers) setBorrowers(parsed.borrowers);
      if (parsed.loans) setLoans(parsed.loans);
      if (parsed.followups) setFollowups(parsed.followups);
      showToast('นำเข้าข้อมูลระบบสำเร็จเรียบร้อย', 'success');
      return true;
    } catch (e) {
      showToast('รูปแบบไฟล์ JSON ไม่ถูกต้อง', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Data
        equipment,
        borrowers,
        loans,
        followups,
        gradeConfig,
        updateGradeConfig,
        resetGradeConfig,
        // Navigation & Teacher Mode
        activeTab,
        setActiveTab,
        isTeacherMode,
        loginTeacher,
        logoutTeacher,
        changeTeacherPin,
        toasts,
        showToast,
        // Cart
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        // Loans & Returns
        createLoan,
        processReturn,
        reportReturnIssue,
        transferStudentLoan,
        // Student Kiosk Actions & Restriction Checks
        getActiveLoanByStudent,
        createStudentLoan,
        findLoanForReturn,
        // Equipment & Borrower CRUD
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addBorrower,
        deleteBorrower,
        clearAllBorrowers,
        addFollowup,
        // Scanner & Modals
        scannerConfig,
        openScanner,
        closeScanner,
        selectedLabelItem,
        setSelectedLabelItem,
        receiptLoan,
        setReceiptLoan,
        selectedReminderLoan,
        setSelectedReminderLoan,
        // Backup & Reset
        resetDatabase,
        exportDatabase,
        importDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
