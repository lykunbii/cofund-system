import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // States chứa dữ liệu
  const [goalData, setGoalData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm tải dữ liệu tổng từ Backend
  const fetchData = async () => {
    try {
      const [resProgress, resHistory] = await Promise.all([
        axios.get('http://localhost:5099/api/Transactions/goal-progress/1'),
        axios.get('http://localhost:5099/api/Transactions')
      ]);
      setGoalData(resProgress.data);
      setTransactions(resHistory.data);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang khởi động hệ thống...</div>;

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* CHUYỂN TRANG */}
      {activeTab === 'dashboard' && <Dashboard goalData={goalData} />}
      
      {activeTab === 'transactions' && (
        <Transactions transactions={transactions} refreshData={fetchData} />
      )}

      {activeTab === 'members' && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px' }}>
          <h2>Thành viên</h2><p>Đang chờ bạn Lý lên ý tưởng thiết kế...</p>
        </div>
      )}
      
      {activeTab === 'reports' && <Reports />}

    </MainLayout>
  );
}

export default App;