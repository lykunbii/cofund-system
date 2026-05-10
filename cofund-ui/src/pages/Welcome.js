import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api'; 

function Welcome({ currentUser, onJoinSuccess, onLogout }) { // NHẬN THÊM PROP onLogout TỪ APP.JS
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState(''); 
  const [targetAmount, setTargetAmount] = useState('');
  const [endDate, setEndDate] = useState('');

  const [myGroups, setMyGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // MỚI: State cho Menu Đăng xuất
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Click ra ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!currentUser?.id) {
        setLoadingGroups(false);
        return; 
      }
      try {
        const res = await api.get(`/Transactions/user-groups/${currentUser.id}`);
        if (Array.isArray(res.data)) {
          setMyGroups(res.data);
        } else {
          setMyGroups([]); 
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách quỹ:", err);
        setMyGroups([]); 
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchMyGroups();
  }, [currentUser?.id]); 

  const handleEnterGroup = (group) => {
    if (group) onJoinSuccess(group); 
  };

  const handleJoinGroup = async () => {
    if (!joinCode) return alert("Vui lòng nhập mã tham gia!");
    try {
      const res = await api.post('/Transactions/join-group', {
        userId: currentUser?.id,
        joinCode: joinCode.trim().toUpperCase()
      });
      alert(res.data?.message || "🎉 Tham gia quỹ thành công!");
      window.location.reload(); 
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.response?.data?.message || "Mã không hợp lệ"));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName || !targetAmount) {
      return alert("Vui lòng nhập Tên quỹ và Tổng tiền mục tiêu!");
    }
    try {
      const res = await api.post('/Transactions/create-group', {
        name: newGroupName,
        targetAmount: Number(targetAmount),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        userId: currentUser?.id
      });
      alert(`🎉 Tạo quỹ thành công!\nMã mời: ${res.data?.group?.joinCode}`);
      onJoinSuccess(res.data.group); 
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.response?.data?.message || "Có lỗi xảy ra"));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        
        {/* HEADER CỦA SẢNH CHỜ (CÓ AVATAR ĐĂNG XUẤT) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#0F172A', fontWeight: '800' }}>CoFund.</h1>
          
          {/* AVATAR & DROPDOWN MENU */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
             <div onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: 'white', padding: '8px 16px', borderRadius: '999px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
               <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>{currentUser?.fullName || currentUser?.name || 'User'}</div>
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                  {currentUser?.fullName?.charAt(0) || 'U'}
               </div>
             </div>

             {/* Menu Đăng xuất */}
             {showUserMenu && (
               <div style={{ position: 'absolute', top: '50px', right: '0', width: '200px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E2E8F0', overflow: 'hidden', zIndex: 50 }}>
                 <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>
                   <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Tài khoản của tôi</div>
                   <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', wordBreak: 'break-all' }}>{currentUser?.email}</div>
                 </div>
                 <div style={{ padding: '8px' }}>
                   <button onClick={onLogout} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', backgroundColor: 'transparent', color: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                     <span>🚪</span> Đăng xuất
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* LỜI CHÀO HIỆN ĐẠI */}
        <div style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white', marginBottom: '40px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: '800' }}>
            Chào mừng {currentUser?.fullName || currentUser?.name || 'bạn'}! 👋
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '16px' }}>
            Sảnh chờ: Chọn một quỹ để quản lý hoặc tham gia/tạo quỹ mới để bắt đầu.
          </p>
        </div>

        {/* CÁC QUỸ ĐÃ THAM GIA */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '24px' }}>📁</span>
            <h3 style={{ fontSize: '22px', color: '#1E293B', margin: 0, fontWeight: '700' }}>Các quỹ đang tham gia</h3>
          </div>
          
          {loadingGroups ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>⏳ Đang tải danh sách...</div>
          ) : myGroups.length === 0 ? (
            <div style={{ padding: '32px', backgroundColor: 'white', borderRadius: '20px', border: '2px dashed #CBD5E1', textAlign: 'center', color: '#64748B', fontWeight: '500' }}>
              Bạn chưa tham gia quỹ nào. Hãy tạo mới hoặc nhập mã tham gia ở bên dưới nhé!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {myGroups.map(group => (
                <div key={group.id} onClick={() => handleEnterGroup(group)} 
                     style={{ 
                       backgroundColor: 'white', padding: '24px', borderRadius: '20px', 
                       boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer', 
                       border: '1px solid #F1F5F9', transition: 'all 0.3s ease'
                     }}
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#0F172A', fontSize: '18px', fontWeight: '700' }}>{group?.name}</h4>
                    <div style={{ backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                      {group?.joinCode}
                    </div>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748B' }}>Số dư khả dụng:</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '24px', color: '#10B981', fontWeight: '800' }}>{(group?.currentBalance || 0).toLocaleString()}đ</span>
                     <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3B82F6' }}>
                       ➔
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* THÊM QUỸ MỚI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '24px' }}>✨</span>
          <h3 style={{ fontSize: '22px', color: '#1E293B', margin: 0, fontWeight: '700' }}>Mở rộng hoạt động</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#0F172A', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>🤝 Tham gia bằng mã</h4>
            <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Nhập mã (VD: A8F9K2)" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '15px', backgroundColor: '#F8FAFC' }} />
            <button onClick={handleJoinGroup} style={{ width: '100%', padding: '14px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}>
              Vào nhóm ngay
            </button>
          </div>

          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#0F172A', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>👑 Tạo quỹ mới</h4>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#475569' }}>Tên quỹ nhóm <span style={{color:'#EF4444'}}>*</span></label>
              <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="VD: Quỹ lớp 5A" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#475569' }}>Tổng tiền mục tiêu (VNĐ) <span style={{color:'#EF4444'}}>*</span></label>
              <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="VD: 5000000" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#475569' }}>Hạn chót đóng quỹ</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC', color: '#475569' }} />
            </div>
            <button onClick={handleCreateGroup} style={{ width: '100%', padding: '14px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10B981'}>
              Tạo quỹ ngay
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Welcome;