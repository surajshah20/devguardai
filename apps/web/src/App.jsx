import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { ReviewWorkspaceBar } from './components/ReviewWorkspaceBar.jsx';
import { OverviewMetrics } from './components/OverviewMetrics.jsx';
import { FindingsExplorer } from './components/FindingsExplorer.jsx';
import { HistoryPanel } from './components/HistoryPanel.jsx';
import { Shield, AlertCircle, Terminal } from 'lucide-react';

export function App() {
  const [reviews, setReviews] = useState([]);
  const [activeReview, setActiveReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initial reviews fetch
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        const list = data.reviews || [];
        setReviews(list);
        if (!activeReview && list.length > 0) {
          setActiveReview(list[0]);
        }
      }
    } catch {
      // Offline / connecting
    }
  };

  const handleStartReview = async ({ owner, repo, branch, enableAI, excludeTests }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, branch, enableAI, excludeTests }),
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px',
        flex: 1,
      }}>
        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: 'var(--bg-critical)',
            border: '1px solid var(--border-critical)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="var(--color-critical)" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '20px',
          alignItems: 'start',
        }}>
          {/* Main Workspace Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Command & Input Bar */}
            <ReviewWorkspaceBar onStartReview={handleStartReview} isLoading={isLoading} />

            {/* Active Analysis View */}
            {activeReview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <OverviewMetrics review={activeReview} />
                <FindingsExplorer findings={activeReview.findings} reviewId={activeReview.id} />
              </div>
            ) : (
              /* Empty Standby State */
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                <Shield size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No Repository Selected
                </div>
                <div style={{ fontSize: '12px', maxWidth: '380px', margin: '0 auto' }}>
                  Enter a target repository above or choose one of the sample targets to begin automated security inspection.
                </div>
              </div>
            )}
          </div>

          {/* Right Rail: Recent Scans */}
          <HistoryPanel
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
