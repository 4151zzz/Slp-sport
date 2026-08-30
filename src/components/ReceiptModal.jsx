import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Printer, CheckCircle, Download } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import html2canvas from 'html2canvas';
import { downloadCanvasImage } from '../utils/fileDownloader';

export default function ReceiptModal() {
  const { receiptLoan, setReceiptLoan, showToast } = useApp();
  const receiptPaperRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!receiptLoan) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceiptPNG = async () => {
    if (!receiptPaperRef.current || downloading) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(receiptPaperRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const cleanBorrower = (receiptLoan.borrowerName || 'borrower').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Receipt_${receiptLoan.id}_${cleanBorrower}.png`;
      downloadCanvasImage(canvas, fileName);

      setDownloading(false);
      showToast('ดาวน์โหลดใบเสร็จ (PNG) เรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error('Download receipt error:', err);
      showToast('เกิดข้อผิดพลาดในการดาวน์โหลดใบเสร็จ', 'error');
      setDownloading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setReceiptLoan(null)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header no-print">
          <div className="modal-title">
            <CheckCircle size={20} color="#10b981" />
            <span>ใบยืมพัสดุอุปกรณ์กีฬา (Borrow Slip)</span>
          </div>
          <button className="modal-close-btn" onClick={() => setReceiptLoan(null)}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          ref={receiptPaperRef}
          style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontFamily: 'Sarabun, Outfit, sans-serif'
          }}
        >
          {/* Slip Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '14px' }}>
            <img 
              src="/logo.png" 
              alt="ตราโรงเรียนสระหลวงพิทยาคม" 
              style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto 8px auto', display: 'block' }} 
            />
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              โรงเรียนสระหลวงพิทยาคม
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>
              ใบยืมอุปกรณ์กีฬา (Borrow Slip)
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>Sports Equipment Loan Receipt</p>
            <div style={{ 
              display: 'inline-block', 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              color: '#0284c7', 
              background: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              padding: '3px 10px', 
              borderRadius: '6px', 
              marginTop: '6px' 
            }}>
              รหัสรายการ: {receiptLoan.id}
            </div>
          </div>

          {/* Slip Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>ผู้เบิกยืม:</span>
              <strong>{receiptLoan.borrowerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>สังกัด / ชั้นเรียน:</span>
              <span>{receiptLoan.borrowerDept || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>เบอร์โทร:</span>
              <span>{receiptLoan.borrowerPhone || receiptLoan.phone || '-'}</span>
            </div>
            {(receiptLoan.borrowerLineId || receiptLoan.lineId) && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>ID Line:</span>
                <span>{receiptLoan.borrowerLineId || receiptLoan.lineId}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>วันที่ยืม:</span>
              <span>{formatDate(receiptLoan.borrowDate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>กำหนดส่งคืน:</span>
              <strong style={{ color: '#dc2626' }}>{formatDate(receiptLoan.dueDate)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>วัตถุประสงค์:</span>
              <span>{receiptLoan.purpose || '-'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              รายการอุปกรณ์ที่ยืม
            </div>
            {receiptLoan.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '3px 0' }}>
                <span>{item.image} {item.name}</span>
                <strong>x{item.qty}</strong>
              </div>
            ))}
          </div>

          {/* Signature Preview */}
          {receiptLoan.signature && (
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>ลายมือชื่อผู้เบิกยืม</div>
              <img
                src={receiptLoan.signature}
                alt="Signature"
                style={{ maxHeight: '42px', margin: '0 auto', display: 'block' }}
              />
              <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '2px' }}>
                ({receiptLoan.borrowerName})
              </div>
            </div>
          )}

          {/* Barcode & Verification */}
          <div style={{ textAlign: 'center', paddingTop: '4px' }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              letterSpacing: '4px',
              padding: '6px 12px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '6px',
              display: 'inline-block',
              fontWeight: 800
            }}>
              *{receiptLoan.id}*
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '6px 0 0 0' }}>
              โปรดนำอุปกรณ์มาส่งคืนให้ตรงเวลา • พัฒนาโดย wunPiyapong
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="modal-footer no-print" style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleDownloadReceiptPNG}
            disabled={downloading}
          >
            <Download size={18} />
            <span>{downloading ? 'กำลังบันทึกภาพ...' : 'บันทึกรูปภาพ (PNG)'}</span>
          </button>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            <span>พิมพ์</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setReceiptLoan(null)}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
