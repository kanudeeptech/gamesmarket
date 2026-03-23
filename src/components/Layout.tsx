import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeItem: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, activeItem }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Mobile Hamburger Button - Top Left */}
      <button
        className="mobile-hamburger"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 2000,
          background: 'var(--bg-sidebar)',
          color: 'white',
          padding: '10px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-neon)'
        }}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Conditional for Mobile */}
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar onLogout={onLogout} activeItem={activeItem} onItemClick={closeSidebar} />
        {isSidebarOpen && (
          <div
            onClick={closeSidebar}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 90
            }}
          />
        )}
      </div>

      <main style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        padding: 'min(40px, 5vw)',
        maxWidth: '1400px',
        width: '100%',
        transition: 'margin-left 0.3s ease'
      }}>
        {children}
      </main>

      <style>{`
        :root {
          --sidebar-width: 260px;
        }

        .mobile-hamburger { display: none; }
        .sidebar-container { display: block; }

        @media (max-width: 768px) {
          :root {
            --sidebar-width: 0px;
          }
          .mobile-hamburger { display: flex; }
          .sidebar-container { 
            position: fixed;
            left: -260px;
            top: 0;
            bottom: 0;
            width: 260px;
            z-index: 1001;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .sidebar-container.open {
            left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
