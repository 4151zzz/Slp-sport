import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RotateCcw, 
  History, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  ShieldCheck 
} from 'lucide-react';
import { exportLoansReport, exportInventoryReport } from '../utils/csvExport';
import { formatDate } from '../utils/formatters';

export default function Reports() {
  const { 
    loans, 
    equipment, 
    resetDatabase, 
    exportDatabase, 
    importDatabase, 
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const filteredLoans = loans.filter(l => {
    const s = searchTerm.toLowerCase();
    return l.borrowerName.toLowerCase().includes(s) ||
           l.id.toLowerCase().includes(s) ||
           (l.borrowerDept && l.borrowerDept.toLowerCase().includes(s)) ||
           l.items.some(i => i.name.toLowerCase().includes(s));
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        importDatabase(content);
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    if (window.confirm('คำเตือน: คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นใช่หรือไม่? (ข้อมูลที่เพิ่มเองจะถูกลบ)')) {
      resetDatabase();
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
            รายงานและสำรองข้อมูลระบบ 📊
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ส่งออกไฟล์ Excel/CSV, บันทึกสำรองข้อมูล JSON และตรวจสอบประวัติรายการทั้งหมด
          </p>
        </div>
      </div>

      {/* Export & Data Tools Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* CSV Export 1 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <FileSpreadsheet size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>ส่งออกประวัติการยืม-คืน (CSV)</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ดาวน์โหลดรายงานประวัติการเบิกคืนทั้งหมด รองรับภาษาไทยเปิดใน Excel ได้ทันที
            </p>
          </div>
          <button className="btn btn-success" style={{ width: '100%' }} onClick={() => exportLoansReport(loans)}>
            <Download size={16} />
            <span>Export รายการเบิก-คืน</span>
          </button>
        </div>

        {/* CSV Export 2 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8' }}>
                <FileSpreadsheet size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>ส่งออกสต็อกอุปกรณ์ (CSV)</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ดาวน์โหลดรายการพัสดุและอุปกรณ์กีฬา จำนวนคงเหลือ มูลค่า และจุดจัดเก็บ
            </p>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => exportInventoryReport(equipment)}>
            <Download size={16} />
            <span>Export คลังอุปกรณ์</span>
          </button>
        </div>

        {/* JSON Backup & Restore */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>สำรอง & นำเข้าข้อมูล (JSON)</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Backup ข้อมูลระบบทั้งหมดไปเก็บไว้ หรือนำเข้าไฟล์ JSON เพื่อย้ายเครื่อง
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={exportDatabase}>
              <Download size={14} />
              <span>Backup</span>
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} />
              <span>Restore</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" style={{ display: 'none' }} />
          </div>
        </div>

        {/* Reset Database */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                <RotateCcw size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>รีเซ็ตข้อมูลตัวอย่าง</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              คืนค่าฐานข้อมูลกลับสู่ชุดข้อมูลตัวอย่างเริ่มต้น (Seed Data)
            </p>
          </div>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleResetConfirm}>
            <RotateCcw size={16} />
            <span>รีเซ็ตเป็นค่าเริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* Complete Audit History Table */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="#38bdf8" />
            <span>ประวัติรายการเบิก-คืนทั้งหมด ({loans.length} รายการ)</span>
          </h2>

          <div className="search-bar-box" style={{ maxWidth: '320px' }}>
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
              placeholder="ค้นหาประวัติ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>รหัสรายการ</th>
                <th style={{ padding: '10px' }}>ผู้ยืม & สังกัด</th>
                <th style={{ padding: '10px' }}>รายการอุปกรณ์</th>
                <th style={{ padding: '10px' }}>วันที่ยืม</th>
                <th style={{ padding: '10px' }}>กำหนดคืน</th>
                <th style={{ padding: '10px' }}>สถานะ & วันที่คืน</th>
                <th style={{ padding: '10px' }}>สภาพตอนคืน</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map(loan => (
                <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary-light)' }}>
                    {loan.id}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 600 }}>{loan.borrowerName}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{loan.borrowerDept || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {loan.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                    {formatDate(loan.borrowDate)}
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                    {formatDate(loan.dueDate)}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {loan.status === 'returned' ? (
                      <div>
                        <span className="status-badge badge-success" style={{ fontSize: '0.7rem' }}>คืนแล้ว</span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {formatDate(loan.returnDate)}
                        </div>
                      </div>
                    ) : loan.status === 'overdue' ? (
                      <span className="status-badge badge-danger" style={{ fontSize: '0.7rem' }}>เกินกำหนด</span>
                    ) : (
                      <span className="status-badge badge-primary" style={{ fontSize: '0.7rem' }}>กำลังยืม</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {loan.returnCondition || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
