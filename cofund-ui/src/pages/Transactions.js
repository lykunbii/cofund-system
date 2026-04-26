import React, { useState } from 'react';
import axios from 'axios';

function Transactions({ transactions, refreshData }) {
  const [inputAmount, setInputAmount] = useState('');
  const [inputNote, setInputNote] = useState('');

  const TRANSACTIONS_URL = 'http://localhost:5099/api/Transactions';

  const handleAction = async (type) => {
    if (!inputAmount || inputAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    try {
      const payload = {
        userId: 1,
        groupId: 1,
        amount: Number(inputAmount),
        transactionType: type,
        note: inputNote || (type === 1 ? "Nộp tiền quỹ" : "Rút tiền quỹ")
      };

      await axios.post(TRANSACTIONS_URL, payload);
      
      setInputAmount('');
      setInputNote('');
      await refreshData(); // Gọi hàm tải lại dữ liệu mới nhất
      
      alert(type === 1 ? "Nộp tiền thành công!" : "Rút tiền thành công!");
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
      
      {/* CỘT TRÁI: FORM NHẬP LIỆU */}
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
            placeholder="Ví dụ: Nộp quỹ tháng 5"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handleAction(1)} style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            📥 Nộp Quỹ
          </button>
          <button onClick={() => handleAction(2)} style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            📤 Rút Quỹ
          </button>
        </div>
      </div>

      {/* CỘT PHẢI: LỊCH SỬ GIAO DỊCH */}
      <div style={{ flex: 1, backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>Lịch Sử Giao Dịch</h3>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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