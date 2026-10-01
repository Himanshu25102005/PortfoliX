"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number | null;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  prefix = "",
  decimals = 2,
  duration = 700,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value ?? 0);
  const previousValue = useRef(value ?? 0);

  useEffect(() => {
    if (value === null) return;

    const startValue = previousValue.current;
    const endValue = value;

    if (startValue === endValue) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue =
        startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  if (value === null) {
    return <>N/A</>;
  }

  return (
    <>
      {prefix}
      {displayValue.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}