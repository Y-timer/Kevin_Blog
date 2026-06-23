import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import RequireAuth from './components/layout/RequireAuth';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const UserCenterPage = lazy(() => import('./pages/UserCenterPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function GuestGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          path="/register"
          element={
            <GuestGuard>
              <RegisterPage />
            </GuestGuard>
          }
        />
        <Route path="/post/:slug" element={<ArticleDetailPage />} />
        <Route
          path="/user/center"
          element={
            <RequireAuth>
              <UserCenterPage />
            </RequireAuth>
          }
        />
        <Route
          path="/editor"
          element={
            <RequireAuth>
              <EditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/editor/:slug"
          element={
            <RequireAuth>
              <EditorPage />
            </RequireAuth>
          }
        />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
