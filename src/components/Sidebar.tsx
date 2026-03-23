import React from 'react';
import { Home, BarChart2, Settings, Gamepad2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
  activeItem: string;
  onItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, activeItem, onItemClick }) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'Home', icon: <Home size={20} />, active: activeItem === 'Home', path: '/' },
    { name: 'My Stats', icon: <BarChart2 size={20} />, active: activeItem === 'Stats', path: '/stats' },
    { name: 'Game Configuration', icon: <Gamepad2 size={20} />, active: activeItem === 'Config', path: '/config' },
    { name: 'Settings', icon: <Settings size={20} />, active: activeItem === 'Settings', path: '/settings' },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (onItemClick) onItemClick();
  };

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '30px 20px',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      <div className="brand" style={{ 
        fontSize: '1.2rem', 
        fontWeight: 700, 
        marginBottom: '40px',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center',
        cursor: 'pointer'
      }} onClick={() => handleItemClick('/')}>
        Arcade OS
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.name}
            onClick={() => handleItemClick(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: item.active ? 'var(--neon-blue)' : 'var(--text-dim)',
              background: item.active ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
              transition: 'all 0.2s',
              border: item.active ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid transparent'
            }}
          >
            <span style={{ marginRight: '12px' }}>{item.icon}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</span>
          </div>
        ))}
      </nav>

      <button
        onClick={onLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: '8px',
          color: '#ff4444',
          background: 'rgba(255, 68, 68, 0.05)',
          border: '1px solid rgba(255, 68, 68, 0.1)',
          marginTop: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 68, 68, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.1)';
        }}
      >
        <LogOut size={20} style={{ marginRight: '12px' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
