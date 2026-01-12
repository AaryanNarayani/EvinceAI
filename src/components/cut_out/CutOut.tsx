import { useState, useEffect } from "react";

interface CutOutProps {
  cutoutHeight?: number;
  cutoutWidth?: number;
  fillColor?: string;
  opacity?: number;
  className?: string;
}

interface CutOutProps {
  cutoutHeight?: number;
  cutoutWidth?: number;
  fillColor?: string;
  opacity?: number;
  className?: string;
}

function CutOut({
  cutoutHeight = 120,
  cutoutWidth = 550,
  fillColor = "white",
  opacity = 0.05,
  className = "",
}: CutOutProps) {
  const [dimensions, setDimensions] = useState({
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 700,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1000,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateClipPath = (height: number, width: number) => {
    const { viewportHeight, viewportWidth } = dimensions;
    
    const cutoutHeightPercent = height / viewportHeight;
    const cutoutWidthPercent = width / viewportWidth;
    const centerOffset = cutoutWidthPercent / 2;
    
    const cornerRadius = 0.02;
    const notchRadius = 0.02;
    
    const cutoutStart = 1 - cutoutHeightPercent;
    
    return `M ${cornerRadius},0
            L ${1 - cornerRadius},0
            Q 1,0 1,${cornerRadius}
            L 1,0.98
            Q 1,1 ${1 - cornerRadius},1
            L ${0.5 + centerOffset + cornerRadius},1
            Q ${0.5 + centerOffset},1 ${0.5 + centerOffset},${1 - cornerRadius}
            L ${0.5 + centerOffset},${cutoutStart + notchRadius}
            Q ${0.5 + centerOffset},${cutoutStart} ${0.5 + centerOffset - notchRadius},${cutoutStart}
            L ${0.5 - centerOffset + notchRadius},${cutoutStart}
            Q ${0.5 - centerOffset},${cutoutStart} ${0.5 - centerOffset},${cutoutStart + notchRadius}
            L ${0.5 - centerOffset},${1 - cornerRadius}
            Q ${0.5 - centerOffset},1 ${0.5 - centerOffset - cornerRadius},1
            L ${cornerRadius},1
            Q 0,1 0,0.98
            L 0,${cornerRadius}
            Q 0,0 ${cornerRadius},0
            Z`;
  };
  
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      <defs>
        <clipPath id="curvedClip" clipPathUnits="objectBoundingBox">
          <path d={generateClipPath(cutoutHeight, cutoutWidth)} />
        </clipPath>
      </defs>
      <rect
        fill={fillColor}
        opacity={opacity}
        clipPath="url(#curvedClip)"
        width="1"
        height="1"
      />
    </svg>
  );
}

export default CutOut;