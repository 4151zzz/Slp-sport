import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  User, 
  Calendar, 
  FileText, 
  PenTool, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BorrowFlow() {
  const { 
    equipment, 
    borrowers, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQty, 
    clearCart, 
    createLoan, 
    openScanner, 
    showToast 
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Checkout Form State
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [customBorrower, setCustomBorrower] = useState({
    name: '',
    studentId: '',
    phone: '',
    email: '',
    lineId: '',
    department: 'นักศึกษา / ชมรม'
  });
  const [isNewBorrower, setIsNewBorrower] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [duePreset, setDuePreset] = useState('1'); // 1, 3, 7 days
  const [customDueDate, setCustomDueDate] = useState('');

  // Signature Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Filter Categories
  const categories = ['all', ...new Set(equipment.map(e => e.category))];

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate Due Date based on preset
  const getCalculatedDueDate = () => {
    if (duePreset === 'custom' && customDueDate) {
      return new Date(customDueDate).toISOString();
    }
    const d = new Date();
    d.setDate(d.getDate() + parseInt(duePreset, 10));
    d.setHours(17, 0, 0, 0); // 17:00 default return time
    return d.toISOString();
  };

  // Canvas Drawing Handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Resize with DPR
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0284c7';
  }, []);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.closePath();
      }
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit Borrowing
  const handleSubmitBorrow = (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast('กรุณาเลือกอุปกรณ์ที่ต้องการเบิกอย่างน้อย 1 รายการ', 'warning');
      return;
    }

    let borrowerData = {};
    if (isNewBorrower) {
      if (!customBorrower.name.trim()) {
        showToast('กรุณาระบุชื่อ-สกุลผู้ยืม', 'warning');
        return;
      }
      borrowerData = {
        borrowerId: `BR-${Date.now().toString().slice(-6)}`,
        borrowerName: customBorrower.name.trim(),
        borrowerPhone: customBorrower.phone.trim(),
        borrowerLine: customBorrower.lineId.trim(),
        borrowerDept: customBorrower.department.trim()
      };
    } else {
      const borrower = borrowers.find(b => b.id === selectedBorrowerId);
      if (!borrower) {
        showToast('กรุณาเลือกผู้เบิกยืมจากรายชื่อ หรือเพิ่มผู้ยืมใหม่', 'warning');
        return;
      }
      borrowerData = {
        borrowerId: borrower.id,
        borrowerName: borrower.name,
        borrowerPhone: borrower.phone,
        borrowerLine: borrower.lineId,
        borrowerDept: borrower.department
      };
    }

    const signatureData = canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;

    const loanPayload = {
      ...borrowerData,
      dueDate: getCalculatedDueDate(),
      purpose: purpose.trim() || 'ใช้ในการฝึกซ้อมและกิจกรรมกีฬา',
      items: cart.map(item => ({
        equipmentId: item.id,
        name: item.name,
        code: item.code,
        qty: item.qty,
        image: item.image
      })),
      signature: signatureData
    };

    createLoan(loanPayload);

    // Trigger celebration confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Reset form
    clearSignature();
    setPurpose('');
    setSelectedBorrowerId('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
            ทำรายการเบิกอุปกรณ์กีฬา 📤
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            เลือกอุปกรณ์ สแกนบาร์โค้ด และระบุตัวตนผู้ยืมพร้อมลงลายมือชื่อดิจิทัล
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => openScanner(null, 'สแกน Barcode เพื่อเพิ่มลงตะกร้า')}
        >
          <Scan size={18} />
          <span>สแกนกล้องเพิ่มอุปกรณ์</span>
        </button>
      </div>

      {/* Main Two-Column Layout (Catalog on Left, Checkout Cart on Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* LEFT: Equipment Catalog & Search */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>เลือกอุปกรณ์จากคลัง</h2>

            {/* Search Input */}
            <div className="search-bar-box">
              <Search size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="ค้นหาชื่ออุปกรณ์, รหัส Barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap', borderRadius: '999px' }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'ทั้งหมด' : cat}
                </button>
              ))}
            </div>

            {/* Equipment Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredEquipment.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                const isAvailable = item.availableQty > 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      opacity: isAvailable ? 1 : 0.6
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{item.image || '📦'}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '1.3' }}>{item.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {item.code}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span>คงเหลือพร้อมยืม:</span>
                        <strong style={{ color: isAvailable ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {item.availableQty} / {item.totalQty} ชิ้น
                        </strong>
                      </div>
                    </div>

                    <button
                      className={`btn ${inCart ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.82rem', padding: '8px 12px', width: '100%' }}
                      onClick={() => addToCart(item)}
                      disabled={!isAvailable}
                    >
                      {inCart ? (
                        <>
                          <span>ในตะกร้า ({inCart.qty})</span>
                          <Plus size={14} />
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>{isAvailable ? 'เพิ่มลงรายการ' : 'ของหมด'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Borrowing Basket & Identification Form */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="#38bdf8" />
                <span>รายการอุปกรณ์ที่เบิก ({cart.reduce((sum, i) => sum + i.qty, 0)} ชิ้น)</span>
              </h2>
              {cart.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={clearCart}
                >
                  ล้างตะกร้า
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 20px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)'
              }}>
                <ShoppingCart size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>ยังไม่มีรายการอุปกรณ์ในตะกร้า</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  คลิกปุ่ม "เพิ่มลงรายการ" ทางซ้าย หรือกดสแกนบาร์โค้ด
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {cart.map(item => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{item.image}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.code}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary btn-icon-only"
                        style={{ padding: '4px' }}
                        onClick={() => updateCartQty(item.id, item.qty - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.qty}</span>
                      <button 
                        className="btn btn-secondary btn-icon-only"
                        style={{ padding: '4px' }}
                        onClick={() => updateCartQty(item.id, item.qty + 1)}
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon-only"
                        style={{ padding: '4px', color: 'var(--accent-rose)' }}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Borrower Identification Section */}
            <form onSubmit={handleSubmitBorrow} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} color="#38bdf8" />
                  <span>ข้อมูลผู้เบิกยืมอุปกรณ์</span>
                </label>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary-light)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => setIsNewBorrower(!isNewBorrower)}
                >
                  {isNewBorrower ? '← เลือกจากรายชื่อเดิม' : '+ เพิ่มผู้ยืมใหม่'}
                </button>
              </div>

              {!isNewBorrower ? (
                <div className="form-group" style={{ margin: 0 }}>
                  <select
                    className="form-select"
                    value={selectedBorrowerId}
                    onChange={(e) => setSelectedBorrowerId(e.target.value)}
                    required
                  >
                    <option value="">-- เลือกชื่อผู้ยืม / นักศึกษา / บุคลากร --</option>
                    {borrowers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.department} - โทร {b.phone})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ชื่อ-นามสกุล ผู้ยืม *"
                    value={customBorrower.name}
                    onChange={(e) => setCustomBorrower({ ...customBorrower, name: e.target.value })}
                    required
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="รหัสนักศึกษา / Staff ID"
                      value={customBorrower.studentId}
                      onChange={(e) => setCustomBorrower({ ...customBorrower, studentId: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เบอร์โทรศัพท์ *"
                      value={customBorrower.phone}
                      onChange={(e) => setCustomBorrower({ ...customBorrower, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="LINE ID"
                      value={customBorrower.lineId}
                      onChange={(e) => setCustomBorrower({ ...customBorrower, lineId: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="คณะ / ชมรม / ภาควิชา"
                      value={customBorrower.department}
                      onChange={(e) => setCustomBorrower({ ...customBorrower, department: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Due Date Presets */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} color="#38bdf8" />
                  <span>กำหนดส่งคืน (Due Date)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    className={`btn ${duePreset === '1' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => setDuePreset('1')}
                  >
                    1 วัน
                  </button>
                  <button
                    type="button"
                    className={`btn ${duePreset === '3' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => setDuePreset('3')}
                  >
                    3 วัน
                  </button>
                  <button
                    type="button"
                    className={`btn ${duePreset === '7' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => setDuePreset('7')}
                  >
                    7 วัน
                  </button>
                  <button
                    type="button"
                    className={`btn ${duePreset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => setDuePreset('custom')}
                  >
                    กำหนดเอง
                  </button>
                </div>

                {duePreset === 'custom' && (
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={customDueDate}
                    onChange={(e) => setCustomDueDate(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Purpose */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#38bdf8" />
                  <span>วัตถุประสงค์ในการเบิก</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น ซ้อมทีมตัวแทนคณะ, ใช้แข่งกีฬาสี..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              {/* Digital Signature Pad */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <PenTool size={16} color="#38bdf8" />
                    <span>ลายเซ็นผู้ยืม (Digital Signature)</span>
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={clearSignature}
                    >
                      <RotateCcw size={12} />
                      <span>ล้างลายเซ็น</span>
                    </button>
                  )}
                </div>

                <div className="signature-canvas-box">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="signature-placeholder">
                      ✍️ ใช้นิ้วหรือเมาส์เซ็นชื่อที่นี่เพื่อยืนยันรับอุปกรณ์
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Checkout Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '14px', fontSize: '1rem', marginTop: '10px' }}
                disabled={cart.length === 0}
              >
                <CheckCircle size={20} />
                <span>ยืนยันการเบิกอุปกรณ์ ({cart.reduce((sum, i) => sum + i.qty, 0)} ชิ้น)</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
