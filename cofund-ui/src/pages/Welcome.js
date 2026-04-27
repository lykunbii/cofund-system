import React, { useState } from 'react';
import axios from 'axios';

function Welcome({ currentUser, onJoinSuccess }) {
  const [joinCode, setJoinCode] = useState('');
  
  // Tạm thời chưa nối API tạo nhóm, ta làm form nhập tên nhóm trước
  const [newGroupName, setNewGroupName] = useState(''); 

  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  const handleJoinGroup = async () => {
    if (!joinCode) {
      alert("Vui lòng nhập mã tham gia!");
      return;
    }

    try {
      // Gọi cái API xịn xò mà chúng ta vừa viết ở Backend lúc nãy!
      const res = await axios.post(`${TRANSACTIONS_URL}/join-group`, {
        userId: currentUser.id,
        joinCode: joinCode.trim().toUpperCase() // Tự động viết hoa để tránh lỗi
      });

      alert(res.data.message || "🎉 Tham gia quỹ thành công!");
      
      // Giả lập đưa user vào nhóm (Sau này sẽ truyền thông tin nhóm thật từ Backend về)
      onJoinSuccess({ id: 1, name: "Quỹ vừa tham gia" }); 

    } catch (err) {
      if (err.response && err.response.data) {
        alert("Lỗi: " + (err.response.data.error || "Mã không hợp lệ"));
      } else {
        alert("Không thể kết nối tới máy chủ!");
      }
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName) {
      alert("Vui lòng nhập tên quỹ mới!");
      return;
    }
    alert("Tính năng Tạo quỹ đang được Backend phát triển! Tạm thời hãy dùng mã để tham gia nhé.");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ maxWidth: '800px', width: '100%', padding: '20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#0f172a', fontSize: '32px', marginBottom: '12px' }}>Chào mừng {currentUser.fullName || currentUser.name}! 👋</h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Bạn hiện chưa tham gia vào quỹ nào. Hãy bắt đầu bằng một trong hai lựa chọn dưới đây.</p>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* LỰA CHỌN 1: THAM GIA BẰNG MÃ */}
          <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤝</div>
            <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '20px' }}>Tham gia quỹ có sẵn</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Nhập mã tham gia (gồm 6 ký tự) do thủ quỹ hoặc quản trị viên cung cấp cho bạn.</p>
            
            <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Ví dụ: A8F9K2"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center' }}
            />
            <button 
              onClick={handleJoinGroup}
              style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Vào nhóm
            </button>
          </div>

          {/* LỰA CHỌN 2: TẠO QUỸ MỚI */}
          <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>👑</div>
            <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '20px' }}>Tạo một quỹ mới</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Bạn sẽ trở thành Quản trị viên (Admin). Bạn có thể mời người khác tham gia sau khi tạo xong.</p>
            
            <input 
              type="text" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Tên quỹ (VD: Quỹ lớp 5A)"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <button 
              onClick={handleCreateGroup}
              style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Tạo quỹ ngay
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Welcome;