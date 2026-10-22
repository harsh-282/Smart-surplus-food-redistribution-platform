import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Mobile-friendly touch & swipe carousel with desktop controls.
 * - Fully accessible with keyboard navigation and ARIA tags.
 * - Leaves vertical scrolling 100% natural (touch-action: pan-y).
 * - Smooth scroll-snap on mobile and tablet devices.
 * - Active dot indicator and prev/next arrow buttons.
 */
const SwipeableCarousel = ({
  items = [],
  renderItem,
  className = '',
  itemClassName = '',
  ariaLabel = 'Interactive carousel',
}) => {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Update navigation button and active dot state on scroll
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const scrollLeft = el.scrollLeft;
    const scrollWidth = el.scrollWidth - el.clientWidth;
    const itemWidth = el.firstElementChild ? el.firstElementChild.getBoundingClientRect().width : el.clientWidth;

    setCanScrollPrev(scrollLeft > 10);
    setCanScrollNext(scrollLeft < scrollWidth - 10);

    const newIndex = Math.round(scrollLeft / (itemWidth || 1));
    setActiveIndex(Math.min(Math.max(newIndex, 0), items.length - 1));
  }, [items.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const handleResize = () => handleScroll();
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScroll]);

  const scrollToIndex = (index) => {
    const el = trackRef.current;
    if (!el || !el.children[index]) return;

    const targetEl = el.children[index];
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveIndex(index);
  };

  const scrollPrev = () => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  };

  const scrollNext = () => {
    if (activeIndex < items.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      scrollPrev();
    } else if (e.key === 'ArrowRight') {
      scrollNext();
    }
  };

  return (
    <div
      className={`swipe-carousel-container ${className}`}
      role="region"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Navigation Arrows for Desktop / Tablet */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            className="swipe-nav-arrow swipe-nav-prev"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous slide"
            title="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="swipe-nav-arrow swipe-nav-next"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next slide"
            title="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Touch-Friendly Swipe Track */}
      <div ref={trackRef} className="swipe-track">
        {items.map((item, idx) => (
          <div key={idx} className={`swipe-item ${itemClassName}`}>
            {renderItem ? renderItem(item, idx) : item}
          </div>
        ))}
      </div>

      {/* Pagination Dot Indicators */}
      {items.length > 1 && (
        <div className="swipe-dots" aria-hidden="true">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`swipe-dot ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => scrollToIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              tabIndex={-1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeableCarousel;
