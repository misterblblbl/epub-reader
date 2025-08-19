import React from 'react';
import { VocabularyWord } from '../../database/db';
import './VocabularyPanel.css';

export interface VocabularyPanelProps {
  isVisible: boolean;
  vocabulary: VocabularyWord[];
  onClose: () => void;
}

export const VocabularyPanel: React.FC<VocabularyPanelProps> = ({
  isVisible,
  vocabulary,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="vocabulary-panel">
      <div className="vocabulary-header">
        <h3>Saved Words ({vocabulary.length})</h3>
        <button 
          className="close-btn"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="vocabulary-list">
        {vocabulary.length === 0 ? (
          <p className="no-words">
            No words saved yet. Select words while reading to build your vocabulary!
          </p>
        ) : (
          vocabulary.map((word) => (
            <div key={word.id} className="vocabulary-item">
              <div className="word-main">{word.word}</div>
              <div className="word-translation">{word.translation}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};