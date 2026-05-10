import React from 'react';
import FinanceChat from '../components/FinanceChat'; // Nhúng Trợ lý AI vào đây

function Dashboard({ goalData, currentGroup }) { // Thêm currentGroup vào props để lấy ID
  // CHỐT CHẶN BẢO VỆ: Hiển thị loading xoay mượt mà khi chờ API
  if (!goalData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#64748B', fontSize: '16px', fontWeight: '500' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          ⏳ Đang đồng bộ dữ liệu quỹ...
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Hàm format tiền tệ VNĐ
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* BANNER LỜI CHÀO */}
      <div style={{ 
        padding: '24px 32px', borderRadius: '20px', 
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>
          Tổng quan: {goalData.groupName}
        </h2>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '15px' }}>
          Dữ liệu được cập nhật theo thời gian thực từ hệ thống.
        </p>
      </div>

      {/* KHỐI THẺ THỐNG KÊ (CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* THẺ 1: SỐ DƯ HIỆN TẠI (Nổi bật nhất) */}
        <div style={{ 
          padding: '28px', borderRadius: '24px', 
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
          color: 'white', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Vòng tròn kính mờ */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}></div>
          
          <div style={{ fontSize: '15px', fontWeight: '600', opacity: 0.9, marginBottom: '8px' }}>SỐ DƯ HIỆN TẠI</div>
          <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>
            {formatVND(goalData.current)}
          </div>
        </div>

        {/* THẺ 2: MỤC TIÊU QUỸ & THANH TIẾN ĐỘ */}
        <div style={{ 
          padding: '28px', borderRadius: '24px', backgroundColor: 'white', 
          border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gridColumn: 'span 2' // Thẻ này cho chiếm 2 cột cho đẹp
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>MỤC TIÊU CẦN ĐẠT</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#3B82F6' }}>
                {formatVND(goalData.target)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: goalData.isGoalAchieved ? '#10B981' : '#1E293B' }}>
                {Math.min(goalData.progressPercentage, 100)}%
              </div>
            </div>
          </div>

          {/* Thanh tiến độ Hiện đại */}
          <div style={{ backgroundColor: '#F1F5F9', borderRadius: '999px', height: '12px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ 
              background: goalData.isGoalAchieved ? 'linear-gradient(90deg, #34D399 0%, #10B981 100%)' : 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)', 
              height: '100%', 
              width: `${Math.min(goalData.progressPercentage, 100)}%`,
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '999px'
            }}></div>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748B', fontWeight: '500' }}>
            <span>{goalData.isGoalAchieved ? '🎉 Đã đạt mục tiêu!' : 'Đang tiến hành'}</span>
            <span>Còn thiếu: <strong style={{ color: '#EF4444' }}>{formatVND(goalData.remainingAmount)}</strong></span>
          </div>
        </div>
      </div>

      {/* 🤖 KHU VỰC TRỢ LÝ AI CHATBOT ĐƯỢC NHÚNG VÀO ĐÂY */}
      {currentGroup && currentGroup.id && (
        <div style={{ marginTop: '8px' }}>
          <FinanceChat groupId={currentGroup.id} />
        </div>
      )}

    </div>
  );
}

export default Dashboard;