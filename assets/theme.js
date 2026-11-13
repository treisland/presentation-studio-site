(() => {
  const key = 'presentation-studio-docs-theme';
  const media = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const saved = localStorage.getItem(key);
    if (['light', 'dark', 'system'].includes(saved)) preference = saved;
  } catch {}
  const apply = () => {
    document.documentElement.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
  };
  apply();
  media.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.querySelector('#theme-preference');
    if (!selector) return;
    selector.value = preference;
    selector.addEventListener('change', () => {
      preference = selector.value;
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    });
  });
})();
