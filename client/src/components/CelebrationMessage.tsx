import { FC, useEffect, useState } from 'react';
import { MilestoneType } from '@/contexts/CelebrationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationMessageProps {
  milestone: MilestoneType | null;
  onClose: () => void;
  duration?: number; // Duration in ms
}

const CelebrationMessage: FC<CelebrationMessageProps> = ({
  milestone,
  onClose,
  duration = 4000
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (milestone) {
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [milestone, duration, onClose]);
  
  // Get celebratory message based on milestone type
  const getMessage = (milestone: MilestoneType): { title: string; message: string } => {
    switch (milestone) {
      case 'account_created':
        return {
          title: 'Welcome aboard!',
          message: 'You successfully created your account. Time to explore!'
        };
      case 'first_login':
        return {
          title: 'Welcome back!',
          message: 'Great to see you again. Ready to discover new strains?'
        };
      case 'strain_selected':
        return {
          title: 'Great choice!',
          message: 'You\'ve selected your first strain. Now let\'s find where to get it!'
        };
      case 'strain_saved':
        return {
          title: 'Added to favorites!',
          message: 'This strain has been added to your saved collection.'
        };
      case 'dispensary_found':
        return {
          title: 'Success!',
          message: 'We found dispensaries near you with your selected strains.'
        };
      case 'tutorial_completed':
        return {
          title: 'Tutorial completed!',
          message: 'You\'re all set to make the most of our app!'
        };
      case 'preferences_saved':
        return {
          title: 'Preferences saved!',
          message: 'Your experience will now be personalized to your taste.'
        };
      default:
        return {
          title: 'Congratulations!',
          message: 'You\'ve reached a new milestone!'
        };
    }
  };
  
  if (!milestone) return null;
  
  const { title, message } = getMessage(milestone);
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-1">{title}</h3>
            <p>{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationMessage;