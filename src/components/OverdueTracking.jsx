import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Search, 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  MessageSquare, 
  Phone, 
  Calendar,
  Filter
} from 'lucide-react';
import { formatDate, getDueStatus } from '../utils/formatters';

export default function OverdueTracking() {
  const { 
    loans, 
    setSelectedReminderLoan 
  } = useApp();

  const [filterType, setFilterType] = useState('overdue'); // 'all', 'overdue', 'due_today', 'active'
  const [searchTerm, setSearchTerm] = useState('');

  const activeOrOverdueLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');

  const filteredLoans = activeOrOverdueLoans.filter(loan => {
    const status = getDueStatus(loan.dueDate, loan.status);
    
    // Tab filter
    if (filterType === 'overdue' && !status.isOverdue) return false;
    if (filterType === 'due_today' && status.type !== 'due_today') return false;

    // Search filter
    const s = searchTerm.toLowerCase();
    const matchName = loan.borrowerName.toLowerCase().includes(s);
    const matchId = loan.id.toLowerCase().includes(s);
    const matchItem = loan.items.some(i => i.name.toLowerCase().includes(s));
    return matchName || matchId || matchItem;
  });

  const overdueCount = activeOrOverdueLoans.filter(l => getDueStatus(l.dueDate, l.status).isOverdue).length;
  const dueTodayCount = activeOrOverdueLoans.filter(l => getDueStatus(l.dueDate, l.status).type === 'due_today').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
            ศูนย์ติดตามและทวงคืนอุปกรณ์ (Reminder Hub) ⏰
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ตรวจสอบรายการเกินกำหนดส่ง สร้างข้อความทวงอัตโนมัติ ส่งต่อเข้า LINE / Email ในคลิกเดียว
          </p>
        </div>
      </div>

      {/* Quick Summary Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div 
          className="glass-card" 
          style={{ 
            cursor: 'pointer',
            borderColor: filterType === 'overdue' ? 'var(--accent-rose)' : 'var(--border-subtle)',
            background: filterType === 'overdue' ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-glass-card)'
          }}
          onClick={() => setFilterType('overdue')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fb7185' }}>เกินกำหนดส่งแล้ว (Overdue)</span>
            <AlertTriangle size={20} color="#fb7185" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb7185', marginTop: '8px' }}>
            {overdueCount} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>รายการ</span>
          </div>
        </div>

        <div 
          className="glass-card" 
          style={{ 
            cursor: 'pointer',
            borderColor: filterType === 'due_today' ? 'var(--accent-amber)' : 'var(--border-subtle)',
            background: filterType === 'due_today' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-glass-card)'
          }}
          onClick={() => setFilterType('due_today')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fbbf24' }}>ครบกำหนดส่งวันนี้</span>
            <Clock size={20} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
            {dueTodayCount} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>รายการ</span>
          </div>
        </div>

        <div 
          className="glass-card" 
          style={{ 
            cursor: 'pointer',
            borderColor: filterType === 'all' ? 'var(--brand-primary)' : 'var(--border-subtle)',
            background: filterType === 'all' ? 'rgba(2, 132, 199, 0.1)' : 'var(--bg-glass-card)'
          }}
          onClick={() => setFilterType('all')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--brand-primary-light)' }}>กำลังถูกยืมทั้งหมด</span>
            <Calendar size={20} color="var(--brand-primary-light)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-primary-light)', marginTop: '8px' }}>
            {activeOrOverdueLoans.length} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>รายการ</span>
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar-box" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่อผู้ยืม, รหัสรายการ, อุปกรณ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn ${filterType === 'overdue' ? 'btn-danger' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              onClick={() => setFilterType('overdue')}
            >
              เกินกำหนด ({overdueCount})
            </button>
            <button
              className={`btn ${filterType === 'due_today' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              onClick={() => setFilterType('due_today')}
            >
              ครบวันนี้ ({dueTodayCount})
            </button>
            <button
              className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              onClick={() => setFilterType('all')}
            >
              ทั้งหมด ({activeOrOverdueLoans.length})
            </button>
          </div>
        </div>

        {/* Overdue Items List */}
        {filteredLoans.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '50px 20px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)'
          }}>
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontWeight: 600 }}>ไม่พบรายการที่ต้องติดตามในหมวดนี้</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ไม่มีรายการที่เกินกำหนดหรือครบกำหนดในเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredLoans.map(loan => {
              const status = getDueStatus(loan.dueDate, loan.status);
              return (
                <div
                  key={loan.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: status.isOverdue ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: status.isOverdue ? '0 4px 16px rgba(244, 63, 94, 0.1)' : 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--brand-primary-light)' }}>
                          {loan.id}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{loan.borrowerName}</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {loan.borrowerDept || '-'}
                        </p>
                      </div>
                      <span className={`status-badge ${status.badgeClass}`}>{status.label}</span>
                    </div>

                    {/* Borrowed Items */}
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '10px'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>อุปกรณ์ที่ยืม:</div>
                      {loan.items.map(item => (
                        <div key={item.equipmentId} style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                          {item.image} {item.name} (x{item.qty})
                        </div>
                      ))}
                    </div>

                    {/* Dates & Contact */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div>ยืมเมื่อ: <strong>{formatDate(loan.borrowDate)}</strong></div>
                      <div>กำหนดคืน: <strong style={{ color: status.isOverdue ? 'var(--accent-rose)' : 'inherit' }}>{formatDate(loan.dueDate)}</strong></div>
                      <div>โทร: <strong>{loan.borrowerPhone || '-'}</strong></div>
                      <div>LINE: <strong>{loan.borrowerLine ? `@${loan.borrowerLine}` : '-'}</strong></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      className="btn btn-danger"
                      style={{ flex: 1, fontSize: '0.82rem', padding: '9px 12px' }}
                      onClick={() => setSelectedReminderLoan(loan)}
                    >
                      <Bell size={15} />
                      <span>ส่งข้อความทวง ({loan.followupCount || 0})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
