import { animate } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}
