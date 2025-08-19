import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ePub from 'epubjs';
import { db, Book, VocabularyWord } from '../database/db';
import { dictionaryService } from '../services/dictionaryService';

export const useBookReader = (bookId: string | undefined) => {
  const navigate = useNavigate();
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [tableOfContents, setTableOfContents] = useState<any[]>([]);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [pageInput, setPageInput] = useState('');

  useEffect(() => {
    if (bookId) {
      loadBook(parseInt(bookId));
    }
    return cleanup;
  }, [bookId]);

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

  const initializeEpub = async (bookData: Book) => {
    if (!viewerRef.current) {
      console.error('Viewer ref not available');
      setLoading(false);
      return;
    }

    try {
      console.log('Initializing EPUB with data size:', bookData.fileContent.byteLength);
      
      const book = ePub(bookData.fileContent);
      bookRef.current = book;

      console.log('EPUB book instance created');

      await book.ready;
      console.log('EPUB book is ready');

      const toc = await book.loaded.navigation;
      setTableOfContents(toc.toc || []);
      console.log('Table of contents loaded:', toc.toc?.length || 0, 'items');

      const rendition = book.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
        allowScriptedContent: true,
        snap: true,
        manager: 'default'
      });
      renditionRef.current = rendition;

      console.log('Rendition created');

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

      const startLocation = bookData.currentLocation || undefined;
      console.log('Displaying book at location:', startLocation);
      
      await rendition.display(startLocation);
      console.log('Book displayed successfully');

      setTimeout(async () => {
        try {
          console.log('Starting initial pagination setup...');
          
          if (!book.locations.length()) {
            console.log('Pre-generating locations for better pagination...');
            await book.locations.generate(1650);
            console.log('Initial locations generated:', book.locations.length(), 'pages');
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

  const loadVocabulary = async (bookId: number) => {
    try {
      const words = await db.vocabulary
        .where('bookId')
        .equals(bookId)
        .toArray();
      words.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      setVocabulary(words);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  };

  const updateProgress = async (location: any, calculatedProgress?: number) => {
    if (!book || !bookRef.current) return;

    try {
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

  const saveWord = async (word: string, translation: string) => {
    if (!book) return;

    try {
      const vocabularyWord: Omit<VocabularyWord, 'id'> = {
        word,
        translation,
        bookId: book.id!,
        context: '',
        addedAt: new Date()
      };

      await db.vocabulary.add(vocabularyWord);
      await loadVocabulary(book.id!);
    } catch (error) {
      console.error('Error saving word:', error);
    }
  };

  const goNext = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const goPrev = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const goToPage = async (pageNumber: number) => {
    if (!renditionRef.current || !bookRef.current) return;
    
    try {
      const book = bookRef.current;
      
      try {
        if (!book.locations.length()) {
          console.log('Generating locations for page navigation...');
          await book.locations.generate(1650);
        }
        
        if (book.locations.length() > 0) {
          const totalPages = book.locations.length();
          const targetPage = Math.max(1, Math.min(pageNumber, totalPages));
          const targetIndex = targetPage - 1;
          
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

  return {
    // Refs
    viewerRef,
    bookRef,
    renditionRef,
    
    // State
    book,
    loading,
    vocabulary,
    tableOfContents,
    showVocabulary,
    showNavigation,
    pageInput,
    
    // State setters
    setShowVocabulary,
    setShowNavigation,
    setPageInput,
    
    // Actions
    saveWord,
    updateProgress,
    goNext,
    goPrev,
    goToPage,
    goToChapter,
    handlePageInputSubmit,
    loadVocabulary
  };
};