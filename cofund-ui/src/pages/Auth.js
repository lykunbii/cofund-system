import React, { useState } from 'react';
import axios from 'axios';

function Auth({ onLoginSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // States lưu dữ liệu form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Đường dẫn đến AuthController của bạn
  const AUTH_URL = 'http://localhost:5099/api/Auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra xem user có nhập thiếu ô nào không
    if (!email || !password || (!isLoginMode && !fullName)) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      if (isLoginMode) {
        // LUỒNG 1: GỌI API ĐĂNG NHẬP
        const res = await axios.post(`${AUTH_URL}/login`, { 
          email: email, 
          password: password 
        });
        
        // Đăng nhập thành công, đẩy thông tin User ra App.js để cho phép vào hệ thống
        onLoginSuccess(res.data.user); 
        
      } else {
        // LUỒNG 2: GỌI API ĐĂNG KÝ
        const res = await axios.post(`${AUTH_URL}/register`, { 
          fullName: fullName, 
          email: email, 
          password: password 
        });
        
        alert("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
        
        // Đăng ký xong tự động lật sang form Đăng nhập và xóa ô password
        setIsLoginMode(true); 
        setPassword('');
      }
    } catch (err) {
      // Bắt lỗi từ Backend (Ví dụ: Trùng email, sai mật khẩu...)
      if (err.response && err.response.data) {
        // Vì Backend có thể trả về string hoặc object, ta xử lý khéo léo một chút
        const errorMsg = typeof err.response.data === 'string' 
            ? err.response.data 
            : err.response.data.title || "Có lỗi xảy ra";
        alert("Lỗi: " + errorMsg);
      } else {
        alert("Không thể kết nối tới máy chủ Backend!");
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, Arial, sans-serif' }}>
      
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '28px' }}>CoFund</h1>
          <p style={{ margin: 0, color: '#64748b' }}>
            {isLoginMode ? 'Đăng nhập để quản lý quỹ' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLoginMode && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Họ và Tên</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" style={{ marginTop: '8px', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            {isLoginMode ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          {isLoginMode ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <span 
            onClick={() => setIsLoginMode(!isLoginMode)}
            style={{ color: '#3b82f6', fontWeight: '600', cursor: 'pointer' }}
          >
            {isLoginMode ? 'Đăng ký ngay' : 'Đăng nhập'}
          </span>
        </div>

      </div>
    </div>
  );
}

export default Auth;