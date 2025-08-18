export interface Translation {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
}

class DictionaryService {
  private cache: Map<string, Translation> = new Map();

  async translateWord(word: string, targetLang: string = 'en'): Promise<Translation | null> {
    const cacheKey = `${word}-${targetLang}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Try Wiktionary first (more reliable for CORS)
      const wikiTranslation = await this.translateWithWiktionary(word);
      if (wikiTranslation) {
        this.cache.set(cacheKey, wikiTranslation);
        return wikiTranslation;
      }

      // Fallback to Free Dictionary API
      const freeDictTranslation = await this.translateWithFreeDictionary(word);
      if (freeDictTranslation) {
        this.cache.set(cacheKey, freeDictTranslation);
        return freeDictTranslation;
      }

      // Last resort: try LibreTranslate (may fail due to CORS)
      const translation = await this.translateWithLibreTranslate(word, targetLang);
      if (translation) {
        this.cache.set(cacheKey, translation);
        return translation;
      }

      return null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }

  private async translateWithFreeDictionary(word: string): Promise<Translation | null> {
    try {
      // Free Dictionary API - reliable and CORS-friendly
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );

      if (!response.ok) throw new Error('Free Dictionary API error');

      const data = await response.json();
      
      if (data && data.length > 0) {
        const entry = data[0];
        const meaning = entry.meanings?.[0];
        const definition = meaning?.definitions?.[0];
        
        if (definition) {
          let translationText = definition.definition || word;
          translationText = this.cleanHtmlText(translationText);
          
          return {
            word,
            translation: translationText,
            partOfSpeech: meaning.partOfSpeech,
            phonetic: entry.phonetic || entry.phonetics?.[0]?.text
          };
        }
      }

      return null;
    } catch (error) {
      console.warn('Free Dictionary failed:', error);
      return null;
    }
  }

  private async translateWithLibreTranslate(word: string, targetLang: string): Promise<Translation | null> {
    try {
      // Using a public LibreTranslate instance
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: word,
          source: 'auto',
          target: targetLang,
          format: 'text'
        })
      });

      if (!response.ok) throw new Error('LibreTranslate API error');

      const data = await response.json();
      let translationText = data.translatedText || word;
      
      // Clean up any potential HTML content
      translationText = this.cleanHtmlText(translationText);
      
      return {
        word,
        translation: translationText
      };
    } catch (error) {
      // Silently fail for LibreTranslate since CORS errors are expected in development
      return null;
    }
  }

  private async translateWithWiktionary(word: string): Promise<Translation | null> {
    try {
      const response = await fetch(
        `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
      );

      if (!response.ok) throw new Error('Wiktionary API error');

      const data = await response.json();
      
      if (data.en && data.en.length > 0) {
        const definition = data.en[0];
        let translationText = definition.definitions?.[0]?.definition || word;
        
        // Clean up HTML tags and entities
        translationText = this.cleanHtmlText(translationText);
        
        return {
          word,
          translation: translationText,
          partOfSpeech: definition.partOfSpeech
        };
      }

      return null;
    } catch (error) {
      console.warn('Wiktionary failed:', error);
      return null;
    }
  }

  private cleanHtmlText(text: string): string {
    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit length to keep tooltips manageable
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 197) + '...';
    }
    
    return cleaned;
  }
}

export const dictionaryService = new DictionaryService();