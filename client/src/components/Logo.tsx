import { FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg
        className={`${sizeClasses[size]} text-primary-600`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L8 6.5M12 2L16 6.5M8 6.5C5 6.5 2.5 9 2.5 12C2.5 15 5 17.5 8 17.5M16 6.5C19 6.5 21.5 9 21.5 12C21.5 15 19 17.5 16 17.5M8 17.5C8 19.5 9.5 22 12 22C14.5 22 16 19.5 16 17.5M8 17.5H16" />
      </svg>
      <h1 className={`font-bold text-primary-800 ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'}`}>
        Cannathrive
      </h1>
    </div>
  );
};

export default Logo;
