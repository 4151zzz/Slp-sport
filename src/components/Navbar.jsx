import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Scan, 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Boxes, 
  Users, 
  QrCode, 
  FileSpreadsheet,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeTab, 
    setActiveTab, 
    logoutTeacher,
    loans, 
    openScanner 
  } = useApp();

  const overdueCount = loans.filter(l => l.status === 'overdue').length;
  const activeLoansCount = loans.filter(l => l.status === 'active' || l.status === 'overdue').length;

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'borrow', label: 'เบิกอุปกรณ์', icon: ArrowUpRight },
    { id: 'return', label: 'รับคืน', icon: ArrowDownLeft, badge: activeLoansCount, badgeType: 'info' },
    { id: 'tracking', label: 'ติดตามทวงคืน', icon: Clock, badge: overdueCount, isAlert: overdueCount > 0, badgeType: 'danger' },
    { id: 'inventory', label: 'คลังพัสดุ', icon: Boxes },
    { id: 'borrowers', label: 'ทะเบียนผู้ยืม', icon: Users },
    { id: 'labels', label: 'ป้ายสติกเกอร์', icon: QrCode },
    { id: 'reports', label: 'รายงาน & ระบบ', icon: FileSpreadsheet }
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* School Brand Identity */}
        <div className="navbar-brand-block">
          <div className="navbar-school-logo-wrap">
            <img 
              src="/logo.png" 
              alt="ตราโรงเรียนสระหลวงพิทยาคม" 
              className="navbar-school-logo"
            />
          </div>
          <div className="navbar-brand-texts">
            <div className="navbar-school-name">
              โรงเรียนสระหลวงพิทยาคม
            </div>
            <div className="navbar-app-title">
              ระบบยืมอุปกรณ์กีฬา
            </div>
          </div>
        </div>

        {/* Back to Student Button */}
        <button
          onClick={logoutTeacher}
          className="btn-back-student"
          title="กลับไปหน้านักเรียน"
        >
          <ArrowLeft size={15} />
          <span>หน้านักเรียน</span>
        </button>

        {/* Desktop Modern Segmented Navigation Links */}
        <nav className="desktop-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} className="nav-icon" />
                <span className="nav-text">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`nav-counter-badge ${item.isAlert ? 'badge-danger-glow' : 'badge-primary-soft'}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <div className="nav-active-glow" />}
              </button>
            );
          })}
        </nav>

        {/* Header Action Buttons */}
        <div className="navbar-actions">
          {/* Quick Scan Button */}
          <button 
            className="btn-quick-scan"
            onClick={() => openScanner(null, 'สแกน Barcode / QR Code อุปกรณ์')}
            title="เปิดกล้องสแกนทันที"
          >
            <Scan size={17} />
            <span className="scan-btn-text">สแกนกล้อง</span>
          </button>
        </div>
      </div>
    </header>
  );
}

