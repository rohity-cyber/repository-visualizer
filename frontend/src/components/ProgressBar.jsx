import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ percent, message }) {
  return (
    <div className="progress-overlay">
      <div className="progress-box">
        <div className="progress-header">
          <span className="progress-icon">⬡</span>
          <span className="progress-title">Analyzing Repository</span>
        </div>

        <div className="progress-message">{message}</div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>

        <div className="progress-percent">{percent}%</div>
      </div>
    </div>
  );
}