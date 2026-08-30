import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  QrCode, 
  Boxes, 
  MapPin, 
  Package, 
  X, 
  Check, 
  Layers 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function InventoryManager() {
  const { 
    equipment, 
    addEquipment, 
    updateEquipment, 
    deleteEquipment, 
    setSelectedLabelItem, 
    setActiveTab,
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'ฟุตบอล / ฟุตซอล',
    code: '',
    totalQty: 5,
    location: '',
    condition: 'สมบูรณ์ (Good)',
    price: 500,
    image: '⚽',
    notes: ''
  });

  const categories = ['all', ...new Set(equipment.map(e => e.category))];

  const filteredEquipment = equipment.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(s) ||
                        item.code.toLowerCase().includes(s) ||
                        item.id.toLowerCase().includes(s);
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'ฟุตบอล / ฟุตซอล',
      code: `EQ-${Date.now().toString().slice(-6)}`,
      totalQty: 5,
      location: 'ตู้เก็บอุปกรณ์',
      condition: 'สมบูรณ์ (Good)',
      price: 500,
      image: '⚽',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      code: item.code,
      totalQty: item.totalQty,
      location: item.location || '',
      condition: item.condition || 'สมบูรณ์ (Good)',
      price: item.price || 0,
      image: item.image || '📦',
      notes: item.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('กรุณาระบุชื่ออุปกรณ์', 'warning');
      return;
    }

    if (editingItem) {
      // Calculate diff for available quantity
      const borrowedCount = editingItem.totalQty - editingItem.availableQty;
      const newTotal = Number(formData.totalQty);
      const newAvailable = Math.max(0, newTotal - borrowedCount);

      updateEquipment(editingItem.id, {
        ...formData,
        totalQty: newTotal,
        availableQty: newAvailable
      });
    } else {
      addEquipment(formData);
    }

    setModalOpen(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์ "${name}" ออกจากระบบ?`)) {
      deleteEquipment(id);
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
            คลังพัสดุและอุปกรณ์กีฬา 📦
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            จัดการรายการอุปกรณ์ ตรวจสอบจำนวนคงเหลือ และพิมพ์ป้ายแท็ก Barcode / QR Code
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('labels')}>
            <QrCode size={18} />
            <span>พิมพ์สติกเกอร์ทั้งหมด</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>เพิ่มอุปกรณ์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar-box" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่ออุปกรณ์, บาร์โค้ด, จุดจัดเก็บ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap', borderRadius: '999px' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'ทุกหมวดหมู่' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="equip-grid">
          {filteredEquipment.map(item => {
            const availablePercent = Math.round((item.availableQty / item.totalQty) * 100) || 0;
            const isLowStock = item.availableQty <= 1 && item.totalQty > 1;

            return (
              <div key={item.id} className="equip-card">
                <div>
                  <div className="equip-card-header">
                    <div className="equip-card-emoji">{item.image || '📦'}</div>
                    <div style={{ flex: 1 }}>
                      <span className="badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', marginBottom: '4px', display: 'inline-block' }}>
                        {item.category}
                      </span>
                      <h3 className="equip-card-title">{item.name}</h3>
                      <div className="equip-card-code">{item.code} ({item.id})</div>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>คงเหลือพร้อมยืม:</span>
                      <strong style={{ color: item.availableQty > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {item.availableQty} / {item.totalQty} ชิ้น
                      </strong>
                    </div>
                    <div className="equip-stock-bar-box">
                      <div
                        className="equip-stock-bar-fill"
                        style={{
                          width: `${availablePercent}%`,
                          background: item.availableQty === 0 ? 'var(--accent-rose)' : (isLowStock ? 'var(--accent-amber)' : 'var(--accent-emerald)')
                        }}
                      />
                    </div>
                  </div>

                  {/* Location & Condition */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="var(--text-muted)" />
                      <span>จุดเก็บ: {item.location || '-'}</span>
                    </div>
                    <div>มูลค่า: {formatCurrency(item.price || 0)} / ชิ้น</div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.78rem', padding: '6px 8px' }}
                    onClick={() => {
                      setSelectedLabelItem(item);
                      setActiveTab('labels');
                    }}
                    title="สร้างป้าย QR / Barcode"
                  >
                    <QrCode size={14} />
                    <span>พิมพ์ป้าย</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-icon-only"
                    style={{ padding: '6px' }}
                    onClick={() => handleOpenEdit(item)}
                    title="แก้ไข"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-secondary btn-icon-only"
                    style={{ padding: '6px', color: 'var(--accent-rose)' }}
                    onClick={() => handleDelete(item.id, item.name)}
                    title="ลบ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Equipment Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Package size={20} color="#38bdf8" />
                <span>{editingItem ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์กีฬาใหม่'}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ชื่ออุปกรณ์กีฬา / พัสดุ *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น ลูกฟุตบอล Molten เบอร์ 5"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">หมวดหมู่ *</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="ฟุตบอล / ฟุตซอล">ฟุตบอล / ฟุตซอล</option>
                    <option value="บาสเกตบอล">บาสเกตบอล</option>
                    <option value="วอลเลย์บอล">วอลเลย์บอล</option>
                    <option value="แบดมินตัน">แบดมินตัน</option>
                    <option value="เปตอง">เปตอง</option>
                    <option value="ปิงปอง / เทเบิลเทนนิส">ปิงปอง / เทเบิลเทนนิส</option>
                    <option value="อุปกรณ์สนาม & กรรมการ">อุปกรณ์สนาม & กรรมการ</option>
                    <option value="อุปกรณ์ฝึกซ้อม & ฟิตเนส">อุปกรณ์ฝึกซ้อม & ฟิตเนส</option>
                    <option value="เสื้อผ้า & เบ็ดเตล็ด">เสื้อผ้า & เบ็ดเตล็ด</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">ไอคอนแสดงผล (Emoji)</label>
                  <select
                    className="form-select"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  >
                    <option value="⚽">⚽ ฟุตบอล</option>
                    <option value="🏀">🏀 บาสเกตบอล</option>
                    <option value="🏐">🏐 วอลเลย์บอล</option>
                    <option value="🏸">🏸 แบดมินตัน</option>
                    <option value="🏓">🏓 ปิงปอง</option>
                    <option value="⚪">⚪ เปตอง</option>
                    <option value="⏱️">⏱️ นาฬิกาจับเวลา</option>
                    <option value="🔶">🔶 กรวยซ้อม</option>
                    <option value="📢">📢 นกหวีด</option>
                    <option value="🎽">🎽 เสื้อเอี๊ยม</option>
                    <option value="📦">📦 พัสดุอื่นๆ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">รหัส Barcode / รหัสครุภัณฑ์ *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น FB-001001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">จำนวนทั้งหมดในคลัง (ชิ้น) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.totalQty}
                    onChange={(e) => setFormData({ ...formData, totalQty: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">สถานที่จัดเก็บ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น ตู้ A1 - ชั้น 2"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">มูลค่าต่อหน่วย (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">คำอธิบาย / รายละเอียดเพิ่มเติม</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="เช่น มาตรฐานแข่งขัน FIFA, หนังในร่ม..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px', marginTop: '10px' }}
              >
                <Check size={18} />
                <span>{editingItem ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มอุปกรณ์'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
