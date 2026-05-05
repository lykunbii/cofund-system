import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Welcome({ currentUser, onJoinSuccess }) {
  const [joinCode, setJoinCode] = useState('');
  
  // States cho form Tạo quỹ mới
  const [newGroupName, setNewGroupName] = useState(''); 
  const [targetAmount, setTargetAmount] = useState('');
  const [endDate, setEndDate] = useState('');

  const [myGroups, setMyGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const res = await axios.get(`${TRANSACTIONS_URL}/user-groups/${currentUser.id}`);
        setMyGroups(res.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách quỹ:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchMyGroups();
  }, [currentUser.id]);

  const handleEnterGroup = (group) => {
    onJoinSuccess(group); 
  };

  const handleJoinGroup = async () => {
    if (!joinCode) return alert("Vui lòng nhập mã tham gia!");
    try {
      const res = await axios.post(`${TRANSACTIONS_URL}/join-group`, {
        userId: currentUser.id,
        joinCode: joinCode.trim().toUpperCase()
      });
      alert(res.data.message || "🎉 Tham gia quỹ thành công!");
      window.location.reload(); 
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || "Mã không hợp lệ"));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName || !targetAmount) {
      return alert("Vui lòng nhập Tên quỹ và Tổng tiền mục tiêu!");
    }
    try {
      const res = await axios.post(`${TRANSACTIONS_URL}/create-group`, {
        name: newGroupName,
        targetAmount: Number(targetAmount),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        userId: currentUser.id
      });
      alert(`🎉 Tạo quỹ thành công!\nMã mời: ${res.data.group.joinCode}`);
      onJoinSuccess(res.data.group); 
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || "Có lỗi xảy ra"));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: '#0f172a', fontSize: '32px', marginBottom: '8px' }}>Chào mừng {currentUser.fullName || currentUser.name}! 👋</h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Sảnh chờ: Chọn một quỹ để bắt đầu quản lý hoặc tham gia quỹ mới.</p>
        </div>

        {/* CÁC QUỸ ĐÃ THAM GIA */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>📁 Các quỹ bạn đang tham gia</h2>
          {loadingGroups ? (
            <p style={{ color: '#64748b' }}>⏳ Đang tải danh sách...</p>
          ) : myGroups.length === 0 ? (
            <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>
              Bạn chưa tham gia quỹ nào. Hãy tạo hoặc nhập mã tham gia ở bên dưới!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {myGroups.map(group => (
                <div key={group.id} onClick={() => handleEnterGroup(group)} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{group.name}</h3>
                  <p style={{ margin: '0', fontSize: '13px', color: '#64748b' }}>Mã nhóm: <strong>{group.joinCode}</strong></p>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>{group.currentBalance.toLocaleString()}đ</span>
                     <span style={{ fontSize: '20px' }}>👉</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h2 style={{ fontSize: '20px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>➕ Thêm quỹ mới</h2>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '18px' }}>🤝 Tham gia bằng mã</h3>
            <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Nhập mã (VD: A8F9K2)" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 'bold' }} />
            <button onClick={handleJoinGroup} style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Vào nhóm</button>
          </div>

          <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '18px' }}>👑 Tạo quỹ mới</h3>
            
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Tên quỹ nhóm <span style={{color:'red'}}>*</span></label>
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="VD: Quỹ lớp 5A" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} />
            
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Tổng tiền mục tiêu (VNĐ) <span style={{color:'red'}}>*</span></label>
            <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="VD: 5000000" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} />
            
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>Hạn chót đóng quỹ</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '20px', boxSizing: 'border-box' }} />
            
            <button onClick={handleCreateGroup} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Tạo quỹ ngay</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Welcome;