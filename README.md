# Happy New Year 🎆

A small, heartfelt, and interactive Happy New Year webpage made with love — no build steps, no dependencies, and optimized for modern desktop and mobile browsers.

What it does
- Festive night-sky animated background: gradient, stars, floating particles, and fireworks.
- Entrance animations: fade-in headline, slide-up message, and subtle background fireworks.
- Interactive surprise: Tap the "Tap for a Surprise 🎁" button to trigger confetti, fireworks burst, and glowing hearts.
- Animated year transition (previous year → next year) that uses the visitor's system date.
- Optional soft celebratory audio synthesized with WebAudio (Mute/Unmute toggle).
- Respect for user preferences (prefers-reduced-motion) and adaptive performance on mobile.

Files
- `index.html` — Main webpage
- `style.css` — Styling and animations
- `script.js` — Interactivity and visual effects
- `README.md` — This file and deployment instructions

Deployment (GitHub Pages)
1. Create a new public repository on GitHub or use an existing one.
2. Push these files to the repository's `main` branch root (`/`).
3. On GitHub, go to Settings → Pages.
4. Under "Build and deployment" choose "Source: Branch: main / Folder: / (root)" then Save.
5. Wait a minute and your page will be available at `https://<your-username>.github.io/<repo-name>/`.
6. Add that public URL to this README or any profile you like.

Notes & customization
- Audio is generated with the WebAudio API. If you'd prefer a specific MP3, replace or add an `<audio>` element and update `script.js` accordingly.
- For best performance, the script scales back particle counts on small devices.
- Respect user preference for reduced motion; animations are reduced if that preference is set.

License
- Use it freely and modify as you wish. If you share publically, a credit (optional) is appreciated.

Enjoy — I hope this brings a smile. If you'd like, I can push these files to a GitHub repository for you and enable Pages (please provide the repo owner/name).
