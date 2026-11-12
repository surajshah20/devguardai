import React from 'react';
import { History, GitCommit, ChevronRight } from 'lucide-react';

export function HistorySidebar({ reviews = [], activeReviewId, onSelectReview }) {
  if (reviews.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 600 }}>
        <History size={18} color="var(--primary)" />
        <span>Recent Reviews ({reviews.length})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {reviews.map((r) => {
          const isActive = r.id === activeReviewId;
          const shortSha = (r.commitSha || '').slice(0, 7);
          const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

          return (
            <button
              key={r.id}
              onClick={() => onSelectReview(r.id)}
              style={{
                background: isActive ? 'var(--bg-card-hover)' : 'var(--bg-primary)',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: isActive ? 'var(--primary)' : '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {r.repository?.fullName || 'Repo Review'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  marginTop: '4px',
                }}>
                  <GitCommit size={11} />
                  <span>{shortSha || 'HEAD'}</span>
                  <span>•</span>
                  <span>{r.summary?.total || 0} findings</span>
                  {dateStr && <span>• {dateStr}</span>}
                </div>
              </div>
              <ChevronRight size={14} color={isActive ? 'var(--primary)' : 'var(--text-dim)'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
