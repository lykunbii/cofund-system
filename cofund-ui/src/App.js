import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import Layout và các trang (Pages)
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Members from './pages/Members';
import Reports from './pages/Reports';
import Auth from './pages/Auth';
import Welcome from './pages/Welcome';

function App() {
  // 1. STATE BẢO VỆ & ĐIỀU HƯỚNG
  const [currentUser, setCurrentUser] = useState(null); 
  const [currentGroup, setCurrentGroup] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');

  // 2. STATE DỮ LIỆU CỦA QUỸ
  const [goalData, setGoalData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Hàm tải dữ liệu: Chỉ chạy khi người dùng đã CHỌN ĐƯỢC NHÓM
  const fetchGroupData = async () => {
    if (!currentGroup) return;
    
    setLoading(true);
    try {
      // Gọi API lấy Tiến độ và Lịch sử theo đúng ID của nhóm hiện tại
      // Chú ý: Ở Backend, API GetTransactions hiện đang lấy tất cả, nếu sau này cần, bạn update backend lọc theo groupId nhé!
      const [resProgress, resHistory] = await Promise.all([
        axios.get(`http://localhost:5099/api/Transactions/goal-progress/${currentGroup.id}`),
        axios.get(`http://localhost:5099/api/Transactions`) 
      ]);
      setGoalData(resProgress.data);
      setTransactions(resHistory.data);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại dữ liệu mỗi khi `currentGroup` thay đổi (vừa tham gia nhóm xong)
  useEffect(() => {
    if (currentGroup) {
      fetchGroupData();
    }
  }, [currentGroup]);

  // ==========================================
  // CÁC CHỐT CHẶN BẢO VỆ (ROUTING BẰNG TAY)
  // ==========================================

  // CHỐT 1: Chưa đăng nhập -> Trả về trang Auth
  if (!currentUser) {
    return <Auth onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // CHỐT 2: Đã đăng nhập nhưng CHƯA CÓ NHÓM -> Trả về trang Welcome
  if (!currentGroup) {
    return (
      <Welcome 
        currentUser={currentUser} 
        onJoinSuccess={(group) => setCurrentGroup(group)} 
      />
    );
  }

  // CHỐT 3: Đang tải dữ liệu từ Backend -> Hiện màn hình chờ
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '18px' }}>
        ⏳ Đang đồng bộ dữ liệu quỹ...
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH KHI ĐÃ ĐẦY ĐỦ ĐIỀU KIỆN
  // ==========================================
  return (
    <MainLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser} // Truyền tên user xuống Header nếu muốn
    >
      
      {activeTab === 'dashboard' && <Dashboard goalData={goalData} />}
      
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions} 
          refreshData={fetchGroupData} 
          // Bạn có thể truyền thêm currentUser và currentGroup xuống file Transactions.js 
          // để lấy linh động ID thay vì gán cứng số 1 như hiện tại nhé!
        />
      )}

      {activeTab === 'members' && <Members />}
      
      {activeTab === 'reports' && <Reports currentGroup={currentGroup} />}

    </MainLayout>
  );
}

export default App;