<div align="center">

# NoFace

Lightweight, privacy‑first face anonymization in the browser. Drop an image, auto‑detect faces (with manual tweaks), then blur / pixelate / color‑block them. Nothing ever uploads.

</div>

## ✨ Features

- 100% client‑side (no image leaves the device)
- Face detection + manual box add/remove
- Three anonymization modes: Blur, Pixelate, Color Block
- Adjustable intensity / pixel size
- EXIF stripped on download
- Multi‑language UI (EN, PL)
- Live global counters (images processed / faces anonymized)
- Zoom & pan canvas + manual box drawing
- Accessible UI (keyboard focusable controls)

## 🧱 Tech Stack

| Area | Tech |
| ---- | ---- |
| Framework | React + TypeScript (Vite) |
| UI | Tailwind CSS, shadcn-ui, Radix primitives |
| State | Zustand + localStorage persistence |
| Detection | TensorFlow.js (BlazeFace / Face Detection) |
| Build | Vite + SWC React plugin |
| Backend (counters only) | Tiny PHP endpoint + JSON file |

## 🚀 Quick Start

```bash
git clone <REPO_URL> noface
cd noface
npm install
npm run dev
# open http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview  # http://localhost:4173
```

## 🖼 How It Works

1. Image is loaded into an HTMLCanvasElement
2. Face detection model returns bounding boxes
3. User can toggle/select or draw new boxes (coordinates adjusted for zoom/pan transforms)
4. Chosen anonymization algorithm mutates pixel regions (blur, pixelate, or fill color)
5. Canvas is exported to a re‑encoded image (eliminates EXIF metadata)

## 🌐 Internationalization

Currently shipping English (`en`) and Polish (`pl`). Translations live in `src/i18n/index.tsx`.

To add a new language (community PRs welcome):
1. Add locale code to the `Locale` union
2. Add dictionary block with string keys mirroring `en`
3. Add to exported `locales` array for the selector
4. Submit PR including translation credit in the PR description

Usage example:

```tsx
const { t } = useI18n();
<h1>{t('hero.tagline')}</h1>
```

## 🔄 Custom Events

The app dispatches window events for optimistic counters:
- `noface:image`  detail: { images: 1, faces: 0 }
- `noface:anonymized` detail: { images: 0, faces: <n> }

`LiveCounters` listens and merges them with server totals (polled every 5s).

## 📂 Project Structure (abridged)

```
src/
	components/
		ImageProcessor.tsx   # detection + anonymization UI
		FileDropzone.tsx     # upload + validation
		LiveCounters.tsx     # polling + optimistic updates
		LanguageSelector.tsx # locale switcher
i18n/                  # translations + provider
utils/                 # image & face helpers
store/                 # zustand state
pages/                 # routed pages (Home, Terms, Privacy)
public/api/counter.php # simple JSON counter service
```

## 🛠 Configuration

- Change polling interval: `COUNTER_POLL_INTERVAL` in `LiveCounters.tsx`
- Add anonymization modes: extend logic in `imageProcessing.ts`
- Edit CSP / meta: `index.html`

## 📏 Accessibility

- Gradient text uses sufficient contrast backgrounds
- Tab focus retained on interactive elements
- Semantic button usage for actions

## 🧪 Ideas / Roadmap

- Batch processing (multi‑image queue)
- Box edge refinement (smart padding)
- Drag to reposition existing boxes
- Optional download quality selector
- Service worker for offline usage

## 🔐 Security

See `SECURITY.md` for reporting guidelines. No external image uploads occur; any discovered data exfil path is high severity.

## 🤖 Models & Licenses

See `MODEL-LICENSES.md` for bundled model attribution (BlazeFace, MediaPipe). Apache 2.0 notices are aggregated in `NOTICE`.

## 👤 Author

Maintained by **Łukasz Kosma (Alien)**  
GitHub: https://github.com/pearpl  
Website: https://www.pear.pl  

## ☕ Support

If this project saved you time or helped protect privacy you can support development:

[![Buy Me a Coffee](public/images/buymecoffee.png)](https://buymeacoffee.com/alienatedalien)

Funds help cover maintenance, new features, performance work, and additional privacy tooling.

## 📝 License

MIT. See `LICENSE` for full text.

---

Happy anonymizing! Contributions & improvements welcome.
