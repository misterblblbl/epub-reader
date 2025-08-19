# BookReader Component Refactoring Plan

## Overview
The current BookReader component is 800+ lines and handles multiple responsibilities. This document outlines how to split it into smaller, focused components following the Single Responsibility Principle.

## Current Issues
- **Single Large Component**: 800+ lines with multiple concerns
- **Mixed Responsibilities**: UI rendering, business logic, state management, and event handling
- **Complex State**: 10+ state variables managed in one component
- **Multiple Event Handlers**: Text selection, navigation, keyboard shortcuts
- **Large Functions**: Several functions exceed 50+ lines

## Proposed Component Structure

### 1. **BookReader** (Main Container)
**Responsibility**: Orchestrate the reading experience, manage book loading
**Size**: ~150-200 lines

**Responsibilities**:
- Load book data from database
- Initialize EPUB.js instance
- Coordinate child components
- Handle top-level error states
- Manage keyboard shortcuts

**State**:
- `book: Book | null`
- `loading: boolean`
- `bookRef: RefObject`
- `renditionRef: RefObject`

**Key Functions**:
- `loadBook()`
- `initializeEpub()`
- `handleKeyPress()`

---

### 2. **EpubViewer** (EPUB Rendering)
**Responsibility**: Handle EPUB.js rendering and display
**Size**: ~100-150 lines

**Responsibilities**:
- Render EPUB content using EPUB.js
- Apply reading themes and styles
- Handle EPUB-specific events
- Manage iframe interactions

**Props**:
- `bookData: Book`
- `onTextSelection: (cfiRange, contents) => void`
- `onRelocated: (location) => void`
- `viewerRef: RefObject`

**Internal State**:
- Theme settings
- Rendering status

---

### 3. **TextSelectionHandler** (Custom Hook)
**Responsibility**: Manage text selection and word detection
**Size**: ~80-120 lines

**Responsibilities**:
- Handle multiple text selection methods (native, double-click, manual)
- Clean and validate selected text
- Calculate tooltip positioning
- Coordinate with dictionary service

**Hook Interface**:
```typescript
const useTextSelection = (viewerRef, onWordSelected) => {
  // Returns selection handlers and utilities
}
```

**Functions**:
- `handleTextSelection()`
- `handleDoubleClickEvent()`
- `handleManualSelectionEvent()`

---

### 4. **WordTooltip** (Dictionary Integration)
**Responsibility**: Display word definitions and manage vocabulary
**Size**: ~80-100 lines

**Props**:
- `word: string`
- `position: { x: number, y: number }`
- `onClose: () => void`
- `onSaveWord: (word: VocabularyWord) => void`

**Internal State**:
- `translation: Translation | null`
- `loading: boolean`

**Responsibilities**:
- Fetch word definitions from dictionary service
- Display definition with formatting
- Handle word saving to vocabulary
- Manage loading and error states

---

### 5. **ReaderNavigation** (Navigation Controls)
**Responsibility**: Handle all navigation and progress tracking
**Size**: ~120-150 lines

**Props**:
- `controls: ReaderControls`
- `onNext: () => void`
- `onPrev: () => void`
- `onGoToPage: (page: number) => void`
- `onShowTOC: () => void`

**Internal State**:
- `pageInput: string`

**Sub-components**:
- `ProgressBar`
- `NavigationButtons`
- `PageSelector`
- `QuickNavigation`

**Responsibilities**:
- Display progress bar and percentage
- Handle prev/next navigation
- Manage page input and jumping
- Quick navigation shortcuts

---

### 6. **ProgressManager** (Custom Hook)
**Responsibility**: Calculate and track reading progress
**Size**: ~60-80 lines

**Hook Interface**:
```typescript
const useProgressManager = (rendition, book) => {
  return {
    controls: ReaderControls,
    updateProgress: (location) => void
  }
}
```

**Responsibilities**:
- Calculate progress using multiple methods
- Generate EPUB.js locations for accurate pagination
- Update database with reading progress
- Handle progress edge cases and fallbacks

---

### 7. **TableOfContents** (TOC Panel)
**Responsibility**: Display and navigate table of contents
**Size**: ~60-80 lines

**Props**:
- `isVisible: boolean`
- `tableOfContents: TOCItem[]`
- `onClose: () => void`
- `onChapterSelect: (href: string) => void`

