import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, FileCode, ShieldAlert, Sparkles, Terminal } from 'lucide-react';

export function FindingItem({ finding, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);

  const {
    title,
    severity,
    source,
    ruleId,
    filePath,
    startLine,
    endLine,
    evidence,
    explanation,
    suggestedFix,
    verificationStatus,
    patch,
  } = finding;

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (!evidence) return;
    navigator.clipboard.writeText(evidence);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPatch = (e) => {
    e.stopPropagation();
    if (!patch) return;
    navigator.clipboard.writeText(patch);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      transition: 'border-color 0.15s ease, background-color 0.15s ease',
    }}>
      {/* Clickable Summary Row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '12px',
          userSelect: 'none',
          background: isExpanded ? 'var(--bg-surface-hover)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.background = 'var(--bg-surface-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          {/* Severity Micro Pill */}
          <span className={`badge-pill ${severity}`}>
            {severity}
          </span>

          {/* Title */}
          <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </span>

          {/* File location */}
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}>
            <FileCode size={11} />
            {filePath}:{startLine}
          </span>
        </div>

        {/* Right side tags & chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span className="badge-pill source">
            {source === 'ai' ? <Sparkles size={9} style={{ marginRight: '3px', color: '#38bdf8' }} /> : null}
            {source}
          </span>

          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {ruleId}
          </span>

          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded Details Pane */}
      {isExpanded && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-canvas)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          {/* Explanation */}
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Security Context: </strong>
            {explanation}
          </div>

          {/* Code Evidence IDE Box */}
          {evidence && (
            <div style={{
              background: '#0d0f12',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                <span>{filePath}:{startLine}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedCode ? '#4ade80' : 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedCode ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', padding: '10px 0', overflowX: 'auto', fontSize: '12px' }}>
                <div style={{
                  padding: '0 12px',
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                  userSelect: 'none',
                  textAlign: 'right',
                  borderRight: '1px solid var(--border-subtle)',
                }}>
                  {startLine}
                </div>
                <pre style={{ padding: '0 12px', margin: 0, color: '#f0f3f6' }}>
                  <code>{evidence}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Remediation & Patch Preview */}
          {suggestedFix && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#2ea043', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recommended Remediation
                </span>
                {patch && (
                  <button
                    type="button"
                    onClick={handleCopyPatch}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '2px 7px',
                      color: copiedPatch ? '#4ade80' : 'var(--text-secondary)',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {copiedPatch ? <Check size={10} /> : <Terminal size={10} />}
                    <span>{copiedPatch ? 'Patch Copied' : 'Copy .patch'}</span>
                  </button>
                )}
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {suggestedFix}
              </p>

              {/* Diff Preview if available */}
              {patch && (
                <div style={{
                  background: '#0d0f12',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '8px 10px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  overflowX: 'auto',
                }}>
                  <div className="diff-line-delete">- {evidence}</div>
                  <div className="diff-line-add">+ {suggestedFix}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
