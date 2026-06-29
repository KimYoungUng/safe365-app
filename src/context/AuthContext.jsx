import { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Supabase에서 유저 정보 가져오기
  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (data) {
      // snake_case -> camelCase 매핑 및 로컬 데이터(주소, 휴가) 병합
      const localExtraData = JSON.parse(localStorage.getItem('usersExtraData') || '{}');
      const mapped = data.map(u => ({
        ...u,
        roleCode: u.role_code,
        baseSalary: u.base_salary,
        companyId: u.company_id,
        savedSignature: u.saved_signature,
        profileImage: u.profile_image,
        address: localExtraData[u.id]?.address || u.address || '',
        totalLeaves: localExtraData[u.id]?.totalLeaves || u.total_leaves || 15
      }));
      setUsers(mapped);
      
      // 세션 복구
      const isAutoLogin = localStorage.getItem('autoLogin') === 'true';
      const savedUserId = isAutoLogin ? localStorage.getItem('mockUserId') : sessionStorage.getItem('mockUserId');
      if (savedUserId) {
        const user = mapped.find(u => u.id === savedUserId);
        if (user) setCurrentUser(user);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // (임시) pendingUsers 로컬 유지
    const savedPending = localStorage.getItem('pendingUsers');
    if (savedPending) setPendingUsers(JSON.parse(savedPending));
  }, []);

  const login = (id, password) => {
    const user = users.find(u => u.id === id && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('mockUserId', user.id);
      sessionStorage.setItem('mockUserId', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mockUserId');
    sessionStorage.removeItem('mockUserId');
    localStorage.setItem('autoLogin', 'false');
  };

  const addEmployee = async (employeeData) => {
    if (users.some(u => u.id === employeeData.id)) {
      throw new Error('이미 존재하는 아이디입니다.');
    }
    const { data, error } = await supabase.from('users').insert({
      id: employeeData.id,
      password: employeeData.password || 'password',
      name: employeeData.name,
      role: employeeData.role,
      role_code: employeeData.roleCode,
      department: employeeData.department || null,
      company_id: employeeData.companyId || null,
      base_salary: employeeData.baseSalary || 0,
      phone: employeeData.phone || null
      // address: employeeData.address || null // Supabase 컬럼 누락으로 임시 주석 처리
    });
    
    // DB에 없는 컬럼(주소, 휴가일수)은 임시로 LocalStorage에 저장
    const localExtraData = JSON.parse(localStorage.getItem('usersExtraData') || '{}');
    localExtraData[employeeData.id] = {
      ...(localExtraData[employeeData.id] || {}),
      address: employeeData.address || '',
      totalLeaves: employeeData.totalLeaves || 15
    };
    localStorage.setItem('usersExtraData', JSON.stringify(localExtraData));
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || '가입 승인 중 데이터베이스 오류가 발생했습니다.');
    }
    await fetchUsers();
  };

  const updateEmployee = async (userId, newInfo) => {
    const updateData = { ...newInfo };
    if ('roleCode' in updateData) { updateData.role_code = updateData.roleCode; delete updateData.roleCode; }
    if ('baseSalary' in updateData) { updateData.base_salary = updateData.baseSalary; delete updateData.baseSalary; }
    if ('companyName' in updateData) { delete updateData.companyName; }
    
    // DB에 없는 컬럼 처리
    const localExtraData = JSON.parse(localStorage.getItem('usersExtraData') || '{}');
    const extraInfo = localExtraData[userId] || {};
    let saveLocal = false;

    if ('address' in updateData) {
      extraInfo.address = updateData.address;
      delete updateData.address;
      saveLocal = true;
    }
    if ('totalLeaves' in updateData) {
      extraInfo.totalLeaves = updateData.totalLeaves;
      delete updateData.totalLeaves;
      saveLocal = true;
    }
    if ('total_leaves' in updateData) {
      delete updateData.total_leaves; // DB 에러 방지
    }

    if (saveLocal) {
      localExtraData[userId] = extraInfo;
      localStorage.setItem('usersExtraData', JSON.stringify(localExtraData));
    }

    // 빈 객체가 아니면 DB 업데이트 실행
    if (Object.keys(updateData).length > 0) {
      if ('companyId' in updateData) { updateData.company_id = updateData.companyId; delete updateData.companyId; }
      if ('savedSignature' in updateData) { updateData.saved_signature = updateData.savedSignature; delete updateData.savedSignature; }

      const { error } = await supabase.from('users').update(updateData).eq('id', userId);
      if (error) console.error(error);
    }
    await fetchUsers();
  };

  const removeEmployee = async (userId) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) await fetchUsers();
  };

  const resetPassword = async (userId) => {
    await updateEmployee(userId, { password: 'password' });
  };

  // 가입 대기자 로직 (현재는 로컬 유지, 필요 시 DB 테이블로 확장)
  const addPendingUser = (userData) => {
    if (users.some(u => u.id === userData.id) || pendingUsers.some(u => u.id === userData.id)) {
      throw new Error('이미 존재하는 아이디입니다.');
    }
    const newPending = [...pendingUsers, { ...userData, status: '대기중', requestDate: new Date().toISOString() }];
    setPendingUsers(newPending);
    localStorage.setItem('pendingUsers', JSON.stringify(newPending));
  };

  const approvePendingUser = async (userId) => {
    const userToApprove = pendingUsers.find(u => u.id === userId);
    if (userToApprove) {
      const newUser = {
        ...userToApprove,
        roleCode: 'EMPLOYEE',
        role: '사원',
        baseSalary: 3000000,
      };
      delete newUser.status;
      delete newUser.requestDate;
      try {
        await addEmployee(newUser);
        rejectPendingUser(userId);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const rejectPendingUser = (userId) => {
    const newPending = pendingUsers.filter(u => u.id !== userId);
    setPendingUsers(newPending);
    localStorage.setItem('pendingUsers', JSON.stringify(newPending));
  };

  const resetPendingUserPassword = (userId) => {
    setPendingUsers(prev => {
      const newPending = prev.map(u => u.id === userId ? { ...u, password: 'password' } : u);
      localStorage.setItem('pendingUsers', JSON.stringify(newPending));
      return newPending;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, users, pendingUsers, 
      login, logout, addEmployee, updateEmployee, 
      removeEmployee, resetPassword, resetPendingUserPassword, 
      addPendingUser, approvePendingUser, rejectPendingUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
