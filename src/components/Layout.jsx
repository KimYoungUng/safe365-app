import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Bell, MessageSquare, User } from 'lucide-react';
import { useEmployeeNotifications } from '../hooks/useEmployeeNotifications';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const notifications = useEmployeeNotifications();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  useEffect(() => {
    const el = document.getElementById('main-scroll-container');
    if (el) {
      el.scrollTop = 0;
    }
  }, [location.pathname, location.search]);

  // 모바일 뒤로가기 버튼 처리
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backHandler = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/dashboard') {
        // 홈 화면에서는 앱 최소화 (Android 표준 동작)
        CapacitorApp.minimizeApp();
      } else {
        // 다른 페이지에서는 뒤로가기
        navigate(-1);
      }
    });

    return () => {
      backHandler.then(handler => handler.remove());
    };
  }, [location.pathname, navigate]);

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 화면 내용 영역 (이 안에서만 스크롤 됨) */}
      <div id="main-scroll-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Outlet />
      </div>

      {/* Bottom Navigation (절대 밀려나지 않고 하단 고정) */}
      <nav className="bottom-nav" style={{ position: 'relative', flexShrink: 0, zIndex: 9999 }}>
        <div className={`nav-item ${isActive('/dashboard')}`} onClick={() => navigate('/dashboard')}>
          <Home className="nav-icon" />
          <span>홈</span>
        </div>
        <div className={`nav-item ${isActive('/notifications')}`} onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
          {notifications.total > 0 && (
            <div style={{ position: 'absolute', top: '4px', right: '16px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '1.5px solid white' }}>
              {notifications.total > 99 ? '99+' : notifications.total}
            </div>
          )}
          <Bell className="nav-icon" />
          <span>알림</span>
        </div>
        <div className={`nav-item ${isActive('/profile')}`} onClick={() => navigate('/profile')}>
          <User className="nav-icon" />
          <span>내정보</span>
        </div>
      </nav>
    </div>
  );
}

export default Layout;
