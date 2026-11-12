import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, Loader2, GitBranch, Terminal } from 'lucide-react';

export function ReviewForm({ onStartReview, isLoading }) {
  const [repoInput, setRepoInput] = useState('');
  const [branch, setBranch] = useState('');
  const [enableAI, setEnableAI] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    let clean = repoInput.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = clean.split('/');

    if (parts.length < 2) {
      alert('Please enter repository in "owner/repo" format (e.g. expressjs/express)');
      return;
    }

    onStartReview({
      owner: parts[0],
      repo: parts[1],
      branch: branch.trim() || undefined,
      enableAI,
    });
  };

  const handlePreset = (presetRepo) => {
    setRepoInput(presetRepo);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
      }} />

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
        Start New Code Review
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Enter a public or permitted GitHub repository to run deterministic static checks and AI vulnerability analysis.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="e.g. expressjs/express or https://github.com/owner/repo"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>

          <div style={{ width: '160px', position: 'relative' }}>
            <GitBranch size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            <input
              type="text"
              placeholder="Branch (default)"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px 10px 34px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !repoInput.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isLoading || !repoInput.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !repoInput.trim() ? 0.6 : 1,
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Analyzing Repo...</span>
              </>
            ) : (
              <>
                <span>Review Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Try sample:</span>
            {['surajshah20/devguardai', 'expressjs/express', 'octocat/Hello-World'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handlePreset(sample)}
                disabled={isLoading}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {sample}
              </button>
            ))}
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem',
            color: enableAI ? 'var(--primary)' : 'var(--text-dim)',
            cursor: 'pointer',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={enableAI}
              onChange={(e) => setEnableAI(e.target.checked)}
              disabled={isLoading}
            />
            <Sparkles size={14} />
            <span>Enable AI Context Review</span>
          </label>
        </div>
      </form>
    </div>
  );
}
