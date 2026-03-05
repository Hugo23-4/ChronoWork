'use client';

import { useRef, useState } from 'react';

interface ReflectiveCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export default function ReflectiveCard({
  children,
  className = '',
  glowColor = 'rgba(37, 99, 235, 0.5)',
}: ReflectiveCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePos({ x, y });
  };

  return (
    <div
      ref={cardRef}
      className={`cw-reflective-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setGlarePos({ x: 50, y: 50 }); }}
    >
      <div className="cw-reflective-inner position-relative">
        {/* Glare sutil — sin rotación */}
        <div
          className="cw-reflective-glare"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glowColor}, transparent 65%)`,
            opacity: hovered ? 0.6 : 0,
          }}
        />
        <div className="cw-reflective-content position-relative">
          {children}
        </div>
      </div>
    </div>
  );
}
