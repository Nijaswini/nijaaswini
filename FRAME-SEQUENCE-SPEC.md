# Pages for Sages — Cinematic 3D Character Turnaround Frame Specification

This specification outlines the technical and creative standards for the 300-frame turning sequence rendered in the author hero section of **NIJAASWINI**.

---

## 1. Sequence Overview

- **Subject:** Stylized 3D-illustrated author character modeled after author Nijaswini Nandru.
- **Reference Image:** `assets/images/nijaaswini-character.png` and reference photo `assets/images/author-portrait.jpg`.
- **Character Attributes:**
  - Young South Asian woman
  - Long, dark, wavy brown-black hair flowing naturally over shoulders
  - Black ruffled dress (flutter ruffled sleeves, modest neckline, tiered hem)
  - Dark green hardcover journal with delicate antique-gold botanical detailing
  - Warm, cinematic, golden-hour studio lighting
  - Serene, welcoming, literary expression

---

## 2. Animation Choreography & Motion Arc

The sequence represents a 10-second (300 frames @ 30 FPS) deliberate horizontal turn:

| Frame Range | Motion Phase | Pose & Gaze Description |
| :--- | :--- | :--- |
| **001 – 060** | **Initial Three-Quarter Pose** | Character is turned in a three-quarter angle, looking contemplative toward the background scenery / warm light. |
| **061 – 120** | **Initiation of Turn** | Her head begins to turn gently toward the viewer; hair drifts slightly with the motion. |
| **121 – 180** | **Neutral Resting Pose (Frame 150)** | Upper body, shoulders, and head align gracefully; eyes meet the viewer with a calm, welcoming warmth. |
| **181 – 240** | **Subtle Greeting / Shift** | Character subtly adjusts her journal hold, nodding slightly with a reassuring literary presence. |
| **241 – 300** | **Full Frontal Presence** | Steady, luminous gaze directly addressing the viewer, settling into complete emotional connection. |

---

## 3. Technical File Requirements

- **File Path:** `assets/frames/frame-{001..300}.webp`
- **File Format:** Modern WebP format (lossy quality 85–90% or lossless WebP).
- **Target Dimensions:** `1080 x 1920 px` (9:16 vertical) or `1200 x 1600 px` (3:4 ratio).
- **Naming Pattern:** Zero-padded 3-digit numbering (`frame-001.webp`, `frame-002.webp`, ..., `frame-300.webp`).
- **File Size Budget:** ~30 KB – 50 KB per frame (total package ~9 MB – 15 MB).

---

## 4. Engine Integration

The website's HTML5 Canvas scrubbing engine (`js/scrub-engine.js`) is pre-wired to:
1. Instantly display `assets/images/nijaaswini-character.png` on initial page render (zero blank flash).
2. Probe `assets/frames/frame-001.webp`.
3. If detected, progressively stream all 300 frames in background batches while the user interacts.
4. Scrub frames smoothly based on horizontal mouse movement or touch drag with eased interpolation (`lerp`).
5. Ease back to neutral Frame 150 upon idle timeout (1500ms).
6. Gracefully fall back to interactive dynamic poster art when frames are pending.
