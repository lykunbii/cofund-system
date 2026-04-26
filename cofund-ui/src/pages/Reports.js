import React from 'react';
import axios from 'axios';

function Reports() {
  const handleExportExcel = async () => {
    try {
      const response = await axios.get('http://localhost:5099/api/Transactions/export/1', {
        responseType: 'blob', 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_ThuChi_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Có lỗi khi xuất file Excel! Hãy kiểm tra Backend.");
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>Báo Cáo & Thống Kê</h2>
      <p style={{ color: '#475569', marginBottom: '24px' }}>
        Trích xuất dữ liệu dòng tiền của nhóm để lưu trữ hoặc nộp báo cáo. File xuất ra sẽ có định dạng .xlsx, chứa đầy đủ mã giao dịch, thời gian và ghi chú.
      </p>
      
      <button 
        onClick={handleExportExcel}
        style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span style={{ fontSize: '18px' }}>📊</span> Tải File Báo Cáo Excel
      </button>
    </div>
  );
}

export default Reports;