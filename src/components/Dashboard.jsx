import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scan, 
  QrCode, 
  TrendingUp, 
  Bell, 
  ChevronRight 
} from 'lucide-react';
import { formatDate, getDueStatus } from '../utils/formatters';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  const { 
    equipment, 
    loans, 
    processReturn,
    setActiveTab, 
    openScanner, 
    setSelectedReminderLoan,
    theme 
  } = useApp();

  // Calculations
  const totalItemsCount = equipment.reduce((sum, item) => sum + item.totalQty, 0);
  const availableItemsCount = equipment.reduce((sum, item) => sum + item.availableQty, 0);
  const borrowedItemsCount = totalItemsCount - availableItemsCount;

  const pendingReturns = loans.filter(l => l.status === 'pending_return');
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = loans.filter(l => l.status === 'overdue');

  // Category Aggregation
  const categoryCounts = {};
  equipment.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + (item.totalQty - item.availableQty);
  });

  const doughnutData = {
    labels: ['พร้อมใช้งาน (Available)', 'กำลังถูกยืม (Borrowed)'],
    datasets: [
      {
        data: [availableItemsCount, borrowedItemsCount],
        backgroundColor: ['#10b981', '#0284c7'],
        borderColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const barData = {
    labels: Object.keys(categoryCounts).slice(0, 5),
    datasets: [
      {
        label: 'จำนวนชิ้นที่ถูกเบิกยืม',
        data: Object.values(categoryCounts).slice(0, 5),
        backgroundColor: 'rgba(56, 189, 248, 0.85)',
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#94a3b8' : '#475569',
          font: { family: 'Outfit, Sarabun' }
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome & Quick Actions Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'var(--bg-glass-card)',
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src="/logo.png" 
            alt="ตราโรงเรียนสระหลวงพิทยาคม" 
            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
              โรงเรียนสระหลวงพิทยาคม
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
              ระบบยืมอุปกรณ์กีฬา 🏆
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '2px 0 0 0' }}>
              ติดตามการยืม-คืนพัสดุ สแกนรหัสอุปกรณ์ และจัดการระบบทวงถามอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setActiveTab('borrow')}>
            <ArrowUpRight size={18} />
            <span>เบิกอุปกรณ์</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('return')}>
            <ArrowDownLeft size={18} />
            <span>รับคืน</span>
          </button>
          <button className="btn btn-secondary" onClick={() => openScanner(null, 'สแกนตรวจอุปกรณ์')}>
            <Scan size={18} />
            <span>สแกนกล้อง</span>
          </button>
        </div>
      </div>

      {/* 📥 Pending Return Verifications for Teacher */}
      {pendingReturns.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #ffffff 100%)',
          border: '2px solid #f59e0b',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 8px 28px rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}>
                📥
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#92400e' }}>
                  มีนักเรียนแจ้งส่งคืนอุปกรณ์ ({pendingReturns.length} รายการ) • รอคุณครูตรวจสอบ
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#b45309', marginTop: '2px' }}>
                  ตรวจสอบสภาพอุปกรณ์ที่โต๊ะ แล้วกดยืนยันรับคืนเพื่อตัดสต็อกเข้าคลัง
                </div>
              </div>
            </div>

            <span style={{
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 800
            }}>
              🟡 รอการตรวจสอบ
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {pendingReturns.map(l => (
              <div
                key={l.id}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fcd34d',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{l.items?.[0]?.image || '⚽'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>{l.borrowerName}</div>
                    <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700 }}>{l.items?.[0]?.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>รหัส: {l.id}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    processReturn(l.id, {
                      condition: 'สมบูรณ์ (Good)',
                      notes: 'คุณครูตรวจสอบรับคืนผ่าน Dashboard',
                      receivedBy: 'คุณครูผู้ดูแล'
                    });
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>✓ ตรวจสอบแล้ว - ยืนยันรับคืน</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Counter Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card stat-emerald">
          <div className="stat-top">
            <span className="stat-label">อุปกรณ์พร้อมยืม</span>
            <div className="stat-icon">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-value">{availableItemsCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {totalItemsCount} ชิ้น</span></div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">กำลังถูกยืม</span>
            <div className="stat-icon">
              <Package size={20} />
            </div>
          </div>
          <div className="stat-value">{borrowedItemsCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>ชิ้น</span></div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-top">
            <span className="stat-label">รายการยืมที่ยังไม่คืน</span>
            <div className="stat-icon">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value">{activeLoans.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>รายการ</span></div>
        </div>

        <div className="stat-card stat-rose">
          <div className="stat-top">
            <span className="stat-label">เกินกำหนดส่ง (Overdue)</span>
            <div className="stat-icon">
              <AlertOctagon size={20} />
            </div>
          </div>
          <div className="stat-value">{overdueLoans.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>รายการ</span></div>
        </div>
      </div>

      {/* Overdue Urgent Alert Box (If any) */}
      {overdueLoans.length > 0 && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fb7185' }}>
                  แจ้งเตือนรายการอุปกรณ์เกินกำหนดส่ง ({overdueLoans.length} รายการ)
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  กรุณาติดตามทวงถามผู้ยืมเพื่อนำอุปกรณ์กลับคืนสู่คลัง
                </p>
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
              onClick={() => setActiveTab('tracking')}
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {overdueLoans.slice(0, 3).map(loan => {
              const status = getDueStatus(loan.dueDate, loan.status);
              return (
                <div 
                  key={loan.id} 
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{loan.borrowerName}</span>
                      <span className={`status-badge ${status.badgeClass}`}>{status.label}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {loan.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      โทร: {loan.borrowerPhone || '-'}
                    </span>
                    <button 
                      className="btn btn-danger" 
                      style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      onClick={() => {
                        setSelectedReminderLoan(loan);
                        setActiveTab('tracking');
                      }}
                    >
                      <Bell size={13} />
                      <span>ส่งข้อความทวง</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Doughnut Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#38bdf8" />
            <span>สัดส่วนสถานะอุปกรณ์ในคลัง</span>
          </h3>
          <div style={{ height: '220px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#10b981" />
            <span>หมวดหมู่อุปกรณ์ที่ถูกเบิกใช้งานสูงสุด</span>
          </h3>
          <div style={{ height: '220px', position: 'relative' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Loans Activity */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#38bdf8" />
            <span>ประวัติรายการยืม-คืนล่าสุด</span>
          </h3>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            onClick={() => setActiveTab('reports')}
          >
            ดูรายงานทั้งหมด
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px' }}>รหัสรายการ</th>
                <th style={{ padding: '10px 14px' }}>ผู้เบิกยืม</th>
                <th style={{ padding: '10px 14px' }}>รายการอุปกรณ์</th>
                <th style={{ padding: '10px 14px' }}>วันที่ยืม</th>
                <th style={{ padding: '10px 14px' }}>กำหนดคืน</th>
                <th style={{ padding: '10px 14px' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {loans.slice(0, 5).map(loan => {
                const status = getDueStatus(loan.dueDate, loan.status);
                return (
                  <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary-light)' }}>
                      {loan.id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{loan.borrowerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.borrowerDept || '-'}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {loan.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {formatDate(loan.borrowDate)}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {formatDate(loan.dueDate)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`status-badge ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
