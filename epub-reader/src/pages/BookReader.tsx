import React, { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  WordTooltip, 
  ReaderNavigation, 
  EpubViewer, 
  TableOfContents, 
  VocabularyPanel 
} from '../components/reader';
import { 
  useBookReader, 
  useProgressManager, 
  useTextSelection
} from '../hooks';
import './BookReader.css';

export const BookReader: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  
  const {
    viewerRef,
    bookRef,
    renditionRef,
    book,
    loading,
    vocabulary,
    tableOfContents,
    showVocabulary,
    showNavigation,
    pageInput,
    setShowVocabulary,
    setShowNavigation,
    setPageInput,
    saveWord,
    goNext,
    goPrev,
    goToPage,
    goToChapter,
    handlePageInputSubmit
  } = useBookReader(bookId);
  
  const { controls, updateControls } = useProgressManager(book, bookRef);
  const { 
    showTooltip, 
    handleTextSelection, 
    handleDoubleClickEvent, 
    handleManualSelectionEvent, 
    closeTooltip 
  } = useTextSelection(viewerRef);

  // Handle word saving from tooltip
  const handleSaveWord = useCallback((word: string, translation: string) => {
    saveWord(word, translation);
    closeTooltip();
  }, [saveWord, closeTooltip]);

  // Set up EPUB event handlers when rendition is ready
  useEffect(() => {
    if (!renditionRef.current) return;
    
    const rendition = renditionRef.current;
    
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
    
    // Initial controls update
    updateControls(rendition);
  }, [renditionRef.current, handleTextSelection, handleDoubleClickEvent, handleManualSelectionEvent, updateControls]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (showTooltip) {
      closeTooltip();
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
  }, [showTooltip, closeTooltip, goPrev, goNext, setShowVocabulary, setShowNavigation]);

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

      <EpubViewer
        ref={viewerRef}
        onViewerClick={closeTooltip}
      />

      <ReaderNavigation
        controls={controls}
        pageInput={pageInput}
        onNext={goNext}
        onPrev={goPrev}
        onGoToPage={goToPage}
        onShowTOC={() => setShowNavigation(!showNavigation)}
        onPageInputChange={setPageInput}
        onPageInputSubmit={handlePageInputSubmit}
      />

      {showTooltip && (
        <WordTooltip
          word={showTooltip.word}
          x={showTooltip.x}
          y={showTooltip.y}
          onClose={closeTooltip}
          onSaveWord={handleSaveWord}
        />
      )}

      <TableOfContents
        isVisible={showNavigation}
        tableOfContents={tableOfContents}
        onClose={() => setShowNavigation(false)}
        onChapterSelect={goToChapter}
      />

      <VocabularyPanel
        isVisible={showVocabulary}
        vocabulary={vocabulary}
        onClose={() => setShowVocabulary(false)}
      />
    </div>
  );
};