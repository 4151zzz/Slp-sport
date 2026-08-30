import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Scan, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  RotateCcw, 
  User, 
  GraduationCap, 
  DoorOpen, 
  IdCard, 
  Sparkles, 
  Check, 
  X, 
  Clock, 
  Boxes, 
  ShieldAlert, 
  Flame,
  ArrowRight,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Save,
  RotateCw,
  HelpCircle,
  AlertOctagon,
  FileQuestion,
  UserCheck,
  PackageOpen,
  Calendar,
  UserPlus,
  ArrowRightLeft,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDate } from '../utils/formatters';

const PRESET_SYSTEMS = [
  {
    name: '🏫 มัธยมศึกษา (ม.1 - ม.6 + ครูบุคลากร)',
    grades: ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ครู / บุคลากร'],
    rooms: Array.from({ length: 15 }, (_, i) => String(i + 1))
  },
  {
    name: '🌟 ครบวงจร (อนุบาล - ม.6 + ครูบุคลากร)',
    grades: ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ครู / บุคลากร'],
    rooms: Array.from({ length: 15 }, (_, i) => String(i + 1))
  }
];

const ISSUE_REASONS = [
  { id: 'handed_over', label: 'ส่งต่อให้เพื่อนหรือคุณครูแล้ว (ระบุตัวตน)', desc: 'โอนสิทธิ์ความรับผิดชอบให้เพื่อนหรืออาจารย์นำไปใช้ต่อ', icon: '🤝', color: '#0284c7', isTransfer: true },
  { id: 'lost', label: 'สูญหาย / หาไม่เจอ', desc: 'อุปกรณ์ตกหล่นหรือหาไม่พบระหว่างใช้งาน', icon: '❌', color: '#ef4444' },
  { id: 'damaged', label: 'ชำรุด / เสียหายระหว่างเล่น', desc: 'อุปกรณ์แตก หัก ฉีกขาด หรือชำรุด', icon: '🔨', color: '#f59e0b' },
  { id: 'forgot', label: 'ลืมนำมา / ขอส่งคืนวันถัดไป', desc: 'ลืมไว้ที่ห้องเรียนหรือที่บ้าน จะนำมาคืนพรุ่งนี้', icon: '🎒', color: '#8b5cf6' },
  { id: 'other', label: 'อื่นๆ (ระบุรายละเอียดเพิ่มเติม)', desc: 'สาเหตุอื่นๆ นอกเหนือจากที่ระบุข้างต้น', icon: '📝', color: '#64748b' }
];

const CURRENT_STUDENT_SESSION_KEY = 'sportequip_active_student_id_v1';

