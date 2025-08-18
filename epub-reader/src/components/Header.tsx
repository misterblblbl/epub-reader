import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false, 
  onAction, 
  actionLabel,
  onSecondaryAction,
  secondaryActionLabel
}) => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-left">
        {showBack && (
          <button 
            className="header-btn back-btn" 
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>
        )}
      </div>
      
      <h1 className="header-title">{title}</h1>
      
      <div className="header-right">
        {onSecondaryAction && secondaryActionLabel && (
          <button 
            className="header-btn action-btn" 
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        )}
        {onAction && actionLabel && (
          <button 
            className="header-btn action-btn" 
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
};