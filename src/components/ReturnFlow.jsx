import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Scan, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  User, 
  Calendar, 
  FileCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { formatDate, getDueStatus } from '../utils/formatters';
import confetti from 'canvas-confetti';

export default function ReturnFlow() {
  const { 
    loans, 
    processReturn, 
    openScanner, 
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Return inspection state
  const [condition, setCondition] = useState('สมบูรณ์ (Good)');
  const [notes, setNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState('เจ้าหน้าที่ห้องพัสดุ');

  // Filter only active or overdue loans
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');

  const filteredLoans = activeLoans.filter(l => {
    const s = searchTerm.toLowerCase();
    const matchesName = l.borrowerName.toLowerCase().includes(s);
    const matchesId = l.id.toLowerCase().includes(s);
    const matchesItem = l.items.some(i => i.name.toLowerCase().includes(s) || i.code.toLowerCase().includes(s));
    return matchesName || matchesId || matchesItem;
  });

  const handleScanToReturn = () => {
    openScanner((scannedCode) => {
      // Find matching loan by item code or loan id
      const matched = activeLoans.find(l => 
        l.id.toLowerCase() === scannedCode.toLowerCase() ||
        l.items.some(i => i.code.toLowerCase() === scannedCode.toLowerCase() || i.equipmentId.toLowerCase() === scannedCode.toLowerCase())
      );

      if (matched) {
        setSelectedLoan(matched);
        showToast(`พบรายการยืม: ${matched.borrowerName} (${matched.id})`, 'success');
      } else {
        showToast(`ไม่พบรายการที่ยังไม่คืน สำหรับรหัส: ${scannedCode}`, 'warning');
      }
    }, 'สแกน Barcode/QR เพื่อรับคืน');
  };

  const handleConfirmReturn = (e) => {
    e.preventDefault();
    if (!selectedLoan) {
      showToast('กรุณาเลือกรายการที่ต้องการรับคืน', 'warning');
      return;
    }

    const success = processReturn(selectedLoan.id, {
      condition,
      notes,
      receivedBy
    });

    if (success) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
      setSelectedLoan(null);
      setNotes('');
      setCondition('สมบูรณ์ (Good)');
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
            ตรวจรับคืนอุปกรณ์กีฬา 📥
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            สแกนบาร์โค้ด ตรวจสอบสภาพอุปกรณ์ และบันทึกรับคืนเข้าสู่สต็อก
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleScanToReturn}>
          <Scan size={18} />
          <span>สแกนกล้องเพื่อรับคืน</span>
        </button>
      </div>

      {/* Grid: Active Loans List & Return Inspection Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* LEFT: Active Loans List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              รายการที่กำลังยืมอยู่ ({activeLoans.length} รายการ)
            </h2>
          </div>

          <div className="search-bar-box">
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่อผู้ยืม, รหัสรายการ, ชื่ออุปกรณ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredLoans.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)'
            }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontWeight: 600 }}>ไม่มีรายการอุปกรณ์ที่ค้างคืน</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>อุปกรณ์ทั้งหมดถูกส่งคืนครบถ้วน</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto' }}>
              {filteredLoans.map(loan => {
                const status = getDueStatus(loan.dueDate, loan.status);
                const isSelected = selectedLoan?.id === loan.id;

                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan)}
                    style={{
                      padding: '14px',
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--brand-primary-light)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'var(--brand-glow)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{loan.borrowerName}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{loan.borrowerDept || '-'}</div>
                      </div>
                      <span className={`status-badge ${status.badgeClass}`}>{status.label}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {loan.items.map(i => (
                        <span key={i.equipmentId} style={{ display: 'inline-block', marginRight: '8px' }}>
                          {i.image} {i.name} (x{i.qty})
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                      <span>รหัส: {loan.id}</span>
                      <span>กำหนดคืน: {formatDate(loan.dueDate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Return Inspection & Submit */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <FileCheck size={20} color="#10b981" />
            <span>ตรวจรับคืนอุปกรณ์</span>
          </h2>

          {!selectedLoan ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <RotateCcw size={40} color="var(--text-muted)" />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>กรุณาเลือกรายการที่ต้องการรับคืน</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  คลิกเลือกรายการทางซ้ายมือ หรือกดปุ่ม "สแกนกล้องเพื่อรับคืน"
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmReturn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Selected Loan Summary Box */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {selectedLoan.id}
                  </span>
                  <span className={`status-badge ${getDueStatus(selectedLoan.dueDate, selectedLoan.status).badgeClass}`}>
                    {getDueStatus(selectedLoan.dueDate, selectedLoan.status).label}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedLoan.borrowerName}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {selectedLoan.borrowerDept} • โทร: {selectedLoan.borrowerPhone || '-'}
                  </p>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>อุปกรณ์ที่ต้องรับคืน:</div>
                  {selectedLoan.items.map(item => (
                    <div key={item.equipmentId} style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {item.image} {item.name} — <strong>จำนวน {item.qty} ชิ้น</strong>
                    </div>
                  ))}
                </div>

                {selectedLoan.signature && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ลายเซ็นตอนยืม:</span>
                    <img src={selectedLoan.signature} alt="Signature" style={{ height: '28px', background: '#fff', padding: '2px 6px', borderRadius: '4px' }} />
                  </div>
                )}
              </div>

              {/* Condition Assessment */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ประเมินสภาพอุปกรณ์ก่อนรับคืน *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn ${condition === 'สมบูรณ์ (Good)' ? 'btn-success' : 'btn-secondary'}`}
                    style={{ fontSize: '0.82rem', padding: '10px 6px' }}
                    onClick={() => setCondition('สมบูรณ์ (Good)')}
                  >
                    ✅ สมบูรณ์
                  </button>
                  <button
                    type="button"
                    className={`btn ${condition === 'ชำรุด (Damaged)' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ fontSize: '0.82rem', padding: '10px 6px' }}
                    onClick={() => setCondition('ชำรุด (Damaged)')}
                  >
                    ⚠️ ชำรุด
                  </button>
                  <button
                    type="button"
                    className={`btn ${condition === 'สูญหาย (Lost)' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ fontSize: '0.82rem', padding: '10px 6px' }}
                    onClick={() => setCondition('สูญหาย (Lost)')}
                  >
                    ❌ สูญหาย
                  </button>
                </div>
              </div>

              {/* Condition Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">หมายเหตุการรับคืน / รายละเอียดความชำรุด (ถ้ามี)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="เช่น อุปกรณ์สภาพปกติ ไม่มีรอยแตกหัก, หรือ หนังปริเล็กน้อย..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Receiver Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">เจ้าหน้าที่ผู้ตรวจรับ</label>
                <input
                  type="text"
                  className="form-input"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-success"
                style={{ padding: '14px', fontSize: '1rem', marginTop: '8px' }}
              >
                <CheckCircle size={20} />
                <span>ยืนยันตรวจรับคืนเข้าสต็อก</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
