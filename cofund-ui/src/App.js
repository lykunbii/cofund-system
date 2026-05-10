import React, { useState, useEffect } from 'react';
import api from './services/api'; // ĐÃ SỬA: Dùng máy kẹp thẻ tự động thay cho axios gốc

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

  // 2. STATE DỮ LIỆU CỦA QUỸ VÀ QUYỀN HẠN
  const [goalData, setGoalData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [myRole, setMyRole] = useState('Member'); 
  const [loading, setLoading] = useState(false);

  // ==========================================
  // [MỚI] TỰ ĐỘNG KHÔI PHỤC ĐĂNG NHẬP KHI F5 TRANG
  // ==========================================
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // ==========================================
  // [MỚI] HÀM XỬ LÝ ĐĂNG XUẤT
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentGroup(null);
  };

  // 3. HÀM TẢI DỮ LIỆU: Chỉ chạy khi người dùng đã CHỌN ĐƯỢC NHÓM
  const fetchGroupData = async () => {
    if (!currentGroup) return;
    
    setLoading(true);
    try {
      // ĐÃ SỬA: Dùng `api.get` và bỏ chuỗi `http://localhost:5099/api` đi
      const [resProgress, resHistory, resMembers] = await Promise.all([
        api.get(`/Transactions/goal-progress/${currentGroup.id}`),
        api.get(`/Transactions/group/${currentGroup.id}`), 
        api.get(`/Transactions/group-members/${currentGroup.id}`)
      ]);
      
      setGoalData(resProgress.data);
      setTransactions(resHistory.data);
      setGroupMembers(resMembers.data);

      const me = resMembers.data.find(m => m.userId === currentUser.id);
      if (me) {
        setMyRole(me.role);
      }

    } catch (err) {
      console.error("Lỗi khi tải dữ liệu quỹ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentGroup) {
      fetchGroupData();
    }
  }, [currentGroup]);

  // ==========================================
  // CÁC CHỐT CHẶN BẢO VỆ (ROUTING)
  // ==========================================

  // CHỐT 1: Chưa đăng nhập -> Trả về form Đăng nhập/Đăng ký
  if (!currentUser) {
    return <Auth onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // CHỐT 2: Đã đăng nhập nhưng chưa chọn nhóm -> Trả về Sảnh chờ (Welcome)
  if (!currentGroup) {
    return (
      <Welcome 
        currentUser={currentUser} 
        onJoinSuccess={(group) => setCurrentGroup(group)} 
        onLogout={handleLogout} // TRUYỀN HÀM ĐĂNG XUẤT VÀO SẢNH CHỜ
      />
    );
  }

  // CHỐT 3: Đang gọi API tải dữ liệu -> Hiện màn hình chờ
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '18px' }}>
        ⏳ Đang đồng bộ dữ liệu hệ thống...
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH KHI ĐÃ TẢI XONG DỮ LIỆU
  // ==========================================
  return (
    <MainLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser}
      onBackToLobby={() => setCurrentGroup(null)} 
      onLogout={handleLogout} // TRUYỀN HÀM ĐĂNG XUẤT VÀO MAIN LAYOUT
    >
      
      {activeTab === 'dashboard' && <Dashboard goalData={goalData} currentGroup={currentGroup} />}
      
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions} 
          refreshData={fetchGroupData} 
          currentUser={currentUser}       
          currentGroup={currentGroup}     
          myRole={myRole}                 
        />
      )}

      {activeTab === 'members' && (
        <Members 
          members={groupMembers}          
          myRole={myRole}                 
          currentUser={currentUser}       
        />
      )}
      
      {activeTab === 'reports' && <Reports currentGroup={currentGroup} />}
  
    </MainLayout>
  );
}

export default App;