import { useEffect } from 'react';

/**
 * High-performance viewport scroll reveal hook.
 * - Automatically queries and observes target reveal elements.
 * - Adds '.is-revealed' class when elements enter the viewport.
 * - Immediately unobserves revealed elements (one-shot for 60/120fps performance).
 * - Instantly marks all elements revealed if user prefers reduced motion.
 * - Fallback: reveals all elements immediately if IntersectionObserver is unsupported.
 *
 * @param {Array} dependencies - Re-run when dependencies (e.g. data load) change
 */
export function useScrollReveal(dependencies = []) {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const selector = '.reveal-on-scroll, .reveal-fade-up, .reveal-scale, .reveal-stagger';

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll(selector).forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    const observeUnrevealed = () => {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el.classList.contains('is-revealed')) {
          observer.observe(el);
        }
      });
    };

    observeUnrevealed();

    // Observe newly inserted DOM nodes from async fetches or transitions
    let mutationObserver = null;
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        observeUnrevealed();
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, dependencies);
}

export default useScrollReveal;
