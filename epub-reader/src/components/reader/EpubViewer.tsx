import React, { forwardRef } from 'react';
import './EpubViewer.css';

export interface EpubViewerProps {
  onViewerClick: () => void;
}

export const EpubViewer = forwardRef<HTMLDivElement, EpubViewerProps>(
  ({ onViewerClick }, ref) => {
    return (
      <div className="reader-container">
        <div 
          ref={ref} 
          className="epub-viewer"
          onClick={onViewerClick}
        />
      </div>
    );
  }
);

EpubViewer.displayName = 'EpubViewer';