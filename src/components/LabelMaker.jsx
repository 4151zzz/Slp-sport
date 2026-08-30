import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Printer, 
  Download, 
  QrCode, 
  Barcode as BarcodeIcon, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Image, 
  Sliders, 
  Check, 
  Eye 
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { downloadCanvasImage, copyCanvasToClipboard } from '../utils/fileDownloader';
import { downloadStickerDirect } from '../utils/stickerGenerator';

// Single Tag Component with Download button
function TagCard({ item, tagSize, tagTheme, showBarcode, showQr, showLocation, showToast: propShowToast, onOpenPreview }) {
  const app = useApp();
  const showToast = propShowToast || app?.showToast;
  const cardRef = useRef(null);
  const barcodeRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Render Barcode
    if (showBarcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, item.code || item.id, {
          format: 'CODE128',
          width: tagSize === 'small' ? 1.4 : (tagSize === 'large' ? 1.9 : 1.6),
          height: tagSize === 'small' ? 28 : (tagSize === 'large' ? 44 : 34),
          displayValue: true,
          fontSize: tagSize === 'small' ? 10 : 12,
          font: 'Outfit, Sarabun, sans-serif',
          margin: 2,
          background: tagTheme === 'dark' ? '#1e293b' : '#ffffff',
          lineColor: tagTheme === 'dark' ? '#f8fafc' : '#0f172a'
        });
      } catch (e) {
        console.warn('JsBarcode render error', e);
      }
    }

    // Render QR Code
    if (showQr && qrCanvasRef.current) {
      const qrSize = tagSize === 'small' ? 60 : (tagSize === 'large' ? 95 : 75);
      QRCode.toCanvas(qrCanvasRef.current, item.code || item.id, {
        width: qrSize,
        margin: 1,
        color: {
          dark: tagTheme === 'dark' ? '#f8fafc' : '#0f172a',
          light: tagTheme === 'dark' ? '#1e293b' : '#ffffff'
        }
      }).catch(err => console.warn('QR render error', err));
    }
  }, [item, tagSize, tagTheme, showBarcode, showQr]);

  const handleDownloadThisTag = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);

    try {
      const res = await downloadStickerDirect(item, {
        tagSize,
        tagTheme,
        showBarcode,
        showQr,
        showLocation
      });

      setDownloading(false);
      const safeCode = (item.code || item.id || 'EQUIP').replace(/[^a-zA-Z0-9_-]/g, '_');
      if (res && res.success) {
        if (showToast) showToast(`ดาวน์โหลดสติกเกอร์ Sticker_${safeCode}.png เรียบร้อยแล้ว`, 'success');
        if (onOpenPreview) {
          onOpenPreview({
            item,
            dataUrl: res.dataUrl,
            filename: res.filename,
            canvas: res.canvas
          });
        }
      } else {
        if (showToast) showToast('เกิดข้อผิดพลาดในการดาวน์โหลดสติกเกอร์', 'error');
      }
    } catch (err) {
      console.error('Download sticker error:', err);
      if (showToast) showToast('เกิดข้อผิดพลาดในการดาวน์โหลดสติกเกอร์', 'error');
      setDownloading(false);
    }
  };

  const getCardStyle = () => {
    let padding = tagSize === 'small' ? '10px' : (tagSize === 'large' ? '18px' : '14px');
    let width = tagSize === 'small' ? '250px' : (tagSize === 'large' ? '340px' : '290px');
    
    let bg = '#ffffff';
    let text = '#0f172a';
    let border = '1.5px dashed #cbd5e1';

    if (tagTheme === 'cyan') {
      bg = '#f0fdfa';
      border = '1.5px solid #0d9488';
    } else if (tagTheme === 'dark') {
      bg = '#1e293b';
      text = '#f8fafc';
      border = '1.5px solid #38bdf8';
    }

    return {
      background: bg,
      color: text,
      border: border,
      borderRadius: '12px',
      padding: padding,
      width: '100%',
      maxWidth: width,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      position: 'relative',
      boxSizing: 'border-box'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {/* The Printable Tag Element */}
      <div ref={cardRef} style={getCardStyle()} className="label-tag-card">
        {/* Badge header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: tagTheme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
          paddingBottom: '4px',
          width: '100%'
        }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: tagTheme === 'cyan' ? '#0d9488' : '#0284c7'
          }}>
            SPORTEQUIP INVENTORY
          </span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: tagTheme === 'dark' ? '#94a3b8' : '#64748b',
            fontFamily: 'monospace'
          }}>
            {item.id}
          </span>
        </div>

        {/* Center: QR + Item Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          {showQr && (
            <canvas
              ref={qrCanvasRef}
              style={{
                borderRadius: '6px',
                flexShrink: 0,
                border: tagTheme === 'dark' ? '1px solid #334155' : '1px solid #f1f5f9'
              }}
            />
          )}

          <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontSize: tagSize === 'small' ? '0.8rem' : '0.92rem',
              fontWeight: 800,
              lineHeight: 1.25,
              color: tagTheme === 'dark' ? '#f8fafc' : '#0f172a'
            }}>
              {item.image} {item.name}
            </div>

            <div style={{
              fontSize: '0.72rem',
              color: tagTheme === 'dark' ? '#cbd5e1' : '#475569',
              marginTop: '3px'
            }}>
              หมวด: <strong>{item.category}</strong>
            </div>

            {showLocation && (
              <div style={{
                fontSize: '0.7rem',
                color: tagTheme === 'dark' ? '#94a3b8' : '#64748b'
              }}>
                จุดเก็บ: {item.location || 'ห้องพัสดุ'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Barcode */}
        {showBarcode && (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '2px' }}>
            <svg ref={barcodeRef} style={{ maxWidth: '100%' }}></svg>
          </div>
        )}
      </div>

      {/* Individual Download Action Button (Hidden during print) */}
      <button
        type="button"
        className="btn btn-secondary no-print"
        style={{
          fontSize: '0.75rem',
          padding: '5px 12px',
          width: '100%',
          maxWidth: tagSize === 'small' ? '250px' : (tagSize === 'large' ? '340px' : '290px'),
          borderRadius: '8px'
        }}
        onClick={handleDownloadThisTag}
        disabled={downloading}
      >
        <Download size={13} color="#0284c7" />
        <span>{downloading ? 'กำลังบันทึกภาพ...' : 'โหลดสติกเกอร์ PNG (ชิ้นนี้)'}</span>
      </button>
    </div>
  );
}

