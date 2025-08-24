# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web application for reading EPUB books with integrated dictionary lookup and vocabulary tracking. 
The app is designed for language learners who want to build their vocabulary while reading.

The tech stack of the app is the following:
### Frontend:
- **Main stack:** React, TypeScript
- **State management:** Zustand
- **Styling:** styled-components
- **Progressive Web App:** Workbox for service worker management, IndexedDB wrapper like Dexie.js for storing books and vocabulary data, Web App Manifest with proper icons and metadata
- **EPUB Parsing & Rendering:** epub.js for EPUB parsing and rendering in web apps
- **Dictionary lookup:** Wiktionary API (free)

### Backend:
The backend part will be developed in the later iterations.
The planned stack is the following:
- **Main stack:** Golang
- **Database and filestorage:** Postgres, AWS S3 or Google Cloud Storage

## Key Technical Requirements
### Core Features
- EPUB Library Viewer
- EPUB file upload and parsing
- EBUP reader with navigation, text rendeing, pagination and TOC
- Reading progress synchronization
- Offline reading capability
- Word selection and dictionary lookup
- Vocabulary list management
- Ability to select color themes for the reader

### Performance
- Lazy loading of EPUB chapters
- Text virtualization for large books
- Efficient caching strategy
- Background sync for vocabulary data

### Accessibility:
- Keyboard navigation
- High contrast mode support

## Development Commands

### Primary Commands
- `cd epub-reader && npm start` - Start development server at http://localhost:3000
- `cd epub-reader && npm run build` - Build for production
- `cd epub-reader && npm test` - Run tests
- `cd epub-reader && npm install` - Install dependencies

## Development Requirements
1. The development should be iterative, each feature should be added separately
2. When developing a new feature checkout to a new branch named `feature-<fe/be>-<feature-name>`, where FE/BE stands for frontend or backend
3. The code should be professional and production-ready:
    - the handed out code should have at least 80% test coverage
    - the code should be compiling
    - the tests should be passing
    - the code should be following SOLID principles
    - the code should be safe and secure
4. All the frontend related code is stored in /frontend directory
5. All the backend related code is stored in /backend directory
6. Adhere to the following structurewhen adding code to /frontend directory:
```
src/
├── components/           # Pure UI components
│   ├── ui/              # Basic UI primitives
│   ├── reader/          # Reading-specific components
│   ├── vocabulary/      # Vocabulary-related components
│   └── common/          # Shared components
├── features/            # Feature modules (business logic)
│   ├── epub-reader/     # Core reading functionality
│   ├── dictionary/      # Dictionary lookup logic
│   ├── vocabulary/      # Vocabulary tracking logic
│   ├── library/         # Book library management
│   └── settings/        # User preferences
├── stores/              # State management
│   ├── epub.store.ts
│   ├── vocabulary.store.ts
│   ├── dictionary.store.ts
│   └── settings.store.ts
├── services/            # External integrations
│   ├── epub.service.ts
│   ├── dictionary.service.ts
│   └── storage.service.ts
├── hooks/               # Custom React hooks
├── utils/               # Pure utility functions
├── types/               # TypeScript definitions
└── constants/           # App constants
└── App.tsx            # Main app with routing
```
7. Key architectural pronciples for Frontend:
    - Component Separation:
        - Components only handle UI rendering and user interactions
        - No business logic in components
        - Props are typed interfaces
    - Feature Modules:
        - Each feature is self-contained
        - Business logic lives in custom hooks within features
        - Easy to enable/disable features
    - State Management:
        - Zustand stores handle global state
        - Local component state for UI-only concerns
        - Clear action definitions for state mutations
    - Service Abstraction:
        - External dependencies wrapped in service classes
        - Easy to swap implementations (mock for testing)
        - Consistent API across the app
8. Backend requirement will be defined later after the first milestone is complete.

## Status
Update this status when completing a new feature of the app.