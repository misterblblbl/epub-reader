# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript progressive web application for reading EPUB books with integrated dictionary lookup and vocabulary tracking. The app is designed for language learners who want to build their vocabulary while reading.

## Development Commands

### Primary Commands
- `cd epub-reader && npm start` - Start development server at http://localhost:3000
- `cd epub-reader && npm run build` - Build for production
- `cd epub-reader && npm test` - Run tests
- `cd epub-reader && npm install` - Install dependencies

### Specific Testing
- No specific test commands defined yet (uses default React testing)

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **EPUB Rendering**: epub.js library for parsing and displaying EPUB files
- **Database**: IndexedDB via Dexie for storing books and vocabulary
- **Dictionary**: LibreTranslate and Wiktionary APIs for word translation
- **PWA**: Service Worker and Web App Manifest for offline capabilities

### Key Components

**Pages:**
- `BookLibrary.tsx` - Main library view for importing and managing EPUB books
- `BookReader.tsx` - Main reading interface with word selection and dictionary lookup

**Services:**
- `database/db.ts` - Dexie database schema for books and vocabulary
- `services/dictionaryService.ts` - Translation service using multiple APIs
- `utils/epubUtils.ts` - EPUB metadata extraction utilities

**Core Features:**
- EPUB file import with metadata extraction
- Text selection for dictionary lookup with tooltip UI
- Vocabulary saving and management per book
- Progress tracking and bookmarking
- Responsive design for mobile and desktop

### File Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── services/           # API and business logic
├── database/           # IndexedDB schema and operations
├── utils/              # Helper functions
└── App.tsx            # Main app with routing
```

### Key Implementation Details

**EPUB Handling:**
- Uses epub.js for rendering and navigation
- Stores full file content in IndexedDB as ArrayBuffer
- Extracts metadata (title, author) during import
- Supports custom reading themes for comfortable reading

**Dictionary Integration:**
- Text selection triggers translation lookup
- Fallback chain: LibreTranslate → Wiktionary
- Caching of translation results
- Save words with translation and context

**Data Persistence:**
- All data stored locally in IndexedDB
- Books table: metadata, content, reading progress
- Vocabulary table: words linked to specific books
- No server-side storage required

## Development Notes

- The app works entirely offline after initial load (PWA)
- EPUB files can be large - consider memory usage during development
- Dictionary APIs may have rate limits in production
- Uses CSS custom properties for theming (supports dark mode)
- Error boundary component wraps the entire app for graceful error handling