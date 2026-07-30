'use client';

export const Logo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      className="mt-[8px] min-w-[60px] min-h-[60px]"
    >
      <defs>
        <linearGradient id="ta-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9114F6" />
          <stop offset="100%" stopColor="#00C6FF" />
        </linearGradient>
      </defs>
      <rect width="60" height="60" rx="14" fill="url(#ta-logo-gradient)" />
      <text
        x="30"
        y="42"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="30"
        fill="white"
      >
        TA
      </text>
    </svg>
  );
};
