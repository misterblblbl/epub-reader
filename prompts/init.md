I want to create an application that will be a language-learning e-reader.
The application should be nice and user-friendly.


APPLICATION OVERVIEW:
The application is a reader for books in epub format that will help reading in a foreign language. The app will have an integration with a dictionary, that will allow user to quickly select a word, and quickly look up it's translation in a dictionary. The user should be able to save the selected words, and to have an overview of the worrds related to the book the user is currently reading.

CORE FEATURES:
1. EPUB reader – the main functionality of the app is reading the books:
  - the user should be able to import it as a file
  - it should display pages
  - it should allow user to turn pages, get to any page she/he wants
  - it should show the progress
  - it should show the content

2. Dictionary integration:
- the reader should be integrated with a dictionary, it should be a free dictionaly
- when user highlights a word, a small tooltip with a translation should be displayed, there should be a button allowing the user to save this word to his own vocabulary
- the app should allow user to view the vocabulary related to each book

Feel free to take care of any other fuctionality I did not mention, that will improve the user-experience


TECHNICAL REQUIREMENTS:
- this should be a progressive web app allowing to save the app icon on the phone screen
- Framework: React
- EPUB rendering: use epub.js (works well in browsers).
- Dictionary lookup, Free API options: LibreTranslate, Wiktionary, Glosbe.
- Store words in IndexedDB (persists even after closing browser).


DESIGN REQUIREMENTS:
- Clean, modern interface
- color scheme should containe colors that are comfortable for reading
- Intuitive navigation and user experience
- Visual feedback for user actions
- Loading states and error handling
- Mobile-responsive design


Please create this as a complete, production-ready application. Set up the project structure, implement all features, and make sure everything works together seamlessly. Focus on creating something that looks professional and that I could actually use to read books.
For the beginning we can run it on localhost.

When you're done, provide instructions on how to run the application and test all features.