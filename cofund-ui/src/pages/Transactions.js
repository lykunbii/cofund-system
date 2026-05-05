import React, { useState } from 'react';
import axios from 'axios';

function Transactions({ transactions, refreshData, currentUser, currentGroup, myRole }) {
  const [inputAmount, setInputAmount] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [qrUrl, setQrUrl] = useState(null); 
  
  // STATE MỚI: Quản lý danh mục được chọn
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Danh sách danh mục mẫu khớp với Backend (Seed Data)
  const categories = [
    { id: 1, name: "Đóng quỹ định kỳ", type: 1 },
    { id: 2, name: "Tiền lãi/Tài trợ", type: 1 },
    { id: 3, name: "Mua sắm thiết bị", type: 2 },
    { id: 4, name: "Liên hoan/Sự kiện", type: 2 },
    { id: 5, name: "Chi phí khác", type: 2 }
  ];

  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  const handleGenerateQR = async () => {
    if (!inputAmount || Number(inputAmount) <= 0) {
      return alert("⚠️ Vui lòng nhập số tiền bạn muốn đóng trước khi lấy mã QR!");
    }
    try {
      const res = await axios.get(`${TRANSACTIONS_URL}/payment-qr?amount=${inputAmount}&note=${encodeURIComponent(inputNote || 'NopTienQuy')}`);
      setQrUrl(res.data.qrUrl);
    } catch (err) {
      alert("Lỗi tạo mã QR");
    }
  };

  const handleAction = async (type) => {
    if (!inputAmount || Number(inputAmount) <= 0) return alert("Vui lòng nhập số tiền!");

    // Cảnh báo logic: Rút tiền (type 2) mà lại chọn danh mục Thu (type 1) thì nhắc nhở
    const selectedCat = categories.find(c => c.id === Number(selectedCategoryId));
    if (selectedCat && selectedCat.type !== type) {
      const isConfirm = window.confirm("Cảnh báo: Loại giao dịch và Danh mục phân loại không khớp nhau (Ví dụ: Bạn đang bấm Nộp tiền nhưng lại chọn danh mục Chi tiêu). Bạn có chắc chắn muốn tiếp tục?");
      if (!isConfirm) return;
    }

    try {
      const payload = {
        userId: currentUser.id, 
        groupId: currentGroup.id,
        amount: Number(inputAmount),
        transactionType: type,
        note: inputNote || (type === 1 ? `Nộp quỹ ${currentGroup.name}` : `Rút quỹ ${currentGroup.name}`),
        // Gửi thêm ID danh mục xuống Backend
        categoryId: selectedCategoryId ? Number(selectedCategoryId) : null
      };

      await axios.post(TRANSACTIONS_URL, payload);
      
      // Xóa trắng form sau khi thành công
      setInputAmount(''); 
      setInputNote(''); 
      setSelectedCategoryId('');
      setQrUrl(null); 
      
      await refreshData(); 
      alert(type === 1 ? "Ghi nhận nộp tiền thành công!" : "Ghi nhận rút tiền thành công!");
    } catch (err) {
      alert("Lỗi: " + (err.response?.data || err.message));
    }
  };

  const isAdmin = myRole && myRole.includes('Admin');

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      
      {/* CỘT TRÁI: FORM NHẬP */}
      <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Tạo Giao Dịch Mới</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Số tiền (VNĐ) <span style={{color:'red'}}>*</span></label>
          <input 
            type="number" 
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="Ví dụ: 500000" 
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        {/* Ô CHỌN DANH MỤC (CATEGORY) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phân loại danh mục</label>
          <select 
            value={selectedCategoryId} 
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: 'white' }}
          >
            <option value="">-- Chưa phân loại --</option>
            <optgroup label="📥 Nhóm Khoản Thu">
              {categories.filter(c => c.type === 1).map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="📤 Nhóm Khoản Chi">
              {categories.filter(c => c.type === 2).map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Ghi chú chi tiết</label>
          <input 
            type="text" 
            value={inputNote}
            onChange={(e) => setInputNote(e.target.value)}
            placeholder="Ví dụ: Đóng quỹ tháng 5" 
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        {qrUrl && (
          <div style={{ marginTop: '20px', textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#0f172a' }}>Quét mã để chuyển khoản</p>
            <img src={qrUrl} alt="Mã QR Thanh Toán" style={{ width: '200px', height: '200px', objectFit: 'contain' }} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          <button onClick={handleGenerateQR} style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            📱 Lấy mã QR Nộp tiền
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleAction(1)} style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✅ Ghi nhận Thu
            </button>
            
            {isAdmin && (
              <button onClick={() => handleAction(2)} style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                📤 Ghi nhận Chi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: LỊCH SỬ GIAO DỊCH */}
      <div style={{ flex: '1 1 450px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Lịch Sử Giao Dịch</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                  {t.transactionType === 1 ? '📥 Nộp vào' : '📤 Rút ra'} - {t.userName || 'Thành viên'}
                </div>
                
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{new Date(t.transactionDate).toLocaleString('vi-VN')}</span>
                  {/* HIỂN THỊ NHÃN DANH MỤC */}
                  <span style={{ 
                    padding: '2px 8px', 
                    backgroundColor: t.transactionType === 1 ? '#d1fae5' : '#fee2e2', 
                    color: t.transactionType === 1 ? '#047857' : '#b91c1c', 
                    borderRadius: '12px', 
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    🏷️ {t.categoryName || 'Chưa phân loại'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: '#475569', marginTop: '6px', fontStyle: 'italic' }}>
                  "{t.note}"
                </div>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: t.transactionType === 1 ? '#10b981' : '#ef4444' }}>
                {t.transactionType === 1 ? '+' : '-'}{t.amount.toLocaleString()}đ
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Chưa có giao dịch nào.</p>}
        </div>
      </div>
      
    </div>
  );
}

export default Transactions;