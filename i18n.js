/* ============================================================
   Alma — i18n (RU / EN)

   Strategy: BOTH translations live in the HTML (good for SEO,
   no flash of untranslated content). CSS hides the wrong one
   based on `html[lang]`. JS only sets the lang attribute.

   Markup options:
     1) Block / inline switch:
        <span class="i18n-en">English text</span>
        <span class="i18n-ru">Русский текст</span>

     2) Attribute swap (for short labels):
        <span data-en="Pricing" data-ru="Тарифы">Pricing</span>

   Detection priority:
     1. localStorage `alma.lang` (the user's last manual choice)
     2. URL `?lang=ru|en`
     3. `navigator.language` first 2 chars
     4. Default `en`
   ============================================================ */
(function () {
  const KEY = 'alma.lang';
  const SUPPORTED = ['en', 'ru'];

  function detect() {
    try {
      const url = new URLSearchParams(location.search).get('lang');
      if (url && SUPPORTED.includes(url)) return url;
      const saved = localStorage.getItem(KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch {}
    const nav = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : 'en';
  }

  function applyAttributeSwaps(lang) {
    document.querySelectorAll('[data-en][data-ru]').forEach(el => {
      const v = el.dataset[lang];
      if (v != null) el.textContent = v;
    });
    // Update placeholders / titles too
    document.querySelectorAll('[data-en-ph][data-ru-ph]').forEach(el => {
      el.setAttribute('placeholder', el.dataset[lang + 'Ph']);
    });
    document.querySelectorAll('[data-en-title][data-ru-title]').forEach(el => {
      el.setAttribute('title', el.dataset[lang + 'Title']);
    });
  }

  window.setLang = function (lang) {
    if (!SUPPORTED.includes(lang)) lang = 'en';
    document.documentElement.lang = lang;
    try { localStorage.setItem(KEY, lang); } catch {}
    applyAttributeSwaps(lang);
    // Update any visible language toggles
    document.querySelectorAll('[data-lang-btn]').forEach(b => {
      b.classList.toggle('active', b.dataset.langBtn === lang);
    });
    window.dispatchEvent(new CustomEvent('alma:lang', { detail: { lang } }));
  };

  // Apply ASAP so there's no flash. Re-applied at DOMContentLoaded for
  // elements that weren't yet parsed.
  const initial = detect();
  document.documentElement.lang = initial;
  document.addEventListener('DOMContentLoaded', () => window.setLang(initial));

  // Wire up clicks on any [data-lang-btn="ru|en"] element automatically.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang-btn]');
    if (btn) { e.preventDefault(); window.setLang(btn.dataset.langBtn); }
  });
})();
