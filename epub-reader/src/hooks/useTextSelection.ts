import { useState, useCallback } from 'react';
import { dictionaryService, Translation } from '../services/dictionaryService';

export interface WordTooltip {
  word: string;
  translation: Translation | null;
  x: number;
  y: number;
  loading: boolean;
}

export const useTextSelection = (viewerRef: React.RefObject<HTMLDivElement | null>) => {
  const [showTooltip, setShowTooltip] = useState<WordTooltip | null>(null);

  const handleTextSelection = useCallback(async (cfiRange: string, contents: any) => {
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
  }, [viewerRef]);

  const handleDoubleClickEvent = useCallback((event: MouseEvent, contentWindow: Window) => {
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
  }, []);

  const handleManualSelectionEvent = useCallback(async (selection: Selection, contentWindow: Window) => {
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
  }, [viewerRef]);

  const closeTooltip = useCallback(() => {
    setShowTooltip(null);
  }, []);

  return {
    showTooltip,
    handleTextSelection,
    handleDoubleClickEvent,
    handleManualSelectionEvent,
    closeTooltip
  };
};