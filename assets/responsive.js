(() => {
  // Keep text entry visible when the on-screen keyboard reduces the visual viewport.
  const viewport = window.visualViewport;
  function updateViewport() {
    const height = viewport ? viewport.height : window.innerHeight;
    const inset = viewport ? Math.max(0, window.innerHeight - height - viewport.offsetTop) : 0;
    document.documentElement.style.setProperty('--visible-height', `${height}px`);
    document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`);
  }
  updateViewport();
  window.addEventListener('resize', updateViewport);
  viewport?.addEventListener('resize', updateViewport);
  viewport?.addEventListener('scroll', updateViewport);
})();