export default function StudentKiosk() {
  const { 
    equipment, 
    borrowers, 
    loans, 
    gradeConfig, 
    updateGradeConfig, 
    resetGradeConfig, 
    getActiveLoanByStudent, 
    createStudentLoan, 
    requestReturnByStudent,
    processReturn, 
    reportReturnIssue, 
    transferStudentLoan, 
    openScanner, 
    showToast 
  } = useApp();

  const gradesList = gradeConfig?.grades || ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ครู / บุคลากร'];
  const roomsList = gradeConfig?.rooms || Array.from({ length: 15 }, (_, i) => String(i + 1));

  // Student identification state
  const [studentId, setStudentId] = useState(() => {
    return localStorage.getItem(CURRENT_STUDENT_SESSION_KEY) || '';
  });
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentLineId, setStudentLineId] = useState('');
  const [grade, setGrade] = useState(gradesList[0] || 'ม.1');
  const [room, setRoom] = useState(roomsList[0] || '1');
  const [selectedItem, setSelectedItem] = useState(null);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('all');
  const [manualEquipCode, setManualEquipCode] = useState('');

  // Kiosk Operating Mode ('borrow' | 'return')
  const [kioskMode, setKioskMode] = useState('borrow');
  const [scannedReturnLoan, setScannedReturnLoan] = useState(null);
  const [manualReturnCode, setManualReturnCode] = useState('');

  // Active borrow step ('step_equipment' | 'step_student')
  const [currentStep, setCurrentStep] = useState('step_equipment');

  // Grade & Room Management Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [tempGrades, setTempGrades] = useState(gradesList);
  const [tempRooms, setTempRooms] = useState(roomsList);
  const [newGradeInput, setNewGradeInput] = useState('');
  const [newRoomInput, setNewRoomInput] = useState('');
  const [modalTab, setModalTab] = useState('grades');

  // "Cannot Return / Issue Report / Handover" Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssueReason, setSelectedIssueReason] = useState(ISSUE_REASONS[0].label);
  const [issueNote, setIssueNote] = useState('');

  // Target Friend Handover Identification State
  const [targetFriendId, setTargetFriendId] = useState('');
  const [targetFriendName, setTargetFriendName] = useState('');
  const [targetFriendGrade, setTargetFriendGrade] = useState(gradesList[0] || 'ม.1');
  const [targetFriendRoom, setTargetFriendRoom] = useState(roomsList[0] || '1');

  // Result Success Feedback
  const [borrowSuccessData, setBorrowSuccessData] = useState(null);
  const [returnSuccessData, setReturnSuccessData] = useState(null);
  const [issueSuccessData, setIssueSuccessData] = useState(null);
  const [transferSuccessData, setTransferSuccessData] = useState(null);

  // Active Loan for current entered student ID
  const activeLoan = studentId.trim() ? getActiveLoanByStudent(studentId.trim()) : null;

  // Live Thai Clock & Date State
  const [liveTime, setLiveTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist student ID session
  useEffect(() => {
    if (studentId.trim()) {
      localStorage.setItem(CURRENT_STUDENT_SESSION_KEY, studentId.trim());
    }
  }, [studentId]);

  // Keep selected grade/room valid if config changes
  useEffect(() => {
    if (gradesList.length > 0 && !gradesList.includes(grade)) {
      setGrade(gradesList[0]);
    }
  }, [gradesList, grade]);

  useEffect(() => {
    if (roomsList.length > 0 && !roomsList.includes(room)) {
      setRoom(roomsList[0]);
    }
  }, [roomsList, room]);

  // Auto-fill student info if studentId matches registered borrower
  useEffect(() => {
    if (!studentId.trim()) return;
    const cleanId = studentId.trim();
    const foundBorrower = borrowers.find(b => b.studentId === cleanId || b.id === cleanId || b.id === `BR-${cleanId}`);
    if (foundBorrower) {
      if (foundBorrower.name && !studentName) {
        setStudentName(foundBorrower.name);
      }
      if (foundBorrower.grade && gradesList.includes(foundBorrower.grade)) setGrade(foundBorrower.grade);
      if (foundBorrower.room && roomsList.includes(foundBorrower.room)) setRoom(foundBorrower.room);
      if (foundBorrower.phone && !studentPhone) setStudentPhone(foundBorrower.phone);
      if (foundBorrower.lineId && !studentLineId) setStudentLineId(foundBorrower.lineId);
    }
  }, [studentId, borrowers, gradesList, roomsList]);

  // Auto-fill target friend info if targetFriendId matches registered borrower
  useEffect(() => {
    if (!targetFriendId.trim()) return;
    const cleanId = targetFriendId.trim();
    const foundFriend = borrowers.find(b => b.studentId === cleanId || b.id === cleanId || b.id === `BR-${cleanId}`);
    if (foundFriend) {
      if (foundFriend.name) setTargetFriendName(foundFriend.name);
      if (foundFriend.grade && gradesList.includes(foundFriend.grade)) setTargetFriendGrade(foundFriend.grade);
      if (foundFriend.room && roomsList.includes(foundFriend.room)) setTargetFriendRoom(foundFriend.room);
    }
  }, [targetFriendId, borrowers, gradesList, roomsList]);

  // Categories
  const categories = ['all', ...new Set(equipment.map(e => e.category))];

  const filteredEquipment = equipment.filter(item => {
    const s = equipmentSearch.toLowerCase();
    const matchText = item.name.toLowerCase().includes(s) || 
                      item.code.toLowerCase().includes(s) || 
                      item.id.toLowerCase().includes(s);
    const matchCat = equipmentCategory === 'all' || item.category === equipmentCategory;
    return matchText && matchCat;
  });

  // Handle Scanning for Borrowing Equipment
  const handleScanBorrowEquipment = () => {
    openScanner((scannedCode) => {
      const item = equipment.find(
        eq => eq.code.toLowerCase() === scannedCode.toLowerCase() || 
              eq.id.toLowerCase() === scannedCode.toLowerCase()
      );
      if (item) {
        setSelectedItem(item);
        setCurrentStep('step_student');
        showToast(`เลือกอุปกรณ์: ${item.name}`, 'success');
      } else {
        showToast(`ไม่พบอุปกรณ์รหัส: ${scannedCode}`, 'warning');
      }
    }, 'สแกน Barcode / QR Code อุปกรณ์ที่จะยืม');
  };

  // Handle Manual Equipment Code Entry
  const handleManualCodeSubmit = (e) => {
    if (e) e.preventDefault();
    const code = manualEquipCode.trim();
    if (!code) {
      showToast('กรุณาพิมพ์รหัสอุปกรณ์', 'warning');
      return;
    }
    const item = equipment.find(
      eq => eq.code.toLowerCase() === code.toLowerCase() ||
            eq.id.toLowerCase() === code.toLowerCase()
    );
    if (item) {
      setSelectedItem(item);
      setManualEquipCode('');
      setCurrentStep('step_student');
      showToast(`เลือกอุปกรณ์: ${item.name}`, 'success');
    } else {
      showToast(`ไม่พบอุปกรณ์รหัส: ${code}`, 'warning');
    }
  };

  // 📥 Handle Return Scan at Teacher's Desk
  const handleScanReturnEquipment = () => {
    openScanner((scannedCode) => {
      const clean = scannedCode.trim().toLowerCase();
      const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
      const matched = activeLoans.find(l => 
        (l.id && l.id.toLowerCase() === clean) ||
        (l.studentId && l.studentId.toLowerCase() === clean) ||
        (l.borrowerStudentId && l.borrowerStudentId.toLowerCase() === clean) ||
        l.items?.some(i => (i.code && i.code.toLowerCase() === clean) || (i.equipmentId && i.equipmentId.toLowerCase() === clean))
      );

      if (matched) {
        setScannedReturnLoan(matched);
        showToast(`พบรายการยืม: ${matched.borrowerName} (${matched.items?.[0]?.name})`, 'success');
      } else {
        showToast(`ไม่พบรายการค้างยืมสำหรับรหัส: ${scannedCode}`, 'warning');
      }
    }, 'สแกน Barcode / QR Code อุปกรณ์เพื่อส่งคืน');
  };

  // Handle Manual Return Code Submit
  const handleManualReturnSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = manualReturnCode.trim().toLowerCase();
    if (!clean) {
      showToast('กรุณาพิมพ์รหัสอุปกรณ์หรือรหัสนักเรียน', 'warning');
      return;
    }
    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
    const matched = activeLoans.find(l => 
      (l.id && l.id.toLowerCase() === clean) ||
      (l.studentId && l.studentId.toLowerCase() === clean) ||
      (l.borrowerStudentId && l.borrowerStudentId.toLowerCase() === clean) ||
      l.items?.some(i => (i.code && i.code.toLowerCase() === clean) || (i.equipmentId && i.equipmentId.toLowerCase() === clean))
    );

    if (matched) {
      setScannedReturnLoan(matched);
      showToast(`พบรายการยืม: ${matched.borrowerName}`, 'success');
    } else {
      showToast(`ไม่พบรายการค้างยืมสำหรับรหัส: ${manualReturnCode}`, 'warning');
    }
  };

  // Confirm Scanned Return at Teacher's Desk
  const handleConfirmReturnScanSubmit = () => {
    if (!scannedReturnLoan) return;
    const item = scannedReturnLoan.items?.[0];
    const success = processReturn(scannedReturnLoan.id, {
      condition: 'สมบูรณ์ (Good)',
      notes: 'สแกนคืนที่โต๊ะอาจารย์ (Teacher Desk Scan)',
      receivedBy: 'จุดสแกนโต๊ะอาจารย์'
    });

    if (success) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setReturnSuccessData({
        loan: scannedReturnLoan,
        item: item
      });
      setScannedReturnLoan(null);
      setManualReturnCode('');
    }
  };

  // Submit Borrow
  const handleConfirmBorrow = (e) => {
    if (e) e.preventDefault();

    if (!selectedItem) {
      showToast('กรุณาเลือกอุปกรณ์ที่ต้องการยืม', 'warning');
      setCurrentStep('step_equipment');
      return;
    }
    if (!studentId.trim()) {
      showToast('กรุณากรอกรหัสนักเรียน', 'warning');
      return;
    }
    if (!studentName.trim()) {
      showToast('กรุณากรอกชื่อ-นามสกุล', 'warning');
      return;
    }

    if (activeLoan) {
      showToast('นักเรียนมีรายการค้างยืมอยู่แล้ว กรุณาคืนของเดิมก่อน', 'error');
      return;
    }

    const res = createStudentLoan({
      studentId: studentId.trim(),
      name: studentName.trim(),
      phone: studentPhone.trim(),
      lineId: studentLineId.trim(),
      grade,
      room,
      item: selectedItem
    });

    if (res.success) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      setBorrowSuccessData({
        loan: res.loan,
        item: selectedItem,
        studentName: studentName.trim(),
        phone: studentPhone.trim(),
        lineId: studentLineId.trim(),
        grade,
        room
      });
      setSelectedItem(null);
      setCurrentStep('step_equipment');
    }
  };

  // Submit Return for current active loan
  const handleConfirmReturn = () => {
    if (!activeLoan) return;

    const success = processReturn(activeLoan.id, {
      condition: 'สมบูรณ์ (Good)',
      notes: 'คืนผ่านจุดบริการตนเองนักเรียน (Student Kiosk)',
      receivedBy: 'ระบบบริการตนเอง (Self-Service)'
    });

    if (success) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setReturnSuccessData({
        loan: activeLoan,
        item: activeLoan.items?.[0]
      });
    }
  };

  // Submit Issue Report or Transfer
  const handleSubmitIssueOrTransfer = (e) => {
    if (e) e.preventDefault();
    if (!activeLoan) return;

    const isHandover = selectedIssueReason.includes('ส่งต่อให้เพื่อน') || selectedIssueReason.includes('Handed');

    if (isHandover) {
      if (!targetFriendId.trim()) {
        showToast('กรุณากรอกรหัสนักเรียนของเพื่อนที่จะยืมต่อ', 'warning');
        return;
      }
      if (!targetFriendName.trim()) {
        showToast('กรุณากรอกชื่อ-นามสกุลของเพื่อนที่จะยืมต่อ', 'warning');
        return;
      }

      if (targetFriendId.trim() === studentId.trim()) {
        showToast('รหัสเพื่อนต้องไม่ตรงกับรหัสตนเอง', 'warning');
        return;
      }

      const res = transferStudentLoan(activeLoan.id, {
        targetStudentId: targetFriendId.trim(),
        targetStudentName: targetFriendName.trim(),
        targetGrade: targetFriendGrade,
        targetRoom: targetFriendRoom,
        notes: issueNote
      });

      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTransferSuccessData({
          originalStudent: studentName || activeLoan.borrowerName,
          targetFriendName: targetFriendName.trim(),
          targetFriendId: targetFriendId.trim(),
          targetGrade: targetFriendGrade,
          targetRoom: targetFriendRoom,
          item: activeLoan.items?.[0]
        });
        setIsIssueModalOpen(false);
        setTargetFriendId('');
        setTargetFriendName('');
        setIssueNote('');
      }
    } else {
      const success = reportReturnIssue(activeLoan.id, {
        reason: selectedIssueReason,
        notes: issueNote,
        reportedBy: `${studentName || activeLoan.borrowerName} (${grade}/${room})`
      });

      if (success) {
        setIssueSuccessData({
          loan: activeLoan,
          reason: selectedIssueReason,
          item: activeLoan.items?.[0]
        });
        setIsIssueModalOpen(false);
        setIssueNote('');
      }
    }
  };

  // Change / Switch Student
  const handleSwitchStudent = () => {
    setStudentId('');
    setStudentName('');
    setStudentPhone('');
    setStudentLineId('');
    setSelectedItem(null);
    setBorrowSuccessData(null);
    setReturnSuccessData(null);
    setIssueSuccessData(null);
    setTransferSuccessData(null);
    setCurrentStep('step_equipment');
    localStorage.removeItem(CURRENT_STUDENT_SESSION_KEY);
  };

  // Grade & Room Management Actions
  const handleOpenGradeModal = () => {
    setTempGrades([...gradesList]);
    setTempRooms([...roomsList]);
    setIsGradeModalOpen(true);
  };

  const handleAddGrade = (e) => {
    if (e) e.preventDefault();
    const trimmed = newGradeInput.trim();
    if (!trimmed) return;
    if (tempGrades.includes(trimmed)) {
      showToast('ระดับชั้นนี้มีอยู่ในระบบแล้ว', 'warning');
      return;
    }
    setTempGrades(prev => [...prev, trimmed]);
    setNewGradeInput('');
  };

  const handleRemoveGrade = (gradeToRemove) => {
    if (tempGrades.length <= 1) {
      showToast('ต้องมีระดับชั้นอย่างน้อย 1 ระดับ', 'warning');
      return;
    }
    setTempGrades(prev => prev.filter(g => g !== gradeToRemove));
  };

  const handleAddRoom = (e) => {
    if (e) e.preventDefault();
    const trimmed = newRoomInput.trim();
    if (!trimmed) return;
    if (tempRooms.includes(trimmed)) {
      showToast('ห้องนี้มีอยู่ในระบบแล้ว', 'warning');
      return;
    }
    setTempRooms(prev => [...prev, trimmed]);
    setNewRoomInput('');
  };

  const handleRemoveRoom = (roomToRemove) => {
    if (tempRooms.length <= 1) {
      showToast('ต้องมีห้องอย่างน้อย 1 ห้อง', 'warning');
      return;
    }
    setTempRooms(prev => prev.filter(r => r !== roomToRemove));
  };

  const handleApplyPreset = (preset) => {
    setTempGrades([...preset.grades]);
    setTempRooms([...preset.rooms]);
    showToast(`โหลดชุดระดับชั้น "${preset.name}" เรียบร้อยแล้ว`, 'info');
  };

  const handleSetRoomRange = (count) => {
    const newRooms = Array.from({ length: count }, (_, i) => String(i + 1));
    setTempRooms(newRooms);
    showToast(`กำหนดห้องเป็น 1 ถึง ${count} เรียบร้อย`, 'info');
  };

  const handleSaveGradeConfig = () => {
    if (tempGrades.length === 0) {
      showToast('กรุณาระบุระดับชั้นอย่างน้อย 1 ระดับ', 'warning');
      return;
    }
    if (tempRooms.length === 0) {
      showToast('กรุณาระบุห้องอย่างน้อย 1 ห้อง', 'warning');
      return;
    }
    updateGradeConfig(tempGrades, tempRooms);
    setIsGradeModalOpen(false);
  };

  const handleResetDefaultGrades = () => {
    if (window.confirm('คุณต้องการรีเซ็ตระดับชั้นและห้องกลับสู่ค่าเริ่มต้นใช่หรือไม่?')) {
      resetGradeConfig();
      setTempGrades(gradeConfig?.grades || []);
      setTempRooms(gradeConfig?.rooms || []);
      setIsGradeModalOpen(false);
    }
  };

  return (
    <div className="student-kiosk-container">
      
      {/* ============================================================ */}
      {/* 🌟 ULTRA-PREMIUM SCHOOL HERO HEADER                          */}
      {/* ============================================================ */}
      <div className="school-hero-card">
        {/* Animated ambient aura */}
        <div className="school-hero-glow" />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-20px',
          width: '220px',
          height: '220px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          filter: 'blur(35px)',
          pointerEvents: 'none'
        }} />

        {/* Decorative subtle texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          borderRadius: 'inherit',
          pointerEvents: 'none'
        }} />

        <div className="school-hero-inner">
          <div className="school-hero-brand">
            {/* Radiant School Logo */}
            <div className="school-hero-logo-box">
              <img 
                src="/logo.png" 
                alt="ตราโรงเรียนสระหลวงพิทยาคม" 
                className="school-hero-logo-img"
              />
              <div className="hero-logo-shimmer" />
            </div>

            <div className="school-hero-texts">
              <div className="school-hero-badge">
                <Sparkles size={12} className="sparkle-gold" />
                <span>โรงเรียนสระหลวงพิทยาคม</span>
              </div>
              <h1 className="school-hero-title">
                ระบบยืมอุปกรณ์กีฬา
              </h1>
              <div className="school-hero-subtitle">
                <span>🎽 ยืมฟรี สะดวก รวดเร็ว</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>🎯 1 คน ยืมได้ 1 ชิ้น</span>
              </div>
            </div>
          </div>

          {/* Floating Glass Stats Pod */}
          <div className="school-hero-stats">
            <div className="hero-stats-glass-pod">
              <div className="school-live-badge">
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399', animation: 'liveBlink 1.4s infinite' }} />
                <span>เปิดให้บริการยืม-คืน</span>
              </div>
              <div className="hero-time-badge">
                <Clock size={12} style={{ color: '#38bdf8' }} />
                <span>
                  {liveTime.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' '}
                  <strong style={{ color: '#38bdf8' }}>{liveTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUCCESS NOTIFICATIONS                                        */}
      {/* ============================================================ */}
      {borrowSuccessData && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ffffff 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '22px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 12px 32px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.7) inset',
          animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
            }}>
              ✓
            </div>
            <div>
              <h3 style={{ margin: '0 0 2px 0', color: '#065f46', fontSize: '1.1rem', fontWeight: 900 }}>
                ยืมอุปกรณ์สำเร็จเรียบร้อย! 🎉
              </h3>
              <div style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                นักเรียน <strong>{borrowSuccessData.studentName} ({borrowSuccessData.grade}/{borrowSuccessData.room})</strong> ยืม <strong>{borrowSuccessData.item?.name}</strong>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                รหัสรายการ: <strong>{borrowSuccessData.loan?.id}</strong> • เมื่อเล่นเสร็จแล้ว กลับมากดคืนได้เลย
              </div>
            </div>
          </div>
          <button
            className="btn btn-success"
            onClick={() => setBorrowSuccessData(null)}
            style={{ padding: '8px 18px', fontSize: '0.88rem', borderRadius: '12px' }}
          >
            ตกลง ✓
          </button>
        </div>
      )}

      {returnSuccessData && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ffffff 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '22px',
          padding: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 16px 40px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.7) inset',
          animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 6px rgba(16, 185, 129, 0.1)'
          }}>
            ✓
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#065f46', fontSize: '1.3rem', fontWeight: 900 }}>
              คืนอุปกรณ์กีฬาเรียบร้อยแล้ว! 👏
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem' }}>
              ขอบคุณที่นำ <strong>{returnSuccessData.item?.name || 'อุปกรณ์'}</strong> มาส่งคืนตรงเวลา
            </p>
          </div>
          <button
            className="btn btn-success"
            onClick={() => {
              setReturnSuccessData(null);
              handleSwitchStudent();
            }}
            style={{ padding: '9px 24px', fontSize: '0.92rem', borderRadius: '12px' }}
          >
            เสร็จสิ้น — พร้อมให้นักเรียนคนต่อไป 🎽
          </button>
        </div>
      )}

      {transferSuccessData && (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #ffffff 100%)',
          border: '1.5px solid rgba(2, 132, 199, 0.4)',
          borderRadius: '22px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 12px 32px rgba(2, 132, 199, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.7) inset',
          animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 6px 18px rgba(2, 132, 199, 0.4)'
            }}>🤝</div>
            <div>
              <h3 style={{ margin: '0 0 2px 0', color: '#1e40af', fontSize: '1.1rem', fontWeight: 900 }}>
                ส่งต่อสิทธิ์การยืมให้เพื่อนเรียบร้อย! 🎉
              </h3>
              <div style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                ส่งต่อ <strong>{transferSuccessData.item?.name}</strong> ให้ <strong>{transferSuccessData.targetFriendName} ({transferSuccessData.targetGrade}/{transferSuccessData.targetRoom})</strong>
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setTransferSuccessData(null)}
            style={{ padding: '8px 18px', fontSize: '0.88rem', borderRadius: '12px' }}
          >
            ตกลง ✓
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚠️ CONDITION 1: ALREADY BORROWED -> SIMPLE, CLEAR RETURN CARD */}
      {/* ========================================================================= */}
      {activeLoan ? (
        /* RETURN CARD — Premium Redesign */
        <div style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)',
          border: '1.5px solid rgba(2, 132, 199, 0.35)',
          borderRadius: '24px',
          padding: '22px',
          boxShadow: '0 12px 36px rgba(2, 132, 199, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.7) inset',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top accent bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #2563eb 100%)' }} />

          {activeLoan.status === 'pending_return' ? (
            /* ⏳ FIRMLY LOCKED: PENDING TEACHER VERIFICATION CARD */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '18px',
              padding: '16px 8px'
            }}>
              {/* Pulsing Loading Halo */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
                  animation: 'pulseGlow 1.8s infinite'
                }} />
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  boxShadow: '0 10px 28px rgba(245, 158, 11, 0.45)',
                  zIndex: 2
                }}>
                  ⏳
                </div>
              </div>

              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  marginBottom: '10px',
                  border: '1.5px solid #fcd34d'
                }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #f59e0b'
                  }} />
                  <span>สแกนส่งคืนแล้ว • รอคุณครูตรวจสอบอุปกรณ์</span>
                </div>

                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  กรุณานำอุปกรณ์ไปวางที่โต๊ะอาจารย์
                </h2>
                
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
                  ผู้ยืม: <strong>{activeLoan.borrowerName}</strong> ({activeLoan.borrowerDepartment})
                </p>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                  อุปกรณ์: {activeLoan.items?.[0]?.name}
                </div>

                <div style={{
                  fontSize: '0.86rem',
                  color: '#92400e',
                  marginTop: '16px',
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(245, 158, 11, 0.35)',
                  lineHeight: 1.5
                }}>
                  🔒 <strong>หน้าจอจะค้างหน้านี้ไว้จนกว่าคุณครูจะตรวจสอบและกดยืนยันรับคืน</strong><br/>
                  <span style={{ color: '#b45309', fontSize: '0.8rem' }}>
                    เมื่อคุณครูกดยืนยันในระบบ หน้าจอนี้จะปลดล็อกและกลับสู่หน้าหลักอัตโนมัติครับ
                  </span>
                </div>
              </div>

              {/* Live WebSocket / Polling Heartbeat Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f0fdf4',
                color: '#166534',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span>กำลังเชื่อมต่อกับหน้าจอคุณครูแบบ Real-Time</span>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}>
                  <span>📦 รายการที่กำลังยืมอยู่</span>
                </div>
                <button
                  onClick={handleSwitchStudent}
                  style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)',
                    border: '1px solid #cbd5e1',
                    padding: '4px 12px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  สลับรหัสนักเรียน 👤
                </button>
              </div>

              {/* Active Item Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 60%, #e0f2fe 100%)',
                padding: '18px',
                borderRadius: '18px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.1) inset'
              }}>
                <div style={{ fontSize: '46px', lineHeight: 1 }}>
                  {activeLoan.items?.[0]?.image || '⚽'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 800, marginBottom: '2px' }}>
                    ผู้ยืม: {activeLoan.borrowerName}
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>
                    {activeLoan.items?.[0]?.name}
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    รหัสรายการ: <strong>{activeLoan.id}</strong> • ยืมเมื่อ: {formatDate(activeLoan.borrowDate)}
                  </div>
                </div>
              </div>

              {/* Action Guidance & Scan Button */}
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '16px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.84rem',
                color: '#92400e'
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>🔒</span>
                <span>
                  <strong>ต้องนำอุปกรณ์มาสแกนที่โต๊ะอาจารย์</strong> — เมื่อสแกนแล้ว รายการจะไปแจ้งเตือนที่หน้าจอคุณครูเพื่อตรวจสอบและกดยืนยันรับคืน
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    openScanner((scannedCode) => {
                      const clean = scannedCode.trim().toLowerCase();
                      const isMatch = (activeLoan.id && activeLoan.id.toLowerCase() === clean) ||
                                      (activeLoan.studentId && activeLoan.studentId.toLowerCase() === clean) ||
                                      activeLoan.items?.some(i => (i.code && i.code.toLowerCase() === clean) || (i.equipmentId && i.equipmentId.toLowerCase() === clean));
                      if (isMatch) {
                        requestReturnByStudent(activeLoan.id);
                      } else {
                        showToast(`รหัส ${scannedCode} ไม่ตรงกับอุปกรณ์ที่ยืมอยู่`, 'warning');
                      }
                    }, 'สแกน Barcode/QR อุปกรณ์เพื่อแจ้งคืน');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    fontSize: '1.02rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35), 0 1px 0 rgba(255, 255, 255, 0.2) inset',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Scan size={20} />
                  <span>สแกนบาร์โค้ดแจ้งส่งคืน (รอครูตรวจ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    color: '#475569',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <AlertTriangle size={18} color="#d97706" />
                  <span>ส่งต่อ / แจ้งปัญหาอุปกรณ์ ➔</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* ✨ BORROW FLOW — ONLY SHOWN WHEN STUDENT HAS NO ACTIVE LOAN  */
        /* ============================================================ */
        <div className="kiosk-desktop-split">
          
          {/* LEFT COLUMN: Progress Bar + Active Action Step */}
          <div className="kiosk-left-column">
            {/* Responsive Step Progress Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
              padding: '6px',
              borderRadius: '18px',
              border: '1.5px solid rgba(221, 228, 239, 0.9)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.7) inset'
            }}>
              {/* Step 1 Tab */}
              <button
                type="button"
                onClick={() => setCurrentStep('step_equipment')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: currentStep === 'step_equipment' 
                    ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 60%, #2563eb 100%)' 
                    : 'transparent',
                  color: currentStep === 'step_equipment' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: currentStep === 'step_equipment' ? '0 4px 16px rgba(2, 132, 199, 0.4)' : 'none'
                }}
              >
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentStep === 'step_equipment' ? 'rgba(255,255,255,0.25)' : 'rgba(2, 132, 199, 0.1)',
                  color: currentStep === 'step_equipment' ? '#ffffff' : '#0284c7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  flexShrink: 0
                }}>1</span>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    สแกนอุปกรณ์ {selectedItem ? selectedItem.image : '📷'}
                  </div>
                  <div style={{ fontSize: '0.68rem', opacity: currentStep === 'step_equipment' ? 0.85 : 0.65, fontWeight: 600 }}>
                    จุดสแกนโต๊ะอาจารย์
                  </div>
                </div>
              </button>

              {/* Step 2 Tab */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '14px',
                  background: currentStep === 'step_student' 
                    ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 60%, #2563eb 100%)' 
                    : 'rgba(0, 0, 0, 0.03)',
                  color: currentStep === 'step_student' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'not-allowed',
                  userSelect: 'none',
                  boxShadow: currentStep === 'step_student' ? '0 4px 16px rgba(2, 132, 199, 0.4)' : 'none'
                }}
              >
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentStep === 'step_student' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: currentStep === 'step_student' ? '#ffffff' : '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  flexShrink: 0
                }}>2</span>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    ข้อมูลผู้ยืม 👤
                  </div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 600 }}>
                    (ต้องสแกนก่อน)
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 1: TEACHER'S DESK SCANNING ARENA */}
            {currentStep === 'step_equipment' && (
              <div style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
                borderRadius: '24px',
                padding: '24px',
                border: '1.5px solid rgba(221, 228, 239, 0.9)',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.7) inset',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                height: '100%',
                animation: 'fadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {/* 🎯 TEACHER'S DESK SCANNING ARENA */}
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 40%, #e0f2fe 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.5)',
                  borderRadius: '20px',
                  padding: '20px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 28px rgba(2, 132, 199, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Scan arena top bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px', background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #0ea5e9 100%)', borderRadius: '20px 20px 0 0' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                        flexShrink: 0
                      }}>
                        📷
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                          จุดสแกนอุปกรณ์โต๊ะอาจารย์
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                          นำอุปกรณ์หรือบาร์โค้ดมาสแกนเพื่อยืม
                        </div>
                      </div>
                    </div>

                    <span style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      color: '#0369a1',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee', display: 'inline-block', animation: 'liveBlink 1.2s infinite' }} />
                      พร้อมสแกน
                    </span>
                  </div>

                  {/* Primary Camera Scanner Button */}
                  <button
                    type="button"
                    onClick={handleScanBorrowEquipment}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 60%, #2563eb 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4), 0 1px 0 rgba(255, 255, 255, 0.2) inset',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      letterSpacing: '0.01em',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                      animation: 'laserShimmer 2.5s infinite',
                      pointerEvents: 'none'
                    }} />
                    <Scan size={24} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>เปิดกล้องสแกนบาร์โค้ด / QR</span>
                  </button>

                  {/* Barcode Gun / Manual Code Input */}
                  <form onSubmit={handleManualCodeSubmit} style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <IdCard size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="พิมพ์รหัสอุปกรณ์ เช่น SP-FB-01..."
                        value={manualEquipCode}
                        onChange={(e) => setManualEquipCode(e.target.value)}
                        style={{
                          paddingLeft: '40px',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                          border: '1.5px solid rgba(56, 189, 248, 0.6)',
                          borderRadius: '14px',
                          marginBottom: 0,
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)'
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '0 20px',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Search size={16} />
                      <span>ตกลง</span>
                    </button>
                  </form>
                </div>

                {/* Guidance Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '1.5px solid rgba(2, 132, 199, 0.3)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  fontSize: '0.88rem',
                  color: '#1e3a5f',
                  marginTop: 'auto'
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>🔒</span>
                  <span>
                    <strong>ต้องสแกนที่โต๊ะอาจารย์เท่านั้น</strong> — นำอุปกรณ์มาให้อาจารย์สแกนบาร์โค้ด
                    หรือยิงบาร์โค้ดด้วยเครื่องสแกน เพื่อยืนยันการยืม
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Only: In Step 1, render Catalog below Scan Arena */}
            {currentStep === 'step_equipment' && (
              <div className="kiosk-mobile-only">
                <div style={{
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1.5px solid rgba(221, 228, 239, 0.9)',
                  boxShadow: '0 8px 28px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.7) inset',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                        fontSize: '14px'
                      }}>📋</span>
                      ตรวจสอบรายการอุปกรณ์และจำนวนคงเหลือ:
                    </div>
                  </div>

                  {/* Search & Category Filter */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ค้นหาชื่ออุปกรณ์..."
                        value={equipmentSearch}
                        onChange={(e) => setEquipmentSearch(e.target.value)}
                        style={{ paddingLeft: '36px', fontSize: '0.88rem', background: '#f8fafc', marginBottom: 0 }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setEquipmentCategory(cat)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            border: equipmentCategory === cat ? '1px solid #0284c7' : '1px solid #e2e8f0',
                            background: equipmentCategory === cat ? '#0284c7' : '#f8fafc',
                            color: equipmentCategory === cat ? '#fff' : '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          {cat === 'all' ? 'ทั้งหมด' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment Cards Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '8px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    padding: '2px'
                  }}>
                    {filteredEquipment.map(item => {
                      const isAvailable = item.availableQty > 0;
                      return (
                        <div
                          key={item.id}
                          className={`kiosk-equip-card ${!isAvailable ? 'out-of-stock' : ''}`}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '12px 8px',
                            textAlign: 'center',
                            cursor: 'default',
                            opacity: isAvailable ? 1 : 0.45,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            userSelect: 'none',
                            pointerEvents: 'none'
                          }}
                        >
                          <div style={{ fontSize: '32px', margin: '2px 0 4px 0' }}>
                            {item.image || '⚽'}
                          </div>

                          <div style={{
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            lineHeight: 1.2,
                            marginBottom: '6px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.name}
                          </div>

                          <div style={{
                            fontSize: '0.76rem',
                            fontWeight: 900,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: isAvailable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                            color: isAvailable ? '#059669' : '#dc2626',
                            display: 'inline-block',
                            marginTop: 'auto',
                            border: isAvailable ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.2)'
                          }}>
                            {isAvailable ? `เหลือ ${item.availableQty} ชิ้น` : '✗ หมดแล้ว'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: BORROWER FORM (LEFT COLUMN) */}
            {currentStep === 'step_student' && (
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                animation: 'fadeIn 0.25s ease'
              }}>
                {/* 🌟 Ultra-Premium Selected Item Recap */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 55%, #eff6ff 100%)',
                  padding: '16px 18px',
                  borderRadius: '20px',
                  border: '1.5px solid rgba(2, 132, 199, 0.25)',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    background: 'linear-gradient(90deg, #10b981 0%, #0284c7 50%, #2563eb 100%)'
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '200px' }}>
                    {/* Emoji Avatar Frame */}
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
                      border: '1.5px solid rgba(2, 132, 199, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)',
                      flexShrink: 0
                    }}>
                      {selectedItem?.image || '⚽'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#059669',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        width: 'fit-content'
                      }}>
                        <CheckCircle2 size={11} />
                        <span>สแกนสำเร็จจากโต๊ะอาจารย์</span>
                      </div>

                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2,
                        marginTop: '2px'
                      }}>
                        {selectedItem?.name}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                        คงเหลือในคลัง: <strong style={{ color: '#0284c7' }}>{selectedItem?.availableQty || 1} ชิ้น</strong>
                      </div>
                    </div>
                  </div>

                  {/* Re-scan button */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep('step_equipment')}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '1.5px solid rgba(2, 132, 199, 0.3)',
                      color: '#0284c7',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Scan size={14} />
                    <span>สแกนชิ้นใหม่</span>
                  </button>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Student ID */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <IdCard size={16} color="#0284c7" />
                      <span>รหัสนักเรียน <span style={{ color: '#ef4444' }}>*</span></span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น 12345 หรือ 65001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.04em', background: '#f8fafc', marginBottom: 0 }}
                    />
                  </div>

                  {/* Student Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <User size={16} color="#0284c7" />
                      <span>ชื่อ - นามสกุล <span style={{ color: '#ef4444' }}>*</span></span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น เด็กชายมานะ ใจกล้า"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      style={{ fontSize: '1rem', background: '#f8fafc', marginBottom: 0 }}
                    />
                  </div>

                  {/* Grade & Room */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                        ระดับชั้นและห้องเรียน
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenGradeModal}
                        style={{
                          background: 'rgba(2, 132, 199, 0.08)',
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                          color: '#0284c7',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Settings size={12} />
                        <span>แก้ไขชั้น/ห้อง</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <select
                        className="form-select"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        style={{ fontSize: '0.95rem', fontWeight: 700, background: '#f8fafc', marginBottom: 0 }}
                      >
                        {gradesList.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>

                      <select
                        className="form-select"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        style={{ fontSize: '0.95rem', fontWeight: 700, background: '#f8fafc', marginBottom: 0 }}
                      >
                        {roomsList.map((r) => (
                          <option key={r} value={r}>ห้อง {r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Phone & Line ID */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                        <Phone size={14} color="#0284c7" />
                        <span>เบอร์โทรศัพท์</span>
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="เช่น 081-234-5678"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        style={{ fontSize: '0.92rem', background: '#f8fafc', marginBottom: 0 }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                        <MessageCircle size={14} color="#10b981" />
                        <span>ID Line <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(ถ้ามี)</span></span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="เช่น somchai_123"
                        value={studentLineId}
                        onChange={(e) => setStudentLineId(e.target.value)}
                        style={{ fontSize: '0.92rem', background: '#f8fafc', marginBottom: 0 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons — Responsive & Perfectly Sized */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('step_equipment')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronLeft size={16} />
                    <span>ย้อนกลับ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBorrow}
                    disabled={!studentId.trim() || !studentName.trim() || !selectedItem}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: '0.98rem',
                      fontWeight: 900,
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: (!studentId.trim() || !studentName.trim() || !selectedItem) 
                        ? '#cbd5e1' 
                        : 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 60%, #2563eb 100%)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: (!studentId.trim() || !studentName.trim() || !selectedItem) ? 'not-allowed' : 'pointer',
                      boxShadow: (!studentId.trim() || !studentName.trim() || !selectedItem) 
                        ? 'none' 
                        : '0 6px 20px rgba(2, 132, 199, 0.35)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      minWidth: 0
                    }}
                  >
                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      ยืนยันการยืมอุปกรณ์
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (Desktop Only): Always visible real-time Inventory Catalog */}
          <div className="kiosk-right-column kiosk-desktop-only">
            <div style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
              borderRadius: '24px',
              padding: '24px',
              border: '1.5px solid rgba(221, 228, 239, 0.9)',
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.7) inset',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: '100%',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      fontSize: '15px'
                    }}>📋</span>
                    ตรวจสอบรายการอุปกรณ์กีฬาและจำนวนคงเหลือ:
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#5a7a99', background: 'rgba(2, 132, 199, 0.06)', padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
                    แตะเพื่อดูรหัสบาร์โค้ด → นำไปสแกนที่โต๊ะอาจารย์
                  </div>
                </div>

                {/* Search & Category Filter */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ค้นหาชื่ออุปกรณ์หรือรหัส..."
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      style={{ paddingLeft: '36px', fontSize: '0.88rem', background: '#f8fafc', marginBottom: 0 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setEquipmentCategory(cat)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          border: equipmentCategory === cat ? '1px solid #0284c7' : '1px solid #e2e8f0',
                          background: equipmentCategory === cat ? '#0284c7' : '#f8fafc',
                          color: equipmentCategory === cat ? '#fff' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat === 'all' ? 'ทั้งหมด' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '10px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  padding: '4px 2px'
                }}>
                  {filteredEquipment.map(item => {
                    const isAvailable = item.availableQty > 0;
                    return (
                      <div
                        key={item.id}
                        className={`kiosk-equip-card ${!isAvailable ? 'out-of-stock' : ''}`}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '12px 8px',
                          textAlign: 'center',
                          cursor: 'default',
                          opacity: isAvailable ? 1 : 0.45,
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          userSelect: 'none',
                          pointerEvents: 'none',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
                        }}
                      >
                        <div style={{ fontSize: '34px', margin: '2px 0 4px 0' }}>
                          {item.image || '⚽'}
                        </div>

                        <div style={{
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          lineHeight: 1.25,
                          marginBottom: '6px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {item.name}
                        </div>

                        <div style={{
                          fontSize: '0.76rem',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: isAvailable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                          color: isAvailable ? '#059669' : '#dc2626',
                          display: 'inline-block',
                          marginTop: 'auto',
                          border: isAvailable ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.2)'
                        }}>
                          {isAvailable ? `เหลือ ${item.availableQty} ชิ้น` : '✗ หมดแล้ว'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Guidance — Scan Required */}
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1.5px solid rgba(2, 132, 199, 0.3)',
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '0.88rem',
                color: '#1e3a5f',
                marginTop: 'auto'
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>🔒</span>
                <span>
                  <strong>ต้องสแกนที่โต๊ะอาจารย์เท่านั้น</strong> — นำอุปกรณ์มาให้อาจารย์สแกนบาร์โค้ด
                  หรือยิงบาร์โค้ดด้วยเครื่องสแกน เพื่อยืนยันการยืม
                  <br/>
                  <span style={{ color: '#0284c7', fontSize: '0.8rem' }}>รายการด้านบนแสดงเพื่อ<strong>ดูจำนวนคงเหลือ</strong>เท่านั้น ไม่สามารถกดเลือกได้</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: "CANNOT RETURN / REPORT ISSUE / HANDOVER TO FRIEND" */}
      {/* ========================================================================= */}
      {isIssueModalOpen && activeLoan && (
        <div className="modal-backdrop" onClick={() => setIsIssueModalOpen(false)}>
          <div 
            className="modal-dialog animate-pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '24px' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={22} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  แจ้งปัญหา / ส่งต่อให้เพื่อนยืมต่อ
                </h3>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setIsIssueModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitIssueOrTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '0.88rem'
              }}>
                อุปกรณ์ที่กำลังยืม: <strong>{activeLoan.items?.[0]?.name}</strong> (รหัส: {activeLoan.id})
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                  เลือกสาเหตุหรือประเภทการแจ้ง:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ISSUE_REASONS.map(reason => {
                    const isSelected = selectedIssueReason === reason.label;
                    return (
                      <div
                        key={reason.id}
                        onClick={() => setSelectedIssueReason(reason.label)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: isSelected ? `2px solid ${reason.color}` : '1px solid #e2e8f0',
                          background: isSelected ? 'rgba(2, 132, 199, 0.05)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{reason.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? reason.color : '#0f172a' }}>
                            {reason.label}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {reason.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Handover Specific Target Friend Fields */}
              {selectedIssueReason.includes('ส่งต่อให้เพื่อน') && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0284c7' }}>
                    👤 ระบุข้อมูลเพื่อนที่จะรับผิดชอบยืมต่อ:
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      รหัสนักเรียนของเพื่อน <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น 65002 หรือ 12346"
                      value={targetFriendId}
                      onChange={(e) => setTargetFriendId(e.target.value)}
                      style={{ background: '#ffffff', marginBottom: 0 }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      ชื่อ - นามสกุลของเพื่อน <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น เด็กหญิงสมหญิง รักดี"
                      value={targetFriendName}
                      onChange={(e) => setTargetFriendName(e.target.value)}
                      style={{ background: '#ffffff', marginBottom: 0 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <select
                      className="form-select"
                      value={targetFriendGrade}
                      onChange={(e) => setTargetFriendGrade(e.target.value)}
                      style={{ background: '#ffffff', fontSize: '0.9rem' }}
                    >
                      {gradesList.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <select
                      className="form-select"
                      value={targetFriendRoom}
                      onChange={(e) => setTargetFriendRoom(e.target.value)}
                      style={{ background: '#ffffff', fontSize: '0.9rem' }}
                    >
                      {roomsList.map(r => (
                        <option key={r} value={r}>ห้อง {r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Note / Details */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  รายละเอียดเพิ่มเติม (ถ้ามี):
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="เช่น ฝากไว้กับคุณครูวิชาพละ, ทำลูกบอลตกน้ำหาไม่เจอ ฯลฯ"
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  rows={2}
                  style={{ fontSize: '0.9rem' }}
                />
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsIssueModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  ยืนยันการบันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GRADE & ROOM CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      {isGradeModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsGradeModalOpen(false)}>
          <div 
            className="modal-dialog animate-pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px', padding: '24px' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  จัดการระดับชั้นและห้องเรียน
                </h3>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setIsGradeModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Presets */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                เลือกรูปแบบโรงเรียนสำเร็จรูป:
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {PRESET_SYSTEMS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setModalTab('grades')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: modalTab === 'grades' ? '2px solid #0284c7' : '2px solid transparent',
                  background: 'transparent',
                  color: modalTab === 'grades' ? '#0284c7' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ระดับชั้น ({tempGrades.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('rooms')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: modalTab === 'rooms' ? '2px solid #0284c7' : '2px solid transparent',
                  background: 'transparent',
                  color: modalTab === 'rooms' ? '#0284c7' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ห้องเรียน ({tempRooms.length})
              </button>
            </div>

            {/* Tab 1: Grades */}
            {modalTab === 'grades' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <form onSubmit={handleAddGrade} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="พิมพ์ระดับชั้นใหม่ เช่น ม.7, ปวส.1..."
                    value={newGradeInput}
                    onChange={(e) => setNewGradeInput(e.target.value)}
                    style={{ marginBottom: 0, fontSize: '0.9rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
                    <Plus size={16} />
                    <span>เพิ่ม</span>
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {tempGrades.map(g => (
                    <div
                      key={g}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f1f5f9',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: 700
                      }}
                    >
                      <span>{g}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGrade(g)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Rooms */}
            {modalTab === 'rooms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[6, 8, 10, 12, 15].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSetRoomRange(cnt)}
                      style={{
                        flex: 1,
                        padding: '4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      1-{cnt}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddRoom} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="พิมพ์ชื่อห้องใหม่..."
                    value={newRoomInput}
                    onChange={(e) => setNewRoomInput(e.target.value)}
                    style={{ marginBottom: 0, fontSize: '0.9rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
                    <Plus size={16} />
                    <span>เพิ่ม</span>
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {tempRooms.map(r => (
                    <div
                      key={r}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f1f5f9',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      <span>ห้อง {r}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoom(r)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleResetDefaultGrades}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                คืนค่าเริ่มต้น
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsGradeModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveGradeConfig}
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
