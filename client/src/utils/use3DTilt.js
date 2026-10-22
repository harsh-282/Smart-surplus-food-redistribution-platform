import { useRef, useEffect } from 'react';

/**
 * Lightweight Hook for smooth, subtle 3D tilt on pointer movement.
 * - Restrained maximum tilt (default: 4.5 degrees)
 * - Uses requestAnimationFrame for 60/120fps smoothness
 * - Returns smoothly to 0deg when pointer leaves
 * - Automatically disabled on touch screens and if prefers-reduced-motion is active
 * 
 * @param {Object} options
 * @param {number} [options.maxTilt=4] - Maximum tilt in degrees
 * @param {number} [options.perspective=1000] - CSS perspective in px
 * @param {number} [options.scale=1.015] - Slight scale on hover
 * @returns {React.RefObject}
 */
export function use3DTilt({ maxTilt = 4, perspective = 1000, scale = 1.015, enabled = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    // Check if device supports hover and doesn't prefer reduced motion
    const canHover = window.matchMedia('(hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || prefersReducedMotion) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovering = false;

    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';
    el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease';

    const updateTilt = () => {
      // Smooth interpolation (lerp) for fluid motion
      const ease = 0.12;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      if (isHovering) {
        el.style.transform = `perspective(${perspective}px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
      } else {
        el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      }

      // Keep running if there's significant delta
      if (isHovering || Math.abs(currentX) > 0.05 || Math.abs(currentY) > 0.05) {
        rafId = requestAnimationFrame(updateTilt);
      } else {
        el.style.transform = '';
      }
    };

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (restrained to maxTilt)
      targetX = -((y - centerY) / centerY) * maxTilt;
      targetY = ((x - centerX) / centerX) * maxTilt;

      if (!isHovering) {
        isHovering = true;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateTilt);
      }
    };

    const onMouseEnter = () => {
      isHovering = true;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTilt);
    };

    const onMouseLeave = () => {
      isHovering = false;
      targetX = 0;
      targetY = 0;
    };

    el.addEventListener('mousemove', onMouseMove, { passive: true });
    el.addEventListener('mouseenter', onMouseEnter, { passive: true });
    el.addEventListener('mouseleave', onMouseLeave, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.style.transform = '';
      el.style.transformStyle = '';
      el.style.willChange = '';
    };
  }, [maxTilt, perspective, scale, enabled]);

  return ref;
}

export default use3DTilt;
