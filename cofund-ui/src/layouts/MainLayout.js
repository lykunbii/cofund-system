import React from 'react';

function MainLayout({ activeTab, setActiveTab, children }) {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Tổng quan' },
    { id: 'transactions', icon: '💸', label: 'Thu & Chi' },
    { id: 'members', icon: '👥', label: 'Thành viên' },
    { id: 'reports', icon: '📈', label: 'Báo cáo' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, Arial, sans-serif' }}>
      
      {/* SIDEBAR (CỘT MENU TRÁI) */}
      <div style={{ width: '260px', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #1e293b', textAlign: 'center' }}>
          CoFund System
        </div>
        <div style={{ padding: '16px', flex: 1 }}>
          {menuItems.map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeTab === item.id ? '#3b82f6' : 'transparent',
                color: activeTab === item.id ? 'white' : '#94a3b8',
                fontWeight: activeTab === item.id ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '12px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* KHU VỰC NỘI DUNG BÊN PHẢI */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER (THANH ĐIỀU HƯỚNG TRÊN) */}
        <header style={{ height: '64px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Nguyễn Thị Lý</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Admin Quản Trị</div>
            </div>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0f172a' }}>
              L
            </div>
          </div>
        </header>

        {/* NỘI DUNG TỪNG TRANG SẼ HIỂN THỊ Ở ĐÂY */}
        <main style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;