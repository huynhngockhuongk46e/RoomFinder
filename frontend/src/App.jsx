import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import api from './api';
import './App.css';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="qnu-login-container">
      <div className="qnu-left-bg" />
      <div className="qnu-right-panel">
        <div className="qnu-header">
          <img src="/logo.png" alt="Logo" className="qnu-logo" />
          <h2 className="qnu-university-name">TRƯỜNG ĐẠI HỌC QUY NHƠN</h2>
          <h3 className="qnu-portal-name">CỔNG THÔNG TIN ĐÀO TẠO</h3>
        </div>
        <div className="qnu-login-card">
          <h1 className="qnu-title">{title}</h1>
          <p className="qnu-subtitle">{subtitle}</p>
          {children}
        </div>
        <div className="qnu-footer">
          © Copyright © 2026 Trường Đại học Quy Nhơn | All Rights Reserved
          Developed by DSC
        </div>
      </div>
    </div>
  );
}

function Message({ children, type = 'error' }) {
  return <div className={`qnu-message qnu-message-${type}`}>{children}</div>;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Tên đăng nhập và mật khẩu là bắt buộc');
      return;
    }
    try {
      const response = await api.post('/auth/login', {
        emailOrCode: email,
        password,
      });
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Tên đăng nhập hoặc mật khẩu không đúng',
      );
    }
  };

  return (
    <AuthLayout title="ĐĂNG NHẬP" subtitle="Cổng thông tin đào tạo">
      <form onSubmit={handleLogin}>
        {error && <span className="qnu-error-text">{error}</span>}
        <div className="qnu-form-group">
          <label htmlFor="login-email">Tên đăng nhập</label>
          <input
            id="login-email"
            type="text"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            className={error ? 'qnu-input-error' : ''}
          />
        </div>
        <div className="qnu-form-group">
          <label htmlFor="login-password">Mật khẩu</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit" className="qnu-btn-primary">
          Đăng nhập
        </button>
        <div className="qnu-auth-links">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Đăng ký ngay</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function Register() {
  const [form, setForm] = useState({
    fullName: '',
    userCode: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      await api.post('/auth/register', form);
      setMessage({ type: 'success', text: 'Đăng ký thành công!' });
      setTimeout(() => navigate('/'), 2000);
    } catch (requestError) {
      const error = requestError.response?.data?.message;
      setMessage({
        type: 'error',
        text: Array.isArray(error)
          ? error.join(', ')
          : error || 'Đăng ký thất bại. Vui lòng kiểm tra lại.',
      });
    }
  };

  return (
    <AuthLayout title="ĐĂNG KÝ" subtitle="Tạo tài khoản mới">
      <form onSubmit={handleRegister}>
        {message && <Message type={message.type}>{message.text}</Message>}
        {[
          ['fullName', 'Họ và tên', 'text'],
          ['userCode', 'Mã Sinh viên / Giảng viên', 'text'],
          ['email', 'Email', 'email'],
          ['password', 'Mật khẩu', 'password'],
        ].map(([field, label, type]) => (
          <div className="qnu-form-group" key={field}>
            <label htmlFor={`register-${field}`}>{label}</label>
            <input
              id={`register-${field}`}
              type={type}
              required
              minLength={field === 'password' ? 6 : undefined}
              value={form[field]}
              onChange={(event) => updateField(field, event.target.value)}
            />
          </div>
        ))}
        <div className="qnu-form-group">
          <label htmlFor="register-role">Vai trò</label>
          <select
            id="register-role"
            value={form.role}
            onChange={(event) => updateField('role', event.target.value)}
          >
            <option value="STUDENT">Sinh viên</option>
            <option value="LECTURER">Giảng viên</option>
          </select>
        </div>
        <button type="submit" className="qnu-btn-primary">
          Đăng ký
        </button>
        <div className="qnu-auth-links qnu-auth-links-center">
          <Link to="/">Quay lại đăng nhập</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setMessage({
        type: 'success',
        text: response.data.message,
      });
    } catch {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
  };

  return (
    <AuthLayout title="QUÊN MẬT KHẨU" subtitle="Khôi phục tài khoản">
      <form onSubmit={handleSubmit}>
        {message && <Message type={message.type}>{message.text}</Message>}
        <div className="qnu-form-group">
          <label htmlFor="forgot-email">Nhập Email của bạn</label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <button type="submit" className="qnu-btn-primary">
          Gửi yêu cầu
        </button>
        <div className="qnu-auth-links qnu-auth-links-center">
          <Link to="/reset-password">Đã có mã? Đặt lại mật khẩu</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setTimeout(() => navigate('/'), 2000);
    } catch (requestError) {
      setMessage({
        type: 'error',
        text: requestError.response?.data?.message || 'Mã không hợp lệ',
      });
    }
  };

  return (
    <AuthLayout title="ĐẶT LẠI MẬT KHẨU" subtitle="Tạo mật khẩu mới">
      <form onSubmit={handleSubmit}>
        {message && <Message type={message.type}>{message.text}</Message>}
        <div className="qnu-form-group">
          <label htmlFor="reset-token">
            Mã khôi phục (Vui lòng kiểm tra Email)
          </label>
          <input
            id="reset-token"
            type="text"
            required
            placeholder="Nhập mã 6 ký tự trong Email của bạn"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </div>
        <div className="qnu-form-group">
          <label htmlFor="reset-password">Mật khẩu mới</label>
          <input
            id="reset-password"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <button type="submit" className="qnu-btn-primary">
          Xác nhận
        </button>
      </form>
    </AuthLayout>
  );
}

