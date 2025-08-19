import React from 'react';
import './TableOfContents.css';

export interface TOCItem {
  label: string;
  href: string;
}

export interface TableOfContentsProps {
  isVisible: boolean;
  tableOfContents: TOCItem[];
  onClose: () => void;
  onChapterSelect: (href: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  isVisible,
  tableOfContents,
  onClose,
  onChapterSelect
}) => {
  if (!isVisible) return null;

  return (
    <div className="toc-panel">
      <div className="toc-header">
        <h3>Table of Contents</h3>
        <button 
          className="close-btn"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      
      <div className="toc-content">
        {tableOfContents.length > 0 ? (
          <div className="toc-list">
            {tableOfContents.map((item, index) => (
              <button
                key={index}
                className="toc-item"
                onClick={() => onChapterSelect(item.href)}
              >
                <span className="toc-label">{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="no-toc">
            <p>No table of contents available for this book.</p>
          </div>
        )}
      </div>
    </div>
  );
};