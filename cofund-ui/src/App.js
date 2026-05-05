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

  // 2. STATE DỮ LIỆU CỦA QUỸ VÀ QUYỀN HẠN
  const [goalData, setGoalData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [myRole, setMyRole] = useState('Member'); // Mặc định là Member
  const [loading, setLoading] = useState(false);

  // 3. HÀM TẢI DỮ LIỆU: Chỉ chạy khi người dùng đã CHỌN ĐƯỢC NHÓM
  const fetchGroupData = async () => {
    if (!currentGroup) return;
    
    setLoading(true);
    try {
      // Gọi cả 3 API cùng lúc để tối ưu thời gian chờ
      const [resProgress, resHistory, resMembers] = await Promise.all([
        axios.get(`http://localhost:5099/api/Transactions/goal-progress/${currentGroup.id}`),
        
        // 🌟 GỌI ĐÚNG API LỌC THEO NHÓM MÀ CHÚNG TA VỪA VIẾT
        axios.get(`http://localhost:5099/api/Transactions/group/${currentGroup.id}`), 
        
        axios.get(`http://localhost:5099/api/Transactions/group-members/${currentGroup.id}`)
      ]);
      
      setGoalData(resProgress.data);
      setTransactions(resHistory.data);
      setGroupMembers(resMembers.data);

      // Tìm xem user đang đăng nhập có quyền gì trong danh sách thành viên trả về
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

  // Tự động tải lại dữ liệu mỗi khi biến `currentGroup` thay đổi (VD: Vừa click chọn quỹ)
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
      onBackToLobby={() => setCurrentGroup(null)} // Lệnh xóa Group để văng ra Sảnh
    >
      
      {activeTab === 'dashboard' && <Dashboard goalData={goalData} />}
      
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions} 
          refreshData={fetchGroupData} 
          currentUser={currentUser}       // Truyền User thật xuống
          currentGroup={currentGroup}     // Truyền Group thật xuống
          myRole={myRole}                 // Truyền Quyền xuống để ẩn/hiện nút Rút quỹ
        />
      )}

      {activeTab === 'members' && (
        <Members 
          members={groupMembers}          // Truyền danh sách thành viên thật
          myRole={myRole}                 // Truyền Quyền xuống để ẩn/hiện nút Admin
          currentUser={currentUser}       // Để file Members nhận diện được "Ai là Bạn"
        />
      )}
      
      {activeTab === 'reports' && <Reports currentGroup={currentGroup} />}
  

    </MainLayout>
  );
}

export default App;