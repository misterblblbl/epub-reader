# Language Learning EPUB Reader

A progressive web application for reading EPUB books with integrated dictionary lookup and vocabulary tracking features. Perfect for language learners who want to build their vocabulary while reading.

## Features

### 📚 EPUB Reader
- Import and read EPUB files
- Clean, comfortable reading interface with optimized typography
- Page navigation with keyboard shortcuts (arrow keys)
- Progress tracking and bookmarking
- Responsive design for mobile and desktop

### 📖 Dictionary Integration
- Select any word to get instant translations
- Free dictionary services (LibreTranslate, Wiktionary)
- Word pronunciation and part-of-speech information
- Context-aware translations

### 📝 Vocabulary Management
- Save words to your personal vocabulary
- Book-specific vocabulary lists
- Review saved words anytime
- Persistent storage with IndexedDB

### 📱 Progressive Web App
- Install on your phone home screen
- Offline reading capabilities
- Fast loading and smooth performance
- Cross-platform compatibility

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **EPUB Rendering**: epub.js
- **Database**: IndexedDB (via Dexie)
- **Dictionary**: LibreTranslate API, Wiktionary API
- **Styling**: CSS Custom Properties with responsive design
- **PWA**: Service Worker, Web App Manifest

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd epub-reader
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and go to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Usage

### Adding Books
1. Click the "Add EPUB Book" button on the library page
2. Select an EPUB file from your device
3. The book will be processed and added to your library

### Reading
1. Click on any book in your library to open it
2. Use the navigation buttons or arrow keys to turn pages
3. Click and drag to select text for dictionary lookup
4. Save interesting words to your vocabulary

### Dictionary Lookup
1. Select any word while reading
2. A tooltip will appear with the translation
3. Click "Save Word" to add it to your vocabulary
4. Access your vocabulary via the "Words" button

### Vocabulary Management
1. Click "Words" in the reader header
2. View all saved words for the current book
3. Words are organized by the book they were found in
4. Vocabulary persists across sessions

## Keyboard Shortcuts

- `←` / `→` Arrow keys: Navigate pages
- `Esc`: Close vocabulary panel or word tooltip

## Browser Compatibility

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Installing as PWA

### Mobile (iOS/Android)
1. Open the app in your mobile browser
2. Look for "Add to Home Screen" in your browser menu
3. Follow the prompts to install

### Desktop
1. Open the app in Chrome/Edge
2. Look for the install icon in the address bar
3. Click to install as a desktop app

## Troubleshooting

### EPUB files not loading
- Ensure the file is a valid EPUB format
- Try a different EPUB file to test
- Check browser console for error messages

### Dictionary not working
- Check your internet connection
- Some words may not have translations available
- Try selecting single words rather than phrases

### Vocabulary not saving
- Ensure browser storage permissions are enabled
- Clear browser data and try again
- Check if you're in private/incognito mode

## Performance Tips

- Keep EPUB files under 50MB for best performance
- Close vocabulary panel when not needed
- Restart the app if it becomes sluggish

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter issues:
1. Check the browser console for errors
2. Try refreshing the page
3. Clear browser storage and re-import books
4. Open an issue on GitHub with details