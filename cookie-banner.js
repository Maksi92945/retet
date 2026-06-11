/* ============================================================
   Alma — cookie / local-storage consent banner
   ------------------------------------------------------------
   Shows once per visitor on public pages. Alma uses only
   essential browser storage (no tracking pixels, no analytics),
   so the banner is informational + one-click acknowledge.

   If you later add analytics, change `MODE` to 'choice' so the
   banner offers Accept/Reject buttons.
   ============================================================ */
(function () {
  const KEY  = 'alma.cookie_consent';
  const MODE = 'info';   // 'info' (one OK button)  |  'choice' (Accept / Reject)
  const POLICY_URL = '/cookies.html';

  // Suppress on auth-walled pages and on the policy page itself.
  const path = location.pathname.toLowerCase();
  if (/(app|admin|cookies)\.html?$/i.test(path)) return;

  // Already answered? Don't re-prompt.
  try { if (localStorage.getItem(KEY)) return; } catch { return; }

  // Wait for DOM
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {
    const style = document.createElement('style');
    style.textContent = `
      #alma-cookie-banner {
        position: fixed;
        left: 14px; bottom: 14px;
        max-width: 380px;
        background: #FFFFFF;
        color: #0A0A0A;
        border: 1px solid rgba(10,10,10,0.10);
        border-radius: 14px;
        box-shadow:
          0 1px 2px rgba(10,10,10,0.04),
          0 18px 50px -20px rgba(15,69,48,0.25);
        font: 14px/1.5 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        padding: 16px 16px 14px;
        z-index: 9999;
        transform: translateY(140%);
        opacity: 0;
        transition: transform .45s cubic-bezier(0.32,0.72,0,1), opacity .35s ease-out;
      }
      #alma-cookie-banner.show { transform: translateY(0); opacity: 1; }
      #alma-cookie-banner .acb-head {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 500;
        color: #15583E;
        margin-bottom: 6px;
      }
      #alma-cookie-banner .acb-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #2D9E6E;
        box-shadow: 0 0 0 4px rgba(45,158,110,0.18);
      }
      #alma-cookie-banner p {
        margin: 0 0 12px;
        color: rgba(10,10,10,0.65);
        font-size: 13px;
      }
      #alma-cookie-banner a {
        color: #15583E;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: rgba(21,88,62,0.4);
      }
      #alma-cookie-banner a:hover { text-decoration-color: #15583E; }
      #alma-cookie-banner .acb-actions {
        display: flex; gap: 8px;
      }
      #alma-cookie-banner button {
        font: inherit;
        font-weight: 500;
        font-size: 13px;
        padding: 8px 14px;
        border-radius: 8px;
        border: 0;
        cursor: pointer;
        transition: background-color .2s ease, color .2s ease, border-color .2s ease;
      }
      #alma-cookie-banner .acb-primary {
        background: #15583E;
        color: #FAFAFA;
      }
      #alma-cookie-banner .acb-primary:hover { background: #0F4530; }
      #alma-cookie-banner .acb-ghost {
        background: transparent;
        color: #0A0A0A;
        border: 1px solid rgba(10,10,10,0.18);
      }
      #alma-cookie-banner .acb-ghost:hover { border-color: #15583E; color: #15583E; }
      @media (prefers-reduced-motion: reduce) {
        #alma-cookie-banner { transition: none; }
      }
      @media (max-width: 480px) {
        #alma-cookie-banner { left: 10px; right: 10px; bottom: 10px; max-width: none; }
      }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'alma-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie notice');

    if (MODE === 'choice') {
      banner.innerHTML = `
        <div class="acb-head"><span class="acb-dot"></span> Cookies & storage</div>
        <p>
          Alma uses essential browser storage to keep you signed in.
          We may also use optional analytics to understand which features people use.
          <a href="${POLICY_URL}">Learn more</a>.
        </p>
        <div class="acb-actions">
          <button type="button" class="acb-primary" data-acb="accept">Accept all</button>
          <button type="button" class="acb-ghost"  data-acb="reject">Essential only</button>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <div class="acb-head"><span class="acb-dot"></span> Cookies & storage</div>
        <p>
          Alma uses only essential browser storage to keep you signed in and remember UI preferences.
          <strong>No third-party trackers, no advertising cookies.</strong>
          <a href="${POLICY_URL}">Learn more</a>.
        </p>
        <div class="acb-actions">
          <button type="button" class="acb-primary" data-acb="accept">Got it</button>
        </div>
      `;
    }

    document.body.appendChild(banner);
    // animate in
    requestAnimationFrame(() => banner.classList.add('show'));

    banner.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-acb]');
      if (!btn) return;
      const value = btn.dataset.acb === 'reject' ? 'essential' : 'all';
      try {
        localStorage.setItem(KEY, JSON.stringify({
          choice: value,
          at: new Date().toISOString(),
          version: 1
        }));
      } catch {}
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 500);
      // Dispatch event so analytics scripts (when you add any) can react.
      window.dispatchEvent(new CustomEvent('alma:consent', { detail: { choice: value } }));
    });
  });
})();
