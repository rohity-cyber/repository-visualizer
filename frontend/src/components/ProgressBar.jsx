import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ percent, message }) {
  const pct = Math.max(0, Math.min(100, percent));

  return (
    <div className="progress-overlay">
      <div className="progress-box">
        <div className="progress-header">
          <span className="progress-icon">⬡</span>
          <span className="progress-title">Analyzing Repository</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="progress-footer">
          {/* key prop triggers fadeIn on each new message */}
          <span className="progress-message" key={message}>{message}</span>
          <span className="progress-percent">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
