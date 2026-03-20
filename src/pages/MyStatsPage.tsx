import React, { useState, useEffect } from 'react';

interface GameStat {
  gameName: string;
  score: number;
  date: string;
}

const MyStatsPage: React.FC = () => {
  const [stats, setStats] = useState<GameStat[]>([]);

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem('gameStats') || '[]');
    setStats(savedStats);
  }, []);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: 'bold', letterSpacing: '1px' }}>
        My Stats
      </h1>

      <div style={{
        background: 'rgba(15, 15, 15, 0.6)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Game Name</th>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Score</th>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.length > 0 ? (
              stats.map((stat, index) => (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>{stat.gameName}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--neon-blue, #00d2ff)', fontWeight: 'bold' }}>{stat.score}</td>
                  <td style={{ padding: '16px 24px', color: 'rgba(255, 255, 255, 0.6)' }}>{new Date(stat.date).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                  No stats available yet. Go play some games!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyStatsPage;
