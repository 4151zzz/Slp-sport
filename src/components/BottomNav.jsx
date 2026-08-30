import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Boxes 
} from 'lucide-react';

export default function BottomNav() {
  const { activeTab, setActiveTab, loans } = useApp();

  const overdueCount = loans.filter(l => l.status === 'overdue').length;
  const activeCount = loans.filter(l => l.status === 'active' || l.status === 'overdue').length;

  const tabs = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'borrow', label: 'เบิก', icon: ArrowUpRight },
    { id: 'return', label: 'รับคืน', icon: ArrowDownLeft, badge: activeCount },
    { id: 'tracking', label: 'ทวงคืน', icon: Clock, badge: overdueCount, isAlert: overdueCount > 0 },
    { id: 'inventory', label: 'คลังพัสดุ', icon: Boxes }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bottom-badge">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
