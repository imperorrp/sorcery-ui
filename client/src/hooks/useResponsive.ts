/**
 * useResponsive Hook
 * 
 * High-level responsive design hook that provides semantic breakpoint states.
 * Built on top of useMediaQuery to provide commonly-used screen size classifications.
 * 
 * Breakpoints:
 * - mobile: < 768px (phones)
 * - tablet: 768px - 1024px (tablets, small laptops)
 * - desktop: > 1024px (laptops, desktops)
 * - wide: > 1536px (large monitors, ultra-wide screens)
 * 
 * @returns {Object} Responsive state object with boolean flags for each breakpoint
 * @returns {boolean} isMobile - True on mobile devices (< 768px)
 * @returns {boolean} isTablet - True on tablet devices (768px - 1024px)
 * @returns {boolean} isDesktop - True on desktop devices (> 1024px)
 * @returns {boolean} isWide - True on wide screens (> 1536px)
 * @returns {'mobile' | 'tablet' | 'desktop' | 'wide'} currentBreakpoint - Current active breakpoint
 * @returns {boolean} isTouchDevice - True if device supports touch
 * 
 * @example
 * const { isMobile, isDesktop, currentBreakpoint } = useResponsive();
 * 
 * return (
 *   <div>
 *     {isMobile && <MobileLayout />}
 *     {isDesktop && <DesktopLayout />}
 *   </div>
 * );
 */

import { useMediaQuery } from './useMediaQuery';
import { useMemo } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide';
  isTouchDevice: boolean;
}

export function useResponsive(): ResponsiveState {
  // Define breakpoint queries
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isWide = useMediaQuery('(min-width: 1536px)');

  // Detect touch device
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Determine current breakpoint (priority: mobile > tablet > desktop > wide)
  const currentBreakpoint = useMemo((): 'mobile' | 'tablet' | 'desktop' | 'wide' => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isWide) return 'wide';
    return 'desktop';
  }, [isMobile, isTablet, isWide]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    currentBreakpoint,
    isTouchDevice,
  };
}
