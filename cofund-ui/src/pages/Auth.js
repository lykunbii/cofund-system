import React, { useState } from 'react';
import api from '../services/api'; 
import axios from 'axios';

function Auth({ onLoginSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // States dữ liệu
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Đường dẫn Backend Auth
  const AUTH_URL = 'http://localhost:5099/api/Auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || (!isLoginMode && !fullName)) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      if (isLoginMode) {
        // --- LUỒNG ĐĂNG NHẬP ---
        const res = await axios.post(`${AUTH_URL}/login`, { email, password });
        
        // BỌC THÉP: Lấy đúng Token dù C# trả về viết hoa hay viết thường
        const actualToken = res.data.token || res.data.Token;
        const actualUser = res.data.user || res.data.User;

        if (!actualToken) {
           alert("Lỗi hệ thống: Backend không trả về Thẻ bảo mật (Token)!");
           return;
        }

        // Lưu thẻ JWT và Info
        localStorage.setItem('token', actualToken);
        localStorage.setItem('user', JSON.stringify(actualUser));
        
        alert("Đăng nhập thành công!");
        onLoginSuccess(actualUser);
      } else {
        // --- LUỒNG ĐĂNG KÝ ---
        const res = await axios.post(`${AUTH_URL}/register`, { fullName, email, password });
        
        alert("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
        setIsLoginMode(true); 
        setPassword(''); // Xóa mật khẩu cũ đi để bắt user gõ lại khi login
      }
    } catch (err) {
      // Bắt lỗi an toàn từ Backend trả về
      const errorMsg = err.response?.data?.message || err.response?.data?.title || "Không thể kết nối tới máy chủ Backend!";
      alert("Lỗi: " + errorMsg);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '28px', margin: '0 auto 16px auto' }}>
            C
          </div>
          <h1 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '28px', fontWeight: '800' }}>CoFund.</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
            {isLoginMode ? 'Đăng nhập để quản lý quỹ' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLoginMode && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Họ và Tên</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
          </div>

          <button type="submit" style={{ marginTop: '8px', padding: '14px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}>
            {isLoginMode ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
          {isLoginMode ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <span onClick={() => setIsLoginMode(!isLoginMode)} style={{ color: '#3B82F6', fontWeight: '700', cursor: 'pointer' }}>
            {isLoginMode ? 'Đăng ký ngay' : 'Đăng nhập'}
          </span>
        </div>

      </div>
    </div>
  );
}

export default Auth;