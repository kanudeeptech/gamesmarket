import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import Layout from './components/Layout';
import GameConfigPage from './pages/GameConfigPage';
import MyStatsPage from './pages/MyStatsPage';
import MathBlitzPage from './pages/MathBlitzPage';
import RetroSnakePage from './pages/RetroSnakePage';
import PacManRetroPage from './pages/PacManRetroPage';
import FlappyNeonPage from './pages/FlappyNeonPage';
import BombermanPage from './pages/BombermanPage';
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
  const isZenMode = ['/math-blitz', '/retro-snake', '/pacman-retro', '/flappy-neon', '/bomberman'].includes(location.pathname);

  const getActiveItem = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === '/stats') return 'Stats';
    if (location.pathname === '/config') return 'Config';
    return '';
  };

  if (isZenMode) {
    if (location.pathname === '/math-blitz') return <MathBlitzPage />;
    if (location.pathname === '/retro-snake') return <RetroSnakePage />;
    if (location.pathname === '/pacman-retro') return <PacManRetroPage />;
    if (location.pathname === '/flappy-neon') return <FlappyNeonPage />;
    if (location.pathname === '/bomberman') return <BombermanPage />;
  }

  return (
    <Layout onLogout={onLogout} activeItem={getActiveItem()}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<MyStatsPage />} />
        <Route path="/config" element={<GameConfigPage />} />
        <Route path="/flappy-neon" element={<FlappyNeonPage />} />
        <Route path="/bomberman" element={<BombermanPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
