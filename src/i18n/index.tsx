import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported locales trimmed to only English and Polish per requirements.
export type Locale = 'en' | 'pl';

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const resources: Record<Locale, Record<string, string>> = {
  en: {
    'app.name': 'NoFace',
    'hero.tagline': 'Privacy-first image anonymization that runs entirely in your browser.',
    'hero.sub': 'No uploads, no tracking, complete control.',
  'hero.freeLabel': 'Free',
  'hero.freeNotice': 'You will never be charged for protecting your privacy.',
  'support.title': 'Keep it free 💜',
  'support.body': 'NoFace is kept private, and ad‑free by people like you. If it saved you time or protected someone’s privacy, buying a coffee helps ship new features, performance wins, and more zero‑tracking tools.',
  'support.cta': 'Buy me a coffee',
  'support.thanks': 'Grateful for your support of open, privacy‑first tools.',
  'legal.responsibility.title': 'Terms & Responsibility',
  'legal.responsibility.body': 'NoFace runs 100% in your browser. Images never leave your device. You alone are responsible for what you anonymize, how you use the results, and any legal or ethical outcomes. The author has no visibility into, and accepts no liability for, content processed with this tool.',
    'feature.privacy.title': 'Privacy First',
    'feature.privacy.desc': '100% client-side processing. Your images never leave your device.',
    'feature.smart.title': 'Smart Detection',
    'feature.smart.desc': 'AI-powered face detection with manual selection controls.',
    'feature.instant.title': 'Instant Results',
    'feature.instant.desc': 'Fast blur, pixelation or color block effects with customizable intensity.',
    'feature.clean.title': 'Clean Downloads',
    'feature.clean.desc': 'EXIF data removed – no location, camera model, or timestamps.',
    'counters.images': 'Images Processed',
    'counters.faces': 'Faces Anonymized',
    'drop.freeLimit': 'Free tier limit reached',
    'drop.freeLimit.desc': 'You can process one image per session. Refresh to try another image.',
    'drop.dropHere': 'Drop your image here',
    'drop.uploadCta': 'Upload an image to anonymize',
    'drop.supported': 'Drag & drop or click to select • JPG, PNG, WebP supported',
    'drop.refreshToContinue': 'Refresh the page to process another image',
    'drop.chooseImage': 'Choose Image',
    'drop.heic.warn': 'HEIC files need conversion first',
    'privacy.notice.1': 'Your images are processed entirely in your browser',
    'privacy.notice.2': 'No uploads, no cloud processing, complete privacy',
    'faces.detected': 'Detected Faces',
    'faces.selectAll': 'Select All',
    'faces.deselectAll': 'Deselect All',
    'faces.aggressive': 'Aggressive Detect',
  'faces.help.title': 'Face Editing Tips',
  'faces.help.add': 'Draw a box (click and drag) to add a manual face region.',
  'faces.help.move': 'Drag an existing box to fine‑tune its position.',
  'faces.help.delete': 'Hover a box and click × to remove it.',
  'faces.addManual': 'Add boxes manual',
  'faces.addManualOn': 'Manual add: ON',
    'anonymize.blur': 'Blur',
    'anonymize.pixelate': 'Pixelate',
    'anonymize.color': 'Color Block',
    'anonymize.intensity': 'Intensity',
    'anonymize.action': 'Anonymize',
    'anonymize.faces': 'Face(s)',
    'download': 'Download',
    'new.image': 'New Image',
  'how.title': 'How it Works',
  'how.step1.title': 'Choose Image',
  'how.step1.desc': 'Select or drop a photo you want to anonymize. Nothing is uploaded – it stays on your device.',
  'how.group.prepare': 'Prepare',
  'how.group.apply': 'Apply & Download',
  'how.step2.title': 'Mark Faces',
  'how.step2.desc': 'Automatic detection finds faces. Add, move or delete boxes to adjust coverage.',
  'how.step3.title': 'Pixelate & Download',
  'how.step3.desc': 'Apply pixelation for strong obfuscation.',
  'how.step4.title': 'Color Block & Download',
  'how.step4.desc': 'Use solid color blocks instead (or compare), then download instantly.',
  'how.step1.alt': 'Original image before anonymization',
  'how.step2.alt': 'Image with face boxes drawn for anonymization',
  'how.step3.alt': 'Image with pixelated faces',
  'how.step4.alt': 'Image with color‑blocked faces ready to download',
    'exif.note': 'Downloaded image is re-encoded without EXIF metadata.',
    // Newly added UI strings
    'pan.off': 'Pan off',
    'pan.on': 'Pan on',
    'faces.dragToDraw': 'Drag to draw face box',
    'image.dragToMove': 'Drag to move image',
    'image.zoom': 'Zoom'
  },
  pl: {
  'app.name': 'NoFace',
  'hero.tagline': 'Anonimizacja obrazów! Prywatność jest priorytetem. NoFace działa w całości w Twojej przeglądarce.',
  'hero.sub': 'Bez wysyłania zdjęć do chmury, beż śledzenia.',
  'hero.freeLabel': 'Za darmo',
  'hero.freeNotice': 'Anonimizacja zdjęć bez kosztów',
  'support.title': 'Podoba ci się skrypt? Kup mi kawe :)',
  'support.body': 'NoFace pozostaje darmowy, prywatny i wolny od reklam dzięki ludziom takim jak Ty. Jeśli podoba Ci się projekt, kupienie kawy pomoże mi wdrożyć nowe funkcje.',
  'support.cta': 'Kup mi kawę',
  'support.thanks': 'Dziękuje za wsparcie.',
  'legal.responsibility.title': 'Warunki i odpowiedzialność',
  'legal.responsibility.body': 'NoFace działa w 100% w Twojej przeglądarce. Obrazy nigdy nie opuszczają Twojego urządzenia. Ty sam odpowiadasz za to, co anonimizujesz, jak używasz wyników i wszelkie skutki prawne lub etyczne. Autor nie ma wglądu w przetwarzane treści i nie ponosi za nie żadnej odpowiedzialności.',
  'feature.privacy.title': 'Prywatność przede wszystkim',
  'feature.privacy.desc': 'Przetwarzanie 100% po stronie klienta. Twoje obrazy nigdy nie opuszczają urządzenia.',
  'feature.smart.title': 'Inteligentne wykrywanie',
  'feature.smart.desc': 'Wykrywanie twarzy z użyciem AI plus ręczne kontrolki wyboru.',
  'feature.instant.title': 'Natychmiastowe wyniki',
  'feature.instant.desc': 'Szybkie pikselizacja lub blok kolorów.',
  'feature.clean.title': 'Pobieranie bez EXIF',
  'feature.clean.desc': 'Pobranie pliku usuwa lokalizacje, modelu aparatu i inne znaczniki z danych EXIF zdjęcia.',
  'counters.images': 'Przetworzonych zdjęć',
  'counters.faces': 'Zanonimizowanych twarzy',
  'drop.freeLimit': 'Osiągnięto limit wersji darmowej',
  'drop.freeLimit.desc': 'Możesz przetworzyć jedno zdjęcie na sesję. Odśwież, aby spróbować kolejne.',
  'drop.dropHere': 'Upuść tutaj swój obraz',
  'drop.uploadCta': 'Prześlij zdjęcie do anonimizacji',
  'drop.supported': 'Przeciągnij i upuść lub kliknij, aby wybrać • obsługiwane: JPG, PNG, WebP',
  'drop.refreshToContinue': 'Odśwież stronę, aby przetworzyć kolejny obraz',
  'drop.chooseImage': 'Wybierz zdjęcie',
  'drop.heic.warn': 'Pliki HEIC wymagają najpierw konwersji, chyba, że wgrywane prosto z rolki.',
  'privacy.notice.1': 'Twoje obrazy są przetwarzane w całości w przeglądarce',
  'privacy.notice.2': 'Brak wysyłania, brak przetwarzania w chmurze, pełna prywatność',
  'faces.detected': 'Wykryte twarze',
  'faces.selectAll': 'Zaznacz wszystko',
  'faces.deselectAll': 'Odznacz wszystko',
  'faces.aggressive': 'Agresywne wykrywanie',
  'faces.help.title': 'Wskazówki do edycji twarzy',
  'faces.help.add': 'Narysuj prostokąt (kliknij i przeciągnij), aby dodać ręczny obszar twarzy.',
  'faces.help.move': 'Przeciągnij istniejący prostokąt, aby doprecyzować pozycję.',
  'faces.help.delete': 'Najedź na prostokąt i kliknij ×, aby go usunąć.',
  'faces.addManual': 'dodaj obszar ręcznie',
  'faces.addManualOn': 'Ręczne dodawanie: WŁ',
  'anonymize.blur': 'Rozmyj',
  'anonymize.pixelate': 'Pikselizuj',
  'anonymize.color': 'Wybierz kolor',
  'anonymize.intensity': 'Intensywność',
  'anonymize.action': 'Anonimizuj',
  'anonymize.faces': 'Twarz(e)',
  'download': 'Pobierz',
  'new.image': 'Nowy obraz',
  'how.title': 'Jak to działa',
  'how.step1.title': 'Wybierz obraz',
  'how.step1.desc': 'Wybierz lub upuść zdjęcie, które chcesz zanonimizować. Nic nie jest wysyłane – zostaje na Twoim urządzeniu.',
  'how.group.prepare': 'Przygotuj',
  'how.group.apply': 'Zastosuj i pobierz',
  'how.step2.title': 'Oznacz twarze',
  'how.step2.desc': 'Automatyczne wykrywanie znajduje twarze. Dodaj, przesuwaj lub usuń prostokąty, aby dostosować pokrycie.',
  'how.step3.title': 'Pikselizuj i pobierz',
  'how.step3.desc': 'Zastosuj pikselizację dla mocnej obfuskacji.',
  'how.step4.title': 'Blok kolorowy i pobierz',
  'how.step4.desc': 'Zamiast tego użyj bloków koloru (lub porównaj), a następnie pobierz natychmiast.',
  'how.step1.alt': 'Oryginalny obraz przed anonimizacją',
  'how.step2.alt': 'Obraz z prostokątami twarzy do anonimizacji',
  'how.step3.alt': 'Obraz z ostylowanymi pikselami twarzy',
  'how.step4.alt': 'Obraz z blokami kolorów na twarze gotowy do pobrania',
  'exif.note': 'Pobrany obraz zostaje przekodowany bez metadanych EXIF.',
  // Newly added UI strings
  'pan.off': 'Pan wyłączony',
  'pan.on': 'Pan włączony',
  'faces.dragToDraw': 'Przeciągnij, aby narysować obszar twarzy',
  'image.dragToMove': 'Przeciągnij, aby przesunąć obraz',
  'image.zoom': 'Powiększenie'
},
};

