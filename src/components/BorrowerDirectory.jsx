import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X, 
  Check, 
  BookOpen, 
  Trash2, 
  UserPlus 
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function BorrowerDirectory() {
  const { 
    borrowers, 
    loans, 
    addBorrower, 
    deleteBorrower, 
    clearAllBorrowers, 
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);

  // Add Borrower Form State
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    type: 'นักศึกษา (Student)',
    department: 'คณะวิทยาศาสตร์การกีฬา',
    phone: '',
    email: '',
    lineId: ''
  });

  const filteredBorrowers = borrowers.filter(b => {
    const s = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(s) ||
           (b.studentId && b.studentId.toLowerCase().includes(s)) ||
           (b.department && b.department.toLowerCase().includes(s)) ||
           (b.phone && b.phone.includes(s));
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('กรุณากรอกชื่อและเบอร์โทรศัพท์', 'warning');
      return;
    }

    addBorrower(formData);
    setModalOpen(false);
    setFormData({
      name: '',
      studentId: '',
      type: 'นักศึกษา (Student)',
      department: 'คณะวิทยาศาสตร์การกีฬา',
      phone: '',
      email: '',
      lineId: ''
    });
  };

  const handleDeleteBorrower = (id, name) => {
    if (window.confirm(`คุณต้องการลบข้อมูลผู้ยืม "${name}" ออกจากระบบใช่หรือไม่?`)) {
      deleteBorrower(id);
    }
  };

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
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '4px' }}>
            ทะเบียนประวัติผู้เบิกยืมพัสดุ 👥
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            จัดการรายชื่อผู้ยืมจริง (นักศึกษา บุคลากร ชมรม) พร้อมตรวจสอบประวัติการเบิก-คืน
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          <span>เพิ่มข้อมูลผู้ยืมใหม่</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-bar-box" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่อผู้ยืม, รหัสนักศึกษา, คณะ, เบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ผู้ยืมทั้งหมด: <strong>{borrowers.length}</strong> คน
          </div>
        </div>

        {/* Empty State when 0 borrowers */}
        {borrowers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px dashed var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
                ยังไม่มีข้อมูลผู้ยืมในระบบ (พร้อมใช้งานจริง)
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
                สามารถกดปุ่ม "ลงทะเบียนผู้ยืมใหม่" ด้านล่าง หรือเพิ่มผู้ยืมใหม่ขณะทำรายการเบิกอุปกรณ์ได้ทันที
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ marginTop: '8px' }}>
              <Plus size={18} />
              <span>ลงทะเบียนผู้ยืมคนแรก</span>
            </button>
          </div>
        ) : filteredBorrowers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            ไม่พบรายชื่อผู้ยืมที่ตรงกับคำค้นหา "{searchTerm}"
          </div>
        ) : (
          /* Borrower Cards Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredBorrowers.map(borrower => {
              const borrowerLoans = loans.filter(l => l.borrowerId === borrower.id);
              const activeCount = borrowerLoans.filter(l => l.status === 'active' || l.status === 'overdue').length;
              const overdueCount = borrowerLoans.filter(l => l.status === 'overdue').length;

              return (
                <div
                  key={borrower.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: overdueCount > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{
                        fontSize: '2rem',
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {borrower.avatar || '👨‍🎓'}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{borrower.name}</h3>
                          {overdueCount > 0 && (
                            <span className="status-badge badge-danger" style={{ fontSize: '0.65rem' }}>
                              ติดค้างส่ง
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {borrower.studentId ? `รหัส: ${borrower.studentId}` : borrower.id} • {borrower.type}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      สังกัด: <strong>{borrower.department || '-'}</strong>
                    </div>

                    {/* Contact pills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} color="var(--brand-primary-light)" />
                        <span>{borrower.phone || '-'}</span>
                      </div>
                      {borrower.lineId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MessageCircle size={13} color="#10b981" />
                          <span>LINE: @{borrower.lineId}</span>
                        </div>
                      )}
                      {borrower.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} color="#a78bfa" />
                          <span>{borrower.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats & History Action */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span>ยืมทั้งหมด: <strong>{borrowerLoans.length}</strong></span>
                      <span>กำลังยืม: <strong style={{ color: activeCount > 0 ? 'var(--brand-primary-light)' : 'inherit' }}>{activeCount}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                        onClick={() => setSelectedBorrower(borrower)}
                      >
                        <BookOpen size={13} />
                        <span>ดูประวัติ</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-icon-only"
                        style={{ padding: '5px 8px', color: 'var(--accent-rose)' }}
                        onClick={() => handleDeleteBorrower(borrower.id, borrower.name)}
                        title="ลบผู้ยืม"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Borrower Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Users size={20} color="#38bdf8" />
                <span>ลงทะเบียนผู้ยืมพัสดุใหม่</span>
              </div>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ชื่อ-นามสกุล ผู้ยืม *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">ประเภทผู้ใช้งาน</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="นักศึกษา (Student)">นักศึกษา (Student)</option>
                    <option value="อาจารย์ / บุคลากร (Staff)">อาจารย์ / บุคลากร (Staff)</option>
                    <option value="ชมรมกีฬา / สโมสร">ชมรมกีฬา / สโมสร</option>
                    <option value="บุคคลภายนอก">บุคคลภายนอก</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">รหัสนักศึกษา / Staff ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น 66012345"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">คณะ / ภาควิชา / สังกัด</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น คณะวิทยาศาสตร์การกีฬา"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">เบอร์โทรศัพท์ *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น 081-234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">LINE ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น somchai_sport"
                    value={formData.lineId}
                    onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">อีเมล</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@university.ac.th"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '8px' }}>
                <Check size={18} />
                <span>บันทึกข้อมูลผู้ยืม</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Borrower Loan History Modal */}
      {selectedBorrower && (
        <div className="modal-backdrop" onClick={() => setSelectedBorrower(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <BookOpen size={20} color="#38bdf8" />
                <span>ประวัติการยืม-คืน: {selectedBorrower.name}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedBorrower(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loans.filter(l => l.borrowerId === selectedBorrower.id).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  ยังไม่มีประวัติการทำรายการเบิกอุปกรณ์
                </div>
              ) : (
                loans.filter(l => l.borrowerId === selectedBorrower.id).map(loan => (
                  <div
                    key={loan.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>{loan.id}</span>
                      <span className={`status-badge ${loan.status === 'returned' ? 'badge-success' : (loan.status === 'overdue' ? 'badge-danger' : 'badge-primary')}`}>
                        {loan.status === 'returned' ? 'คืนแล้ว' : (loan.status === 'overdue' ? 'เกินกำหนด' : 'กำลังยืม')}
                      </span>
                    </div>

                    <div style={{ marginBottom: '6px' }}>
                      {loan.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      <span>ยืม: {formatDate(loan.borrowDate)}</span>
                      <span>กำหนดคืน: {formatDate(loan.dueDate)}</span>
                      {loan.returnDate && <span>คืนเมื่อ: {formatDate(loan.returnDate)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
