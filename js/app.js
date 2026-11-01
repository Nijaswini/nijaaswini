/**
 * NIJAASWINI — Master Website Controller
 * Author: Nijaswini Nandru
 */

document.addEventListener('DOMContentLoaded', () => {
  const writings = Array.isArray(window.WRITINGS) ? window.WRITINGS : [];
  const placeholders = window.PLACEHOLDERS || {};

  // Elements
  const grid = document.getElementById('postGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filters = Array.from(document.querySelectorAll('.filter'));
  const modal = document.getElementById('readerModal');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  const writingCountBadge = document.getElementById('writingCountBadge');

  // State
  let activeFilter = 'All';
  let activePost = null;
  let scrubberController = null;

  // Path resolver for root vs subdirectory pages (/writings/, /about/, /contact/)
  const isSubdir = window.location.pathname.includes('/writings/') || 
                   window.location.pathname.includes('/about/') || 
                   window.location.pathname.includes('/contact/');

  function getAssetPath(filename) {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/')) {
      return filename;
    }
    const prefix = isSubdir ? '../assets/images/' : 'assets/images/';
    return prefix + filename;
  }

  // 1. Initialize Cinematic Character Scrubbing Engine
  const characterStage = document.getElementById('characterStage');
  const characterCanvas = document.getElementById('characterCanvas');
  const valFrame = document.getElementById('valFrame');
  const scrubStatus = document.getElementById('scrubStatus');

  if (characterStage && characterCanvas && window.CharacterScrubber) {
    scrubberController = window.CharacterScrubber.initScrubVideo({
      FRAME_SRC: 'assets/frames/frame-{fff}.webp',
      POSTER_SRC: 'assets/images/nijaaswini-hero.png',
      FRAME_COUNT: 300,
      FPS: 30,
      OBJECT_POSITION: 'center 8%',
      SENSITIVITY: 0.85,
      EASE: 0.12,
      IDLE_MS: 1500,
      NEUTRAL: 0.5,
      canvas: characterCanvas,
      container: characterStage,
      onStatusChange: (status) => {
        if (valFrame) {
          if (status.sequenceAvailable) {
            valFrame.textContent = `${status.frameIndex} / ${status.totalFrames}`;
          } else {
            valFrame.textContent = `Poster Reference (Pose ${status.frameIndex})`;
          }
        }
        if (scrubStatus) {
          if (status.isInteracting) {
            scrubStatus.textContent = 'Scrubbing ✦';
            scrubStatus.style.color = '#dfb55c';
          } else if (status.usingPoster) {
            scrubStatus.textContent = 'Ambient Dynamic ❧';
            scrubStatus.style.color = '#c4b9a8';
          } else {
            scrubStatus.textContent = 'Resting Pose';
            scrubStatus.style.color = '#c4b9a8';
          }
        }
      }
    });

    // Make scrubber globally accessible for debugging or external controls
    window.scrubber = scrubberController;
  }

  // 2. Format Date
  function formatDate(date) {
    if (!date) return 'A note from the author';
    return date;
  }

  // 3. Render Writings Cards
  function renderPosts() {
    if (!grid) return;

    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

    // Filter writings
    const filtered = writings.filter(post => {
      const matchCategory = (activeFilter === 'All') || (post.category === activeFilter);
      const searchBlob = `${post.title} ${post.category} ${post.excerpt} ${post.body}`.toLowerCase();
      const matchQuery = !query || searchBlob.includes(query);
      return matchCategory && matchQuery;
    });

    // Update count badge
    if (writingCountBadge) {
      const typeLabel = activeFilter === 'All' ? 'writing' : (activeFilter === 'Poetry' ? 'poem' : (activeFilter === 'Articles' ? 'article' : 'piece'));
      writingCountBadge.textContent = `Showing ${filtered.length} ${typeLabel}${filtered.length === 1 ? '' : 's'}`;
    }

    let html = '';

    // Render cards
    if (filtered.length > 0) {
      html += filtered.map((post, idx) => {
        const orderNum = String(post.order || idx + 1).padStart(2, '0');
        const imgSrc = getAssetPath(post.image || 'home-window.jpg');
        const fallbackSrc = getAssetPath('home-window.jpg');
        const typeNoun = post.category === 'Poetry' ? 'poem' : (post.category === 'Articles' ? 'article' : 'piece');
        return `
          <article class="post-card" data-category="${post.category}">
            <button class="post-card-btn" data-open="${post.id}" aria-label="Read ${escapeHTML(post.title)}">
              <div class="post-art">
                <img src="${imgSrc}" 
                     alt="${escapeHTML(post.imageAlt || post.title)}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${fallbackSrc}';">
                <span class="post-art-number">${orderNum}</span>
                <span class="post-art-category">${escapeHTML(post.category)}</span>
              </div>
              <div class="post-card-content">
                <p class="post-meta">
                  <span>${escapeHTML(post.category)}</span>
                  <span>·</span>
                  <span>${escapeHTML(formatDate(post.date))}</span>
                </p>
                <h3>${escapeHTML(post.title)}</h3>
                <p class="post-excerpt">${escapeHTML(post.excerpt)}</p>
                <span class="card-read-action">
                  Read complete ${typeNoun} <span aria-hidden="true">→</span>
                </span>
              </div>
            </button>
          </article>
        `;
      }).join('');
    }

    // Include designated placeholders when relevant category is active
    if (!query) {
      if (activeFilter === 'All' || activeFilter === 'Reflections') {
        if (placeholders.renewal) {
          html += `
            <div class="placeholder-card" id="renewal-placeholder">
              <span class="placeholder-badge">${escapeHTML(placeholders.renewal.status)}</span>
              <h3>${escapeHTML(placeholders.renewal.title)}</h3>
              <p>${escapeHTML(placeholders.renewal.note)}</p>
            </div>
          `;
        }
      }

      if ((activeFilter === 'All' || activeFilter === 'Articles') && !writings.some(w => w.category === 'Articles')) {
        if (placeholders.articles) {
          html += `
            <div class="placeholder-card" id="articles-placeholder">
              <span class="placeholder-badge">${escapeHTML(placeholders.articles.status)}</span>
              <h3>${escapeHTML(placeholders.articles.title)}</h3>
              <p>${escapeHTML(placeholders.articles.note)}</p>
            </div>
          `;
        }
      }
    }

    grid.innerHTML = html;

    if (emptyState) {
      const hasAnyCards = filtered.length > 0 || (!query && (activeFilter === 'Articles' || activeFilter === 'Reflections'));
      emptyState.hidden = hasAnyCards;
    }
  }

  // 4. Dedicated Reader (Modal & Deep Linking)
  function openPost(post, updateHash = true) {
    if (!post || !modal) return;
    activePost = post;

    if (updateHash) {
      history.replaceState(null, '', `#writing-${post.id}`);
    }

    const orderNum = String(post.order || writings.indexOf(post) + 1).padStart(2, '0');
    document.getElementById('readerMeta').textContent = `${orderNum} · ${post.category.toUpperCase()} · ${formatDate(post.date).toUpperCase()} · ${post.readTime || '1 min read'}`;
    document.getElementById('readerTitle').textContent = post.title;
    document.getElementById('readerLead').textContent = post.excerpt || '';

    // Hero visual in reader
    const heroVisual = document.getElementById('readerVisual');
    if (heroVisual) {
      heroVisual.src = getAssetPath(post.image || 'home-window.jpg');
      heroVisual.alt = post.imageAlt || post.title;
      heroVisual.onerror = function() {
        this.onerror = null;
        this.src = getAssetPath('home-window.jpg');
      };
    }

    // Poem or Reflection text preservation
    const textContainer = document.getElementById('readerText');
    textContainer.replaceChildren();

    if (post.category === 'Poetry') {
      textContainer.className = 'poem-container';
      // Split into stanzas by double line breaks
      const stanzas = String(post.body || '').split(/\n\s*\n/);
      stanzas.forEach(stanza => {
        const stanzaEl = document.createElement('div');
        stanzaEl.className = 'poem-stanza';
        stanzaEl.textContent = stanza;
        textContainer.appendChild(stanzaEl);
      });
    } else {
      textContainer.className = 'reflection-container';
      const paragraphs = String(post.body || '').split(/\n\s*\n/);
      paragraphs.forEach(pText => {
        const p = document.createElement('p');
        p.style.marginBottom = '1.6rem';
        p.style.fontSize = '1.15rem';
        p.style.lineHeight = '1.85';
        p.textContent = pText;
        textContainer.appendChild(p);
      });
    }

    // Behind the Lines (Interpretation) Section
    const interpContainer = document.getElementById('readerInterpretation');
    interpContainer.replaceChildren();

    if (post.interpretation) {
      const interp = post.interpretation;
      const interpSection = document.createElement('div');
      interpSection.className = 'behind-the-lines';

      const kicker = document.createElement('p');
      kicker.className = 'behind-kicker';
      kicker.textContent = interp.kicker || 'Behind the Lines';
      interpSection.appendChild(kicker);

      const heading = document.createElement('h3');
      heading.textContent = interp.title;
      interpSection.appendChild(heading);

      const copyDiv = document.createElement('div');
      copyDiv.className = 'behind-copy';
      (interp.text || []).forEach(para => {
        const p = document.createElement('p');
        p.textContent = para;
        copyDiv.appendChild(p);
      });
      interpSection.appendChild(copyDiv);

      if (interp.reflectionPrompt) {
        const promptBox = document.createElement('div');
        promptBox.className = 'reflection-prompt-box';
        promptBox.innerHTML = `
          <b>A Thought for the Reader</b>
          <p>“${escapeHTML(interp.reflectionPrompt)}”</p>
        `;
        interpSection.appendChild(promptBox);
      }

      interpContainer.appendChild(interpSection);
    }

    // Prev / Next Navigation
    const currentIndex = writings.indexOf(post);
    const prevPost = currentIndex > 0 ? writings[currentIndex - 1] : null;
    const nextPost = currentIndex < writings.length - 1 ? writings[currentIndex + 1] : null;

    const navLinks = document.getElementById('readerNavLinks');
    if (navLinks) {
      navLinks.innerHTML = `
        ${prevPost ? `<button class="text-link" id="prevPostBtn">← ${escapeHTML(prevPost.title)}</button>` : '<span></span>'}
        ${nextPost ? `<button class="text-link" id="nextPostBtn">${escapeHTML(nextPost.title)} →</button>` : '<span></span>'}
      `;
      const prevBtn = document.getElementById('prevPostBtn');
      if (prevBtn) prevBtn.addEventListener('click', () => openPost(prevPost));
      const nextBtn = document.getElementById('nextPostBtn');
      if (nextBtn) nextBtn.addEventListener('click', () => openPost(nextPost));
    }

    // Standalone direct page link
    const directLink = document.getElementById('readerDirectLink');
    if (directLink) {
      directLink.href = isSubdir ? `${post.id}.html` : `writings/${post.id}.html`;
    }

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';
  }

  function closePost() {
    if (!modal) return;
    if (typeof modal.close === 'function') {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }
    document.body.style.overflow = '';
    if (location.hash.startsWith('#writing-')) {
      history.replaceState(null, '', '#writings');
    }
  }

  // Deep Link Handling
  function checkHash() {
    const hash = window.location.hash;
    const match = hash.match(/^#writing-(.+)$/);
    if (match) {
      const found = writings.find(item => item.id === match[1]);
      if (found) {
        openPost(found, false);
      }
    }
  }

  window.addEventListener('hashchange', checkHash);

  // 5. Featured Poem Read Button
  const featuredReadBtn = document.getElementById('featuredRead');
  if (featuredReadBtn) {
    featuredReadBtn.addEventListener('click', () => {
      const firstPoem = writings.find(p => p.id === 'the-last-dream') || writings[0];
      if (firstPoem) openPost(firstPoem);
    });
  }

  // 6. Category filters & Doorways
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter || 'All';
      filters.forEach(f => {
        const isMatch = f === btn;
        f.classList.toggle('active', isMatch);
        f.setAttribute('aria-pressed', String(isMatch));
      });
      renderPosts();
    });
  });

  document.querySelectorAll('[data-jump-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      const cat = link.dataset.jumpCategory;
      activeFilter = ['Poetry', 'Reflections', 'Articles'].includes(cat) ? cat : 'All';
      filters.forEach(f => {
        const isMatch = f.dataset.filter === activeFilter;
        f.classList.toggle('active', isMatch);
        f.setAttribute('aria-pressed', String(isMatch));
      });
      renderPosts();
    });
  });

  // 7. Search Input
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderPosts();
    });
  }

  // 8. Event Delegation for Post Clicks
  if (grid) {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open]');
      if (btn) {
        const postId = btn.dataset.open;
        const post = writings.find(p => p.id === postId);
        if (post) openPost(post);
      }
    });
  }

  // 9. Modal Close & Share
  const closeBtn = document.getElementById('closeReader');
  if (closeBtn) closeBtn.addEventListener('click', closePost);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closePost();
    });
    modal.addEventListener('cancel', () => {
      document.body.style.overflow = '';
      if (location.hash.startsWith('#writing-')) {
        history.replaceState(null, '', '#writings');
      }
    });
  }

  const shareBtn = document.getElementById('sharePiece');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (!activePost) return;
      const shareData = {
        title: `${activePost.title} — Nijaaswini`,
        text: activePost.excerpt || 'Thoughts that stay...',
        url: window.location.origin + window.location.pathname + `#writing-${activePost.id}`
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
          const orig = shareBtn.textContent;
          shareBtn.textContent = 'Link copied to clipboard ✓';
          setTimeout(() => { shareBtn.textContent = orig; }, 2400);
        } else {
          window.prompt('Copy direct link:', shareData.url);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          window.prompt('Copy direct link:', shareData.url);
        }
      }
    });
  }

  // 10. Theme Toggle
  const savedTheme = localStorage.getItem('nijaaswini-theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggle) themeToggle.textContent = '☼';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      themeToggle.textContent = isDark ? '☼' : '☾';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      localStorage.setItem('nijaaswini-theme', isDark ? 'dark' : 'light');
    });
  }

  // 11. Mobile Navigation Drawer
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isExpanded));
      siteNav.classList.toggle('nav-open', !isExpanded);
    });

    siteNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('nav-open');
      });
    });
  }

  // 12. Contact Form Direct Submission to pagesforsages@gmail.com
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value.trim();
      const email = document.getElementById('contactEmail')?.value.trim();
      const message = document.getElementById('contactMessage')?.value.trim();
      const subject = document.getElementById('contactSubject')?.value || 'A note from a reader';
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      if (!name || !email || !message) {
        formStatus.className = 'form-status-msg status-error';
        formStatus.textContent = 'Please complete all required fields before sending.';
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        formStatus.className = 'form-status-msg status-error';
        formStatus.textContent = 'Please provide a valid email address.';
        return;
      }

      formStatus.className = 'form-status-msg';
      formStatus.style.display = 'block';
      formStatus.textContent = 'Sending your note to Nijaswini...';
      if (submitBtn) submitBtn.disabled = true;

      fetch('https://formsubmit.co/ajax/pagesforsages@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          subject: subject,
          message: message,
          _subject: `NIJAASWINI Reader Note: ${subject}`
        })
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Network error');
      })
      .then(() => {
        formStatus.className = 'form-status-msg status-success';
        formStatus.innerHTML = `✦ Thank you, <strong>${escapeHTML(name)}</strong>! Your note has been delivered directly to Nijaswini at <strong>pagesforsages@gmail.com</strong>. She will read it with care and reply to ${escapeHTML(email)}.`;
        contactForm.reset();
      })
      .catch(() => {
        const mailtoUrl = `mailto:pagesforsages@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\n" + message)}`;
        formStatus.className = 'form-status-msg status-success';
        formStatus.innerHTML = `Note ready! To send directly from your email app, <a href="${mailtoUrl}" style="text-decoration: underline; font-weight: 600;">click here to email pagesforsages@gmail.com</a>.`;
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  // 13. Dynamic Year
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Helper Escape HTML
  function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Initial Render & Hash Check
  renderPosts();
  checkHash();
});
