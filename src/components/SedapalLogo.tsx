import React from 'react';

interface SedapalLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'white'; // light bg, dark bg, or all-white
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SedapalLogo: React.FC<SedapalLogoProps> = ({
  className = '',
  variant = 'light',
  showText = true,
  size = 'md'
}) => {
  const heights = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16'
  };

  const primaryBlue = variant === 'dark' || variant === 'white' ? '#FFFFFF' : '#0070BA';
  const lightWaveBlue = variant === 'dark' || variant === 'white' ? '#93C5FD' : '#88C6EE';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 320 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heights[size]} w-auto object-contain`}
        aria-label="Logo SEDAPAL"
      >
        {/* SEDAPAL Lowercase Bold Text matching official typography */}
        {showText && (
          <g>
            <text
              x="160"
              y="74"
              textAnchor="middle"
              fill={primaryBlue}
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
              fontWeight="900"
              fontSize="68"
              letterSpacing="-2"
            >
              sedapal
            </text>
          </g>
        )}

        {/* 3 Parallel Wave Stripes from the official logo */}
        <g>
          {/* Top Wave (Primary Blue) */}
          <path
            d="M 12 90 C 65 72, 115 72, 175 87 C 235 102, 280 94, 305 76 L 305 87 C 275 106, 230 114, 175 99 C 115 84, 65 84, 12 102 Z"
            fill={primaryBlue}
          />
          
          {/* Middle Wave (Primary Blue) */}
          <path
            d="M 24 105 C 72 89, 120 89, 178 103 C 236 117, 285 110, 318 92 L 318 103 C 282 122, 234 129, 178 115 C 120 101, 72 101, 24 117 Z"
            fill={primaryBlue}
          />

          {/* Bottom Wave (Light Cyan / Sky Blue) */}
          <path
            d="M 38 120 C 82 106, 128 106, 182 119 C 238 132, 288 125, 328 108 L 328 119 C 285 137, 236 144, 182 131 C 128 118, 82 118, 38 132 Z"
            fill={lightWaveBlue}
          />
        </g>
      </svg>
    </div>
  );
};
