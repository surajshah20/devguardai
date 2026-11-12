import React, { useState } from 'react';
import { FileCode, AlertTriangle, ShieldCheck, Sparkles, Copy, Check } from 'lucide-react';

export function FindingCard({ finding }) {
  const [copied, setCopied] = useState(false);

  const {
    title,
    severity,
    confidence,
    source,
    ruleId,
    filePath,
    startLine,
    endLine,
    evidence,
    explanation,
    suggestedFix,
    verificationStatus,
  } = finding;

  const handleCopyEvidence = () => {
    if (!evidence) return;
    navigator.clipboard.writeText(evidence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'border-color 0.2s, transform 0.1s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-accent)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)';
    }}
    >
      {/* Top Header Tags */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge badge-${severity}`}>
            {severity}
          </span>
          <span className="badge badge-source">
            {source === 'ai' && <Sparkles size={11} style={{ marginRight: '3px' }} />}
            {source}
          </span>
          <span className="badge badge-status">
            {verificationStatus}
          </span>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          Rule: <span style={{ color: 'var(--text-muted)' }}>{ruleId}</span>
        </div>
      </div>

      {/* Title & File Location */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
          {title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
          <FileCode size={14} />
          <span>{filePath}</span>
          <span style={{ color: 'var(--text-dim)' }}>:</span>
          <span>Lines {startLine}–{endLine}</span>
        </div>
      </div>

      {/* Code Evidence Block */}
      {evidence && (
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
          }}>
            <span>CODE EVIDENCE (Line {startLine})</span>
            <button
              onClick={handleCopyEvidence}
              style={{
                background: 'transparent',
                border: 'none',
                color: copied ? '#4ade80' : 'var(--text-dim)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre style={{
            padding: '12px',
            fontSize: '0.82rem',
            color: '#e2e8f0',
            overflowX: 'auto',
            lineHeight: 1.5,
          }}>
            <code>{evidence}</code>
          </pre>
        </div>
      )}

      {/* Explanation */}
      <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: '#ffffff' }}>Analysis: </strong>
        {explanation}
      </div>

      {/* Suggested Fix */}
      {suggestedFix && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.05)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          fontSize: '0.84rem',
          color: '#86efac',
          display: 'flex',
          gap: '10px',
        }}>
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#4ade80' }}>Recommended Fix: </strong>
            <span style={{ color: '#bbf7d0' }}>{suggestedFix}</span>
          </div>
        </div>
      )}
    </div>
  );
}
