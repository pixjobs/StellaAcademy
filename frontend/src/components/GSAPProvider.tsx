'use client';

import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useLayoutEffect } from 'react';

// Register the GSAP plugin once when this component is imported
gsap.registerPlugin(ScrollToPlugin);

/**
 * This component handles the client-side registration of GSAP plugins.
 * It doesn't render any DOM elements itself.
 */
export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  // useLayoutEffect ensures this runs before the browser paints, but after the DOM is ready.
  // Although registration happens at import, this pattern is useful for more complex initializations.
  useLayoutEffect(() => {
    // You can add other client-side initializations here if needed.
    // For now, the registration above is sufficient.
  }, []);
  
  return <>{children}</>;
}