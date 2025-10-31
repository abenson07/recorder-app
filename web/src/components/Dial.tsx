import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box } from '@mui/material';

interface DialProps {
  isActive: boolean;
}

const Dial: React.FC<DialProps> = ({ isActive }) => {
  const [currentRotation, setCurrentRotation] = useState(45); // Default 45 degrees
  const animationRef = useRef<number | null>(null);
  const baseRotationRef = useRef<number>(45); // Starting rotation when animation begins
  const animationStartTimeRef = useRef<number | null>(null);
  const rotationSpeed = 180; // degrees per second

  const animate = useCallback((timestamp: number) => {
    if (animationStartTimeRef.current === null) {
      animationStartTimeRef.current = timestamp;
    }

    const elapsed = (timestamp - animationStartTimeRef.current) / 1000; // seconds
    const rotation = (baseRotationRef.current + elapsed * rotationSpeed) % 360;
    
    setCurrentRotation(rotation);

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isActive) {
      // Start animation from current position
      baseRotationRef.current = currentRotation;
      animationStartTimeRef.current = null; // Reset to capture new start time
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Stop animation smoothly
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Save current rotation as base for next time animation starts
      baseRotationRef.current = currentRotation;
      animationStartTimeRef.current = null;
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isActive, animate]);

  return (
    <Box
      component="img"
      src="/dial.svg"
      alt="Dial"
      sx={{
        width: '80%',
        height: '80%',
        objectFit: 'contain',
        transform: `rotate(${currentRotation}deg)`,
        transition: isActive ? 'none' : 'transform 300ms ease-in',
      }}
    />
  );
};

export default Dial;

