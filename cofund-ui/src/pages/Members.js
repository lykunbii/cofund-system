import React, { useState } from 'react';

function Members() {
  const [members] = useState([
    { id: 1, name: 'Nguyễn Thị Lý', role: 'Admin (Thủ quỹ)', isPaid: true },
    { id: 2, name: 'Hồ Quang Tuấn', role: 'Thành viên', isPaid: true },
    { id: 3, name: 'Nguyễn Thị Minh Nguyệt', role: 'Thành viên', isPaid: false },
    { id: 4, name: 'Cao Thị Thắm', role: 'Thành viên', isPaid: false },
  ]);

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: '0 0 24px 0', color: '#0f172a' }}>Danh sách Thành viên</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '12px' }}>Họ và Tên</th>
            <th style={{ padding: '12px' }}>Vai trò</th>
            <th style={{ padding: '12px' }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{m.name}</td>
              <td style={{ padding: '12px' }}>{m.role}</td>
              <td style={{ padding: '12px', color: m.isPaid ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {m.isPaid ? '✅ Đã nộp' : '⏳ Chưa nộp'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Members;