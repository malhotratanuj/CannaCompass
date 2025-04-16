import { FC, useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface ConfettiCelebrationProps {
  isActive: boolean;
  duration?: number; // Duration in ms
  onComplete?: () => void;
}

const ConfettiCelebration: FC<ConfettiCelebrationProps> = ({
  isActive,
  duration = 4000,
  onComplete
}) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      setShowConfetti(true);
      
      // Set timer to end the confetti
      const timer = setTimeout(() => {
        setShowConfetti(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, onComplete]);
  
  if (!showConfetti) return null;
  
  return (
    <ReactConfetti
      width={width}
      height={height}
      recycle={true}
      numberOfPieces={500}
      gravity={0.2}
    />
  );
};

export default ConfettiCelebration;