import Dexie, { Table } from 'dexie';

export interface Book {
  id?: number;
  title: string;
  author: string;
  fileName: string;
  fileContent: ArrayBuffer;
  currentLocation: string;
  progress: number;
  addedAt: Date;
  lastReadAt: Date;
}

export interface VocabularyWord {
  id?: number;
  word: string;
  translation: string;
  bookId: number;
  context: string;
  addedAt: Date;
}

export class AppDatabase extends Dexie {
  books!: Table<Book>;
  vocabulary!: Table<VocabularyWord>;

  constructor() {
    super('EPubReaderDB');
    this.version(1).stores({
      books: '++id, title, author, fileName, addedAt, lastReadAt',
      vocabulary: '++id, word, bookId, addedAt'
    });
  }
}

export const db = new AppDatabase();