**Responsibilities**:
- Display TOC in a modal panel
- Handle chapter navigation
- Manage panel visibility

---

### 8. **VocabularyPanel** (Vocabulary Management)
**Responsibility**: Display and manage saved vocabulary
**Size**: ~80-100 lines

**Props**:
- `isVisible: boolean`
- `vocabulary: VocabularyWord[]`
- `onClose: () => void`
- `bookId: number`

**Responsibilities**:
- Display saved words list
- Load vocabulary from database
- Handle word deletion (future feature)
- Manage panel visibility

---

### 9. **useBookReader** (Main Business Logic Hook)
**Responsibility**: Coordinate all reading-related business logic
**Size**: ~100-150 lines

**Hook Interface**:
```typescript
const useBookReader = (bookId: string) => {
  return {
    book,
    loading,
    vocabulary,
    tableOfContents,
    // ... other state and handlers
  }
}
```

**Responsibilities**:
- Manage all book-related state
- Coordinate between different concerns
- Handle data loading and persistence
- Provide clean interface to main component

## Implementation Strategy

### Phase 1: Extract Utility Functions
1. Create custom hooks for business logic
2. Extract `useProgressManager`
3. Extract `useTextSelection` 
4. Extract `useBookReader`

### Phase 2: Extract UI Components
1. Create `WordTooltip` component
2. Create `ReaderNavigation` component
3. Create `EpubViewer` component

### Phase 3: Extract Modal Components
1. Create `TableOfContents` component
2. Create `VocabularyPanel` component

### Phase 4: Refactor Main Component
1. Update `BookReader` to use extracted components
2. Clean up prop passing and state management
3. Remove unused code and imports

## Benefits of This Refactoring

### 1. **Separation of Concerns**
- Each component has a single, clear responsibility
- Business logic separated from UI components
- Custom hooks encapsulate reusable logic

### 2. **Improved Testability**
- Smaller components are easier to unit test
- Custom hooks can be tested independently
- Mocking becomes more straightforward

### 3. **Better Maintainability**
- Changes to one concern don't affect others
- Easier to locate and fix bugs
- Code is more readable and understandable

### 4. **Enhanced Reusability**
- Navigation components could be reused in other readers
- Custom hooks can be shared across components
- Dictionary integration becomes portable

### 5. **Performance Optimization**
- Smaller components can be memoized individually
- Reduced re-renders when only specific state changes
- Better code splitting opportunities

## File Structure After Refactoring

```
src/
├── pages/
│   └── BookReader.tsx                    # Main container (150-200 lines)
├── components/
│   ├── reader/
│   │   ├── EpubViewer.tsx               # EPUB rendering
│   │   ├── ReaderNavigation.tsx         # Navigation controls
│   │   ├── WordTooltip.tsx              # Dictionary tooltip
│   │   ├── TableOfContents.tsx          # TOC panel
│   │   ├── VocabularyPanel.tsx          # Vocabulary management
│   │   └── index.ts                     # Export all reader components
│   └── ...
├── hooks/
│   ├── useBookReader.ts                 # Main business logic
│   ├── useProgressManager.ts            # Progress tracking
│   ├── useTextSelection.ts              # Text selection handling
│   └── index.ts                         # Export all hooks
└── ...
```

## Migration Checklist

### Pre-refactoring
- [ ] Ensure all current functionality works
- [ ] Create comprehensive tests for current behavior
- [ ] Document current props and state dependencies
- [ ] Identify shared utilities and types

### During Refactoring
- [ ] Extract one component at a time
- [ ] Maintain existing functionality throughout
- [ ] Update imports and prop passing
- [ ] Test each extracted component individually

### Post-refactoring
- [ ] Verify all functionality still works
- [ ] Update CSS class names if needed
- [ ] Optimize prop passing and performance
- [ ] Add component-level tests
- [ ] Update documentation

## Risk Mitigation

### Potential Issues
1. **State synchronization** between components
2. **Prop drilling** for deeply nested data
3. **Event handling** coordination
4. **CSS specificity** with component extraction

### Solutions
1. Use custom hooks to maintain centralized state management
2. Implement Context API if prop drilling becomes excessive
3. Use event delegation and clear callback patterns
4. Maintain CSS module approach with scoped styles

This refactoring will transform the monolithic BookReader into a maintainable, testable, and performant set of focused components while preserving all existing functionality.