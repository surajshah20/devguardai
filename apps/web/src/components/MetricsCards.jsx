import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, GitCommit, Layers, Code2 } from 'lucide-react';

export function MetricsCards({ review }) {
  if (!review) return null;

  const { repository, commitSha, targetRef, summary = {}, project = {} } = review;
  const shortSha = (commitSha || '').slice(0, 7);

  const metrics = [
    { label: 'Total Findings', count: summary.total || 0, color: 'var(--text-main)', bg: 'rgba(255,255,255,0.04)', icon: Layers },
    { label: 'Critical', count: summary.critical || 0, color: 'var(--critical)', bg: 'var(--critical-bg)', icon: ShieldAlert },
    { label: 'High', count: summary.high || 0, color: 'var(--high)', bg: 'var(--high-bg)', icon: AlertTriangle },
    { label: 'Medium', count: summary.medium || 0, color: 'var(--medium)', bg: 'var(--medium-bg)', icon: AlertCircle },
    { label: 'Low', count: summary.low || 0, color: 'var(--low)', bg: 'var(--low-bg)', icon: Info },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0' }}>
      {/* Top Banner with Repo & Commit Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
            {repository?.fullName || 'Repository'}
          </span>
          <span style={{
            fontSize: '0.78rem',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}>
            {targetRef || 'main'}
          </span>
          {shortSha && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--primary)',
              fontFamily: 'monospace',
            }}>
              <GitCommit size={13} />
              {shortSha}
            </span>
          )}
        </div>

        {/* Project Tech Stack */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Code2 size={15} color="var(--primary)" />
          <span>{project.ecosystem ? project.ecosystem.toUpperCase() : 'Generic'}</span>
          {(project.languages || []).length > 0 && (
            <span>• {(project.languages || []).join(', ')}</span>
          )}
          {(project.frameworks || []).length > 0 && (
            <span>• {(project.frameworks || []).join(', ')}</span>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px',
      }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: m.color }}>
                  {m.count}
                </div>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: m.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: m.color,
              }}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
