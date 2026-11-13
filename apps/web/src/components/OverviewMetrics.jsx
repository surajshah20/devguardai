import React from 'react';
import { GitCommit, GitBranch, Code, Clock, Layers } from 'lucide-react';

export function OverviewMetrics({ review }) {
  if (!review) return null;

  const { repository, commitSha, targetRef, summary = {}, project = {}, durationMs = 0 } = review;
  const shortSha = (commitSha || '').slice(0, 7);

  const total = summary.total || 0;
  const critical = summary.critical || 0;
  const high = summary.high || 0;
  const medium = summary.medium || 0;
  const low = summary.low || 0;

  // Percentage calculations for proportional posture bar
  const critPct = total > 0 ? (critical / total) * 100 : 0;
  const highPct = total > 0 ? (high / total) * 100 : 0;
  const medPct = total > 0 ? (medium / total) * 100 : 0;
  const lowPct = total > 0 ? (low / total) * 100 : 0;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {repository?.fullName || 'Repository'}
          </span>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--text-secondary)',
            background: 'var(--bg-canvas)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-subtle)',
          }}>
            <GitBranch size={11} />
            {targetRef || 'HEAD'}
          </span>

          {shortSha && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--text-muted)',
              background: 'var(--bg-canvas)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
            }}>
              <GitCommit size={11} />
              {shortSha}
            </span>
          )}
        </div>

        {/* Stack & Runtime Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Code size={12} />
            <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 500 }}>
              {project.ecosystem || 'GENERIC'}
            </span>
            {(project.frameworks || []).length > 0 && (
              <span>({project.frameworks.slice(0, 3).join(', ')})</span>
            )}
          </div>

          {durationMs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} />
              <span>{(durationMs / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Proportional Severity Distribution Bar */}
      {total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{
            height: '4px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '2px',
            overflow: 'hidden',
            display: 'flex',
          }}>
            {critPct > 0 && <div style={{ width: `${critPct}%`, background: 'var(--color-critical)' }} />}
            {highPct > 0 && <div style={{ width: `${highPct}%`, background: 'var(--color-high)' }} />}
            {medPct > 0 && <div style={{ width: `${medPct}%`, background: 'var(--color-medium)' }} />}
            {lowPct > 0 && <div style={{ width: `${lowPct}%`, background: 'var(--color-low)' }} />}
          </div>
        </div>
      )}

      {/* Metric Breakdown Stats */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        paddingTop: '4px',
      }}>
        {/* Total Metric */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {total}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            issues identified
          </span>
        </div>

        {/* Severity Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-critical)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{critical}</span>
            <span style={{ color: 'var(--text-muted)' }}>Critical</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-high)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{high}</span>
            <span style={{ color: 'var(--text-muted)' }}>High</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-medium)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{medium}</span>
            <span style={{ color: 'var(--text-muted)' }}>Medium</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-low)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{low}</span>
            <span style={{ color: 'var(--text-muted)' }}>Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}

