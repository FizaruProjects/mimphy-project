import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserSession } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { TeacherDashboard } from '@/features/teachers/components/TeacherDashboard';
import { StudentDashboard } from '@/features/students/components/StudentDashboard';
import { AdminDashboard } from '@/features/admin/components/AdminDashboard';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/layouts/ProtectedRoute';

const MainApp: React.FC = () => {
  const [session, setSession] = useState<UserSession>({ role: null });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await SupabaseService.getCurrentUser();
        if (user) {
          setSession(user);
        }
      } catch (err) {
        console.error("Auth init error", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
    
    const { data: { subscription } } = SupabaseService.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_OUT') {
            setSession({ role: null });
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession({ role: null });
    SupabaseService.logout();
  };

  if (isInitializing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-900">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
      );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Route */}
          <Route path="/login" element={
            !session.role ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <Navigate to={`/${session.role}`} replace />
            )
          } />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes for Student */}
          <Route element={<ProtectedRoute session={session} allowedRoles={['student']} />}>
            <Route path="/student" element={<StudentDashboard session={session} onLogout={handleLogout} />} />
            {/* Future nested routes like /student/quiz/:id can go here */}
          </Route>

          {/* Protected Routes for Teacher */}
          <Route element={<ProtectedRoute session={session} allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={<TeacherDashboard session={session} onLogout={handleLogout} />} />
            {/* Future nested routes like /teacher/packets can go here */}
          </Route>

          {/* Protected Routes for Admin */}
          <Route element={<ProtectedRoute session={session} allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />
          </Route>
          
          {/* Catch-all 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <MainApp />
  </ThemeProvider>
);

export default App;