export default function LabelMaker() {
  const { equipment, selectedLabelItem, setSelectedLabelItem, showToast } = useApp();
  const [selectedIds, setSelectedIds] = useState(() => equipment.map(e => e.id));
  const [filterCat, setFilterCat] = useState('all');

  // Customization Options
  const [tagSize, setTagSize] = useState('medium'); // 'small', 'medium', 'large'
  const [tagTheme, setTagTheme] = useState('white'); // 'white', 'cyan', 'dark'
  const [showBarcode, setShowBarcode] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [previewData, setPreviewData] = useState(null); // { item, dataUrl, filename, canvas }

  const printableGridRef = useRef(null);

  useEffect(() => {
    if (selectedLabelItem) {
      setSelectedIds([selectedLabelItem.id]);
    }
  }, [selectedLabelItem]);

  const categories = ['all', ...new Set(equipment.map(e => e.category))];

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(equipment.map(e => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handlePrint = () => {
    window.print();
  };

  // Batch Download all selected sticker cards as PNGs
  const handleDownloadAllSheet = async () => {
    if (!printableGridRef.current || isBatchDownloading) return;
    setIsBatchDownloading(true);
    showToast('กำลังประมวลผลสร้างไฟล์ภาพสติกเกอร์ความละเอียดสูง...', 'info');

    try {
      const canvas = await html2canvas(printableGridRef.current, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const fileName = `SportEquip_Sticker_Sheet_${new Date().toISOString().slice(0, 10)}.png`;
      downloadCanvasImage(canvas, fileName);

      setIsBatchDownloading(false);
      showToast('ดาวน์โหลดแผ่นสติกเกอร์รวม (PNG) เรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error('Batch download error:', err);
      showToast('เกิดข้อผิดพลาดในการดาวน์โหลด', 'error');
      setIsBatchDownloading(false);
    }
  };

  const itemsToPrint = equipment.filter(item => 
    selectedIds.includes(item.id) && (filterCat === 'all' || item.category === filterCat)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="no-print" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '4px' }}>
            เครื่องมือสร้าง & ดาวน์โหลดป้ายสติกเกอร์ Barcode / QR Code 🏷️
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            สร้างสติกเกอร์แท็กติดอุปกรณ์กีฬา ดาวน์โหลดเป็นรูปภาพ PNG ความละเอียดสูง หรือสั่งพิมพ์ผ่านเครื่องพิมพ์
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleDownloadAllSheet}
            disabled={itemsToPrint.length === 0 || isBatchDownloading}
          >
            <Download size={18} />
            <span>{isBatchDownloading ? 'กำลังสร้างไฟล์ภาพ...' : `ดาวน์โหลดภาพสติกเกอร์ทั้งหมด (${itemsToPrint.length} ชิ้น)`}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handlePrint}
            disabled={itemsToPrint.length === 0}
          >
            <Printer size={18} />
            <span>สั่งพิมพ์ (Print Dialog)</span>
          </button>
        </div>
      </div>

      {/* Tag Customizer & Filter Panel */}
      <div className="glass-card no-print" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Style Controls Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Tag Size */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>ขนาดป้ายสติกเกอร์</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                className={`btn ${tagSize === 'small' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '6px' }}
                onClick={() => setTagSize('small')}
              >
                เล็ก (Compact)
              </button>
              <button
                type="button"
                className={`btn ${tagSize === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '6px' }}
                onClick={() => setTagSize('medium')}
              >
                มาตรฐาน
              </button>
              <button
                type="button"
                className={`btn ${tagSize === 'large' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '6px' }}
                onClick={() => setTagSize('large')}
              >
                ใหญ่ (Large)
              </button>
            </div>
          </div>

          {/* Tag Theme Color */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>โทนสีป้าย</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                className={`btn ${tagTheme === 'white' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '6px' }}
                onClick={() => setTagTheme('white')}
              >
                ⚪ ขาวคลาสสิก
              </button>
              <button
                type="button"
                className={`btn ${tagTheme === 'cyan' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '6px' }}
                onClick={() => setTagTheme('cyan')}
              >
                🔷 สปอร์ตไซอัน
              </button>
              <button
                type="button"
                className={`btn ${tagTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '6px' }}
                onClick={() => setTagTheme('dark')}
              >
                ⬛ ดาร์กโมเดิร์น
              </button>
            </div>
          </div>

          {/* Toggle Display Elements */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>องค์ประกอบที่แสดง</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${showQr ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.74rem', padding: '6px 10px' }}
                onClick={() => setShowQr(!showQr)}
              >
                <QrCode size={13} />
                <span>QR Code</span>
              </button>
              <button
                type="button"
                className={`btn ${showBarcode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.74rem', padding: '6px 10px' }}
                onClick={() => setShowBarcode(!showBarcode)}
              >
                <BarcodeIcon size={13} />
                <span>บาร์โค้ด</span>
              </button>
              <button
                type="button"
                className={`btn ${showLocation ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.74rem', padding: '6px 10px' }}
                onClick={() => setShowLocation(!showLocation)}
              >
                <span>จุดจัดเก็บ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selection & Category filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={handleSelectAll}>
              เลือกทั้งหมด ({equipment.length})
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={handleDeselectAll}>
              ยกเลิกทั้งหมด
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn ${filterCat === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '999px' }}
                onClick={() => setFilterCat(cat)}
              >
                {cat === 'all' ? 'ทุกหมวด' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Item Selection Checkboxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
          {equipment.filter(e => filterCat === 'all' || e.category === filterCat).map(item => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleToggleSelect(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--brand-primary-light)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                {isSelected ? <CheckSquare size={16} color="#38bdf8" /> : <Square size={16} color="var(--text-muted)" />}
                <span style={{ fontSize: '1.1rem' }}>{item.image}</span>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong>{item.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({item.code})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticker Preview & Printable Area */}
      <div className="printable-area">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} color="#38bdf8" />
            <span>ตัวอย่างป้ายสติกเกอร์พร้อมดาวน์โหลด/สั่งพิมพ์ ({itemsToPrint.length} ป้าย)</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 กดปุ่มใต้แต่ละป้ายเพื่อดาวน์โหลดไฟล์ PNG เฉพาะชิ้น หรือกดปุ่มด้านบนเพื่อโหลดทั้งแผ่น
          </span>
        </div>

        {itemsToPrint.length === 0 ? (
          <div className="no-print" style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            กรุณาเลือกอุปกรณ์ที่ต้องการสร้างป้ายสติกเกอร์
          </div>
        ) : (
          <div
            ref={printableGridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: tagSize === 'small' 
                ? 'repeat(auto-fill, minmax(250px, 1fr))' 
                : (tagSize === 'large' ? 'repeat(auto-fill, minmax(340px, 1fr))' : 'repeat(auto-fill, minmax(290px, 1fr))'),
              gap: '20px',
              padding: '16px 0'
            }}
          >
            {itemsToPrint.map(item => (
              <TagCard
                key={item.id}
                item={item}
                tagSize={tagSize}
                tagTheme={tagTheme}
                showBarcode={showBarcode}
                showQr={showQr}
                showLocation={showLocation}
                showToast={showToast}
                onOpenPreview={(data) => setPreviewData(data)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STICKER PREVIEW & DIRECT SAVE MODAL */}
      {/* ========================================================================= */}
      {previewData && (
        <div className="modal-backdrop" onClick={() => setPreviewData(null)}>
          <div
            className="modal-dialog animate-pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '92%', textAlign: 'center', padding: '28px 24px', background: '#ffffff', borderRadius: '24px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                <Sparkles size={20} color="#0284c7" />
                <span>ป้ายสติกเกอร์ (PNG) พร้อมใช้งาน</span>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Rendered PNG Image display */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <img
                src={previewData.dataUrl}
                alt={previewData.filename}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0'
                }}
              />
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
                📄 ชื่อไฟล์: <strong style={{ color: '#0f172a' }}>{previewData.filename}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Direct Anchor Download Link (Native browser support) */}
              <a
                href={previewData.dataUrl}
                download={previewData.filename}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <Download size={18} />
                <span>💾 บันทึกรูปภาพลงเครื่อง (Save PNG)</span>
              </a>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Copy Image Button */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '9px', fontSize: '0.85rem', fontWeight: 700 }}
                  onClick={async () => {
                    if (previewData.canvas) {
                      const success = await copyCanvasToClipboard(previewData.canvas);
                      if (success) {
                        showToast('คัดลอกรูปภาพแล้ว สามารถนำไปวาง (Paste) ใน Word/LINE ได้ทันที', 'success');
                      } else {
                        showToast('เบราว์เซอร์ไม่รองรับการคัดลอกรูปภาพตรง กรุณากดปุ่มบันทึกภาพแทน', 'info');
                      }
                    }
                  }}
                >
                  📋 คัดลอกรูปภาพ
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '9px', fontSize: '0.85rem', fontWeight: 700 }}
                  onClick={() => setPreviewData(null)}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>

            {/* Right-click Hint */}
            <div style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              fontSize: '0.78rem',
              color: '#0369a1',
              textAlign: 'left',
              lineHeight: 1.4
            }}>
              💡 <strong>วิธีสำรอง:</strong> สามารถคลิกขวาที่ภาพสติกเกอร์ด้านบน แล้วเลือก <strong>"Save image as..." (บันทึกรูปภาพเป็น...)</strong> เพื่อเซฟไฟล์ภาพได้เช่นกันครับ
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
