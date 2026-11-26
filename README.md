# RoomFinder

RoomFinder(hệ thống tìm kiếm phòng học trống trong trường đại học) là ứng dụng web hỗ trợ tìm kiếm và quản lý phòng học trống tại Trường Đại học Quy Nhơn. Sinh viên và giảng viên có thể tìm phòng phù hợp, tạo và theo dõi lượt đặt; quản trị viên quản lý tài nguyên phòng học và hoạt động sử dụng trên một giao diện tập trung.

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Kiến trúc](#kiến-trúc)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [API](#api)
- [Kiểm tra](#kiểm-tra)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Lưu ý triển khai](#lưu-ý-triển-khai)

## Tính năng

### Dành cho sinh viên và giảng viên

- Đăng ký tài khoản, đăng nhập và đăng xuất.
- Khôi phục mật khẩu qua email và đổi mật khẩu khi đã đăng nhập.
- Tìm kiếm phòng trống theo thời gian và điều kiện tìm kiếm.
- Đặt phòng, xem lịch sử, hủy lượt đặt, check-in, kết thúc sớm hoặc gia hạn lượt đặt.
- Gửi báo cáo sự cố của phòng học.
- Nhận email nhắc check-in và nhắc trước khi lượt sử dụng kết thúc (cần cấu hình SMTP).

### Dành cho quản trị viên

- Xem và quản lý tài khoản người dùng, vai trò và trạng thái tài khoản.
- Thêm, xem, sửa và xóa thông tin phòng học.
- Quản lý thời khóa biểu phòng học.
- Theo dõi và cập nhật trạng thái báo cáo sự cố.
- Xem số liệu tổng quan về lượt đặt, sự cố và các phòng được sử dụng nhiều.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | React 19, Vite, React Router |
| Giao tiếp API | Axios |
| Backend | NestJS 12, TypeScript |
| ORM | TypeORM |
| Cơ sở dữ liệu | MySQL |
| Xác thực | JWT, Passport |

## Kiến trúc

Ứng dụng gồm hai phần chạy riêng:

- **Frontend**: ứng dụng React một trang, hiển thị giao diện người dùng và quản trị; mặc định gửi request tới `http://localhost:3000/api`.
- **Backend**: REST API viết bằng NestJS. Các route có tiền tố `/api`, dữ liệu đầu vào được kiểm tra bằng validation pipe. API được cấu hình CORS để frontend có thể kết nối.
- **MySQL**: lưu người dùng, phòng học, thời khóa biểu, lượt đặt và báo cáo sự cố. TypeORM ánh xạ các thực thể và làm việc với cơ sở dữ liệu.

Frontend sử dụng access token JWT cho các request cần đăng nhập. Quyền truy cập được kiểm tra tại backend theo trạng thái xác thực và vai trò.

## Yêu cầu

- Node.js và npm.
- MySQL Server.
- Git (nếu clone dự án).

## Cài đặt và chạy

### 1. Lấy mã nguồn

```bash
git clone https://github.com/huynhngockhuongk46e/RoomFinder.git
cd RoomFinder
```

### 2. Tạo cơ sở dữ liệu

Khởi động MySQL và tạo database mặc định:

```sql
CREATE DATABASE databasephonghoc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Tạo file `backend/.env` theo mẫu trong phần [Cấu hình môi trường](#cấu-hình-môi-trường) và điền thông tin kết nối của MySQL trên máy.

### 3. Cài đặt và chạy backend

```bash
cd backend
npm install
npm run start:dev
```

Mặc định backend lắng nghe tại `http://localhost:3000`; API có tiền tố `http://localhost:3000/api`.

### 4. Cài đặt và chạy frontend

Mở terminal thứ hai tại thư mục gốc dự án:

```bash
cd frontend
npm install
npm run dev
```

Vite sẽ in địa chỉ local của frontend trong terminal (thường là `http://localhost:5173`). Để kết nối tới backend ở địa chỉ khác, tạo file `frontend/.env` và đặt `VITE_API_URL` như phần bên dưới.

## Cấu hình môi trường

### Backend: `backend/.env`

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=databasephonghoc

JWT_SECRET=replace_with_a_long_random_secret
```

Các biến SMTP dưới đây cần thiết cho chức năng gửi email (khôi phục mật khẩu và nhắc lịch):

```env
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USER=your_email
MAIL_PASS=your_email_password
```

Không commit file `.env` hoặc thông tin đăng nhập thật lên Git.

### Frontend: `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

`VITE_API_URL` là URL gốc của API, bao gồm cả tiền tố `/api`. Nếu không khai báo, frontend sử dụng giá trị mặc định `http://localhost:3000/api`.

## API

Tất cả route backend nằm dưới tiền tố `/api`. Các nhóm chức năng chính:

| Nhóm | Đường dẫn | Mô tả |
| --- | --- | --- |
| Xác thực | `/api/auth` | Đăng ký, đăng nhập, tài khoản hiện tại, đổi/khôi phục mật khẩu |
| Phòng học | `/api/rooms` | Xem và quản lý thông tin phòng |
| Đặt phòng | `/api/bookings` | Tìm phòng trống, tạo và quản lý lượt đặt |
| Thời khóa biểu | `/api/schedules` | Xem và quản lý lịch phòng |
| Người dùng | `/api/users` | Quản lý tài khoản |
| Sự cố | `/api/incidents` | Tạo và quản lý báo cáo sự cố |
| Thống kê | `/api/statistics` | Thống kê hoạt động sử dụng phòng |

Các thao tác quản trị và thao tác cần danh tính người dùng yêu cầu token theo cơ chế Bearer JWT. Quyền cụ thể tùy theo route và vai trò tài khoản.

## Kiểm tra

Chạy lệnh trong đúng thư mục thành phần.

### Backend

```bash
cd backend
npm test
npm run test:e2e
npm run build
npm run lint
```

### Frontend

```bash
cd frontend
npm run build
npm run lint
```

## Cấu trúc thư mục

```text
RoomFinder/
├── backend/
│   ├── src/
│   │   ├── auth/          # Đăng ký, đăng nhập, JWT và khôi phục mật khẩu
│   │   ├── bookings/      # Tìm phòng, lượt đặt và nhắc lịch
│   │   ├── incidents/     # Báo cáo sự cố
│   │   ├── rooms/         # Quản lý phòng học
│   │   ├── schedules/     # Thời khóa biểu
│   │   ├── statistics/    # Thống kê
│   │   └── users/         # Quản lý người dùng
│   └── test/              # Kiểm thử end-to-end
└── frontend/
    └── src/
        ├── App.jsx        # Trang và luồng giao diện
        ├── api.js         # Cấu hình Axios và JWT
        └── assets/        # Tài nguyên giao diện
```

## Lưu ý triển khai

- Backend hiện dùng `synchronize: true` của TypeORM để tự đồng bộ cấu trúc bảng khi chạy. Cấu hình này dành cho phát triển; môi trường production nên dùng migration và tắt synchronize.
- Thay `JWT_SECRET` mặc định bằng một secret mạnh, riêng tư trước khi triển khai.
- Cần cấu hình SMTP hợp lệ để các chức năng gửi email hoạt động.
- Cấu hình CORS hiện cho phép origin từ frontend; khi triển khai thực tế nên giới hạn domain được phép truy cập.
