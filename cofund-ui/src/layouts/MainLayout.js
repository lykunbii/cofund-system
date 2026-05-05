import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function MainLayout({ children, activeTab, setActiveTab, currentUser, onBackToLobby }) {
  // STATE: Quản lý ẩn/hiện menu thông báo
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Tham chiếu (ref) dùng để bắt sự kiện click ra ngoài menu
  const notiRef = useRef(null);

  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  // 1. Tự động lấy thông báo khi Layout được load
  useEffect(() => {
    const fetchNotifications = async () => {
      if (currentUser?.id) {
        try {
          const res = await axios.get(`${TRANSACTIONS_URL}/notifications/${currentUser.id}`);
          setNotifications(res.data);
        } catch (error) {
          console.error("Lỗi lấy thông báo:", error);
        }
      }
    };
    
    // Gọi ngay khi mở trang
    fetchNotifications();
    
    // Có thể cấu hình gọi lại mỗi 30s để giống real-time (tùy chọn)
    // const interval = setInterval(fetchNotifications, 30000);
    // return () => clearInterval(interval);
  }, [currentUser]);

  // 2. Logic tắt menu khi click ra ngoài vùng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShowNotiMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Hàm xử lý khi người dùng bấm Đánh dấu đã đọc
  const handleMarkAsRead = async (notiId) => {
    try {
      await axios.put(`${TRANSACTIONS_URL}/notifications/${notiId}/read`);
      // Cập nhật lại state ở Frontend thay vì gọi lại API cho nhẹ
      setNotifications(prev => 
        prev.map(n => n.id === notiId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }
  };

  // Đếm số lượng thông báo chưa đọc (để hiển thị chấm đỏ)
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, Arial, sans-serif' }}>
      
      {/* THANH MENU BÊN TRÁI (SIDEBAR) */}
      <div style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#3b82f6' }}>CoFund</h1>
        </div>
        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['dashboard', 'transactions', 'members', 'reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px', textAlign: 'left', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s',
                backgroundColor: activeTab === tab ? '#eff6ff' : 'transparent',
                color: activeTab === tab ? '#3b82f6' : '#64748b'
              }}
            >
              {tab === 'dashboard' ? '📊 Tổng quan' : tab === 'transactions' ? '💰 Thu / Chi' : tab === 'members' ? '👥 Thành viên' : '📈 Báo cáo'}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* THANH HEADER PHÍA TRÊN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
               onClick={onBackToLobby} 
               style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', transition: 'background-color 0.2s' }}
               onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
               onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
            >
              🔙 Về Sảnh
            </button>
            <h2 style={{ margin: 0, color: '#0f172a' }}>Quản lý Quỹ</h2>
          </div>
          
          {/* KHU VỰC THÔNG BÁO VÀ USER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* VÙNG QUẢ CHUÔNG (Có gắn ref) */}
            <div ref={notiRef} style={{ position: 'relative' }}>
               <div 
                  onClick={() => setShowNotiMenu(!showNotiMenu)}
                  style={{ cursor: 'pointer', position: 'relative', padding: '8px', borderRadius: '50%', backgroundColor: showNotiMenu ? '#f1f5f9' : 'transparent' }}
               >
                 <span style={{ fontSize: '24px' }}>🔔</span>
                 
                 {/* Chấm đỏ hiển thị số lượng chưa đọc */}
                 {unreadCount > 0 && (
                   <div style={{ 
                     position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', 
                     backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', 
                     fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center',
                     boxShadow: '0 0 0 2px white'
                   }}>
                     {unreadCount}
                   </div>
                 )}
               </div>

               {/* MENU THÔNG BÁO DROPDOWN */}
               {showNotiMenu && (
                 <div style={{ 
                   position: 'absolute', top: '50px', right: '-10px', width: '320px', 
                   backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                   border: '1px solid #e2e8f0', zIndex: 50, overflow: 'hidden'
                 }}>
                   <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Thông báo ({unreadCount})</h3>
                   </div>
                   
                   <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                     {notifications.length === 0 ? (
                       <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Chưa có thông báo nào</div>
                     ) : (
                       notifications.map(noti => (
                         <div key={noti.id} style={{ 
                           padding: '16px', borderBottom: '1px solid #f1f5f9', 
                           backgroundColor: noti.isRead ? 'white' : '#eff6ff', 
                           transition: 'background-color 0.2s' 
                         }}>
                           <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: noti.isRead ? '#475569' : '#1e3a8a' }}>{noti.title}</h4>
                           <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{noti.message}</p>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                               {new Date(noti.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                             </span>
                             {!noti.isRead && (
                               <button 
                                 onClick={() => handleMarkAsRead(noti.id)}
                                 style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                               >
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

            <div style={{ fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ width: '36px', height: '36px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6', fontSize: '16px' }}>
                  {currentUser?.fullName?.charAt(0) || 'U'}
               </div>
               <span>Chào, {currentUser?.fullName || currentUser?.name}</span>
            </div>
            
          </div>
        </div>

        {/* NỘI DUNG CHÍNH Ở GIỮA */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;