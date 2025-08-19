import { useState, useCallback } from 'react';
import { db, Book } from '../database/db';

export interface ReaderControls {
  currentLocation: string;
  progress: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  currentPage: number;
  totalPages: number;
}

export const useProgressManager = (book: Book | null, bookRef: React.RefObject<any>) => {
  const [controls, setControls] = useState<ReaderControls>({
    currentLocation: '',
    progress: 0,
    canGoNext: false,
    canGoPrev: false,
    currentPage: 1,
    totalPages: 1
  });

  const updateControls = useCallback(async (rendition: any) => {
    try {
      const location = rendition.location;
      if (!location) {
        console.log('No location available for progress tracking');
        return;
      }

      console.log('Updating controls with location:', location);

      const epubBook = rendition.book;
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
        if (!epubBook.locations.length()) {
          console.log('Generating locations for pagination...');
          await epubBook.locations.generate(1650); // Characters per page (adjust as needed)
          console.log('Locations generated:', epubBook.locations.length(), 'pages');
        }
        
        if (epubBook.locations.length() > 0) {
          totalPages = epubBook.locations.length();
          
          // Get current page from CFI
          const currentCfi = location.start.cfi;
          if (currentCfi) {
            const currentLocation = epubBook.locations.locationFromCfi(currentCfi);
            currentPage = currentLocation + 1; // locationFromCfi returns 0-based index
            progress = currentLocation / totalPages;
          }
        }
        
        console.log('Pagination from locations:', {
          totalPages,
          currentPage,
          progress,
          locationsLength: epubBook.locations.length()
        });
      } catch (locError) {
        console.warn('Could not generate locations, falling back to spine-based pagination:', locError);
        
        // Fallback to spine-based calculation
        if (epubBook?.spine?.items) {
          totalPages = epubBook.spine.items.length;
          
          if (progress === 0) {
            const currentSpineIndex = epubBook.spine.items.findIndex((item: any) => 
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
        await updateProgress(location, progress);
      }
    } catch (error) {
      console.error('Error updating controls:', error);
    }
  }, [book]);

  const updateProgress = useCallback(async (location: any, calculatedProgress?: number) => {
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
  }, [book, bookRef]);

  return {
    controls,
    updateControls,
    updateProgress
  };
};