# Pages for Sages — Master Author Website

**Author:** Nijaswini Nandru  
**Tagline:** “Thoughts that stay...”  
**Architecture:** Lightweight, zero-build vanilla static web application (HTML5, CSS3, JavaScript ES6+), fully compatible with free static hosting on Netlify Drop.

---

## 1. Quick Start & Local Preview

Because the website utilizes modern ES6 modules, canvas image rendering, and deep link hashes, running a lightweight local HTTP server is recommended for the best experience.

### Option A: Using Python (Built-in)
Open PowerShell or your command line in this folder and run:
```bash
python -m http.server 8000
```
Then visit [http://localhost:8000](http://localhost:8000) in any web browser.

### Option B: Using VS Code Live Server
1. Open the `nijaaswini` folder in Visual Studio Code.
2. Right-click `index.html` and select **Open with Live Server**.

### Option C: Direct Browser Open
Double-click `index.html` to open it in your browser.

---

## 2. Deploying to Netlify (Free Static Hosting)

The entire project is structured as a self-contained static site:

1. Visit [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this entire `nijaaswini/` directory directly into the Netlify upload window.
3. Netlify will generate an instant, free SSL HTTPS production URL (e.g. `https://nijaaswini.netlify.app`).
4. **Form Submissions:** The contact form is equipped with `data-netlify="true"`. All reader submissions will be recorded automatically under the **Forms** tab in your Netlify dashboard.

---

## 3. Project Architecture

```
nijaaswini/
│
├── index.html                   # Central immersive homepage
├── writings/
│   ├── index.html               # Complete writings library (search & category filters)
│   ├── the-last-dream.html      # Dedicated reading page for Poem 1
│   ├── stranger-in-the-mirror.html
│   ├── i-was-just-there.html    # Dedicated reading page (Author-approved meaning)
│   ├── the-waves-that-keep-me-bound.html # Dedicated reading page (Author-approved meaning)
│   ├── the-life-that-remained-sealed.html
│   ├── until-we-say-hello-again.html
│   ├── the-voices-we-slowly-forget.html
│   ├── reality.html
│   └── when-did-we-change.html
│
├── about/
│   └── index.html               # Dedicated About the Author page & biography
│
├── contact/
│   └── index.html               # Dedicated Contact page with validated form & guide
│
├── css/
│   └── styles.css               # Complete literary design system (light & warm dark themes)
│
├── js/
│   ├── app.js                   # Application coordinator, routing, modals, search, sharing
│   └── scrub-engine.js          # 60fps HTML5 Canvas character scrubbing engine
│
├── data/
│   ├── writings.js              # Master JavaScript content data object
│   └── writings.json            # Master JSON format for programmatic consumers
│
├── assets/
│   ├── images/                  # Character portrait, poem scenes, category doorways
│   │   ├── nijaaswini-character.png
│   │   ├── author-portrait.jpg
│   │   └── ...
│   └── frames/                  # Directory for sequential WebP frames (frame-001 to frame-300)
│
├── FRAME-SEQUENCE-SPEC.md       # Technical spec for 3D character turnaround frames
├── ADD-A-NEW-WRITING.md         # Guide for adding new poems, reflections, or articles
└── README.md                    # Project documentation & deployment manual
```

---

## 4. Literary Content & Poem Ordering

The poetry collection adheres strictly to the author-specified order:

1. **The Last Dream** — Mourning stolen childhood innocence in wartime.
2. **Stranger in the Mirror** — Identity shaped by time and searching for the child within.
3. **I Was Just There** — *Author-Approved Core Meaning:* An untold confession to someone the speaker loved; the ocean as infinity with suspended movement; waiting continuing beyond death.
4. **The Waves That Keep Me Bound** — *Author-Approved Core Meaning:* Waves representing recurring memories that both comfort and pain; tension between holding on and releasing to begin a new wave.
5. **The Life That Remained Sealed** — Unopened stories and hidden possibilities.
6. **Until We Say Hello Again** — Friendships fading quietly over time, leaving space for another hello.

### Reflections
- **The Voices We Slowly Forget** — The quiet cruelty of time erasing even voices.
- **Reality** — Moving past comparison to recognize individual uniqueness.
- **When Did We Change?** — Seven piercing questions on childhood vulnerability vs adulthood guard.
- **Renewal** — Identified author topic, marked with a clear manuscript placeholder.

### Articles
- Dedicated category with an editorial placeholder inviting readers back once the author's essays are published.

---

## 5. Cinematic Character Scrubbing Engine

- Implemented in `js/scrub-engine.js` with pure HTML5 Canvas and `requestAnimationFrame`.
- Supports horizontal mouse movement, touch dragging, eased lerp interpolation (`EASE = 0.12`), and automatic settling back to resting neutral pose (`NEUTRAL = 0.5`, Frame 150) after 1500ms of inactivity.
- Zero blank flash: paints the high-resolution poster `assets/images/nijaaswini-character.png` immediately on load.
- Seamlessly falls back to ambient dynamic canvas mode if the 300-frame sequence is pending generation.
