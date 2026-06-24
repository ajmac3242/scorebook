import React, { useState, useEffect, useRef } from "react";

/**
 * Interface representing the props for the AnimatedNumber component.
 */
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
}

/**
 * Component that animates a number from 0 to its target value.
 *
 * @param {AnimatedNumberProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 500,
  decimals = 0,
}) => {
  const safeValue = value ?? 0;
  const [displayValue, setDisplayValue] = useState(safeValue);
  const prevValueRef = useRef(safeValue);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const startValue = prevValueRef.current ?? 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(startValue + progress * (safeValue - startValue));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        prevValueRef.current = safeValue;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      prevValueRef.current = safeValue;
    };
  }, [safeValue, duration]);

  return <span>{displayValue.toFixed(decimals)}</span>;
};
