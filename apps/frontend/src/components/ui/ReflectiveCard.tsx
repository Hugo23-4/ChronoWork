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
  glowColor = 'rgba(37, 99, 235, 0.6)',
}: ReflectiveCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * -10;
    const rotateY = ((x - midX) / midX) * 10;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotation({ x: rotateX, y: rotateY });
    setGlarePos({ x: glareX, y: glareY });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setRotation({ x: 0, y: 0 });
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <div
      ref={cardRef}
      className={`cw-reflective-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1200px' }}
    >
      <div
        className="cw-reflective-inner position-relative"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        <div
          className="cw-reflective-glare"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glowColor}, transparent 60%)`,
            opacity: hovered ? 0.9 : 0,
          }}
        />
        <div className="cw-reflective-content position-relative">
          {children}
        </div>
      </div>
    </div>
  );
}

