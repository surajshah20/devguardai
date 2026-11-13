import React from 'react';
import { History, GitCommit, ChevronRight } from 'lucide-react';

export function HistoryPanel({ reviews = [], activeReviewId, onSelectReview }) {
  if (reviews.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          <History size={13} color="var(--text-muted)" />
          <span>Recent Scans</span>
        </div>
        <span style={{
          fontSize: '10px',
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-muted)',
          background: 'var(--bg-canvas)',
          padding: '1px 5px',
          borderRadius: '3px',
          border: '1px solid var(--border-subtle)',
        }}>
          {reviews.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {reviews.map((r) => {
          const isActive = r.id === activeReviewId;
          const shortSha = (r.commitSha || '').slice(0, 7);
          const time = r.createdAt
            ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <button
              key={r.id}
              onClick={() => onSelectReview(r.id)}
              style={{
                background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                borderRadius: 'var(--radius-xs)',
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {r.repository?.fullName || 'Repository'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginTop: '2px',
                }}>
                  <GitCommit size={10} />
                  <span>{shortSha || 'HEAD'}</span>
                  <span>•</span>
                  <span>{r.summary?.total || 0} issues</span>
                  {time && <span>• {time}</span>}
                </div>
              </div>

              <ChevronRight
                size={12}
                color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'}
                style={{ flexShrink: 0 }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

