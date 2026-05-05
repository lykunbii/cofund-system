import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Reports({ currentGroup }) {
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${TRANSACTIONS_URL}/payment-stats/${currentGroup.id}`);
        setStatsData(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu thống kê", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentGroup.id]);

  // HÀM GỌI API XUẤT EXCEL (.NET Developer ghi điểm ở đây!)
  const handleExportExcel = async () => {
    setDownloading(true);
    try {
      // Quan trọng: Phải cấu hình responseType là 'blob' để nhận file nhị phân từ Backend
      const response = await axios.get(`${TRANSACTIONS_URL}/export/${currentGroup.id}`, {
        responseType: 'blob',
      });

      // Kỹ thuật tải file trong React
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Đặt tên file khi tải về
      const fileName = `BaoCao_Quy_${currentGroup.name.replace(/\s+/g, '_')}.xlsx`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      
      // Dọn dẹp
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Lỗi khi tải báo cáo Excel!");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <p>⏳ Đang tải dữ liệu báo cáo...</p>;

  // Tính tổng số người để hiển thị
  const totalMembers = statsData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Báo Cáo Thống Kê</h2>
        
        {/* NÚT XUẤT EXCEL THẦN THÁNH */}
        <button 
          onClick={handleExportExcel}
          disabled={downloading}
          style={{ 
            padding: '12px 20px', 
            backgroundColor: downloading ? '#94a3b8' : '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: downloading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {downloading ? '⏳ Đang tạo file...' : '📊 Tải Báo Cáo Excel'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* BIỂU ĐỒ TRÒN THỐNG KÊ THÀNH VIÊN */}
        <div style={{ flex: '1 1 400px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Tỷ lệ đóng quỹ (Tổng: {totalMembers} người)</h3>
          
          {totalMembers === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center' }}>Chưa có thành viên nào.</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} người`, 'Số lượng']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* BẢNG TÓM TẮT BÊN CẠNH BIỂU ĐỒ */}
        <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Thông tin quỹ</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <span style={{ color: '#64748b' }}>Tên quỹ:</span>
                <strong style={{ color: '#0f172a' }}>{currentGroup.name}</strong>
             </li>
             <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <span style={{ color: '#64748b' }}>Mục tiêu:</span>
                <strong style={{ color: '#3b82f6' }}>{currentGroup.targetAmount.toLocaleString()} đ</strong>
             </li>
             <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <span style={{ color: '#64748b' }}>Đã thu:</span>
                <strong style={{ color: '#10b981' }}>{currentGroup.currentBalance.toLocaleString()} đ</strong>
             </li>
             <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã tham gia:</span>
                <strong style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>{currentGroup.joinCode}</strong>
             </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default Reports;