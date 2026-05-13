# 🚀 CoFund Ecosystem - Hệ Thống Quản Lý Tài Chính Nhóm Thông Minh Tích Hợp AI

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Hub-1A73E8?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![SignalR](https://img.shields.io/badge/SignalR-Realtime-FF5722?style=for-the-badge)](https://dotnet.microsoft.com/en-us/apps/aspnet/signalr)

**CoFund** là giải pháp phần mềm toàn diện (SaaS-oriented) được thiết kế nhằm số hóa và minh bạch hóa quy trình quản lý dòng tiền cho các mô hình quỹ nhóm, lớp học, hoặc tổ chức quy mô vừa và nhỏ. Dự án tập trung giải quyết bài toán rủi ro thất thoát dòng tiền, giảm tải tác vụ thủ công cho thủ quỹ thông qua **Thanh toán VietQR tự động**, **Real-time broadcast**, và **Trợ lý cố vấn tài chính AI**.

---

## 💡 Bài Toán & Giải Pháp Kỹ Thuật (Technical Highlights)

### 1. Kiến Trúc & Thiết Kế Hệ Thống (Architecture & Patterns)
- **Repository Pattern & Dependency Injection:** Phân tách hoàn toàn Data Access Layer (DAL) và Business Logic Layer (BLL), giúp code lỏng (loose coupling), dễ dàng viết Unit Test và thay đổi RDBMS khi mở rộng.
- **DTOs & AutoMapper (Implied):** Tối ưu hóa payload mạng, bảo mật mô hình dữ liệu gốc (Entity) không bị phơi bày ra phía Client.
- **RESTful API Standard:** Chuẩn hóa các HTTP Methods (`GET`, `POST`, `PUT`, `DELETE`) kèm HTTP Status Codes chính xác cho từng kịch bản lỗi.

### 2. Tích Hợp Trí Tuệ Nhân Tạo Chuyên Sâu (Contextual AI Integration)
- **Dynamic Context Prompting:** Thay vì hỏi AI chung chung, Backend chủ động trích xuất chuỗi 20 giao dịch gần nhất, trạng thái ngân sách (Target vs Current Balance) để "bơm" vào System Prompt, giúp AI trả lời với độ chính xác tuyệt đối dựa trên số liệu thực tế (Hạn chế tối đa AI Hallucination).
- **Robust JSON Parsing:** Tối ưu hóa luồng đọc dữ liệu phức tạp từ Google Gemini API thông qua `System.Text.Json.Nodes.JsonNode`, xử lý triệt để các rủi ro Null Reference và tương thích hoàn hảo với C# Strongly-typed.

### 3. Cổng Thanh Toán & Minh Bạch Dữ Liệu (VietQR Gateway)
- **URL Encoding Integrity:** Sinh mã QR động chuẩn NAPAS theo thời gian thực. Toàn bộ tham số nhạy cảm (Số tiền, Nội dung, Tên tài khoản) đều được tiệt trùng (`Uri.EscapeDataString`) để chống lỗi ký tự đặc biệt.
- **2-Tier Authorization:** Xây dựng luồng trạng thái nghiêm ngặt: `Pending (0)` -> `Approved (1)` hoặc `Rejected (2)`. Số dư quỹ (CurrentBalance) sử dụng Transaction Lock ngầm định của EF Core, đảm bảo tính nhất quán (ACID) khi nhiều user nộp tiền cùng lúc.

### 4. Giao Tiếp Thời Gian Thực (Real-time Broadcast)
- Tích hợp **ASP.NET Core SignalR** để đẩy dữ liệu trạng thái ngay lập tức (Push Notifications) xuống các Client đang kết nối khi số dư quỹ thay đổi hoặc có lời nhắc đóng tiền, loại bỏ hoàn toàn cơ chế Long-polling hao tổn tài nguyên.

---

## 🛠 Công Nghệ & Thư Viện Sử Dụng (Tech Stack)

### Backend (.NET 8 Web API)
- **Entity Framework Core:** ORM quản lý truy vấn và thao tác cơ sở dữ liệu qua cú pháp LINQ tối ưu.
- **System.Text.Json:** Xử lý và tuần tự hóa dữ liệu JSON tốc độ cao.
- **ClosedXML:** Xây dựng dịch vụ xuất báo cáo tài chính thô ra định dạng bảng tính Excel (.xlsx) với công thức và style chuyên nghiệp.
- **C# Asynchronous Programming:** Sử dụng triệt để cơ chế `async/await` để tối ưu hóa Thread Pool cho I/O-bound requests.

### Frontend (React.js Single Page Application)
- **React Hooks & Context API:** Quản lý Global State (Session đăng nhập, thông tin quỹ hiện tại) mượt mà không cần thư viện rườm rà.
- **Axios Interceptors:** Quản lý tập trung Base URL, tự động đính kèm Token bảo mật và xử lý lỗi đồng loạt.
- **CSS-in-JS / Inline Styling:** Tối ưu hóa component rendering, thiết kế theo ngôn ngữ UI/UX hiện đại (Glassmorphism, Gradient Accents).

### Cơ Sở Dữ Liệu
- **SQLite:** Triển khai cơ sở dữ liệu quan hệ cục bộ tốc độ cao, hỗ trợ Foreign Keys và Transactions đầy đủ, cực kỳ thân thiện cho việc CI/CD và chấm điểm thử nghiệm.

---

## 📂 Cấu Trúc Thư Mục Hệ Thống (Project Structure)

```text
CoFund-System/
│
├── CoFund.Api/                   # Backend C# .NET 8
│   ├── Controllers/              # Xử lý HTTP Requests & Routing
│   ├── Data/                     # ApplicationDbContext & Migrations
│   ├── Models/                   # Entities & DTOs
│   ├── Repositories/             # Tầng giao tiếp cơ sở dữ liệu (Interfaces & Implementations)
│   ├── Services/                 # Business Logic & External APIs (AI, Excel)
│   └── appsettings.json          # Cấu hình biến môi trường & API Keys
│
└── CoFund.Web/                   # Frontend ReactJS
    ├── src/
    │   ├── components/           # Reusable UI (FinanceChat, Modals, Cards)
    │   ├── layouts/              # Cấu trúc khung giao diện (MainLayout)
    │   ├── pages/                # Các màn hình chức năng (Dashboard, Transactions, Welcome)
    │   └── services/             # Cấu hình Axios & API calls
    └── package.json
```

---

## 🚀 Hướng Dẫn Cài Đặt & Triển Khai (Local Setup)

### Bước 1: Clone mã nguồn
```bash
git clone [https://github.com/your-username/cofund-system.git](https://github.com/your-username/cofund-system.git)
cd cofund-system
```

### Bước 2: Khởi chạy Backend (.NET API)
1. Mở thư mục Backend:
   ```bash
   cd CoFund.Api
   ```
2. Cấu hình khóa bảo mật AI trong file `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Data Source=cofund.db"
     },
     "GeminiApiKey": "DÁN_API_KEY_CỦA_BẠN_VÀO_ĐÂY"
   }
   ```
3. Chạy lệnh đồng bộ cơ sở dữ liệu (Tự động sinh file `cofund.db`):
   ```bash
   dotnet ef database update
   ```
4. Build và chạy Server tại cổng `http://localhost:5099`:
   ```bash
   dotnet run
   ```

### Bước 3: Khởi chạy Frontend (React SPA)
1. Mở một Terminal mới, đi đến thư mục Frontend:
   ```bash
   cd CoFund.Web
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy ứng dụng trên trình duyệt (`http://localhost:3000`):
   ```bash
   npm start
   ```

---

## 🔒 Tiêu Chuẩn Bảo Mật (Security Compliance)
- **API Key Protection:** Hướng dẫn tách biệt cấu hình nhạy cảm khỏi mã nguồn đẩy lên Git thông qua cơ chế User Secrets hoặc Environment Variables.
- **XSS & SQL Injection Prevention:** Sử dụng parameterized queries thông qua EF Core và cơ chế tự động escape mã HTML độc hại của React JSX.

---

## 👤 Thông Tin Liên Hệ & Tác Giả

**Nguyễn Thị Lý**
- **Vị trí hướng tới:** Fullstack Developer (.NET / ReactJS) | Systems Analyst
- **Kỹ năng cốt lõi:** C# .NET, REST API Architecture, React Framework, Database Design, Prompt Engineering.

---
⭐️ *Nếu bạn thấy giải pháp kiến trúc của dự án này hữu ích, hãy để lại một Star cho Repository nhé!*
