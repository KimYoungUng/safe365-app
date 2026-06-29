import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LeaveManagement from './pages/LeaveManagement';
import Overtime from './pages/Overtime';
import Notice from './pages/Notice';
import Messages from './pages/Messages';
import Education from './pages/Education';
import AttendanceRecord from './pages/AttendanceRecord';
import Notifications from './pages/Notifications';
import Layout from './components/Layout';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminPayroll from './pages/admin/AdminPayroll';
import AdminHR from './pages/admin/AdminHR';
import AdminEducation from './pages/admin/AdminEducation';
import AdminSafety from './pages/admin/AdminSafety';
import MyPayroll from './pages/MyPayroll';
import MyContract from './pages/MyContract';
import SafetyInspection from './pages/safety/SafetyInspection';
import TbmExecution from './pages/safety/TbmExecution';
import SafetySuggestion from './pages/safety/SafetySuggestion';
import NearMiss from './pages/safety/NearMiss';
import Profile from './pages/Profile';
import CompanyManagement from './pages/super/CompanyManagement';
import SubscriptionManagement from './pages/super/SubscriptionManagement';
import CompanyBilling from './pages/super/CompanyBilling';
import CompanyDetail from './pages/super/CompanyDetail';
import EmergencyAlert from './components/EmergencyAlert';
import './App.css';
import mainLogo from './assets/logo_wide.png';

// import { usePushNotifications } from './hooks/usePushNotifications';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { currentUser } = useContext(AuthContext);
  // usePushNotifications(currentUser);
  if (!currentUser) return <Navigate to="/" replace />;
  return <Layout />;
};

function App() {
  const { currentUser } = useContext(AuthContext);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    // 1.5초 후 페이드아웃 시작
    const fadeTimer = setTimeout(() => {
      setFadeSplash(true);
    }, 1500);
    
    // 페이드아웃 애니메이션(0.5초) 완료 후 DOM에서 제거
    const unmountTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  return (
    <>
      {showSplash && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          backgroundColor: 'white', zIndex: 99999,
          opacity: fadeSplash ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
          pointerEvents: fadeSplash ? 'none' : 'auto'
        }}>
          <img src={mainLogo} alt="Safe 365 Logo" style={{ width: '250px', objectFit: 'contain' }} />
        </div>
      )}
      <EmergencyAlert />
      <Routes>
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* 로그인 된 사용자만 접근 가능한 라우트들 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/leave" element={<LeaveManagement />} />
        <Route path="/overtime" element={<Overtime />} />
        <Route path="/notice" element={<Notice />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/education" element={<Education />} />
        <Route path="/attendance" element={<AttendanceRecord />} />
        <Route path="/payroll" element={<MyPayroll />} />
        <Route path="/contract" element={<MyContract />} />
        <Route path="/safety" element={<SafetyInspection />} />
        <Route path="/safety/tbm" element={<TbmExecution />} />
        <Route path="/safety/suggestion" element={<SafetySuggestion />} />
        <Route path="/safety/near-miss" element={<NearMiss />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* 관리자(COMPANY_ADMIN) 전용 라우트 */}
        <Route path="/admin/attendance" element={<AdminAttendance />} />
        <Route path="/admin/approvals" element={<AdminApprovals />} />
        <Route path="/admin/payroll" element={<AdminPayroll />} />
        <Route path="/admin/hr" element={<AdminHR />} />
        <Route path="/admin/education" element={<AdminEducation />} />
        <Route path="/admin/safety" element={<AdminSafety />} />

        {/* 최고관리자(SUPER_ADMIN) 전용 라우트 */}
        <Route path="/super/companies" element={<CompanyManagement />} />
        <Route path="/super/companies/:id" element={<CompanyDetail />} />
        <Route path="/super/subscriptions" element={<SubscriptionManagement />} />
        <Route path="/super/billing/:id" element={<CompanyBilling />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
