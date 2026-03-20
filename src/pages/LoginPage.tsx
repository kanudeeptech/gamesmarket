import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Invalid credentials. Access denied.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      padding: '20px'
    }}>
      <div className="glass fade-in" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-neon)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background circle */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'var(--accent-gradient)',
          filter: 'blur(60px)',
          opacity: 0.3,
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Admin Login</h2>
          <p style={{ 
            color: 'var(--text-dim)', 
            textAlign: 'center', 
            fontSize: '0.9rem',
            marginBottom: '32px'
          }}>Enter your credentials to access the 2D Arcade</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--neon-blue)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Email / Username</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--neon-blue)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--neon-blue)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--neon-blue)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {error && (
              <p style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
              ACCESS SYSTEM
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
