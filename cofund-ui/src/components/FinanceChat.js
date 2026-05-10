import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function FinanceChat({ groupId }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Chào bạn! Tôi là trợ lý AI của CoFund. Bạn cần tôi phân tích gì về quỹ này không? 🤖' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    
    // Hiện câu hỏi của người dùng lên màn hình
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      // Gọi API Chat AI
      const res = await api.post(`/Transactions/ai-chat/${groupId}`, { message: userText });
      
      // Nhận câu trả lời từ AI và in ra màn hình
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (err) {
      console.error("CHI TIẾT LỖI GỐC:", err);
      
      // 👉 ĐÃ SỬA: Bóc tách chính xác nguyên nhân lỗi từ Backend trả về
      const errorMessage = err.response?.data?.reply 
                        || err.response?.data?.message 
                        || err.response?.data 
                        || err.message 
                        || "Không thể kết nối đến máy chủ AI.";

      // 👉 IN THẲNG LỖI LÊN MÀN HÌNH CHAT (Chữ màu đỏ)
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: `⚠️ <b>AI từ chối trả lời:</b><br><span style="color: #EF4444;">${errorMessage}</span>` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '500px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
      <div style={{ padding: '20px', background: '#0F172A', color: 'white', borderRadius: '24px 24px 0 0', fontWeight: 'bold' }}>
        ✨ Trợ lý tài chính AI
      </div>
      
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: m.role === 'user' ? '#3B82F6' : '#F1F5F9',
            color: m.role === 'user' ? 'white' : '#1E293B',
            padding: '12px 16px', borderRadius: '15px', maxWidth: '85%', fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word' // Tránh lỗi bị tràn dòng nếu log quá dài
          }}>
            <div dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: '#94A3B8', alignSelf: 'flex-start' }}>AI đang suy nghĩ...</div>}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '10px' }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Hỏi AI: Quỹ còn đủ tiền đi du lịch không?..."
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
        />
        <button onClick={handleSend} disabled={loading} style={{ padding: '12px 20px', backgroundColor: loading ? '#94A3B8' : '#0F172A', color: 'white', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
          Gửi
        </button>
      </div>
    </div>
  );
}

export default FinanceChat;