import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';

interface GameStat {
  gameName: string;
  score: number;
  date: string;
}

interface GameSummary {
  gameName: string;
  topScore: number;
  lastPlayed: string;
  history: GameStat[];
}

const MyStatsPage: React.FC = () => {
  const [stats, setStats] = useState<GameStat[]>([]);
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem('gameStats') || '[]') as GameStat[];
    savedStats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setStats(savedStats);
  }, []);

  const gameSummaries = useMemo(() => {
    const summaries: Record<string, GameSummary> = {};

    stats.forEach(stat => {
      if (!summaries[stat.gameName]) {
        summaries[stat.gameName] = {
          gameName: stat.gameName,
          topScore: stat.score,
          // Since we sorted by date descending above, the first one encountered is the most recent
          lastPlayed: stat.date,
          history: []
        };
      } else {
        if (stat.score > summaries[stat.gameName].topScore) {
          summaries[stat.gameName].topScore = stat.score;
        }
      }
      summaries[stat.gameName].history.push(stat);
    });

    return Object.values(summaries);
  }, [stats]);

  const toggleExpand = (gameName: string) => {
    setExpandedGames(prev => ({
      ...prev,
      [gameName]: !prev[gameName]
    }));
  };

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
        {gameSummaries.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Game Name</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Top Score</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Last Played</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>History</th>
              </tr>
            </thead>
            <tbody>
              {gameSummaries.map((summary, index) => {
                const isExpanded = !!expandedGames[summary.gameName];
                return (
                  <React.Fragment key={index}>
                    <tr 
                      onClick={() => toggleExpand(summary.gameName)}
                      style={{ 
                        borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.05)', 
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent'}
                    >
                      <td style={{ padding: '16px 24px', fontWeight: 'bold' }}>{summary.gameName}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--neon-blue, #00d2ff)', fontWeight: 'bold' }}>{summary.topScore}</td>
                      <td style={{ padding: '16px 24px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {new Date(summary.lastPlayed).toLocaleDateString()} {new Date(summary.lastPlayed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-blue, #00d2ff)' }}>
                          <History size={20} />
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td colSpan={4} style={{ padding: '0' }}>
                          <div style={{ 
                            background: 'rgba(0, 0, 0, 0.2)', 
                            padding: '16px 24px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              History for {summary.gameName}
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.5)' }}>Score</th>
                                  <th style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.5)' }}>Date & Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {summary.history.map((stat, hIndex) => (
                                  <tr key={hIndex}>
                                    <td style={{ padding: '8px 12px', color: 'var(--neon-blue, #00d2ff)' }}>{stat.score}</td>
                                    <td style={{ padding: '8px 12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                      {new Date(stat.date).toLocaleDateString()} {new Date(stat.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
            No stats available yet. Go play some games!
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStatsPage;
