import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Send, 
  Mail, 
  Copy, 
  Check, 
  Phone, 
  MessageCircle, 
  Clock, 
  User, 
  Calendar, 
  History, 
  Plus 
} from 'lucide-react';
import { formatDate, getDueStatus } from '../utils/formatters';

export default function ReminderModal() {
  const { 
    selectedReminderLoan, 
    setSelectedReminderLoan, 
    followups, 
    addFollowup, 
    showToast,
    borrowers 
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [contactMethod, setContactMethod] = useState('LINE');
  const [contactStatus, setContactStatus] = useState('แจ้งเตือนแล้ว - รอผู้ยืมตอบรับ');

  if (!selectedReminderLoan) return null;

  const loan = selectedReminderLoan;
  const statusInfo = getDueStatus(loan.dueDate, loan.status);
  const borrower = borrowers.find(b => b.id === loan.borrowerId);

  // Generate Message Template
  const itemsText = loan.items.map(i => `• ${i.name} (จำนวน ${i.qty} ชิ้น)`).join('\n');
  const reminderMessage = statusInfo.isOverdue 
    ? `📢 [แจ้งเตือนการคืนอุปกรณ์กีฬา - เกินกำหนดส่ง]\n\n` +
      `เรียนคุณ ${loan.borrowerName}\n` +
      `ตามที่ท่านได้ทำรายการเบิกอุปกรณ์กีฬา (รหัส ${loan.id}) เมื่อวันที่ ${formatDate(loan.borrowDate)}\n\n` +
      `📋 รายการอุปกรณ์:\n${itemsText}\n\n` +
      `⏰ กำหนดส่งคืน: ${formatDate(loan.dueDate)}\n` +
      `⚠️ สถานะ: เกินกำหนดส่งแล้ว ${statusInfo.overdueDays} วัน\n\n` +
      `ขอความกรุณานำอุปกรณ์ดังกล่าวมาส่งคืน ณ ห้องพัสดุและอุปกรณ์กีฬา อาคารศูนย์กีฬา เพื่อให้อาจารย์และเพื่อนนักศึกษาท่านอื่นสามารถเบิกใช้งานต่อไปได้ครับ\n\n` +
      `หากติดขัดประการใดสามารถติดต่อประสานงานห้องอุปกรณ์กีฬา โทร. 02-xxx-xxxx`
    : `🔔 [แจ้งเตือนกำหนดคืนอุปกรณ์กีฬา]\n\n` +
      `เรียนคุณ ${loan.borrowerName}\n` +
      `ขอแจ้งเตือนรายการเบิกอุปกรณ์กีฬา (รหัส ${loan.id}) ซึ่งจะครบกำหนดคืนในวันที่ ${formatDate(loan.dueDate)}\n\n` +
      `📋 รายการอุปกรณ์:\n${itemsText}\n\n` +
      `โปรดเตรียมนำส่งคืนตามกำหนดเวลา ขอบคุณครับ`;

  // Actions
  const handleCopy = () => {
    navigator.clipboard.writeText(reminderMessage).then(() => {
      setCopied(true);
      showToast('คัดลอกข้อความทวงคืนลงคลิปบอร์ดแล้ว', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareLine = () => {
    const encoded = encodeURIComponent(reminderMessage);
    window.open(`https://line.me/R/msg/text/?${encoded}`, '_blank');
    addFollowup({
      loanId: loan.id,
      borrowerName: loan.borrowerName,
      contactMethod: 'LINE',
      contactDetail: loan.borrowerLine || '-',
      operator: 'เจ้าหน้าที่พัสดุ',
      status: 'ส่งข้อความเตือนผ่าน LINE แล้ว',
      notes: 'เปิดส่งข้อความทวงถามทาง LINE'
    });
  };

  const handleShareEmail = () => {
    const email = borrower?.email || '';
    const subject = encodeURIComponent(`[แจ้งเตือน] ขอให้นำส่งคืนอุปกรณ์กีฬา รหัสรายการ ${loan.id}`);
    const body = encodeURIComponent(reminderMessage);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    addFollowup({
      loanId: loan.id,
      borrowerName: loan.borrowerName,
      contactMethod: 'Email',
      contactDetail: email || '-',
      operator: 'เจ้าหน้าที่พัสดุ',
      status: 'ส่งอีเมลแจ้งเตือนแล้ว',
      notes: `ส่งอีเมลแจ้งเตือนไปยัง ${email}`
    });
  };

  const handleSaveManualFollowup = (e) => {
    e.preventDefault();
    if (!customNote.trim()) {
      showToast('กรุณาระบุรายละเอียดหรือผลการติดต่อ', 'warning');
      return;
    }

    addFollowup({
      loanId: loan.id,
      borrowerName: loan.borrowerName,
      contactMethod,
      contactDetail: contactMethod === 'LINE' ? (loan.borrowerLine || '-') : (loan.borrowerPhone || '-'),
      operator: 'เจ้าหน้าที่พัสดุ',
      status: contactStatus,
      notes: customNote.trim()
    });

    setCustomNote('');
  };

  const loanFollowups = followups.filter(f => f.loanId === loan.id);

  return (
    <div className="modal-backdrop" onClick={() => setSelectedReminderLoan(null)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Send size={20} color="#fb7185" />
            <span>ศูนย์ติดตามและส่งข้อความทวงคืน</span>
          </div>
          <button className="modal-close-btn" onClick={() => setSelectedReminderLoan(null)}>
            <X size={20} />
          </button>
        </div>

        {/* Borrower & Loan Info Card */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{loan.borrowerName}</div>
            <span className={`status-badge ${statusInfo.badgeClass}`}>{statusInfo.label}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div>สังกัด: <strong>{loan.borrowerDept || '-'}</strong></div>
            <div>โทร: <strong>{loan.borrowerPhone || '-'}</strong></div>
            <div>LINE: <strong>{loan.borrowerLine ? `@${loan.borrowerLine}` : '-'}</strong></div>
            <div>กำหนดส่ง: <strong>{formatDate(loan.dueDate)}</strong></div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
            รายการ: {loan.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
          </div>
        </div>

        {/* Generated Message Box */}
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>ข้อความแจ้งเตือนอัตโนมัติ (พร้อมส่ง)</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Template มาตรฐานสุภาพ</span>
          </label>
          <textarea
            className="form-textarea"
            rows={7}
            value={reminderMessage}
            readOnly
            style={{ fontSize: '0.84rem', lineHeight: '1.4', background: 'var(--bg-surface)' }}
          />
        </div>

        {/* Quick Send Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={handleShareLine} style={{ fontSize: '0.85rem', padding: '10px' }}>
            <MessageCircle size={16} />
            <span>ส่งเข้า LINE</span>
          </button>
          <button className="btn btn-secondary" onClick={handleShareEmail} style={{ fontSize: '0.85rem', padding: '10px' }}>
            <Mail size={16} />
            <span>ส่ง Email</span>
          </button>
          <button className="btn btn-secondary" onClick={handleCopy} style={{ fontSize: '0.85rem', padding: '10px' }}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
          </button>
        </div>

        {/* Manual Follow-up Logger */}
        <form onSubmit={handleSaveManualFollowup} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} color="#38bdf8" />
            <span>บันทึกผลการติดตาม / การทวงถาม</span>
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <select
              className="form-select"
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
            >
              <option value="LINE">LINE</option>
              <option value="โทรศัพท์">โทรศัพท์ (Phone Call)</option>
              <option value="Email">Email</option>
              <option value="พบตัวจริง">พบตัวจริงที่คณะ/สนาม</option>
            </select>

            <select
              className="form-select"
              value={contactStatus}
              onChange={(e) => setContactStatus(e.target.value)}
            >
              <option value="แจ้งเตือนแล้ว - รอผู้ยืมตอบรับ">แจ้งเตือนแล้ว - รอผู้ยืมตอบรับ</option>
              <option value="ผู้ยืมรับทราบ - นัดวันคืนใหม่">ผู้ยืมรับทราบ - นัดวันคืนใหม่</option>
              <option value="ไม่สามารถติดต่อได้">ไม่สามารถติดต่อได้</option>
              <option value="แจ้งเตือนครั้งสุดท้าย">แจ้งเตือนครั้งสุดท้าย</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="บันทึกรายละเอียด เช่น ผู้ยืมแจ้งว่าจะนำมาคืนช่วงบ่าย 14:00..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0, padding: '0 16px' }}>
              บันทึก
            </button>
          </div>
        </form>

        {/* Follow-up Timeline History */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={16} color="#94a3b8" />
            <span>ประวัติการติดตามทวงถาม ({loanFollowups.length} ครั้ง)</span>
          </h4>

          {loanFollowups.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
              ยังไม่มีบันทึกประวัติการทวงถามสำหรับรายการนี้
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {loanFollowups.map(f => (
                <div
                  key={f.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>
                      [{f.contactMethod}] {f.status}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatDate(f.timestamp)}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{f.notes}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
