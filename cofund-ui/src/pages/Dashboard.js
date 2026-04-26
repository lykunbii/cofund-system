import React from 'react';

function Dashboard({ goalData }) {
  if (!goalData) return <div>Đang tải dữ liệu tổng quan...</div>;

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '20px' }}>🏆 {goalData.groupName}</h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#475569' }}>
        <span>Mục tiêu: <b style={{color: '#0f172a'}}>{goalData.target.toLocaleString()}đ</b></span>
        <span>Số dư: <b style={{color: '#10b981'}}>{goalData.current.toLocaleString()}đ</b></span>
      </div>

      <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '999px', height: '24px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ 
          height: '100%', textAlign: 'center', color: 'white', fontSize: '12px', lineHeight: '24px', transition: 'width 0.5s', fontWeight: 'bold',
          width: `${goalData.progressPercentage > 100 ? 100 : goalData.progressPercentage}%`,
          backgroundColor: goalData.isGoalAchieved ? '#10b981' : '#3b82f6'
        }}>
          {goalData.progressPercentage}%
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', margin: 0 }}>
        {goalData.isGoalAchieved 
          ? "🎉 Chúc mừng! Quỹ đã đạt mục tiêu." 
          : `🚀 Còn thiếu ${goalData.remainingAmount.toLocaleString()}đ nữa.`}
      </p>
    </div>
  );
}

export default Dashboard;