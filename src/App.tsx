import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import GameConfigPage from './pages/GameConfigPage';
import MyStatsPage from './pages/MyStatsPage';
import MathBlitzPage from './pages/MathBlitzPage';
import { useLocation } from 'react-router-dom';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const login = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />
          }
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AuthenticatedRoutes onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

const AuthenticatedRoutes = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();
  const isZenMode = location.pathname === '/math-blitz';

  const getActiveItem = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === '/stats') return 'Stats';
    if (location.pathname === '/config') return 'Config';
    return '';
  };

  if (isZenMode) {
    return <MathBlitzPage />;
  }

  return (
    <Layout onLogout={onLogout} activeItem={getActiveItem()}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<MyStatsPage />} />
        <Route path="/config" element={<GameConfigPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
