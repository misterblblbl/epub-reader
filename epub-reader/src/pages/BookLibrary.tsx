import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, Book } from '../database/db';
import { extractEPubMetadata } from '../utils/epubUtils';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './BookLibrary.css';

export const BookLibrary: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadBooks();
  }, []);

  // Reload books when returning to the library page
  useEffect(() => {
    const handleFocus = () => {
      console.log('Library page focused, reloading books...');
      loadBooks();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Reload books when navigating back to this page
  useEffect(() => {
    console.log('Library page visited, reloading books...');
    loadBooks();
  }, [location.pathname]);

  const loadBooks = async () => {
    try {
      const allBooks = await db.books.orderBy('lastReadAt').reverse().toArray();
      setBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.epub')) {
      alert('Please select a valid EPUB file');
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract EPUB metadata
      const metadata = await extractEPubMetadata(arrayBuffer);
      
      const book: Omit<Book, 'id'> = {
        title: metadata.title,
        author: metadata.author,
        fileName: file.name,
        fileContent: arrayBuffer,
        currentLocation: '',
        progress: 0,
        addedAt: new Date(),
        lastReadAt: new Date()
      };

      await db.books.add(book);
      await loadBooks();
    } catch (error) {
      console.error('Error uploading book:', error);
      alert('Error uploading book. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const openBook = (book: Book) => {
    navigate(`/reader/${book.id}`);
  };

  const deleteBook = async (book: Book, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(`Delete "${book.title}"?`)) {
      try {
        await db.books.delete(book.id!);
        await db.vocabulary.where('bookId').equals(book.id!).delete();
        await loadBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading your library..." />;
  }

  return (
    <div className="book-library">
      <Header title="My Library" />
      
      <div className="library-content">
        <div className="upload-section">
          <input
            type="file"
            accept=".epub"
            onChange={handleFileUpload}
            disabled={uploading}
            id="epub-upload"
            className="file-input"
          />
          <label htmlFor="epub-upload" className="upload-btn">
            {uploading ? 'Uploading...' : '+ Add EPUB Book'}
          </label>
          <p className="upload-hint">
            Select an EPUB file to add to your library
          </p>
        </div>

        {books.length === 0 ? (
          <div className="empty-library">
            <div className="empty-icon">📚</div>
            <h2>Your library is empty</h2>
            <p>Add your first EPUB book to start reading!</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((book) => (
              <div
                key={book.id}
                className="book-card"
                onClick={() => openBook(book)}
              >
                <div className="book-cover">
                  <div className="book-spine"></div>
                  <div className="book-title-cover">{book.title}</div>
                  {book.progress > 0 && (
                    <div className="reading-indicator" title={`${Math.round(book.progress)}% complete`}>
                      📖
                    </div>
                  )}
                </div>
                
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <div className="book-meta">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${book.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {book.progress > 0 ? `${Math.round(book.progress)}%` : 'Not started'}
                    </span>
                  </div>
                  <p className="last-read">
                    {book.progress > 0 ? (
                      <>📍 Continue reading - Last read: {formatDate(book.lastReadAt)}</>
                    ) : (
                      <>📖 Start reading - Added: {formatDate(book.addedAt)}</>
                    )}
                  </p>
                </div>
                
                <button
                  className="delete-btn"
                  onClick={(e) => deleteBook(book, e)}
                  aria-label="Delete book"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};