function StudentDashboard() {
  const [user] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null'),
  );
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('search');
  const [searchForm, setSearchForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '09:00',
    capacity: 40,
    type: 'Lý thuyết',
  });
  const [searchResults, setSearchResults] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [newEndTime, setNewEndTime] = useState('');
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    roomId: '',
    image: null,
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setSearchResults(null);
    try {
      const response = await api.get('/bookings/search', {
        params: {
          ...searchForm,
          capacity: Number(searchForm.capacity),
        },
      });
      setSearchResults(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Lỗi tìm kiếm phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = async (roomId) => {
    if (!window.confirm('Bạn có chắc chắn muốn đặt phòng này?')) return;
    setError('');
    setSuccess('');
    try {
      await api.post('/bookings', {
        roomId,
        date: searchForm.date,
        startTime: searchForm.startTime,
        endTime: searchForm.endTime,
      });
      setSuccess('Đặt phòng thành công! Bạn có thể xem ở tab Lịch sử.');
      setSearchResults((rooms) => rooms.filter((room) => room.id !== roomId));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Lỗi đặt phòng. Có thể phòng vừa được người khác đặt.',
      );
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/my-history');
      setMyBookings(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Lỗi tải lịch sử đặt phòng',
      );
    }
  };

  useEffect(() => {
    if (activeTab !== 'history') return;
    const loadBookings = async () => {
      try {
        const response = await api.get('/bookings/my-history');
        setMyBookings(response.data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Lỗi tải lịch sử đặt phòng',
        );
      }
    };
    loadBookings();
  }, [activeTab]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lượt đặt phòng này?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setSuccess('Đã hủy lượt đặt phòng thành công!');
      await fetchMyBookings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Lỗi hủy phòng');
    }
  };

  const handleCheckIn = async (id) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/bookings/${id}/check-in`);
      setSuccess('Đã xác nhận sử dụng phòng thành công!');
      await fetchMyBookings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Lỗi xác nhận');
    }
  };

  const handleEndEarly = async (id) => {
    if (
      !window.confirm(
        'Bạn có chắc muốn kết thúc sớm? Phần thời gian còn lại sẽ bị hủy.',
      )
    ) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.patch(`/bookings/${id}/end-early`);
      setSuccess('Đã kết thúc sớm thành công!');
      await fetchMyBookings();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Lỗi kết thúc sớm',
      );
    }
  };

  const handleOpenExtend = (booking) => {
    setSelectedBookingId(booking.id);
    setNewEndTime(booking.endTime.slice(0, 5));
    setIsExtendModalOpen(true);
  };

  const handleExtend = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.patch(`/bookings/${selectedBookingId}/extend`, { newEndTime });
      setSuccess('Gia hạn phòng thành công!');
      setIsExtendModalOpen(false);
      await fetchMyBookings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Lỗi gia hạn phòng');
    }
  };

  const handleSendIncident = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('title', incidentForm.title);
    formData.append('description', incidentForm.description);
    formData.append('roomId', incidentForm.roomId);
    if (incidentForm.image) {
      formData.append('image', incidentForm.image);
    }

    try {
      await api.post('/incidents', formData);
      setSuccess('Gửi báo cáo sự cố thành công!');
      setIsIncidentModalOpen(false);
      setIncidentForm({
        title: '',
        description: '',
        roomId: '',
        image: null,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Lỗi gửi báo cáo sự cố',
      );
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <h3>QNU STUDENT</h3>
        </div>
        <ul className="sidebar-menu">
          <li
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => changeTab('search')}
          >
            Tìm phòng trống
          </li>
          <li
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => changeTab('history')}
          >
            Lịch sử đặt phòng
          </li>
          <li onClick={handleLogout} className="sidebar-logout">
            Đăng xuất
          </li>
        </ul>
      </aside>

      <main className="admin-main-content">
        <header className="admin-main-header">
          <h2>
            {activeTab === 'search'
              ? 'Tìm kiếm phòng trống'
              : 'Lịch sử đặt phòng của bạn'}
          </h2>
          <div className="admin-user-actions">
            <span>
              👤 {user?.fullName} ({user?.userCode})
            </span>
            <button className="btn-danger" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        {error && <div className="booking-alert booking-alert-error">{error}</div>}
        {success && (
          <div className="booking-alert booking-alert-success">{success}</div>
        )}

        {activeTab === 'search' && (
          <>
            <section className="admin-card">
              <h3>Nhập yêu cầu tìm phòng</h3>
              <form onSubmit={handleSearch} className="booking-search-form">
                <label>
                  Ngày sử dụng
                  <input
                    type="date"
                    required
                    value={searchForm.date}
                    onChange={(event) =>
                      setSearchForm({
                        ...searchForm,
                        date: event.target.value,
                      })
                    }
                  />
                </label>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    Giờ bắt đầu
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <select
                      value={searchForm.startTime.split(':')[0]}
                      onChange={(event) => {
                        const minute = searchForm.startTime.split(':')[1];
                        setSearchForm({
                          ...searchForm,
                          startTime: `${event.target.value}:${minute}`,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '9px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                      }}
                    >
                      {Array.from({ length: 24 }, (_, index) => {
                        const hour = index.toString().padStart(2, '0');
                        return (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        );
                      })}
                    </select>
                    <span style={{ fontWeight: 'bold' }}>:</span>
                    <select
                      value={searchForm.startTime.split(':')[1]}
                      onChange={(event) => {
                        const hour = searchForm.startTime.split(':')[0];
                        setSearchForm({
                          ...searchForm,
                          startTime: `${hour}:${event.target.value}`,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '9px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                      }}
                    >
                      {Array.from({ length: 60 }, (_, index) => {
                        const minute = index.toString().padStart(2, '0');
                        return (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    Giờ kết thúc
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <select
                      value={searchForm.endTime.split(':')[0]}
                      onChange={(event) => {
                        const minute = searchForm.endTime.split(':')[1];
                        setSearchForm({
                          ...searchForm,
                          endTime: `${event.target.value}:${minute}`,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '9px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                      }}
                    >
                      {Array.from({ length: 24 }, (_, index) => {
                        const hour = index.toString().padStart(2, '0');
                        return (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        );
                      })}
                    </select>
                    <span style={{ fontWeight: 'bold' }}>:</span>
                    <select
                      value={searchForm.endTime.split(':')[1]}
                      onChange={(event) => {
                        const hour = searchForm.endTime.split(':')[0];
                        setSearchForm({
                          ...searchForm,
                          endTime: `${hour}:${event.target.value}`,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '9px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                      }}
                    >
                      {Array.from({ length: 60 }, (_, index) => {
                        const minute = index.toString().padStart(2, '0');
                        return (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <label>
                  Số người
                  <input
                    type="number"
                    required
                    min="1"
                    value={searchForm.capacity}
                    onChange={(event) =>
                      setSearchForm({
                        ...searchForm,
                        capacity: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Loại phòng
                  <select
                    value={searchForm.type}
                    onChange={(event) =>
                      setSearchForm({
                        ...searchForm,
                        type: event.target.value,
                      })
                    }
                  >
                    <option value="Lý thuyết">Lý thuyết</option>
                    <option value="Thực hành">Thực hành</option>
                  </select>
                </label>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Đang tìm...' : 'Tìm phòng'}
                </button>
              </form>
            </section>

            {searchResults && (
              <section className="admin-card">
                <h3>Kết quả tìm kiếm ({searchResults.length} phòng trống)</h3>
                {searchResults.length === 0 ? (
                  <p className="empty-search">
                    Không có phòng phù hợp trong khung giờ này.
                  </p>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tên phòng</th>
                          <th>Tòa nhà</th>
                          <th>Sức chứa</th>
                          <th>Loại</th>
                          <th>Thiết bị</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((room) => (
                          <tr key={room.id}>
                            <td className="room-name">{room.name}</td>
                            <td>{room.building || '-'}</td>
                            <td>{room.capacity} chỗ</td>
                            <td>{room.type}</td>
                            <td>{room.description || '---'}</td>
                            <td className="action-cell">
                              <button
                                className="booking-button"
                                onClick={() => handleBookRoom(room.id)}
                              >
                                Đặt phòng này
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <section className="admin-card">
            <h3>Các lượt đặt phòng của bạn</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Ngày đặt</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="room-name">{booking.room?.name || '-'}</td>
                      <td>
                        {new Date(`${booking.date}T00:00:00`).toLocaleDateString(
                          'vi-VN',
                        )}
                      </td>
                      <td>
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            booking.status === 'Đã đặt'
                              ? 'status-active'
                            : booking.status === 'Đang sử dụng'
                              ? 'status-in-use'
                            : booking.status === 'Kết thúc sớm'
                              ? 'status-warning'
                            : booking.status === 'Hoàn thành'
                              ? 'status-completed'
                              : 'status-locked'
                        }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="action-cell">
                        {booking.status === 'Đã đặt' && (
                          <button
                            className="booking-button"
                            onClick={() => handleCheckIn(booking.id)}
                          >
                            Xác nhận
                          </button>
                        )}
                        {booking.status === 'Đã đặt' && (
                          <button
                            className="btn-danger room-action-button"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Hủy đặt
                          </button>
                        )}
                        {booking.status === 'Đang sử dụng' && (
                          <div className="booking-action-group">
                            <button
                              className="btn-primary room-action-button"
                              onClick={() => handleOpenExtend(booking)}
                            >
                              Gia hạn
                            </button>
                            <button
                              className="btn-warning room-action-button"
                              onClick={() => handleEndEarly(booking.id)}
                            >
                              Kết thúc sớm
                            </button>
                            <button
                              className="btn-secondary room-action-button"
                              onClick={() => {
                                setIncidentForm({
                                  ...incidentForm,
                                  roomId: booking.roomId,
                                });
                                setIsIncidentModalOpen(true);
                              }}
                            >
                              Báo sự cố
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {myBookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-table">
                        Bạn chưa có lượt đặt phòng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {isExtendModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Gia hạn thời gian sử dụng</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setIsExtendModalOpen(false)}
                  aria-label="Đóng"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleExtend} className="edit-form">
                <label>
                  Chọn giờ kết thúc mới
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(event) => setNewEndTime(event.target.value)}
                  />
                </label>
                <p className="extend-hint">
                  Chỉ được gia hạn khi đã dùng quá 2/3 thời gian và tổng thời
                  gian không quá 4 tiếng.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsExtendModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Xác nhận gia hạn
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isIncidentModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Báo cáo sự cố phòng học</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setIsIncidentModalOpen(false)}
                  aria-label="Đóng"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSendIncident} className="edit-form">
                <label>
                  Tiêu đề sự cố
                  <input
                    type="text"
                    required
                    placeholder="VD: Hỏng máy chiếu"
                    value={incidentForm.title}
                    onChange={(event) =>
                      setIncidentForm({
                        ...incidentForm,
                        title: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Mô tả chi tiết
                  <textarea
                    required
                    rows="4"
                    placeholder="Mô tả tình trạng..."
                    value={incidentForm.description}
                    onChange={(event) =>
                      setIncidentForm({
                        ...incidentForm,
                        description: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Đính kèm ảnh (tùy chọn)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setIncidentForm({
                        ...incidentForm,
                        image: event.target.files?.[0] || null,
                      })
                    }
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsIncidentModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Gửi báo cáo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    return <Navigate to="/student" replace />;
  }

  return children;
}

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null'),
  );
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    userCode: '',
    email: '',
    role: 'STUDENT',
    password: '',
  });
  const [editError, setEditError] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async (term = search) => {
    try {
      const response = await api.get('/users', { params: { search: term } });
      setUsers(response.data);
    } catch (requestError) {
      alert(
        `Lỗi tải danh sách: ${
          requestError.response?.data?.message || requestError.message
        }`,
      );
      if ([401, 403].includes(requestError.response?.status)) navigate('/');
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get('/users', { params: { search: '' } });
        setUsers(response.data);
      } catch (requestError) {
        alert(
          `Lỗi tải danh sách: ${
            requestError.response?.data?.message || requestError.message
          }`,
        );
        if ([401, 403].includes(requestError.response?.status)) {
          navigate('/');
        }
      }
    };
    loadUsers();
  }, [navigate]);

  const handleChangeRole = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      await fetchUsers();
    } catch {
      alert('Lỗi đổi quyền');
    }
  };

  const handleToggleLock = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle-lock`);
      await fetchUsers();
    } catch {
      alert('Lỗi thao tác khóa tài khoản');
    }
  };

  const handleOpenEdit = (item) => {
    setEditingUser(item.id);
    setEditForm({
      fullName: item.fullName,
      userCode: item.userCode,
      email: item.email,
      role: item.role,
      password: '',
    });
    setEditError('');
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    setEditError('');
    try {
      const response = await api.patch(`/users/${editingUser}`, editForm);
      if (editingUser === user?.id) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      setEditingUser(null);
      await fetchUsers();
    } catch (requestError) {
      setEditError(
        requestError.response?.data?.message || 'Lỗi cập nhật người dùng',
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <h3>QNU ADMIN</h3>
        </div>
        <ul className="sidebar-menu">
          <li className="active" onClick={() => navigate('/admin')}>
            Quản lý Người dùng
          </li>
          <li onClick={() => navigate('/admin/rooms')}>
            Quản lý Phòng học
          </li>
          <li onClick={() => navigate('/admin/schedules')}>
            Thời khóa biểu
          </li>
          <li onClick={() => navigate('/admin/incidents')}>
            Quản lý Sự cố
          </li>
          <li onClick={() => navigate('/admin/stats')}>
            Thống kê Báo cáo
          </li>
          <li onClick={handleLogout} className="sidebar-logout">
            Đăng xuất
          </li>
        </ul>
      </aside>

      <main className="admin-main-content">
        <header className="admin-main-header">
          <h2>Quản lý Người Dùng</h2>
          <div className="admin-user-actions">
            <span>👤 {user?.fullName}</span>
            <button className="btn-danger" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <section className="admin-card">
          <h3>Danh sách tài khoản</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              fetchUsers();
            }}
            className="admin-form-row admin-search-row"
          >
            <input
              placeholder="Tìm kiếm theo tên, email hoặc mã số..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" className="btn-primary">Tìm kiếm</button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearch('');
                fetchUsers('');
              }}
            >
              Tải lại
            </button>
          </form>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Họ Tên</th>
                  <th>Mã số</th>
                  <th>Email</th>
                  <th>Vai Trò</th>
                  <th>Trạng Thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const isCurrentUser = item.email === user?.email;
                  return (
                    <tr key={item.id}>
                      <td className="user-name">{item.fullName}</td>
                      <td>{item.userCode}</td>
                      <td>{item.email}</td>
                      <td>
                        <select
                          className="role-select"
                          value={item.role}
                          disabled={isCurrentUser}
                          onChange={(event) =>
                            handleChangeRole(item.id, event.target.value)
                          }
                        >
                          <option value="STUDENT">Sinh viên</option>
                          <option value="LECTURER">Giảng viên</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${item.isActive ? 'status-active' : 'status-locked'}`}>
                          {item.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="edit-button"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Sửa
                        </button>
                        <button
                          className={`lock-button ${item.isActive ? 'lock' : 'unlock'}`}
                          disabled={isCurrentUser}
                          onClick={() => handleToggleLock(item.id)}
                        >
                          {item.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {editingUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Chỉnh sửa thông tin</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setEditingUser(null)}
                  aria-label="Đóng"
                >
                  &times;
                </button>
              </div>

              {editError && <p className="edit-error">{editError}</p>}

              <form onSubmit={handleUpdateUser} className="edit-form">
                <label>
                  Họ và tên
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(event) =>
                      setEditForm({ ...editForm, fullName: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Mã số
                  <input
                    type="text"
                    value={editForm.userCode}
                    onChange={(event) =>
                      setEditForm({ ...editForm, userCode: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm({ ...editForm, email: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Mật khẩu mới (để trống nếu không đổi)
                  <input
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Nhập mật khẩu mới"
                    value={editForm.password}
                    onChange={(event) =>
                      setEditForm({ ...editForm, password: event.target.value })
                    }
                  />
                </label>
                <label>
                  Vai trò
                  <select
                    value={editForm.role}
                    disabled={users.find((item) => item.id === editingUser)?.email === user?.email}
                    onChange={(event) =>
                      setEditForm({ ...editForm, role: event.target.value })
                    }
                  >
                    <option value="STUDENT">Sinh viên</option>
                    <option value="LECTURER">Giảng viên</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingUser(null)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [user] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null'),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    building: '',
    capacity: 40,
    type: 'Lý thuyết',
    status: 'Hoạt động',
    description: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (requestError) {
      alert(
        `Lỗi tải danh sách phòng: ${
          requestError.response?.data?.message || requestError.message
        }`,
      );
      if ([401, 403].includes(requestError.response?.status)) navigate('/');
    }
  };

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await api.get('/rooms');
        setRooms(response.data);
      } catch (requestError) {
        alert(
          `Lỗi tải danh sách phòng: ${
            requestError.response?.data?.message || requestError.message
          }`,
        );
        if ([401, 403].includes(requestError.response?.status)) navigate('/');
      }
    };
    loadRooms();
  }, [navigate]);

  const handleOpenModal = (room = null) => {
    setError('');
    if (room) {
      setEditingId(room.id);
      setForm({
        name: room.name,
        building: room.building || '',
        capacity: room.capacity,
        type: room.type,
        status: room.status,
        description: room.description || '',
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        building: '',
        capacity: 40,
        type: 'Lý thuyết',
        status: 'Hoạt động',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editingId) {
        await api.patch(`/rooms/${editingId}`, payload);
      } else {
        await api.post('/rooms', payload);
      }
      setIsModalOpen(false);
      await fetchRooms();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Lỗi lưu thông tin phòng',
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      await fetchRooms();
    } catch (requestError) {
      alert(
        `Lỗi xóa phòng: ${
          requestError.response?.data?.message || requestError.message
        }`,
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <h3>QNU ADMIN</h3>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/admin')}>Quản lý Người dùng</li>
          <li className="active">Quản lý Phòng học</li>
          <li onClick={() => navigate('/admin/schedules')}>
            Thời khóa biểu
          </li>
          <li onClick={() => navigate('/admin/incidents')}>
            Quản lý Sự cố
          </li>
          <li onClick={() => navigate('/admin/stats')}>
            Thống kê Báo cáo
          </li>
          <li onClick={handleLogout} className="sidebar-logout">
            Đăng xuất
          </li>
        </ul>
      </aside>

      <main className="admin-main-content">
        <header className="admin-main-header">
          <h2>Quản lý Phòng Học</h2>
          <div className="admin-user-actions">
            <span>👤 {user?.fullName}</span>
            <button className="btn-danger" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <section className="admin-card">
          <div className="room-card-header">
            <h3>Danh sách phòng</h3>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              + Thêm phòng mới
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên phòng</th>
                  <th>Tòa nhà</th>
                  <th>Sức chứa</th>
                  <th>Loại phòng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="room-name">{room.name}</td>
                    <td>{room.building || '-'}</td>
                    <td>{room.capacity} chỗ</td>
                    <td>{room.type}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          room.status === 'Hoạt động'
                            ? 'status-active'
                            : 'status-locked'
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        className="edit-button"
                        onClick={() => handleOpenModal(room)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-danger room-action-button"
                        onClick={() => handleDelete(room.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-table">
                      Chưa có phòng học nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingId ? 'Sửa thông tin phòng' : 'Thêm phòng học mới'}</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Đóng"
                >
                  &times;
                </button>
              </div>

              {error && <p className="edit-error">{error}</p>}

              <form onSubmit={handleSave} className="edit-form">
                <label>
                  Tên phòng (VD: A101)
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Tòa nhà
                  <input
                    type="text"
                    value={form.building}
                    onChange={(event) =>
                      setForm({ ...form, building: event.target.value })
                    }
                  />
                </label>
                <label>
                  Sức chứa
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) =>
                      setForm({ ...form, capacity: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Loại phòng
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({ ...form, type: event.target.value })
                    }
                  >
                    <option value="Lý thuyết">Lý thuyết</option>
                    <option value="Thực hành">Thực hành</option>
                  </select>
                </label>
                <label>
                  Trạng thái
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value })
                    }
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Bảo trì">Bảo trì</option>
                    <option value="Đã khóa">Đã khóa</option>
                  </select>
                </label>
                <label>
                  Thiết bị (mô tả)
                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [user] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null'),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    subject: '',
    lecturerName: '',
    dayOfWeek: 2,
    startTime: '07:00',
    endTime: '09:00',
    roomId: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [scheduleResponse, roomResponse] = await Promise.all([
        api.get('/schedules'),
        api.get('/rooms'),
      ]);
      setSchedules(scheduleResponse.data);
      setRooms(roomResponse.data);
    } catch (requestError) {
      alert(
        `Lỗi tải dữ liệu: ${
          requestError.response?.data?.message || requestError.message
        }`,
      );
      if ([401, 403].includes(requestError.response?.status)) navigate('/');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scheduleResponse, roomResponse] = await Promise.all([
          api.get('/schedules'),
          api.get('/rooms'),
        ]);
        setSchedules(scheduleResponse.data);
        setRooms(roomResponse.data);
      } catch (requestError) {
        alert(
          `Lỗi tải dữ liệu: ${
            requestError.response?.data?.message || requestError.message
          }`,
        );
        if ([401, 403].includes(requestError.response?.status)) navigate('/');
      }
    };
    loadData();
  }, [navigate]);

  const handleOpenModal = (schedule = null) => {
    setError('');
    if (schedule) {
      setEditingId(schedule.id);
      setForm({
        subject: schedule.subject,
        lecturerName: schedule.lecturerName || '',
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        roomId: schedule.roomId,
      });
    } else {
      setEditingId(null);
      setForm({
        subject: '',
        lecturerName: '',
        dayOfWeek: 2,
        startTime: '07:00',
        endTime: '09:00',
        roomId: rooms[0]?.id || '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.patch(`/schedules/${editingId}`, form);
      } else {
        await api.post('/schedules', form);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Lỗi lưu thời khóa biểu',
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch học này?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      await fetchData();
    } catch (requestError) {
      alert(
        `Lỗi xóa lịch học: ${
          requestError.response?.data?.message || requestError.message
        }`,
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getDayName = (day) =>
    ({
      2: 'Thứ 2',
      3: 'Thứ 3',
      4: 'Thứ 4',
      5: 'Thứ 5',
      6: 'Thứ 6',
      7: 'Thứ 7',
      8: 'Chủ nhật',
    })[day] || `Thứ ${day}`;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <h3>QNU ADMIN</h3>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/admin')}>Quản lý Người dùng</li>
          <li onClick={() => navigate('/admin/rooms')}>Quản lý Phòng học</li>
          <li className="active">Thời khóa biểu</li>
          <li onClick={() => navigate('/admin/incidents')}>
            Quản lý Sự cố
          </li>
          <li onClick={() => navigate('/admin/stats')}>
            Thống kê Báo cáo
          </li>
          <li onClick={handleLogout} className="sidebar-logout">
            Đăng xuất
          </li>
        </ul>
      </aside>

      <main className="admin-main-content">
        <header className="admin-main-header">
          <h2>Quản lý Thời khóa biểu</h2>
          <div className="admin-user-actions">
            <span>👤 {user?.fullName}</span>
            <button className="btn-danger" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <section className="admin-card">
          <div className="room-card-header">
            <h3>Lịch giảng dạy</h3>
            <button
              className="btn-primary"
              onClick={() => handleOpenModal()}
              disabled={rooms.length === 0}
            >
              {rooms.length === 0 ? 'Chưa có phòng học' : '+ Thêm lịch học'}
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th>Giảng viên</th>
                  <th>Thứ</th>
                  <th>Thời gian</th>
                  <th>Phòng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="room-name">{schedule.subject}</td>
                    <td>{schedule.lecturerName || '---'}</td>
                    <td>{getDayName(schedule.dayOfWeek)}</td>
                    <td>
                      {schedule.startTime} - {schedule.endTime}
                    </td>
                    <td>
                      <span className="room-label">
                        {schedule.room?.name || schedule.roomId}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        className="edit-button"
                        onClick={() => handleOpenModal(schedule)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-danger room-action-button"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {schedules.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-table">
                      Chưa có lịch học nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingId ? 'Sửa lịch học' : 'Thêm lịch học mới'}</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Đóng"
                >
                  &times;
                </button>
              </div>
              {error && <p className="edit-error">{error}</p>}
              <form onSubmit={handleSave} className="edit-form">
                <label>
                  Tên môn học
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(event) =>
                      setForm({ ...form, subject: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Giảng viên
                  <input
                    type="text"
                    value={form.lecturerName}
                    onChange={(event) =>
                      setForm({ ...form, lecturerName: event.target.value })
                    }
                  />
                </label>
                <label>
                  Phòng học
                  <select
                    value={form.roomId}
                    onChange={(event) =>
                      setForm({ ...form, roomId: event.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      -- Chọn phòng --
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} ({room.building || 'Không rõ tòa'})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Thứ trong tuần
                  <select
                    value={form.dayOfWeek}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        dayOfWeek: Number(event.target.value),
                      })
                    }
                  >
                    <option value={2}>Thứ 2</option>
                    <option value={3}>Thứ 3</option>
                    <option value={4}>Thứ 4</option>
                    <option value={5}>Thứ 5</option>
                    <option value={6}>Thứ 6</option>
                    <option value={7}>Thứ 7</option>
                    <option value={8}>Chủ nhật</option>
                  </select>
                </label>
                <div className="time-fields">
                  <label>
                    Giờ bắt đầu
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) =>
                        setForm({ ...form, startTime: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Giờ kết thúc
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) =>
                        setForm({ ...form, endTime: event.target.value })
                      }
                      required
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState('');
  const [user] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null'),
  );
  const navigate = useNavigate();

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/incidents');
      setIncidents(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Lỗi tải danh sách sự cố',
      );
    }
  };

  useEffect(() => {
    let isMounted = true;
    void api
      .get('/incidents')
      .then((response) => {
        if (isMounted) {
          setIncidents(response.data);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              'Lỗi tải danh sách sự cố',
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/incidents/${id}/status`, { status });
      await fetchIncidents();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Lỗi cập nhật trạng thái',
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <h3>QNU ADMIN</h3>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/admin')}>Quản lý Người dùng</li>
          <li onClick={() => navigate('/admin/rooms')}>Quản lý Phòng học</li>
          <li onClick={() => navigate('/admin/schedules')}>
            Thời khóa biểu
          </li>
          <li className="active">Quản lý Sự cố</li>
          <li onClick={() => navigate('/admin/stats')}>
            Thống kê Báo cáo
          </li>
          <li onClick={handleLogout} className="sidebar-logout">
            Đăng xuất
          </li>
        </ul>
      </aside>

      <main className="admin-main-content">
        <header className="admin-main-header">
          <h2>Danh sách Báo cáo Sự cố</h2>
          <div className="admin-user-actions">
            <span>👤 {user?.fullName}</span>
            <button className="btn-danger" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        {error && <div className="booking-alert booking-alert-error">{error}</div>}

        <section className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Phòng</th>
                  <th>Người báo cáo</th>
                  <th>Tiêu đề / Mô tả</th>
                  <th>Hình ảnh</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="room-name">
                      {incident.room?.name || incident.roomId}
                    </td>
                    <td>{incident.user?.fullName || '-'}</td>
                    <td>
                      <strong>{incident.title}</strong>
                      <br />
                      <small className="incident-description">
                        {incident.description}
                      </small>
                    </td>
                    <td>
                      {incident.imageUrl ? (
                        <a
                          href={`http://localhost:3000${incident.imageUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={`http://localhost:3000${incident.imageUrl}`}
                            alt={`Ảnh sự cố ${incident.title}`}
                            className="incident-image"
                          />
                        </a>
                      ) : (
                        'Không có'
                      )}
                    </td>
                    <td>
                      <select
                        value={incident.status}
                        onChange={(event) =>
                          handleUpdateStatus(incident.id, event.target.value)
                        }
                      >
                        <option value="Mới">Mới</option>
                        <option value="Đã tiếp nhận">Đã tiếp nhận</option>
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Đã xử lý">Đã xử lý</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-table">
                      Chưa có báo cáo sự cố nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function AdminStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [user] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null'),
  );
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    void api
      .get('/statistics')
      .then((response) => {
        if (isMounted) {
          setStats(response.data);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              'Không thể tải dữ liệu thống kê',
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!stats) {
    return (
      <div className="stats-loading">
        {error || 'Đang tải dữ liệu thống kê...'}
      </div>
    );
  }

  const cards = [
    {
      value: stats.totalBookings,
      label: 'Tổng lượt đặt phòng',
      color: '#3b82f6',
    },
    {
      value: stats.noShowBookings,
      label: 'Lượt bùng (No-show)',
      color: '#ef4444',
    },
    {
      value: stats.totalIncidents,
      label: 'Tổng sự cố báo cáo',
      color: '#10b981',
    },
    {
      value: stats.pendingIncidents,
      label: 'Sự cố chưa xử lý',
      color: '#f59e0b',
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <h3>QNU ADMIN</h3>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/admin')}>Quản lý Người dùng</li>
          <li onClick={() => navigate('/admin/rooms')}>Quản lý Phòng học</li>
          <li onClick={() => navigate('/admin/schedules')}>
            Thời khóa biểu
          </li>
          <li onClick={() => navigate('/admin/incidents')}>
            Quản lý Sự cố
          </li>
          <li className="active">Thống kê Báo cáo</li>
          <li onClick={handleLogout} className="sidebar-logout">
            Đăng xuất
          </li>
        </ul>
      </aside>

      <main className="admin-main-content">
        <header className="admin-main-header">
          <h2>Tổng quan Hệ thống</h2>
          <div className="admin-user-actions">
            <span>👤 {user?.fullName}</span>
            <button className="btn-danger" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        {error && (
          <div className="booking-alert booking-alert-error">{error}</div>
        )}

        <section className="stats-grid">
          {cards.map((card) => (
            <div
              className="stats-card"
              style={{ borderTopColor: card.color }}
              key={card.label}
            >
              <h1 style={{ color: card.color }}>{card.value}</h1>
              <p>{card.label}</p>
            </div>
          ))}
        </section>

        <section className="admin-card">
          <h3>Top 5 Phòng được sử dụng nhiều nhất</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Tên Phòng</th>
                  <th>Số lượt đặt</th>
                </tr>
              </thead>
              <tbody>
                {stats.topRooms.map((room, index) => (
                  <tr key={`${room.roomName}-${index}`}>
                    <td
                      className={
                        index === 0 ? 'stats-first-place' : 'stats-rank'
                      }
                    >
                      #{index + 1}
                    </td>
                    <td className="room-name">{room.roomName}</td>
                    <td>{room.bookingCount} lượt</td>
                  </tr>
                ))}
                {stats.topRooms.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-table">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedules"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSchedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/incidents"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminIncidents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminStats />
            </ProtectedRoute>
          }
        />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
