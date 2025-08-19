import React, { useState, useEffect } from 'react';
import { dictionaryService, Translation } from '../../services/dictionaryService';
import './WordTooltip.css';

export interface WordTooltipProps {
  word: string;
  x: number;
  y: number;
  onClose: () => void;
  onSaveWord: (word: string, translation: string) => void;
}

export const WordTooltip: React.FC<WordTooltipProps> = ({
  word,
  x,
  y,
  onClose,
  onSaveWord
}) => {
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranslation = async () => {
      try {
        setLoading(true);
        const result = await dictionaryService.translateWord(word);
        setTranslation(result);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslation();
  }, [word]);

  const handleSaveWord = () => {
    if (translation) {
      onSaveWord(word, translation.translation);
      onClose();
    }
  };

  return (
    <div 
      className="word-tooltip"
      style={{
        left: x,
        top: y
      }}
    >
      <div className="tooltip-content">
        <div className="tooltip-header">
          <div className="tooltip-word">{word}</div>
          <button 
            className="tooltip-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {loading ? (
          <div className="tooltip-loading">Loading...</div>
        ) : translation ? (
          <>
            {translation.partOfSpeech && (
              <div className="tooltip-part-of-speech">
                {translation.partOfSpeech}
              </div>
            )}
            {translation.phonetic && (
              <div className="tooltip-phonetic">
                {translation.phonetic}
              </div>
            )}
            <div className="tooltip-translation">
              {translation.translation}
            </div>
            <div className="tooltip-actions">
              <button 
                className="save-word-btn"
                onClick={handleSaveWord}
              >
                Save Word
              </button>
            </div>
          </>
        ) : (
          <div className="tooltip-error">Translation not found</div>
        )}
      </div>
    </div>
  );
};