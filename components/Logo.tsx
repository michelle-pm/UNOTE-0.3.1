import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14 24C19.5228 24 24 19.5228 24 14C24 8.47715 19.5228 4 14 4C8.47715 4 4 8.47715 4 14C4 19.5228 8.47715 24 14 24Z"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <path
      d="M14 4C19.5228 4 24 8.47715 24 14C24 19.5228 19.5228 24 14 24V4Z"
      fill="currentColor"
    />
  </svg>
);

export default Logo;