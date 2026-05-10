import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api'; // DÙNG MÁY KẸP THẺ ĐỂ KHÔNG BỊ LỖI CORS 401
import { HubConnectionBuilder } from '@microsoft/signalr';

function MainLayout({ children, activeTab, setActiveTab, currentUser, onBackToLobby }) {
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notiRef = useRef(null);

  useEffect(() => {
    // Hàm tải thông báo
    const fetchNotifications = async () => {
      if (currentUser?.id) {
        try {
          const res = await api.get(`/Transactions/notifications/${currentUser.id}`);
          setNotifications(res.data);
        } catch (error) {
          console.error("Lỗi lấy thông báo:", error);
        }
      }
    };
    
    fetchNotifications();

    // Khởi tạo SignalR (Nhận thông báo Real-time)
    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5099/notificationHub')
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        console.log('✅ Đã kết nối SignalR thành công!');
        newConnection.on("ReceiveNotification", () => {
          fetchNotifications(); // Cập nhật lại chuông khi có sự kiện
        });
      })
      .catch(e => console.log('❌ Lỗi kết nối SignalR: ', e));

    return () => {
      if (newConnection) newConnection.stop();
    };
  }, [currentUser]);

  // Click ra ngoài để đóng menu chuông
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShowNotiMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notiId) => {
    try {
      await api.put(`/Transactions/notifications/${notiId}/read`);
      setNotifications(prev => prev.map(n => n.id === notiId ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR - MODERN STYLE */}
      <div style={{ width: '260px', backgroundColor: '#FFFFFF', boxShadow: '4px 0 24px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>
            C
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>CoFund.</h1>
        </div>

        <nav style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {['dashboard', 'transactions', 'members', 'reports'].map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '14px 20px', textAlign: 'left', border: 'none', borderRadius: '12px', cursor: 'pointer', 
                  fontWeight: isActive ? '600' : '500', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.3s ease', backgroundColor: isActive ? '#EFF6FF' : 'transparent', color: isActive ? '#2563EB' : '#64748B',
                }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: '18px' }}>
                  {tab === 'dashboard' ? '📊' : tab === 'transactions' ? '💳' : tab === 'members' ? '👥' : '📈'}
                </span>
                {tab === 'dashboard' ? 'Tổng quan' : tab === 'transactions' ? 'Thu / Chi' : tab === 'members' ? 'Thành viên' : 'Báo cáo'}
              </button>
            )
          })}
        </nav>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER - GLASSMORPHISM */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', position: 'sticky', top: 0, zIndex: 5 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
               onClick={onBackToLobby} 
               style={{ padding: '10px 16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
               onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'}
               onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'}
            >
              <span style={{ fontSize: '16px' }}>←</span> Về Sảnh
            </button>
            <h2 style={{ margin: 0, color: '#1E293B', fontSize: '20px', fontWeight: '700' }}>
              {activeTab === 'dashboard' ? 'Tổng quan Quỹ' : activeTab === 'transactions' ? 'Quản lý Thu Chi' : activeTab === 'members' ? 'Danh sách Thành viên' : 'Báo cáo Tài chính'}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            
            {/* THÔNG BÁO SIGNALR */}
            <div ref={notiRef} style={{ position: 'relative' }}>
               <div onClick={() => setShowNotiMenu(!showNotiMenu)} style={{ cursor: 'pointer', position: 'relative', padding: '8px', borderRadius: '50%', backgroundColor: showNotiMenu ? '#F1F5F9' : 'transparent' }}>
                 <span style={{ fontSize: '24px' }}>🔔</span>
                 {unreadCount > 0 && (
                   <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 0 2px white' }}>
                     {unreadCount}
                   </div>
                 )}
               </div>

               {showNotiMenu && (
                 <div style={{ position: 'absolute', top: '50px', right: '-10px', width: '320px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                   <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                     <h3 style={{ margin: 0, fontSize: '15px', color: '#0F172A', fontWeight: '700' }}>Thông báo ({unreadCount})</h3>
                   </div>
                   <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                     {notifications.length === 0 ? (
                       <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Chưa có thông báo nào</div>
                     ) : (
                       notifications.map(noti => (
                         <div key={noti.id} style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', backgroundColor: noti.isRead ? 'white' : '#EFF6FF' }}>
                           <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: noti.isRead ? '#475569' : '#1E3A8A' }}>{noti.title}</h4>
                           <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748B', lineHeight: '1.4' }}>{noti.message}</p>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(noti.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                             {!noti.isRead && (
                               <button onClick={() => handleMarkAsRead(noti.id)} style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                 Đã đọc
                               </button>
                             )}
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
            </div>

            {/* AVATAR NGƯỜI DÙNG */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid #E2E8F0' }}>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>{currentUser?.fullName || currentUser?.name}</div>
                 <div style={{ fontSize: '12px', color: '#64748B' }}>Thành viên</div>
               </div>
               <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                  {currentUser?.fullName?.charAt(0) || 'U'}
               </div>
            </div>
            
          </div>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;