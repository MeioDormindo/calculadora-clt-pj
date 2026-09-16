import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target: number, duration = 420): number {
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    if (reducedMotion) return;

    const from = currentRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;
      currentRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reducedMotion]);

  return reducedMotion ? target : value;
}
