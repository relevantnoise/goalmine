import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface CanonicalHeadProps {
  title?: string;
  description?: string;
}

export const CanonicalHead = ({ title, description }: CanonicalHeadProps) => {
  const location = useLocation();

  useEffect(() => {
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    
    const currentUrl = `https://goalmine.ai${location.pathname}${location.hash}`;
    canonical.setAttribute('href', currentUrl);

    // Update title if provided
    if (title) {
      document.title = title;
    }

    // Update description if provided
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }

    return () => {
      // Cleanup is handled by next route
    };
  }, [location.pathname, location.hash, title, description]);

  return null; // This component doesn't render anything
};