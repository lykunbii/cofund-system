import React, { useState } from 'react';
import axios from 'axios';

function Transactions({ transactions, refreshData }) {
  const [inputAmount, setInputAmount] = useState('');
  const [inputNote, setInputNote] = useState('');
  
  // State mới để chứa đường link ảnh QR
  const [qrUrl, setQrUrl] = useState(null); 

  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  // HÀM MỚI: Gọi API để lấy mã QR
  const handleGenerateQR = async () => {
    if (!inputAmount || inputAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ để tạo QR!");
      return;
    }
    try {
      const note = inputNote || "Nop tien quy";
      // Gọi API GET mà chúng ta vừa viết ở Backend
      const res = await axios.get(`${TRANSACTIONS_URL}/payment-qr?amount=${inputAmount}&note=${note}`);
      setQrUrl(res.data.qrUrl);
    } catch (err) {
      alert("Không thể tạo mã QR. Hãy kiểm tra Backend!");
    }
  };

  // Hàm xử lý lưu giao dịch vào DB
  const handleAction = async (type) => {
    if (!inputAmount || inputAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    try {
      const payload = {
        userId: 1, // Tạm thời hardcode, sau này sẽ lấy từ tài khoản đăng nhập
        groupId: 1,
        amount: Number(inputAmount),
        transactionType: type,
        note: inputNote || (type === 1 ? "Nộp tiền quỹ" : "Rút tiền quỹ")
      };

      await axios.post(TRANSACTIONS_URL, payload);
      
      // Thành công thì xóa form và ẩn mã QR đi
      setInputAmount('');
      setInputNote('');
      setQrUrl(null); 
      
      await refreshData(); 
      alert(type === 1 ? "Ghi nhận nộp tiền thành công!" : "Ghi nhận rút tiền thành công!");
    } catch (err) {
      if (err.response && err.response.data) {
        alert("Lỗi: " + err.response.data);
      } else {
        alert("Có lỗi xảy ra: " + err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* CỘT TRÁI: FORM NHẬP LIỆU & QR CODE */}
      <div style={{ flex: 1, backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>Tạo Giao Dịch Mới</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Số tiền (VNĐ)</label>
          <input 
            type="number" 
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="Ví dụ: 50000"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Ghi chú</label>
          <input 
            type="text" 
            value={inputNote}
            onChange={(e) => setInputNote(e.target.value)}
            placeholder="Ví dụ: Tien quy thang 5"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        {/* --- KHU VỰC HIỂN THỊ MÃ QR --- */}
        {qrUrl && (
          <div style={{ marginBottom: '20px', textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>Mã VietQR Thanh Toán</p>
            <img src={qrUrl} alt="Mã QR Thanh Toán" style={{ width: '200px', height: '200px', borderRadius: '8px' }} />
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748b' }}>Sử dụng App ngân hàng để quét mã này</p>
          </div>
        )}

        {/* CÁC NÚT THAO TÁC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Nút Tạo QR */}
          <button 
            onClick={handleGenerateQR} 
            style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            📱 Lấy mã QR Nộp tiền
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Nút Nộp (Lưu DB) */}
            <button 
              onClick={() => handleAction(1)} 
              style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✅ Xác nhận đã nộp
            </button>
            {/* Nút Rút (Lưu DB) */}
            <button 
              onClick={() => handleAction(2)} 
              style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              📤 Rút Quỹ (Admin)
            </button>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: LỊCH SỬ GIAO DỊCH (Giữ nguyên như cũ) */}
      <div style={{ flex: 1, backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>Lịch Sử Giao Dịch</h3>
        
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {transactions.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{item.userName}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{item.note}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: item.transactionType === 1 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  {item.transactionType === 1 ? '+' : '-'}{item.amount.toLocaleString()}đ
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  {new Date(item.transactionDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Chưa có giao dịch nào</div>}
        </div>
      </div>

    </div>
  );
}

export default Transactions;