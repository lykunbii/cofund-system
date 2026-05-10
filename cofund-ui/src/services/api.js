import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5099/api',
});

// 1. TRƯỚC KHI GỬI ĐI: Tự động móc Token từ ví (LocalStorage) kẹp vào Header
api.interceptors.request.use((config) => {
  // Lấy token ra (Chú ý lấy đúng tên 'token' mà lúc đăng nhập đã lưu)
  const token = localStorage.getItem('token');
  if (token) {
    // BẮT BUỘC phải có chữ Bearer và khoảng trắng phía trước token
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. KHI NHẬN KẾT QUẢ VỀ: Bắt lỗi 401 (Hết hạn / Sai thẻ)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      alert("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!");
      localStorage.clear(); // Xóa sạch thẻ cũ bị lỗi
      window.location.reload(); // Tải lại trang để văng ra màn hình Login
    }
    return Promise.reject(error);
  }
);

export default api;