const fallbackLocale: Locale = 'en';

function translate(locale: Locale, key: string, vars?: Record<string, any>): string {
  const dict = resources[locale] || resources[fallbackLocale];
  let template = dict[key] || resources[fallbackLocale][key] || key;
  if (vars) {
    Object.entries(vars).forEach(([k,v]) => {
      template = template.replace(new RegExp('{' + k + '}', 'g'), String(v));
    });
  }
  return template;
}

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() => {
  const stored = (typeof window !== 'undefined') ? localStorage.getItem('noface:locale') : null;
  if (stored === 'en' || stored === 'pl') return stored;
  return 'en';
  });

  useEffect(() => {
    try { localStorage.setItem('noface:locale', locale); } catch {}
  }, [locale]);

  // Detect browser preferred language once on mount if user has not chosen/stored a locale yet.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('noface:locale');
      if (stored) return; // Respect existing user choice.
      if (typeof navigator === 'undefined') return;
  const supported: Locale[] = ['en','pl'];
      const candidates: string[] = Array.isArray((navigator as any).languages) && (navigator as any).languages.length
        ? (navigator as any).languages
        : [(navigator as any).language].filter(Boolean);
      for (const lang of candidates) {
        if (!lang) continue;
        const base = lang.toLowerCase().split(/[-_]/)[0];
        if (supported.includes(base as Locale)) {
          if (base !== locale) setLocale(base as Locale);
          break;
        }
      }
    } catch {
      // Ignore detection errors (privacy settings, etc.)
    }
  }, []); // run only once

  const t = (key: string, vars?: Record<string, any>) => translate(locale, key, vars);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' }
];
