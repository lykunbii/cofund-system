import React from 'react';

function Dashboard({ goalData }) {
  // CHỐT CHẶN BẢO VỆ: Nếu dữ liệu chưa về kịp thì hiện chữ Đang tải
  if (!goalData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '18px' }}>
        ⏳ Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 24px 0', color: '#0f172a' }}>Tổng quan: {goalData.groupName}</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* CARD 1: SỐ DƯ HIỆN TẠI */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>SỐ DƯ HIỆN TẠI</h3>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
            {goalData.current.toLocaleString()} VNĐ
          </div>
        </div>

        {/* CARD 2: MỤC TIÊU QUỸ */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>MỤC TIÊU CẦN ĐẠT</h3>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>
            {goalData.target.toLocaleString()} VNĐ
          </div>
          
          {/* Thanh tiến độ (Progress Bar) */}
          <div style={{ marginTop: '20px', backgroundColor: '#e2e8f0', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
            <div style={{ 
              backgroundColor: goalData.isGoalAchieved ? '#10b981' : '#3b82f6', 
              height: '100%', 
              width: `${Math.min(goalData.progressPercentage, 100)}%`,
              transition: 'width 0.5s ease-in-out'
            }}></div>
          </div>
          
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            <span>Đạt {goalData.progressPercentage}%</span>
            <span>Còn thiếu: {goalData.remainingAmount.toLocaleString()} VNĐ</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;