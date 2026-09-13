import { useEffect } from 'react';
import './LanguageSelector.css';

// Sikkim-relevant first: English, Hindi, Nepali, Bengali — plus other major
// Indian languages. Free Google Translate website widget (no API key needed).
const INCLUDED_LANGUAGES = 'en,hi,ne,bn,mr,gu,ta,te,kn,ml,pa,ur,as,or';

export default function LanguageSelector() {
  useEffect(() => {
    // Guard against double-injection (StrictMode) and remounts.
    if (document.getElementById('google-translate-script')) {
      if (window.google?.translate && document.getElementById('google_translate_element')?.childElementCount === 0) {
        window.googleTranslateElementInit?.();
      }
      return;
    }
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: INCLUDED_LANGUAGES,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <span className="language-selector" title="Change language / भाषा बदलें / भाषा परिवर्तन गर्नुहोस्">
      <span aria-hidden="true" className="language-globe">🌐</span>
      <span id="google_translate_element" aria-label="Language selector" />
    </span>
  );
}
