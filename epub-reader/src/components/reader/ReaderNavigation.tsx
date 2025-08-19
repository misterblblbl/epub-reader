import React from 'react';
import { ReaderControls } from '../../hooks/useProgressManager';
import './ReaderNavigation.css';

export interface ReaderNavigationProps {
  controls: ReaderControls;
  pageInput: string;
  onNext: () => void;
  onPrev: () => void;
  onGoToPage: (page: number) => void;
  onShowTOC: () => void;
  onPageInputChange: (value: string) => void;
  onPageInputSubmit: (e: React.FormEvent) => void;
}

export const ReaderNavigation: React.FC<ReaderNavigationProps> = ({
  controls,
  pageInput,
  onNext,
  onPrev,
  onGoToPage,
  onShowTOC,
  onPageInputChange,
  onPageInputSubmit
}) => {
  return (
    <div className="bottom-navigation">
      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${controls.progress}%` }}
          />
        </div>
        <span className="progress-text">{Math.round(controls.progress)}%</span>
      </div>

      {/* Main Navigation Controls */}
      <div className="nav-controls">
        {/* Left: Previous Button */}
        <button 
          className="nav-btn prev-btn" 
          onClick={onPrev}
          disabled={!controls.canGoPrev}
        >
          ← Prev
        </button>

        {/* Center: Page Info and Go To */}
        <div className="page-section">
          <div className="page-info">
            Page {controls.currentPage} of {controls.totalPages}
          </div>
          <div className="page-input-group">
            <span className="page-label">Go to:</span>
            <form onSubmit={onPageInputSubmit} className="page-form-inline">
              <input
                type="number"
                value={pageInput}
                onChange={(e) => onPageInputChange(e.target.value)}
                placeholder="Page"
                min="1"
                max={controls.totalPages}
                className="page-input-small"
              />
              <button type="submit" className="page-go-btn">Go</button>
            </form>
          </div>
        </div>

        {/* Right: Next Button */}
        <button 
          className="nav-btn next-btn" 
          onClick={onNext}
          disabled={!controls.canGoNext}
        >
          Next →
        </button>
      </div>

      {/* Bottom Row: Table of Contents and Quick Actions */}
      <div className="bottom-controls">
        <button 
          className="control-btn toc-btn"
          onClick={onShowTOC}
        >
          📑 Table of Contents
        </button>
        
        <div className="quick-nav-mini">
          <button 
            className="quick-btn" 
            onClick={() => onGoToPage(1)}
            title="Go to beginning"
          >
            ⏮
          </button>
          <button 
            className="quick-btn" 
            onClick={() => onGoToPage(Math.ceil(controls.totalPages * 0.5))}
            title="Go to middle"
          >
            ⏸
          </button>
          <button 
            className="quick-btn" 
            onClick={() => onGoToPage(controls.totalPages)}
            title="Go to end"
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
};