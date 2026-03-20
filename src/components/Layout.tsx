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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Mobile Header */}
      <div className="mobile-only" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 1000,
        justifyContent: 'space-between'
      }}>
        <div className="brand" style={{ fontSize: '1rem' }}>Arcade OS</div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ background: 'transparent', color: 'white' }}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar - Conditional for Mobile */}
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar onLogout={onLogout} activeItem={activeItem} />
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
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
        marginTop: 'var(--mobile-header-height)'
      }}>
        {children}
      </main>

      <style>{`
        :root {
          --sidebar-width: 260px;
          --mobile-header-height: 0px;
        }

        .mobile-only { display: none; }
        .sidebar-container { display: block; }

        @media (max-width: 768px) {
          :root {
            --sidebar-width: 0px;
            --mobile-header-height: 60px;
          }
          .mobile-only { display: flex; }
          .sidebar-container { 
            position: fixed;
            left: -260px;
            top: 0;
            bottom: 0;
            width: 260px;
            z-index: 1001;
            transition: left 0.3s ease;
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
