import React, { useState } from 'react';
import { GitBranch, CornerDownLeft, Loader2, Sparkles, FilterX } from 'lucide-react';

export function ReviewWorkspaceBar({ onStartReview, isLoading }) {
  const [repoInput, setRepoInput] = useState('');
  const [branch, setBranch] = useState('');
  const [enableAI, setEnableAI] = useState(true);
  const [excludeTests, setExcludeTests] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    let clean = repoInput.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = clean.split('/');

    if (parts.length < 2) {
      alert('Please specify repository in "owner/repo" format (e.g. expressjs/express)');
      return;
    }

    onStartReview({
      owner: parts[0],
      repo: parts[1],
      branch: branch.trim() || undefined,
      enableAI,
      excludeTests,
    });
  };

  const setSample = (name) => {
    setRepoInput(name);
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Main Input Row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Repo Input */}
          <div style={{
            flex: '1 1 340px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 10px',
            height: '36px',
            transition: 'border-color 0.15s ease',
          }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '8px', fontSize: '13px', fontFamily: 'monospace' }}>
              github.com/
            </span>
            <input
              type="text"
              placeholder="owner/repository"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>

          {/* Branch Pill Input */}
          <div style={{
            width: '140px',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 8px',
            height: '36px',
            gap: '6px',
          }}>
            <GitBranch size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="HEAD"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading || !repoInput.trim()}
            style={{
              height: '36px',
              padding: '0 16px',
              background: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isLoading || !repoInput.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !repoInput.trim() ? 0.4 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Analyzing</span>
              </>
            ) : (
              <>
                <span>Run Analysis</span>
                <CornerDownLeft size={12} />
              </>
            )}
          </button>
        </div>

        {/* Options & Presets Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick targets:</span>
            {['surajshah20/devguardai', 'expressjs/express', 'octocat/Hello-World'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setSample(sample)}
                disabled={isLoading}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '2px 6px',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Toggle Switches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: excludeTests ? 'var(--text-secondary)' : 'var(--text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={excludeTests}
                onChange={(e) => setExcludeTests(e.target.checked)}
                disabled={isLoading}
              />
              <FilterX size={12} />
              <span>Exclude test files</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: enableAI ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={enableAI}
                onChange={(e) => setEnableAI(e.target.checked)}
                disabled={isLoading}
              />
              <Sparkles size={12} color={enableAI ? '#38bdf8' : 'currentColor'} />
              <span>AI Context Evaluation</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}

