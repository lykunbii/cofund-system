import React, { useState } from 'react';
import api from '../services/api'; 

function Transactions({ transactions, refreshData, currentUser, currentGroup, myRole }) {
  const [inputAmount, setInputAmount] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [qrUrl, setQrUrl] = useState(null); 
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States cho form Cấu hình Ngân hàng của Admin
  const [bankBin, setBankBin] = useState(currentGroup?.bankBin || '');
  const [bankAccNumber, setBankAccNumber] = useState(currentGroup?.bankAccountNumber || '');
  const [bankAccName, setBankAccName] = useState(currentGroup?.bankAccountName || '');

  const categories = [
    { id: 1, name: "Đóng quỹ định kỳ", type: 1 },
    { id: 2, name: "Tiền lãi/Tài trợ", type: 1 },
    { id: 3, name: "Mua sắm thiết bị", type: 2 },
    { id: 4, name: "Liên hoan/Sự kiện", type: 2 },
    { id: 5, name: "Chi phí khác", type: 2 }
  ];

  const isAdmin = myRole && myRole.includes('Admin');
  const isBankConfigured = currentGroup?.bankAccountNumber && currentGroup?.bankBin;

  // HÀM 1: ADMIN LƯU TÀI KHOẢN NGÂN HÀNG
  const handleSaveBankInfo = async () => {
    if (!bankBin || !bankAccNumber || !bankAccName) return alert("Vui lòng nhập đủ thông tin ngân hàng!");
    setIsSubmitting(true);
    try {
      await api.put(`/Transactions/group/${currentGroup.id}/bank-info`, {
        bankBin,
        bankAccountNumber: bankAccNumber,
        bankAccountName: bankAccName
      });
      alert("✅ Lưu tài khoản nhận tiền thành công!");
      refreshData(); // Load lại để nhận biến isBankConfigured mới
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || "Không thể lưu thông tin."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // HÀM 2: MEMBER/ADMIN LẤY MÃ QR
  const handleGenerateQR = async (e) => {
    e.preventDefault(); 
    if (!inputAmount || Number(inputAmount) <= 0) {
      return alert("⚠️ Vui lòng nhập số tiền bạn muốn đóng trước khi lấy mã QR!");
    }
    
    // Chặn ngay tại Frontend nếu chưa cấu hình
    if (!isBankConfigured) {
      return alert("Thủ quỹ chưa cấu hình tài khoản nhận tiền. Bạn chưa thể quét mã QR lúc này!");
    }

    try {
      const res = await api.get(`/Transactions/payment-qr/${currentGroup.id}?amount=${inputAmount}&note=${encodeURIComponent(inputNote || 'Nop quy')}`);
      setQrUrl(res.data.qrUrl);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || "Không thể tạo mã QR"));
    }
  };

  // 🌟 MỚI THÊM: HÀM DUYỆT/TỪ CHỐI GIAO DỊCH DÀNH CHO ADMIN
  const handleApprove = async (id, status) => {
    if (!window.confirm(status === 1 ? "Xác nhận DUYỆT giao dịch này? Số dư sẽ được cập nhật." : "Bạn có chắc muốn TỪ CHỐI giao dịch này?")) return;
    try {
      await api.put(`/Transactions/${id}/approve?status=${status}`);
      refreshData(); // Cập nhật lại số dư và trạng thái trên UI
    } catch (err) {
      alert("Lỗi xử lý: " + (err.response?.data?.message || "Không thể thực hiện"));
    }
  };

  // HÀM 3: GHI NHẬN GIAO DỊCH
  const handleAction = async (type) => {
    if (!inputAmount || Number(inputAmount) <= 0) return alert("Vui lòng nhập số tiền!");

    const selectedCat = categories.find(c => c.id === Number(selectedCategoryId));
    if (selectedCat && selectedCat.type !== type) {
      const isConfirm = window.confirm("Cảnh báo: Loại giao dịch và Danh mục không khớp nhau. Bạn có chắc chắn muốn tiếp tục?");
      if (!isConfirm) return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/Transactions', {
        userId: currentUser.id, 
        groupId: currentGroup.id,
        amount: Number(inputAmount),
        transactionType: type,
        note: inputNote || (type === 1 ? `Nộp quỹ ${currentGroup.name}` : `Rút quỹ ${currentGroup.name}`),
        categoryId: selectedCategoryId ? Number(selectedCategoryId) : null
      });
      
      setInputAmount(''); setInputNote(''); setSelectedCategoryId(''); setQrUrl(null); 
      await refreshData(); 
      // Đã sửa thông báo vì giao dịch giờ phải qua chờ duyệt
      alert(type === 1 ? "✅ Đã gửi yêu cầu nộp tiền, vui lòng chờ Admin duyệt!" : "✅ Đã gửi yêu cầu rút tiền, vui lòng chờ Admin duyệt!");
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || "Không thể thực hiện giao dịch."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 🌟 KHU VỰC DÀNH RIÊNG CHO ADMIN: CẤU HÌNH NGÂN HÀNG */}
      {isAdmin && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #3B82F6', borderLeft: '8px solid #3B82F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🏦</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Cài đặt Tài khoản nhận tiền (Dành cho Admin)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Ngân hàng</label>
              <select value={bankBin} onChange={(e) => setBankBin(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <option value="">-- Chọn ngân hàng --</option>
                <option value="VCB">Vietcombank</option>
                <option value="MB">MB Bank</option>
                <option value="TCB">Techcombank</option>
                <option value="ICB">VietinBank</option>
                <option value="BIDV">BIDV</option>
                <option value="ACB">ACB</option>
                <option value="VPB">VPBank</option>
                <option value="TPB">TPBank</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Số tài khoản</label>
              <input type="text" value={bankAccNumber} onChange={(e) => setBankAccNumber(e.target.value)} placeholder="Nhập STK..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Tên người nhận (Không dấu)</label>
              <input type="text" value={bankAccName} onChange={(e) => setBankAccName(e.target.value.toUpperCase())} placeholder="VD: NGUYEN VAN A" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxSizing: 'border-box', textTransform: 'uppercase' }} />
            </div>
            <button onClick={handleSaveBankInfo} disabled={isSubmitting} style={{ padding: '12px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              💾 Lưu cấu hình
            </button>
          </div>
        </div>
      )}

      {/* KHỐI FORM NHẬP VÀ QR CODE */}
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>Tạo Giao Dịch Mới</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Số tiền (VNĐ) <span style={{color:'#EF4444'}}>*</span></label>
              <input type="number" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} placeholder="Ví dụ: 500000" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC', fontSize: '15px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Phân loại danh mục</label>
              <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC', fontSize: '15px', color: '#1E293B' }}>
                <option value="">-- Chưa phân loại --</option>
                <optgroup label="📥 Nhóm Khoản Thu">
                  {categories.filter(c => c.type === 1).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </optgroup>
                <optgroup label="📤 Nhóm Khoản Chi">
                  {categories.filter(c => c.type === 2).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </optgroup>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Ghi chú chi tiết</label>
              <input type="text" value={inputNote} onChange={(e) => setInputNote(e.target.value)} placeholder="Ví dụ: Đóng quỹ tháng 5" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC', fontSize: '15px' }} />
            </div>

            {/* MÃ QR SẼ HIỆN Ở ĐÂY */}
            {qrUrl && (
              <div style={{ marginTop: '8px', textAlign: 'center', padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1' }}>
                <p style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#0F172A', fontSize: '15px' }}>Quét mã bằng App Ngân hàng</p>
                <img src={qrUrl} alt="Mã QR VietQR" style={{ width: '220px', height: '220px', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#10B981', fontWeight: 'bold' }}>Tự động điền số tiền & lời nhắn!</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={handleGenerateQR} 
                style={{ padding: '14px', backgroundColor: isBankConfigured ? '#EFF6FF' : '#F1F5F9', color: isBankConfigured ? '#2563EB' : '#94A3B8', border: `1px solid ${isBankConfigured ? '#BFDBFE' : '#E2E8F0'}`, borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: isBankConfigured ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <span>📱</span> {isBankConfigured ? 'Lấy mã QR Nộp tiền' : 'Chưa cấu hình tài khoản'}
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleAction(1)} disabled={isSubmitting} style={{ flex: 1, padding: '14px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Đang xử lý...' : '✅ Ghi nhận Thu'}
                </button>
                {isAdmin && (
                  <button onClick={() => handleAction(2)} disabled={isSubmitting} style={{ flex: 1, padding: '14px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'Đang xử lý...' : '📤 Ghi nhận Chi'}
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* CỘT PHẢI: LỊCH SỬ GIAO DỊCH (ĐÃ THÊM LOGIC PHÊ DUYỆT VÀ CHỮA UI) */}
        <div style={{ flex: '1 1 500px', backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
           <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>Lịch Sử Giao Dịch</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {transactions.map(t => (
              <div key={t.id} style={{ 
                display: 'flex', flexDirection: 'column', // Đổi sang column để chứa các nút ở dưới
                padding: '20px', border: '1px solid #E2E8F0', borderRadius: '16px', 
                backgroundColor: t.status === 0 ? '#FEF9C3' : '#F8FAFC' // Đổi màu vàng nhạt nếu đang chờ duyệt
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: t.transactionType === 1 ? '#D1FAE5' : '#FEE2E2', color: t.transactionType === 1 ? '#10B981' : '#EF4444', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>
                        {t.transactionType === 1 ? '↓' : '↑'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>{t.userName || t.user?.fullName || 'Thành viên'}</div>
                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{new Date(t.transactionDate).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '52px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 10px', backgroundColor: t.transactionType === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: t.transactionType === 1 ? '#059669' : '#DC2626', borderRadius: '8px', fontWeight: '700', fontSize: '11px' }}>
                        🏷️ {t.categoryName || 'Chưa phân loại'}
                      </span>
                      
                      {/* BỔ SUNG: HUY HIỆU TRẠNG THÁI */}
                      {t.status === 0 && <span style={{ padding: '4px 8px', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>⏳ Chờ duyệt</span>}
                      {t.status === 1 && <span style={{ padding: '4px 8px', backgroundColor: '#D1FAE5', color: '#059669', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>✅ Đã duyệt</span>}
                      {t.status === 2 && <span style={{ padding: '4px 8px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>❌ Từ chối</span>}
                      
                      <span style={{ fontSize: '14px', color: '#475569', fontStyle: 'italic', width: '100%', marginTop: '4px' }}>"{t.note}"</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '18px', color: t.transactionType === 1 ? '#10B981' : '#EF4444', paddingLeft: '16px', textAlign: 'right' }}>
                    {t.transactionType === 1 ? '+' : '-'}{t.amount.toLocaleString()}đ
                  </div>
                </div>

                {/* BỔ SUNG: NÚT DUYỆT VÀ TỪ CHỐI CHO ADMIN */}
                {isAdmin && t.status === 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #CBD5E1' }}>
                    <button 
                      onClick={() => handleApprove(t.id, 2)}
                      style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Từ chối
                    </button>
                    <button 
                      onClick={() => handleApprove(t.id, 1)}
                      style={{ padding: '8px 16px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Duyệt ngay
                    </button>
                  </div>
                )}
              </div>
            ))}
            {transactions.length === 0 && (
               <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                 <p style={{ margin: 0, color: '#64748B', fontSize: '15px', fontWeight: '500' }}>Quỹ chưa có giao dịch nào.</p>
               </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Transactions;