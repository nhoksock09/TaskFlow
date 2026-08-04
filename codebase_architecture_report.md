# Báo cáo Cấu trúc Mã nguồn TaskFlow (Backend & Frontend)

Báo cáo này cung cấp cái nhìn chi tiết về kiến trúc hệ thống, ngăn xếp công nghệ (tech stack), cấu trúc cơ sở dữ liệu, chi tiết API và luồng dữ liệu của hai tính năng cốt lõi trong ứng dụng quản lý công việc **TaskFlow**.

---

## 1. 🏗️ High-Level Architecture & Tech Stack (Kiến trúc & Công nghệ)

Dự án TaskFlow được tổ chức dưới dạng cấu trúc thư mục chứa cả Backend và Frontend (Monorepo-like structure) nằm trong cùng một repository:

*   **Phần Backend:** Nằm trong thư mục [/backend](file:///d:/TaskFlow/backend).
*   **Phần Frontend:** Nằm trong thư mục [/frontend](file:///d:/TaskFlow/frontend).

### 🛠️ Tech Stack chi tiết:

| Thành phần | Công nghệ / Thư viện chính | Vai trò |
| :--- | :--- | :--- |
| **Backend Core** | `Node.js` & `Express.js` (v5.2.1) | Framework xây dựng RESTful API và Routing. |
| **Database ORM**| `Mongoose` (v9.7.4) với `MongoDB` | Quản lý schema dữ liệu, kết nối và truy vấn database. |
| **Bảo mật** | `bcryptjs` (v3.0.3) & `jsonwebtoken` (v9.0.3) | Mã hóa mật khẩu người dùng và quản lý phiên làm việc thông qua JSON Web Token (JWT). |
| **Dev Tools** | `nodemon` (v3.1.14), `dotenv` | Tự động reload server khi thay đổi mã nguồn và quản lý biến môi trường. |
| **Frontend Core**| `Angular` (v21.2.0) | Framework phát triển Single Page Application (SPA). |
| **UI Components**| `@angular/material` (v21.2.14) & `@angular/cdk` | Cung cấp các UI component dựng sẵn chất lượng cao. |
| **Icons & Fonts**| `@fortawesome/fontawesome-free` | Thư viện biểu tượng trang trí trực quan. |
| **Style System** | `Sass (SCSS)` & CSS Variables | Quản lý giao diện, bố cục linh hoạt và xử lý Light/Dark mode. |
| **State & Flow** | `RxJS` (v7.8.0) | Xử lý các luồng dữ liệu bất đồng bộ (Reactive Programming). |
| **Testing** | `Vitest` (v4.0.8) & `jsdom` | Bộ công cụ viết và chạy unit test hiệu năng cao. |

### 📂 Cấu trúc thư mục của dự án:
```text
TaskFlow/
├── backend/
│   ├── src/
│   │   ├── config/       # Cấu hình kết nối cơ sở dữ liệu
│   │   ├── controllers/  # Xử lý logic nghiệp vụ cho API
│   │   ├── middleware/   # Middleware xác thực JWT & quyền Admin
│   │   ├── models/       # Mongoose Schemas (User, Task)
│   │   ├── routes/       # Định nghĩa API endpoints
│   │   ├── utils/        # Công cụ bổ trợ (ký sinh JWT,...)
│   │   └── index.js      # Khởi tạo ứng dụng Express & đăng ký middleware
│   ├── server.js         # Điểm khởi chạy server backend
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/           # Guards, Interceptors và global service
    │   │   ├── features/       # Các mô-đun chức năng chính (auth, dashboard, tasks, users)
    │   │   ├── layouts/        # Layout chính của ứng dụng (MainLayout)
    │   │   ├── shared/         # Các service chung (auth, task, user), component tái sử dụng (toast, sidebar)
    │   │   └── app.routes.ts   # Định tuyến (routing) của Angular
    │   ├── styles.scss         # Quản lý theme biến CSS toàn cục
    │   └── main.ts             # Điểm khởi chạy Angular App
    └── package.json
```

---

## 2. ⚙️ Backend Breakdown (Chi tiết Backend)

### 🗄️ Database & Models
Cơ sở dữ liệu MongoDB sử dụng 2 thực thể chính thông qua Mongoose:

1.  **User Model** ([User.js](file:///d:/TaskFlow/backend/src/models/User.js)):
    *   `name` (String, required): Tên đầy đủ của người dùng.
    *   `email` (String, unique, lowercase, required): Email đăng nhập duy nhất.
    *   `password` (String, required): Mật khẩu đã được mã hóa bằng BCrypt.
    *   `role` (String, enum: `["user", "admin"]`): Phân quyền tài khoản. Mặc định là `user`.
    *   `dateOfBirth` (Date): Ngày sinh của người dùng.
    *   `timestamps` (createdAt, updatedAt): Theo dõi thời gian tạo và cập nhật tài khoản.

2.  **Task Model** ([Task.js](file:///d:/TaskFlow/backend/src/models/Task.js)):
    *   `title` (String, required): Tiêu đề của nhiệm vụ.
    *   `description` (String): Nội dung chi tiết.
    *   `priority` (String, enum: `["high", "medium", "low"]`): Mức độ ưu tiên.
    *   `dueDate` (Date): Hạn chót hoàn thành nhiệm vụ.
    *   `status` (String, enum: `["todo", "in-progress", "completed"]`): Trạng thái công việc.
    *   `user` (ObjectId, ref: `User`, required): **Mối quan hệ 1-Nhiều (1-to-Many)** kết nối nhiệm vụ này với người dùng sở hữu.
    *   `completedAt` (Date): Thời điểm đánh dấu hoàn thành nhiệm vụ.
    *   `isDeleted` (Boolean): Flag đánh dấu xóa mềm phục vụ nghiệp vụ dọn dẹp dữ liệu cũ.

### 📡 API Routes & Controllers
Hệ thống API được tổ chức thành 3 cụm chính:

*   **Auth Routes** ([authRoutes.js](file:///d:/TaskFlow/backend/src/routes/authRoutes.js)) $\rightarrow$ [authController.js](file:///d:/TaskFlow/backend/src/controllers/authController.js):
    *   `POST /api/auth/register`: Đăng ký tài khoản mới. Kiểm tra email trùng, định dạng tên, giới hạn độ tuổi và mã hóa mật khẩu trước khi lưu.
    *   `POST /api/auth/login`: Xác thực thông tin đăng nhập, đối chiếu mật khẩu đã hash và phát hành JWT Token 7 ngày.
*   **Task Routes** ([taskRoutes.js](file:///d:/TaskFlow/backend/src/routes/taskRoutes.js)) $\rightarrow$ [taskController.js](file:///d:/TaskFlow/backend/src/controllers/taskController.js) (Tất cả được bảo vệ bởi middleware `protect`):
    *   `GET /api/tasks`: Lấy toàn bộ danh sách nhiệm vụ của người dùng hiện tại (kèm cơ chế dọn dẹp tự động và giới hạn thời gian rolling 6 tháng).
    *   `GET /api/tasks/:id`: Xem chi tiết một nhiệm vụ cụ thể.
    *   `POST /api/tasks`: Tạo mới một nhiệm vụ.
    *   `PUT /api/tasks/:id`: Cập nhật các trường thông tin hoặc trạng thái (đồng thời cập nhật thời gian `completedAt` tương ứng).
    *   `DELETE /api/tasks/:id`: Xóa cứng nhiệm vụ khỏi database.
*   **User Routes** ([userRoutes.js](file:///d:/TaskFlow/backend/src/routes/userRoutes.js)) $\rightarrow$ [userController.js](file:///d:/TaskFlow/backend/src/controllers/userController.js):
    *   `GET /api/users/profile` (Protected): Lấy thông tin cá nhân hiện tại.
    *   `PUT /api/users/profile` (Protected): Cập nhật hồ sơ (tên, ngày sinh).
    *   `PUT /api/users/change-password` (Protected): Đổi mật khẩu (yêu cầu mật khẩu hiện tại chính xác).
    *   `GET /api/users` (Protected, Admin-only): Lấy danh sách thành viên phân trang và hỗ trợ tìm kiếm chuyên sâu.
    *   `PUT /api/users/:id/role` (Protected, Admin-only): Cập nhật quyền của thành viên (Chặn việc tự hạ quyền hoặc hạ quyền admin khác).
    *   `DELETE /api/users/:id` (Protected, Admin-only): Xóa tài khoản người dùng (Chặn xóa tài khoản admin).

### 🧠 Business Logic & Services đặc biệt ở Backend
1.  **Xác thực và Phân quyền** ([authMiddleware.js](file:///d:/TaskFlow/backend/src/middleware/authMiddleware.js)):
    *   Sử dụng JWT Bearer token để xác định danh tính. Token được truyền qua Header `Authorization`.
    *   Mã hóa mật khẩu bằng `bcryptjs` với độ muối (salt rounds) là 10.
    *   Middleware `admin` chặn toàn bộ truy cập không có quyền admin bằng cách kiểm tra thuộc tính `req.user.role === 'admin'`.
2.  **Cơ chế dọn dẹp lăn 6 tháng (Rolling 6-month window) khi truy vấn Tasks**:
    Khi gọi API `GET /api/tasks`, controller [taskController.js](file:///d:/TaskFlow/backend/src/controllers/taskController.js#L3-L49) thực hiện ba bước tự động:
    *   **Xóa vĩnh viễn (Hard-delete):** Mọi công việc ở trạng thái `completed` có `dueDate` cũ hơn 6 tháng sẽ bị xóa bỏ hoàn toàn.
    *   **Xóa mềm (Soft-delete):** Mọi công việc chưa hoàn thành có `dueDate` cũ hơn 6 tháng sẽ được cập nhật thuộc tính `isDeleted = true`.
    *   **Lọc dữ liệu trả về:** Chỉ lấy nhiệm vụ chưa bị xóa mềm (`isDeleted !== true`) và có `dueDate` lớn hơn 6 tháng trước hoặc không có hạn chót.
3.  **Sắp xếp đặc thù theo ngôn ngữ tiếng Việt của Admin**:
    Tại API `GET /api/users` thuộc [userController.js](file:///d:/TaskFlow/backend/src/controllers/userController.js#L75-L105), danh sách tài khoản được sắp xếp có độ ưu tiên: Tài khoản **Admin luôn đứng đầu**, sau đó sắp xếp theo **Tên (Last name) của tiếng Việt** bằng cách phân tách chuỗi tên và so sánh bằng `localeCompare` với mã quốc gia `'vi'`, độ nhạy `'base'`.

---

## 3. 🎨 Frontend Breakdown (Chi tiết Frontend)

### 📦 Core Modules & Components
Frontend được xây dựng bằng kiến trúc component của Angular 21 (Standalone Components):

*   **Auth Component** ([auth.ts](file:///d:/TaskFlow/frontend/src/app/features/auth/auth.ts)): Xử lý cả hai trạng thái Đăng nhập (Login) và Đăng ký (Register) trên giao diện động thông qua biến tín hiệu `isLogin` (signal).
*   **Dashboard Component** ([dashboard.ts](file:///d:/TaskFlow/frontend/src/app/features/dashboard/dashboard.ts)): Bảng điều khiển trực quan hiển thị số liệu thống kê bằng biểu đồ SVG Donut Chart, danh sách việc sắp tới được gom nhóm động, và Modal cảnh báo tức thời các công việc quá hạn/sắp tới hạn.
*   **Tasks Component** ([tasks.ts](file:///d:/TaskFlow/frontend/src/app/features/tasks/tasks.ts)): Quản lý danh sách nhiệm vụ toàn diện. Tích hợp thanh tìm kiếm, bộ lọc trạng thái, độ ưu tiên, bộ lọc khoảng thời gian, phân trang và tích hợp các modal thêm mới, chỉnh sửa, xác nhận xóa.
*   **Users Component** ([users.ts](file:///d:/TaskFlow/frontend/src/app/features/users/users.ts)): Trang quản trị dành riêng cho Admin, cho phép tìm kiếm, phân trang người dùng, thăng chức một user thành Admin hoặc xóa tài khoản.
*   **Sidebar Component** ([sidebar.ts](file:///d:/TaskFlow/frontend/src/app/shared/components/sidebar/sidebar.ts)): Menu điều hướng bên trái, tự động ẩn/hiện mục quản trị "Users" dựa trên quyền hạn của người dùng đăng nhập.

### 🔄 Services & State Management
*   **Cách thức lấy dữ liệu (API Communication):**
    Thông qua các API Service ([auth.service.ts](file:///d:/TaskFlow/frontend/src/app/shared/services/auth.service.ts), [task.service.ts](file:///d:/TaskFlow/frontend/src/app/shared/services/task.service.ts), [user.service.ts](file:///d:/TaskFlow/frontend/src/app/shared/services/user.service.ts)) được tiêm (inject) vào component. Các service này gọi HTTP Client đến [api.service.ts](file:///d:/TaskFlow/frontend/src/app/core/services/api.service.ts) (URL mặc định là `http://localhost:5000/api`).
*   **Đăng ký Token tự động:**
    Một Angular interceptor chức năng ([auth.interceptor.ts](file:///d:/TaskFlow/frontend/src/app/core/interceptors/auth.interceptor.ts)) tự động bắt tất cả các yêu cầu HTTP đi ra ngoài. Nếu trong `localStorage` có token, nó sẽ sao chép request và thêm header xác thực:
    ```typescript
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    ```
*   **Lọc dữ liệu local vs. remote:**
    *   *Remote (Server-side):* Lọc sạch dữ liệu quá hạn > 6 tháng để giảm tải lượng dữ liệu truyền qua mạng. Lọc danh sách Users theo truy vấn tìm kiếm `search` và trang hiện tại `page` trực tiếp tại MongoDB.
    *   *Local (Client-side):* Component [tasks.ts](file:///d:/TaskFlow/frontend/src/app/features/tasks/tasks.ts#L267-L358) triển khai thuộc tính getter `allFilteredTasks` để tiến hành lọc nhanh bằng mã TypeScript dựa trên từ khóa tìm kiếm (`searchQuery`), độ ưu tiên (`activeFilter`), trạng thái (`activeStatusFilter`) hoặc mốc thời gian (`activeTimeframeFilter`) mà không cần gửi lại yêu cầu lên server.

### 🎨 UI & Styling System
Hệ thống giao diện được định nghĩa tập trung trong file [styles.scss](file:///d:/TaskFlow/frontend/src/styles.scss) bằng việc sử dụng các biến CSS tùy chỉnh (CSS Custom Properties).

*   **Chuyển đổi theme Light/Dark:**
    Khi người dùng nhấn chuyển theme tại [main-layout.ts](file:///d:/TaskFlow/frontend/src/app/layouts/main-layout/main-layout.ts), class `dark-theme` và `dark` sẽ được thêm hoặc xóa khỏi thẻ `<html>`:
    ```typescript
    toggleTheme(): void {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      this.applyTheme();
    }
    ```
*   **Các biến CSS đặc trưng:**
    ```css
    :root {
      --bg-primary: #f1f5f9;
      --bg-card: #ffffff;
      --border-color: #cbd5e1;
      --text-primary: #0f172a;
    }
    html.dark-theme, html.dark {
      --bg-primary: #0f172a;
      --bg-card: #1e293b;
      --border-color: #334155;
      --text-primary: #f8fafc;
    }
    ```
*   Tất cả thành phần đều dùng hiệu ứng chuyển màu mượt mà qua thuộc tính `transition: background 0.3s ease, color 0.3s ease;`.
*   Các chỉ báo lịch chọn thời gian gốc trong ô input (`input[type="date"]`) tự động đảo màu trắng sáng trên nền tối để đảm bảo tiêu chuẩn WCAG: `filter: brightness(0) invert(1) !important;`.

---

## 4. 🔄 End-to-End Data Flow Examples (Luồng dữ liệu mẫu)

### Luồng 1: Tạo một nhiệm vụ mới (Create a new Task)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FC as Tasks Component (FE)
    participant FS as TaskService (FE)
    participant AI as Auth Interceptor (FE)
    participant BR as Express Router (BE)
    participant BC as Task Controller (BE)
    participant DB as MongoDB (Database)

    User->>FC: Nhập tiêu đề, thời hạn, ưu tiên & nhấn "Save"
    Note over FC: Trình xác thực kiểm tra thời hạn:<br/>futureDateValidator() bảo đảm ngày tương lai
    alt Form Hợp lệ
        FC->>FS: createTask(taskData)
        FS->>AI: Gửi HTTP POST /api/tasks
        Note over AI: Lấy token từ LocalStorage,<br/>gắn Header "Authorization: Bearer..."
        AI->>BR: Gửi Request qua Network
        Note over BR: Middleware protect giải mã JWT<br/>và xác thực User ID
        BR->>BC: Chuyển tiếp đến createTask controller
        BC->>DB: Task.create({ ..., user: req.user.id })
        DB-->>BC: Trả về tài liệu Task mới được ghi
        BC-->>FC: HTTP 201 Created { success: true, data: Task }
        Note over FC: Kích hoạt Toast thông báo thành công;<br/>Tự động gọi loadTasks() làm mới danh sách;
        FC->>User: Đóng modal, re-render danh sách trên UI
    else Form Không hợp lệ
        FC->>User: Đánh dấu các ô lỗi (markAllAsTouched) và hiển thị thông báo đỏ
    end
```

---

### Luồng 2: Đăng nhập & hiển thị Modal cảnh báo nhiệm vụ (Login & Render Login Task Alert Modal)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant AC as Auth Component (FE)
    participant AS as AuthService (FE)
    participant BR as Express Router (BE)
    participant AC_BE as Auth Controller (BE)
    participant TC as Task Controller (BE)
    participant DB as MongoDB (Database)
    participant DC as Dashboard Component (FE)

    User->>AC: Nhập Email, Password & bấm "Login"
    Note over AC: strictEmailValidator() & emailTypoValidator()<br/>kiểm tra định dạng email và lỗi gõ phím local
    AC->>AS: login({ email, password })
    AS->>BR: HTTP POST /api/auth/login
    BR->>AC_BE: Chuyển tiếp đến login controller
    AC_BE->>DB: User.findOne({ email }) & so sánh bcrypt
    DB-->>AC_BE: Trả về thông tin User
    Note over AC_BE: Ký phát mã JWT Token (hạn 7 ngày)
    AC_BE-->>AC: Trả về HTTP 200 { token, user }
    Note over AC: Lưu token và user vào LocalStorage;<br/>Điều hướng route sang '/dashboard'
    AC->>DC: Khởi chạy component Dashboard
    Note over DC: ngOnInit() gọi loadTasks() làm mới dữ liệu
    DC->>TC: HTTP GET /api/tasks (Được đính kèm JWT)
    Note over TC: Thực hiện dọn dẹp các task cũ > 6 tháng<br/>(Hard-delete tasks hoàn thành, Soft-delete tasks dở dang)
    TC->>DB: Tìm kiếm tasks của user thuộc rolling window
    DB-->>TC: Trả về các tài liệu Tasks hợp lệ
    TC-->>DC: Trả về danh sách nhiệm vụ
    Note over DC: Gọi checkLoginAlerts(tasks)<br/>Kiểm tra sessionStorage 'hasShownLoginAlert'
    alt Chưa hiển thị trong phiên làm việc (Session)
        Note over DC: Tính toán phân loại nhiệm vụ:<br/>- alertOverdueTasks: dueDate < hiện tại<br/>- alertUpcomingTasks: hiện tại <= dueDate <= 24 giờ tới
        Note over DC: Sắp xếp cả hai danh sách theo thời gian tăng dần
        Note over DC: Đặt biến showLoginAlert = true;<br/>Lưu 'hasShownLoginAlert' = true vào sessionStorage
        DC->>User: Hiển thị Modal Cảnh báo nhiệm vụ khẩn cấp lên màn hình
    else Đã hiển thị trước đó trong phiên
        Note over DC: showLoginAlert = false
        DC->>User: Bỏ qua cảnh báo, render thẳng trang Dashboard
    end
```
