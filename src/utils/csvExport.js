import { formatDate } from './formatters';

export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  
  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  // UTF-8 BOM for Thai language Excel support
  const BOM = '\uFEFF';
  
  const csvContent = BOM +
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date
          ? cell.toLocaleString('th-TH')
          : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportLoansReport(loans) {
  const data = loans.map(loan => ({
    'รหัสรายการ': loan.id,
    'ชื่อผู้ยืม': loan.borrowerName,
    'เบอร์โทรศัพท์': loan.borrowerPhone || '-',
    'LINE ID': loan.borrowerLine || '-',
    'คณะ / แผนก': loan.borrowerDept || '-',
    'รายการอุปกรณ์': loan.items.map(i => `${i.name} (x${i.qty})`).join('; '),
    'วัตถุประสงค์': loan.purpose || '-',
    'วันที่ยืม': formatDate(loan.borrowDate),
    'กำหนดส่งคืน': formatDate(loan.dueDate),
    'สถานะ': loan.status === 'returned' ? 'คืนแล้ว' : (loan.status === 'overdue' ? 'เกินกำหนด' : 'กำลังยืม'),
    'วันที่คืน': loan.returnDate ? formatDate(loan.returnDate) : '-',
    'สภาพตอนคืน': loan.returnCondition || '-',
    'หมายเหตุการคืน': loan.returnNotes || '-',
    'จำนวนครั้งที่ทวงถาม': loan.followupCount || 0
  }));

  exportToCSV(`SportEquip_Loans_Report_${new Date().toISOString().slice(0, 10)}.csv`, data);
}

export function exportInventoryReport(equipment) {
  const data = equipment.map(item => ({
    'รหัสอุปกรณ์': item.id,
    'บาร์โค้ด': item.code,
    'ชื่ออุปกรณ์': item.name,
    'หมวดหมู่': item.category,
    'จำนวนทั้งหมด': item.totalQty,
    'คงเหลือพร้อมยืม': item.availableQty,
    'กำลังถูกยืม': item.totalQty - item.availableQty,
    'สถานที่จัดเก็บ': item.location,
    'สภาพอุปกรณ์': item.condition,
    'มูลค่าต่อหน่วย (บาท)': item.price,
    'หมายเหตุ': item.notes || '-'
  }));

  exportToCSV(`SportEquip_Inventory_${new Date().toISOString().slice(0, 10)}.csv`, data);
}
