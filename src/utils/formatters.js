export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateShort(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
}

export function getDueStatus(dueDateString, status) {
  if (status === 'returned') {
    return {
      type: 'returned',
      label: 'คืนแล้ว',
      badgeClass: 'badge-success',
      isOverdue: false,
      diffDays: 0
    };
  }

  const now = new Date();
  const due = new Date(dueDateString);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return {
      type: 'overdue',
      label: `เกินกำหนด ${overdueDays === 0 ? 'วันนี้' : overdueDays + ' วัน'}`,
      badgeClass: 'badge-danger',
      isOverdue: true,
      overdueDays: overdueDays === 0 ? 1 : overdueDays,
      diffDays
    };
  } else if (diffDays === 0 || diffHours <= 12) {
    return {
      type: 'due_today',
      label: 'ครบกำหนดวันนี้',
      badgeClass: 'badge-warning',
      isOverdue: false,
      diffDays: 0
    };
  } else if (diffDays === 1) {
    return {
      type: 'due_soon',
      label: 'ครบกำหนดพรุ่งนี้',
      badgeClass: 'badge-info',
      isOverdue: false,
      diffDays: 1
    };
  } else {
    return {
      type: 'normal',
      label: `เหลืออีก ${diffDays} วัน`,
      badgeClass: 'badge-primary',
      isOverdue: false,
      diffDays
    };
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0
  }).format(amount);
}
