import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { ReviewForm } from './components/ReviewForm.jsx';
import { MetricsCards } from './components/MetricsCards.jsx';
import { FindingCard } from './components/FindingCard.jsx';
import { HistorySidebar } from './components/HistorySidebar.jsx';
import { Filter, Download, Copy, Check, FileText, Search, ShieldCheck } from 'lucide-react';

export function App() {
  const [reviews, setReviews] = useState([]);
  const [activeReview, setActiveReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [copiedReport, setCopiedReport] = useState(false);

  // Fetch recent reviews on initial mount
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (!activeReview && (data.reviews || []).length > 0) {
          setActiveReview(data.reviews[0]);
        }
      }
    } catch {
      // API not yet reachable
    }
  };

  const handleStartReview = async ({ owner, repo, branch, enableAI }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, branch, enableAI }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `Review failed with status ${res.status}`);
      }

      setActiveReview(data);
      setReviews((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReview = async (reviewId) => {
    const existing = reviews.find((r) => r.id === reviewId);
    if (existing) {
      setActiveReview(existing);
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReview(data);
      }
    } catch (err) {
      console.error('Failed to load review:', err);
    }
  };

  const handleCopyReport = () => {
    if (!activeReview?.markdownReport) return;
    navigator.clipboard.writeText(activeReview.markdownReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Filter findings based on active controls
  const filteredFindings = (activeReview?.findings || []).filter((f) => {
    const matchesSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity;
    const matchesSource = selectedSource === 'all' || f.source === selectedSource;
    const matchesSearch =
      !searchTerm ||
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.explanation || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSeverity && matchesSource && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px 20px', flex: 1 }}>
        {/* Error Banner */}
        {errorMessage && (
          <div style={{
            background: 'var(--critical-bg)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span><strong>Review Error:</strong> {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start' }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Input Form */}
            <ReviewForm onStartReview={handleStartReview} isLoading={isLoading} />

            {/* Active Review Presentation */}
            {activeReview ? (
              <div>
                <MetricsCards review={activeReview} />

                {/* Filter and Actions Bar */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  {/* Left: Search & Filter Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                      <input
                        type="text"
                        placeholder="Search findings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 30px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="all">All Sources</option>
                      <option value="semgrep">Semgrep / Patterns</option>
                      <option value="eslint">ESLint</option>
                      <option value="ai">AI Context Review</option>
                    </select>
                  </div>

                  {/* Right: Export & Copy Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={handleCopyReport}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        color: copiedReport ? '#4ade80' : 'var(--text-muted)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {copiedReport ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedReport ? 'Report Copied' : 'Copy Markdown'}</span>
                    </button>

                    <a
                      href={`/api/reviews/${activeReview.id}/report?format=markdown`}
                      download={`devguard-report-${activeReview.id}.md`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={13} />
                      <span>Download .md</span>
                    </a>
                  </div>
                </div>

                {/* Findings List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredFindings.length === 0 ? (
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}>
                      <ShieldCheck size={36} color="#4ade80" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                        No Matching Findings
                      </div>
                      <div style={{ fontSize: '0.84rem' }}>
                        {activeReview.findings.length === 0
                          ? 'Clean codebase! No static or AI issues were detected.'
                          : 'Try adjusting your search terms or filters.'}
                      </div>
                    </div>
                  ) : (
                    filteredFindings.map((finding, idx) => (
                      <FindingCard key={`${finding.filePath}-${finding.startLine}-${idx}`} finding={finding} />
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Empty state before first review */
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                <FileText size={40} color="var(--primary)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                  No Active Review Selected
                </h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Enter a GitHub repository URL above or choose a sample repository to trigger an automated code review.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: History Sidebar */}
          <HistorySidebar
            reviews={reviews}
            activeReviewId={activeReview?.id}
            onSelectReview={handleSelectReview}
          />
        </div>
      </main>
    </div>
  );
}
export default App;
