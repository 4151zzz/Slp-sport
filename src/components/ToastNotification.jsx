import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function ToastNotification() {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => {
        let Icon = CheckCircle2;
        let iconColor = '#10b981';

        if (t.type === 'error') {
          Icon = AlertCircle;
          iconColor = '#f43f5e';
        } else if (t.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = '#f59e0b';
        } else if (t.type === 'info') {
          Icon = Info;
          iconColor = '#0284c7';
        }

        return (
          <div key={t.id} className={`toast-item toast-${t.type || 'success'}`}>
            <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
