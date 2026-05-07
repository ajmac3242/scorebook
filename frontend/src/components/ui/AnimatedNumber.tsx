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
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const startValue = prevValueRef.current;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(startValue + progress * (value - startValue));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        prevValueRef.current = value;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      prevValueRef.current = value;
    };
  }, [value, duration]);

  return <>{displayValue.toFixed(decimals)}</>;
};
