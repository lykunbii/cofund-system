import React from 'react';
import axios from 'axios';

function Members({ members, currentGroup, currentUser, myRole }) {
  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  // 1. Kiểm tra xem user hiện tại có phải là Admin của quỹ này không
  const isAdmin = myRole && myRole.includes('Admin');

  // 2. Hàm gọi API gửi thông báo trong ứng dụng (In-app Notification)
  const handleSendReminder = async (targetMember) => {
    // Xác nhận lại trước khi gửi để tránh bấm nhầm
    const confirmSend = window.confirm(`Bạn có chắc chắn muốn gửi thông báo nhắc nhở đóng quỹ đến ${targetMember.name}?`);
    if (!confirmSend) return;

    try {
      await axios.post(`${TRANSACTIONS_URL}/send-inapp-reminder`, {
        adminUserId: currentUser.id,      // Người gửi (chính là bạn)
        targetUserId: targetMember.userId,// Người nhận
        groupId: currentGroup.id          // Quỹ hiện tại
      });
      alert(`🚀 Đã gửi thông báo nhắc nhở thành công tới ${targetMember.name}!`);
    } catch (err) {
      alert(err.response?.data?.Error || "Có lỗi xảy ra khi gửi thông báo. Vui lòng thử lại.");
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>
          Danh sách thành viên ({members.length})
        </h3>
        {isAdmin && (
          <span style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            👑 Bạn là Quản trị viên
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '16px', color: '#64748b', fontWeight: 'bold' }}>Họ và Tên</th>
              <th style={{ padding: '16px', color: '#64748b', fontWeight: 'bold' }}>Vai trò</th>
              <th style={{ padding: '16px', color: '#64748b', fontWeight: 'bold' }}>Trạng thái quỹ</th>
              <th style={{ padding: '16px', color: '#64748b', fontWeight: 'bold' }}>Ngày tham gia</th>
              {/* Chỉ hiển thị cột Thao tác nếu người đang xem là Admin */}
              {isAdmin && <th style={{ padding: '16px', color: '#64748b', fontWeight: 'bold', textAlign: 'center' }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                
                {/* TÊN THÀNH VIÊN */}
                <td style={{ padding: '16px', fontWeight: '500', color: '#0f172a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6', fontWeight: 'bold' }}>
                      {member.name.charAt(0)}
                    </div>
                    {member.name} 
                    {member.userId === currentUser.id && <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>(Bạn)</span>}
                  </div>
                </td>
                
                {/* VAI TRÒ */}
                <td style={{ padding: '16px', color: '#475569' }}>
                  {member.role.includes('Admin') ? (
                    <span style={{ color: '#d97706', fontWeight: 'bold' }}>Thủ quỹ</span>
                  ) : (
                    <span>Thành viên</span>
                  )}
                </td>

                {/* TRẠNG THÁI */}
                <td style={{ padding: '16px' }}>
                  {member.isPaid ? (
                    <span style={{ padding: '4px 12px', backgroundColor: '#d1fae5', color: '#047857', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                      ✅ Đã hoàn thành
                    </span>
                  ) : (
                    <span style={{ padding: '4px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                      ⏳ Chưa đóng quỹ
                    </span>
                  )}
                </td>

                {/* NGÀY THAM GIA */}
                <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                  {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                </td>

                {/* NÚT THAO TÁC (CHỈ HIỂN THỊ VỚI ADMIN) */}
                {isAdmin && (
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {/* Chỉ hiện nút nhắc nhở nếu thành viên đó chưa đóng tiền và không phải là chính mình */}
                    {!member.isPaid && member.userId !== currentUser.id && (
                      <button 
                        onClick={() => handleSendReminder(member)}
                        style={{ 
                          padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #3b82f6', color: '#3b82f6', 
                          borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                      >
                        🔔 Nhắc nhở
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            
            {/* TRƯỜNG HỢP QUỸ CHƯA CÓ AI */}
            {members.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Quỹ này hiện chưa có thành viên nào. Hãy chia sẻ mã tham gia <strong>{currentGroup.joinCode}</strong> cho mọi người nhé!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Members;