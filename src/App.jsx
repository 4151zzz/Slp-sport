import React, { useState, useRef, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './components/Dashboard';
import BorrowFlow from './components/BorrowFlow';
import ReturnFlow from './components/ReturnFlow';
import OverdueTracking from './components/OverdueTracking';
import InventoryManager from './components/InventoryManager';
import BorrowerDirectory from './components/BorrowerDirectory';
import LabelMaker from './components/LabelMaker';
import Reports from './components/Reports';
import StudentKiosk from './components/StudentKiosk';
import ScannerModal from './components/ScannerModal';
import ReceiptModal from './components/ReceiptModal';
import ReminderModal from './components/ReminderModal';
import ToastNotification from './components/ToastNotification';
import { KeyRound, X, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

// =========================================================================
// Teacher PIN Login Modal
// =========================================================================
function TeacherLoginModal({ isOpen, onClose, onLogin }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (isOpen && inputRefs[0].current) {
      setTimeout(() => inputRefs[0].current.focus(), 100);
    }
    if (isOpen) {
      setPin(['', '', '', '']);
      setError(false);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        const success = onLogin(fullPin);
        if (!success) {
          setError(true);
          setPin(['', '', '', '']);
          setTimeout(() => inputRefs[0].current?.focus(), 400);
        }
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newPin = pasted.split('');
      setPin(newPin);
      inputRefs[3].current?.focus();
      setTimeout(() => {
        const success = onLogin(pasted);
        if (!success) {
          setError(true);
          setPin(['', '', '', '']);
          setTimeout(() => inputRefs[0].current?.focus(), 400);
        }
      }, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog animate-pop-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 28px' }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px'
          }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.3)'
        }}>
          <Lock size={32} />
        </div>

        <h2 style={{ 
          fontSize: '1.35rem', 
          fontWeight: 800, 
          color: '#0f172a', 
          margin: '0 0 6px 0',
          letterSpacing: '-0.02em' 
        }}>
          เข้าสู่ระบบคุณครู
        </h2>

        <p style={{ 
          fontSize: '0.9rem', 
          color: '#64748b', 
          margin: '0 0 24px 0' 
        }}>
          กรุณาใส่รหัส PIN 4 หลัก เพื่อเข้าถึงระบบจัดการทั้งหมด
        </p>

        {/* PIN Input */}
        <div className="pin-input-group" onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={error ? 'pin-error' : ''}
              autoComplete="off"
            />
          ))}
        </div>

        {error && (
          <div style={{
            color: '#e11d48',
            fontSize: '0.88rem',
            fontWeight: 700,
            margin: '8px 0',
            animation: 'fadeIn 0.2s ease'
          }}>
            ❌ รหัสไม่ถูกต้อง กรุณาลองใหม่
          </div>
        )}

        <div style={{
          fontSize: '0.78rem',
          color: '#94a3b8',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={14} />
          <span>รหัสเริ่มต้น: 1234 (เปลี่ยนได้ในหน้ารายงาน & ระบบ)</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Main App Content (Handles Student vs Teacher Mode)
// =========================================================================
function MainAppContent() {
  const { activeTab, isTeacherMode, loginTeacher } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = (pin) => {
    const success = loginTeacher(pin);
    if (success) {
      setShowLoginModal(false);
    }
    return success;
  };

  const renderTeacherView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'borrow':
        return <BorrowFlow />;
      case 'return':
        return <ReturnFlow />;
      case 'tracking':
        return <OverdueTracking />;
      case 'inventory':
        return <InventoryManager />;
      case 'borrowers':
        return <BorrowerDirectory />;
      case 'labels':
        return <LabelMaker />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  // =====================================================
  // STUDENT MODE (Default) — No Navbar, No BottomNav
  // =====================================================
  if (!isTeacherMode) {
    return (
      <div className="student-page-wrapper">
        <div className="student-main-content">
          <StudentKiosk />
        </div>

        {/* Global Footer with Credit */}
        <Footer />

        {/* Floating Teacher Access Button */}
        <button
          className="teacher-access-btn"
          onClick={() => setShowLoginModal(true)}
          title="เข้าสู่ระบบสำหรับคุณครูและเจ้าหน้าที่"
        >
          <KeyRound size={16} />
          <span>สำหรับคุณครู</span>
        </button>

        {/* Teacher Login Modal */}
        <TeacherLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />

        {/* Global Modals & Notifications */}
        <ScannerModal />
        <ReceiptModal />
        <ReminderModal />
        <ToastNotification />
      </div>
    );
  }

  // =====================================================
  // TEACHER MODE — Full System with Navbar + BottomNav
  // =====================================================
  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {renderTeacherView()}
      </main>

      <Footer />
      <BottomNav />

      {/* Global Modals & Notifications */}
      <ScannerModal />
      <ReceiptModal />
      <ReminderModal />
      <ToastNotification />
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AppProvider>
      {isLoading && <LoadingScreen onFinish={() => setIsLoading(false)} />}
      <MainAppContent />
    </AppProvider>
  );
}

