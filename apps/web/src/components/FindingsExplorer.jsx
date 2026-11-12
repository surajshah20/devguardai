import React, { useState } from 'react';
import { FindingItem } from './FindingItem.jsx';
import { Search, Download, Copy, Check, FileDown, ShieldCheck } from 'lucide-react';

export function FindingsExplorer({ findings = [], reviewId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSeverity, setActiveSeverity] = useState('all');
  const [activeSource, setActiveSource] = useState('all');
  const [copiedMd, setCopiedMd] = useState(false);

  // Calculate severity counts
  const counts = {
    all: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  };

  // Filter findings
  const filtered = findings.filter((f) => {
    const matchesSev = activeSeverity === 'all' || f.severity === activeSeverity;
    const matchesSrc = activeSource === 'all' || f.source === activeSource;
    const matchesSearch =
      !searchTerm ||
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.explanation || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSev && matchesSrc && matchesSearch;
  });

  const handleCopyMarkdown = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report?format=markdown`);
      if (res.ok) {
        const text = await res.text();
        navigator.clipboard.writeText(text);
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Explorer Controls Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Left: Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 260px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '280px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Filter by file, rule, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 10px 5px 30px',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Source Dropdown */}
          <select
            value={activeSource}
            onChange={(e) => setActiveSource(e.target.value)}
            style={{
              padding: '5px 8px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Sources</option>
            <option value="semgrep">Semgrep</option>
            <option value="eslint">ESLint</option>
            <option value="ai">AI Context</option>
          </select>
        </div>

        {/* Right: Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleCopyMarkdown}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 9px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: copiedMd ? '#4ade80' : 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = copiedMd ? '#4ade80' : 'var(--text-secondary)')}
          >
            {copiedMd ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedMd ? 'Copied' : 'Copy Report'}</span>
          </button>

          <a
            href={`/api/reviews/${reviewId}/report?format=markdown`}
            download={`devguard-report-${reviewId}.md`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 9px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Download size={12} />
            <span>.md</span>
          </a>

          <a
            href={`/api/reviews/${reviewId}/patch`}
            download={`devguard-fix-${reviewId}.patch`}
            title="Download git unified patch file to automatically apply fixes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 9px',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-inverse)',
              fontSize: '11px',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <FileDown size={12} />
            <span>Export .patch</span>
          </a>
        </div>
      </div>

      {/* Severity Filter Tabs (Segmented Control) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '2px',
      }}>
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'critical', label: 'Critical', count: counts.critical, color: 'var(--color-critical)' },
          { key: 'high', label: 'High', count: counts.high, color: 'var(--color-high)' },
          { key: 'medium', label: 'Medium', count: counts.medium, color: 'var(--color-medium)' },
          { key: 'low', label: 'Low', count: counts.low, color: 'var(--color-low)' },
        ].map((tab) => {
          const isActive = activeSeverity === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSeverity(tab.key)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
                padding: '6px 12px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.1s ease',
              }}
            >
              {tab.color && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tab.color }} />
              )}
              <span>{tab.label}</span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '1px 5px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Findings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <ShieldCheck size={28} color="#2ea043" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>
              No issues matching current filters
            </div>
            <div style={{ fontSize: '11px' }}>
              {findings.length === 0
                ? 'All static security checks and AI reviews passed without warnings.'
                : 'Try clearing your search query or selecting a different severity tier.'}
            </div>
          </div>
        ) : (
          filtered.map((finding, idx) => (
            <FindingItem
              key={`${finding.filePath}-${finding.startLine}-${idx}`}
              finding={finding}
              defaultExpanded={idx === 0 && filtered.length < 5}
            />
          ))
        )}
      </div>
    </div>
  );
}
