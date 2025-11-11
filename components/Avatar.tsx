import React from 'react';
import { User } from '../types';

interface AvatarProps {
  user: Partial<User> | { displayName: string, photoURL?: string | null, email?: string };
  className?: string;
  title?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className = 'w-8 h-8', title }) => {
  const defaultTitle = user.displayName || user.email;
  
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'Avatar'}
        title={title || defaultTitle}
        className={`${className} rounded-full object-cover bg-white/20`}
      />
    );
  }

  const initial = user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';

  // Simple heuristic to dynamically set font size based on container width
  const widthClass = className.split(' ').find(c => c.startsWith('w-'));
  const widthValue = widthClass ? parseInt(widthClass.split('-')[1]) : 8;
  const fontSize = `${(widthValue / 2.5) * 0.25}rem`;

  return (
    <div
      title={title || defaultTitle}
      className={`${className} rounded-full bg-accent text-accent-text flex items-center justify-center font-bold select-none`}
      style={{ fontSize }}
    >
      {initial}
    </div>
  );
};

export default Avatar;
