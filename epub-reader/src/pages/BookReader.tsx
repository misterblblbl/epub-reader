import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ePub from 'epubjs';
import { db, Book, VocabularyWord } from '../database/db';
import { dictionaryService, Translation } from '../services/dictionaryService';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './BookReader.css';

interface ReaderControls {
  currentLocation: string;
  progress: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  currentPage: number;
  totalPages: number;
}

interface WordTooltip {
  word: string;
  translation: Translation | null;
  x: number;
  y: number;
  loading: boolean;
}

export const BookReader: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<ReaderControls>({
    currentLocation: '',
    progress: 0,
    canGoNext: false,
    canGoPrev: false,
    currentPage: 1,
    totalPages: 1
  });
  const [showTooltip, setShowTooltip] = useState<WordTooltip | null>(null);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [showNavigation, setShowNavigation] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<any[]>([]);
  const [pageInput, setPageInput] = useState('');

  useEffect(() => {
    if (bookId) {
      loadBook(parseInt(bookId));
    }
    return cleanup;
  }, [bookId]); // loadBook is stable, no need to include

  // Save progress when component unmounts or page is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (renditionRef.current && book) {
        const location = renditionRef.current.location;
        if (location) {
          updateProgress(location);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && renditionRef.current && book) {
        const location = renditionRef.current.location;
        if (location) {
          updateProgress(location);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Save progress one final time on component cleanup
      if (renditionRef.current && book) {
        const location = renditionRef.current.location;
        if (location) {
          updateProgress(location);
        }
      }
    };
  }, [book]);

  const cleanup = () => {
    if (renditionRef.current) {
      renditionRef.current.destroy();
    }
    if (bookRef.current) {
      bookRef.current.destroy();
    }
  };

  const loadBook = async (id: number) => {
    try {
      const bookData = await db.books.get(id);
      if (!bookData) {
        navigate('/');
        return;
      }

      setBook(bookData);
      await initializeEpub(bookData);
      await loadVocabulary(id);
    } catch (error) {
      console.error('Error loading book:', error);
      navigate('/');
    }
  };

  const handleDoubleClickEvent = (event: MouseEvent, contentWindow: Window) => {
    try {
      // Handle double-click word selection
      console.log('Processing double-click');
      
      // Get the word at the click position
      const range = contentWindow.document.caretRangeFromPoint?.(event.clientX, event.clientY);
      if (!range) return;

      // Try to expand to word boundaries manually
      const selection = contentWindow.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Try to expand the selection to include the whole word
        try {
          selection.modify('extend', 'backward', 'word');
          selection.modify('extend', 'forward', 'word');
        } catch (e) {
          // Fallback if modify doesn't work
          console.log('Selection modify not supported');
        }
        
        // Trigger the same handling as text selection
        handleManualSelectionEvent(selection, contentWindow);
      }
    } catch (error) {
      console.error('Error in handleDoubleClick:', error);
    }
  };

  const handleManualSelectionEvent = async (selection: Selection, contentWindow: Window) => {
    try {
      const text = selection.toString().trim();
      if (!text || text.length > 50) return;

      // Clean up the selected text
      const cleanText = text.replace(/[.,!?;:"'()[\]{}]/g, '').trim();
      if (!cleanText) return;

      // Get selection coordinates relative to the iframe
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Convert to page coordinates
      const iframe = viewerRef.current?.querySelector('iframe');
      const iframeRect = iframe?.getBoundingClientRect();
      const x = (iframeRect?.left || 0) + rect.left + rect.width / 2;
      const y = (iframeRect?.top || 0) + rect.top - 10;

      console.log('Manual selection processed:', cleanText, { x, y });

      // Show loading tooltip
      setShowTooltip({
        word: cleanText,
        translation: null,
        x: Math.max(160, Math.min(x, window.innerWidth - 160)),
        y: Math.max(50, y),
        loading: true
      });

      // Get translation
      const translation = await dictionaryService.translateWord(cleanText);
      console.log('Manual selection translation:', translation);
      
      setShowTooltip(prev => prev ? {
        ...prev,
        translation,
        loading: false
      } : null);
    } catch (error) {
      console.error('Error in handleManualSelection:', error);
    }
  };

  const initializeEpub = async (bookData: Book) => {
    if (!viewerRef.current) {
      console.error('Viewer ref not available');
      setLoading(false);
      return;
    }

    try {
      console.log('Initializing EPUB with data size:', bookData.fileContent.byteLength);
      
      // Create book instance from ArrayBuffer
      const book = ePub(bookData.fileContent);
      bookRef.current = book;

      console.log('EPUB book instance created');

      // Wait for book to be ready
      await book.ready;
      console.log('EPUB book is ready');

      // Load table of contents
      const toc = await book.loaded.navigation;
      setTableOfContents(toc.toc || []);
      console.log('Table of contents loaded:', toc.toc?.length || 0, 'items');

      // Create rendition with proper pagination
      const rendition = book.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
        allowScriptedContent: true,
        snap: true, // Enable snap to page boundaries
        manager: 'default' // Use default manager for proper pagination
      });
      renditionRef.current = rendition;

      console.log('Rendition created');

      // Apply reading-friendly styles
      rendition.themes.default({
        'body': {
          'font-family': 'Georgia, serif !important',
          'font-size': '18px !important',
          'line-height': '1.6 !important',
          'color': '#2d3748 !important',
          'background': '#f7fafc !important',
          'padding': '2rem !important'
        },
        'p': {
          'margin-bottom': '1rem !important'
        }
      });

      // Display the book
      const startLocation = bookData.currentLocation || undefined;
      console.log('Displaying book at location:', startLocation);
      
      await rendition.display(startLocation);
      console.log('Book displayed successfully');

      // Set up text selection for dictionary lookup
      rendition.on('selected', handleTextSelection);
      
      // Add alternative click-based word selection as fallback
      rendition.on('rendered', () => {
        const iframe = viewerRef.current?.querySelector('iframe');
        if (iframe && iframe.contentDocument) {
          const doc = iframe.contentDocument;
          
          // Add double-click handler for word selection
          doc.addEventListener('dblclick', (event) => {
            console.log('Double-click detected');
            if (iframe.contentWindow) {
              handleDoubleClickEvent(event, iframe.contentWindow);
            }
          });
          
          // Add mouseup handler to capture manual selections
          doc.addEventListener('mouseup', () => {
            setTimeout(() => {
              const selection = iframe.contentWindow?.getSelection();
              if (selection && selection.toString().trim() && iframe.contentWindow) {
                console.log('Manual selection detected:', selection.toString());
                handleManualSelectionEvent(selection, iframe.contentWindow);
              }
            }, 100);
          });
        }
      });

      // Set up navigation listeners
      rendition.on('relocated', (location: any) => {
        console.log('Book relocated to:', location);
        updateControls(rendition);
      });

      // Generate locations for proper pagination after initial render
      setTimeout(async () => {
        try {
          console.log('Starting initial pagination setup...');
          await updateControls(rendition);
          
          // Try to generate locations early for better UX
          if (!book.locations.length()) {
            console.log('Pre-generating locations for better pagination...');
            await book.locations.generate(1650);
            console.log('Initial locations generated:', book.locations.length(), 'pages');
            // Update controls again with proper pagination
            await updateControls(rendition);
          }
        } catch (error) {
          console.warn('Could not pre-generate locations:', error);
        }
        
        setLoading(false);
        console.log('EPUB initialization complete');
      }, 500);

    } catch (error) {
      console.error('Error initializing epub:', error);
      setLoading(false);
    }
  };

  const handleTextSelection = async (cfiRange: string, contents: any) => {
    try {
      console.log('Text selection triggered', { cfiRange });
      
      const selection = contents.window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('No selection found');
        return;
      }

      const text = selection.toString().trim();
      console.log('Selected text:', text);
      
      if (!text) {
        console.log('Empty text selection');
        return;
      }
      
      if (text.length > 50) {
        console.log('Text too long:', text.length);
        return;
      }

      // Clean up the selected text (remove punctuation, etc.)
      const cleanText = text.replace(/[.,!?;:"'()[\]{}]/g, '').trim();
      if (!cleanText) {
        console.log('No clean text after removing punctuation');
        return;
      }

      // Get selection coordinates
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Convert coordinates to viewport coordinates
      const viewerRect = viewerRef.current?.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top - 10 + (viewerRect?.top || 0);

      console.log('Showing tooltip for:', cleanText, { x, y });

      // Show loading tooltip
      setShowTooltip({
        word: cleanText,
        translation: null,
        x: Math.max(160, Math.min(x, window.innerWidth - 160)), // Keep tooltip on screen
        y: Math.max(50, y),
        loading: true
      });

      // Get translation
      try {
        const translation = await dictionaryService.translateWord(cleanText);
        console.log('Translation result:', translation);
        
        setShowTooltip(prev => prev ? {
          ...prev,
          translation,
          loading: false
        } : null);
      } catch (error) {
        console.error('Translation error:', error);
        setShowTooltip(prev => prev ? {
          ...prev,
          loading: false
        } : null);
      }
    } catch (error) {
      console.error('Error in handleTextSelection:', error);
    }
  };


  const saveWord = async () => {
    if (!showTooltip || !showTooltip.translation || !book) return;

    try {
      const word: Omit<VocabularyWord, 'id'> = {
        word: showTooltip.word,
        translation: showTooltip.translation.translation,
        bookId: book.id!,
        context: '', // Could extract sentence context
        addedAt: new Date()
      };

      await db.vocabulary.add(word);
      await loadVocabulary(book.id!);
      setShowTooltip(null);
    } catch (error) {
      console.error('Error saving word:', error);
    }
  };

  const loadVocabulary = async (bookId: number) => {
    try {
      const words = await db.vocabulary
        .where('bookId')
        .equals(bookId)
        .toArray();
      // Sort by date in reverse order (newest first)
      words.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      setVocabulary(words);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  };

  const updateControls = async (rendition: any) => {
    try {
      const location = rendition.location;
      if (!location) {
        console.log('No location available for progress tracking');
        return;
      }

      console.log('Updating controls with location:', location);

      const book = rendition.book;
      let currentPage = 1;
      let totalPages = 1;
      let progress = 0;

      // Get actual pagination info from EPUB.js
      if (location.start) {
        // Use the percentage from location.start for accurate progress
        progress = location.start.percentage || 0;
        
        console.log('Progress from location.start.percentage:', progress);
      }

      // Try to get pagination info from the book
      try {
        // Generate locations for accurate page calculation
        if (!book.locations.length()) {
          console.log('Generating locations for pagination...');
          await book.locations.generate(1650); // Characters per page (adjust as needed)
          console.log('Locations generated:', book.locations.length(), 'pages');
        }
        
        if (book.locations.length() > 0) {
          totalPages = book.locations.length();
          
          // Get current page from CFI
          const currentCfi = location.start.cfi;
          if (currentCfi) {
            const currentLocation = book.locations.locationFromCfi(currentCfi);
            currentPage = currentLocation + 1; // locationFromCfi returns 0-based index
            progress = currentLocation / totalPages;
          }
        }
        
        console.log('Pagination from locations:', {
          totalPages,
          currentPage,
          progress,
          locationsLength: book.locations.length()
        });
      } catch (locError) {
        console.warn('Could not generate locations, falling back to spine-based pagination:', locError);
        
        // Fallback to spine-based calculation
        if (book?.spine?.items) {
          totalPages = book.spine.items.length;
          
          if (progress === 0) {
            const currentSpineIndex = book.spine.items.findIndex((item: any) => 
              item.href === location.start.href || 
              location.start.cfi?.includes(item.href)
            );
            
            if (currentSpineIndex >= 0) {
              currentPage = currentSpineIndex + 1;
              progress = currentSpineIndex / totalPages;
            }
          } else {
            currentPage = Math.max(1, Math.min(totalPages, Math.ceil(progress * totalPages)));
          }
        }
      }

      const progressPercent = Math.round(progress * 100);
      
      console.log('Final calculated progress:', {
        percentage: progress,
        progressPercent,
        currentPage,
        totalPages,
        href: location.start?.href,
        cfi: location.start?.cfi
      });

      setControls({
        currentLocation: location.start?.cfi || '',
        progress: progressPercent,
        canGoNext: !location.atEnd,
        canGoPrev: !location.atStart,
        currentPage,
        totalPages
      });

      // Force update progress in database
      if (book) {
        updateProgress(location, progress);
      }
    } catch (error) {
      console.error('Error updating controls:', error);
    }
  };

  const updateProgress = async (location: any, calculatedProgress?: number) => {
    if (!book || !bookRef.current) return;

    try {
      // Use the calculated progress from updateControls if provided
      let progress = calculatedProgress !== undefined ? calculatedProgress : (location.start?.percentage || 0);
      
      const progressPercent = Math.round(progress * 100);
      console.log('Saving progress to database:', progressPercent, '%');
      
      await db.books.update(book.id!, {
        currentLocation: location.start?.cfi,
        progress: progressPercent,
        lastReadAt: new Date()
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const goNext = () => {
    if (renditionRef.current && controls.canGoNext) {
      renditionRef.current.next();
    }
  };

  const goPrev = () => {
    if (renditionRef.current && controls.canGoPrev) {
      renditionRef.current.prev();
    }
  };

  const goToPage = async (pageNumber: number) => {
    if (!renditionRef.current || !bookRef.current) return;
    
    try {
      const book = bookRef.current;
      
      // First try to use locations for accurate page navigation
      try {
        if (!book.locations.length()) {
          console.log('Generating locations for page navigation...');
          await book.locations.generate(1650);
        }
        
        if (book.locations.length() > 0) {
          const totalPages = book.locations.length();
          const targetPage = Math.max(1, Math.min(pageNumber, totalPages));
          const targetIndex = targetPage - 1; // Convert to 0-based index
          
          const cfi = book.locations.cfiFromLocation(targetIndex);
          if (cfi) {
            console.log(`Navigating to page ${targetPage} using CFI:`, cfi);
            await renditionRef.current.display(cfi);
            return;
          }
        }
      } catch (locError) {
        console.warn('Could not use locations for navigation, falling back to spine:', locError);
      }
      
      // Fallback to spine-based navigation
      if (book.spine && book.spine.items) {
        const totalPages = book.spine.items.length;
        const targetPage = Math.max(1, Math.min(pageNumber, totalPages));
        const targetIndex = targetPage - 1;
        
        if (book.spine.items[targetIndex]) {
          const href = book.spine.items[targetIndex].href;
          console.log(`Navigating to page ${targetPage} using spine href:`, href);
          await renditionRef.current.display(href);
        }
      }
    } catch (error) {
      console.error('Error going to page:', error);
    }
  };

  const goToChapter = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowNavigation(false);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber)) {
      goToPage(pageNumber);
      setPageInput('');
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (showTooltip) {
      setShowTooltip(null);
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        goPrev();
        break;
      case 'ArrowRight':
        goNext();
        break;
      case 'Escape':
        setShowVocabulary(false);
        setShowNavigation(false);
        break;
      case 'g':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setShowNavigation(true);
        }
        break;
    }
  }, [controls, showTooltip, goPrev, goNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (loading) {
    return <LoadingSpinner size="large" text="Loading book..." />;
  }

  if (!book) {
    return <div>Book not found</div>;
  }

  return (
    <div className="book-reader">
      <Header 
        title={book.title}
        showBack={true}
        actionLabel="Words"
        onAction={() => setShowVocabulary(!showVocabulary)}
      />

      <div className="reader-container">
        <div 
          ref={viewerRef} 
          className="epub-viewer"
          onClick={() => setShowTooltip(null)}
        />

        {/* Bottom Navigation Panel */}
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
              onClick={goPrev}
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
                <form onSubmit={handlePageInputSubmit} className="page-form-inline">
                  <input
                    type="number"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
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
              onClick={goNext}
              disabled={!controls.canGoNext}
            >
              Next →
            </button>
          </div>

          {/* Bottom Row: Table of Contents and Quick Actions */}
          <div className="bottom-controls">
            <button 
              className="control-btn toc-btn"
              onClick={() => setShowNavigation(!showNavigation)}
            >
              📑 Table of Contents
            </button>
            
            <div className="quick-nav-mini">
              <button 
                className="quick-btn" 
                onClick={() => goToPage(1)}
                title="Go to beginning"
              >
                ⏮
              </button>
              <button 
                className="quick-btn" 
                onClick={() => goToPage(Math.ceil(controls.totalPages * 0.5))}
                title="Go to middle"
              >
                ⏸
              </button>
              <button 
                className="quick-btn" 
                onClick={() => goToPage(controls.totalPages)}
                title="Go to end"
              >
                ⏭
              </button>
            </div>
          </div>
        </div>

        {/* Word Tooltip */}
        {showTooltip && (
          <div 
            className="word-tooltip"
            style={{
              left: showTooltip.x,
              top: showTooltip.y
            }}
          >
            <div className="tooltip-content">
              <div className="tooltip-header">
                <div className="tooltip-word">{showTooltip.word}</div>
                <button 
                  className="tooltip-close-btn"
                  onClick={() => setShowTooltip(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {showTooltip.loading ? (
                <div className="tooltip-loading">Loading...</div>
              ) : showTooltip.translation ? (
                <>
                  {showTooltip.translation.partOfSpeech && (
                    <div className="tooltip-part-of-speech">
                      {showTooltip.translation.partOfSpeech}
                    </div>
                  )}
                  {showTooltip.translation.phonetic && (
                    <div className="tooltip-phonetic">
                      {showTooltip.translation.phonetic}
                    </div>
                  )}
                  <div className="tooltip-translation">
                    {showTooltip.translation.translation}
                  </div>
                  <div className="tooltip-actions">
                    <button 
                      className="save-word-btn"
                      onClick={saveWord}
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
        )}

        {/* Table of Contents Panel */}
        {showNavigation && (
          <div className="toc-panel">
            <div className="toc-header">
              <h3>Table of Contents</h3>
              <button 
                className="close-btn"
                onClick={() => setShowNavigation(false)}
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
                      onClick={() => goToChapter(item.href)}
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
        )}

        {/* Vocabulary Panel */}
        {showVocabulary && (
          <div className="vocabulary-panel">
            <div className="vocabulary-header">
              <h3>Saved Words ({vocabulary.length})</h3>
              <button 
                className="close-btn"
                onClick={() => setShowVocabulary(false)}
              >
                ×
              </button>
            </div>
            <div className="vocabulary-list">
              {vocabulary.length === 0 ? (
                <p className="no-words">No words saved yet. Select words while reading to build your vocabulary!</p>
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
        )}
      </div>
    </div>
  );
};