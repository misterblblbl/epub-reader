import ePub from 'epubjs';

export interface EPubMetadata {
  title: string;
  author: string;
  language?: string;
  description?: string;
  publisher?: string;
  publishedDate?: string;
}

export const extractEPubMetadata = async (arrayBuffer: ArrayBuffer): Promise<EPubMetadata> => {
  try {
    const book = ePub(arrayBuffer);
    await book.ready;

    // Access metadata through the archive property
    const metadata = (book as any).package?.metadata || {};
    
    return {
      title: metadata.title || 'Unknown Title',
      author: metadata.creator || 'Unknown Author',
      language: metadata.language || 'en',
      description: metadata.description || '',
      publisher: metadata.publisher || '',
      publishedDate: metadata.pubdate || ''
    };
  } catch (error) {
    console.error('Error extracting EPUB metadata:', error);
    return {
      title: 'Unknown Title',
      author: 'Unknown Author'
    };
  }
};

export const isValidEPubFile = (file: File): boolean => {
  return file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub');
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};