import { useEffect, useState, RefObject } from 'react';

interface UseInViewOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
}

export function useInView(
  ref: RefObject<Element>,
  options: UseInViewOptions = {}
): { isInView: boolean } {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      {
        threshold: options.threshold ?? 0,
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.threshold, options.root, options.rootMargin]);

  return { isInView };
}
