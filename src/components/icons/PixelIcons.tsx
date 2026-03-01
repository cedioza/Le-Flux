import React from 'react';

// Common SVG props
interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

export const PixelMistralLogo = ({ size = 24, className = '', ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`pixelated ${className}`}
        style={{ shapeRendering: 'crispEdges' }}
        {...props}
    >
        {/* 8-bit Mistral 'M' shape composed of rects */}
        <rect x="2" y="6" width="4" height="14" />
        <rect x="6" y="6" width="4" height="4" />
        <rect x="10" y="10" width="4" height="4" />
        <rect x="14" y="6" width="4" height="4" />
        <rect x="18" y="6" width="4" height="14" />
    </svg>
);

export const PixelRobot = ({ size = 24, className = '', ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`pixelated ${className}`}
        style={{ shapeRendering: 'crispEdges' }}
        {...props}
    >
        {/* 8-bit Robot Head */}
        <rect x="8" y="2" width="8" height="2" />
        <rect x="11" y="4" width="2" height="4" />
        <rect x="4" y="8" width="16" height="12" rx="0" />
        {/* Eyes */}
        <rect x="7" y="11" width="3" height="3" fill="#0A0A0A" />
        <rect x="14" y="11" width="3" height="3" fill="#0A0A0A" />
        {/* Mouth */}
        <rect x="8" y="16" width="8" height="2" fill="#0A0A0A" />
        {/* Antennas side */}
        <rect x="2" y="12" width="2" height="4" />
        <rect x="20" y="12" width="2" height="4" />
    </svg>
);

export const PixelEye = ({ size = 24, className = '', ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`pixelated ${className}`}
        style={{ shapeRendering: 'crispEdges' }}
        {...props}
    >
        {/* 8-bit Eye */}
        <rect x="6" y="6" width="12" height="2" />
        <rect x="4" y="8" width="2" height="2" />
        <rect x="18" y="8" width="2" height="2" />
        <rect x="2" y="10" width="2" height="4" />
        <rect x="20" y="10" width="2" height="4" />
        <rect x="4" y="14" width="2" height="2" />
        <rect x="18" y="14" width="2" height="2" />
        <rect x="6" y="16" width="12" height="2" />

        {/* Pupil */}
        <rect x="10" y="10" width="4" height="4" fill="#0A0A0A" />
    </svg>
);

export const PixelDocument = ({ size = 24, className = '', ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`pixelated ${className}`}
        style={{ shapeRendering: 'crispEdges' }}
        {...props}
    >
        {/* 8-bit Document */}
        <rect x="5" y="3" width="10" height="2" />
        <rect x="15" y="5" width="2" height="2" />
        <rect x="17" y="7" width="2" height="14" />
        <rect x="5" y="21" width="12" height="2" />
        <rect x="3" y="5" width="2" height="16" />

        {/* Fold */}
        <rect x="15" y="3" width="2" height="2" />
        <rect x="17" y="5" width="2" height="2" />
        <rect x="13" y="5" width="2" height="4" />
        <rect x="15" y="7" width="2" height="2" />

        {/* Lines */}
        <rect x="7" y="9" width="6" height="2" />
        <rect x="7" y="13" width="8" height="2" />
        <rect x="7" y="17" width="6" height="2" />
    </svg>
);

export const PixelTerminal = ({ size = 24, className = '', ...props }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`pixelated ${className}`}
        style={{ shapeRendering: 'crispEdges' }}
        {...props}
    >
        {/* 8-bit Terminal Screen */}
        <rect x="2" y="4" width="20" height="16" />
        {/* Content block */}
        <rect x="4" y="6" width="16" height="12" fill="#0A0A0A" />
        {/* Prompt caret */}
        <rect x="6" y="8" width="2" height="2" fill="currentColor" />
        <rect x="8" y="10" width="2" height="2" fill="currentColor" />
        <rect x="6" y="12" width="2" height="2" fill="currentColor" />
        {/* Blinking cursor */}
        <rect x="11" y="12" width="4" height="2" fill="currentColor" />
    </svg>
);
