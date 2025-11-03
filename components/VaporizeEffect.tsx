'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

interface VaporizeEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export default function VaporizeEffect({ isActive, onComplete }: VaporizeEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Enhanced color palette with RGB values for better effects
    const colors = [
      { hex: '#FF1FF0', rgb: [255, 31, 240] }, // magenta
      { hex: '#C4FF1A', rgb: [196, 255, 26] }, // lime
      { hex: '#00FFFF', rgb: [0, 255, 255] },  // cyan
      { hex: '#FF4D00', rgb: [255, 77, 0] },   // orange
      { hex: '#FFFFFF', rgb: [255, 255, 255] }, // white for extra sparkle
    ];

    // Create a massive explosion from a single point
    const createExplosion = (x: number, y: number, particleCount: number, waveSpeed: number = 1) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
        const speed = (Math.random() * 15 + 8) * waveSpeed;
        const life = Math.random() * 80 + 60;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          color: color.hex,
          size: Math.random() * 6 + 3,
          gravity: Math.random() * 0.15 + 0.08,
          alpha: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
      return particles;
    };

    // Create screen-filling explosion pattern with multiple waves
    const createInitialExplosions = () => {
      const explosions: Particle[] = [];

      // Central mega explosion
      explosions.push(...createExplosion(canvas.width / 2, canvas.height / 2, 120, 1.5));

      // Corner explosions
      explosions.push(...createExplosion(canvas.width * 0.15, canvas.height * 0.15, 80, 1.2));
      explosions.push(...createExplosion(canvas.width * 0.85, canvas.height * 0.15, 80, 1.2));
      explosions.push(...createExplosion(canvas.width * 0.15, canvas.height * 0.85, 80, 1.2));
      explosions.push(...createExplosion(canvas.width * 0.85, canvas.height * 0.85, 80, 1.2));

      // Random scattered explosions
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        explosions.push(...createExplosion(x, y, 50, 1.0));
      }

      return explosions;
    };

    particlesRef.current = createInitialExplosions();
    frameCountRef.current = 0;

    // Animation loop with secondary waves
    const animate = () => {
      if (!ctx || !canvas) return;

      frameCountRef.current++;

      // Darker fade for more vibrant particles
      ctx.fillStyle = 'rgba(13, 13, 13, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add secondary wave explosions at specific frames
      if (frameCountRef.current === 15) {
        // Second wave
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particlesRef.current.push(...createExplosion(x, y, 60, 1.3));
        }
      }

      if (frameCountRef.current === 30) {
        // Third wave - smaller, faster particles
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particlesRef.current.push(...createExplosion(x, y, 40, 1.8));
        }
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        // Update particle physics
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.vx *= 0.98; // Air resistance
        particle.rotation += particle.rotationSpeed;
        particle.life--;

        // Calculate alpha with easing
        const lifeRatio = particle.life / particle.maxLife;
        particle.alpha = lifeRatio > 0.7 ? 1 : lifeRatio / 0.7;

        // Draw particle with enhanced glow effect
        if (particle.alpha > 0) {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);

          // Multiple glow layers for depth
          const glowLayers = 3;
          for (let i = glowLayers; i > 0; i--) {
            const glowSize = particle.size + (i * 8);
            const glowAlpha = particle.alpha * 0.3 / i;

            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            gradient.addColorStop(0, particle.color + Math.floor(glowAlpha * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, particle.color + '00');
            ctx.fillStyle = gradient;
            ctx.fill();
          }

          // Bright core with pulsing effect
          const pulse = 1 + Math.sin(frameCountRef.current * 0.1) * 0.2;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size * pulse, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
          ctx.shadowBlur = 20;
          ctx.shadowColor = particle.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Add sparkle for white particles
          if (particle.color === '#FFFFFF' && Math.random() > 0.7) {
            ctx.beginPath();
            ctx.moveTo(-particle.size * 2, 0);
            ctx.lineTo(particle.size * 2, 0);
            ctx.moveTo(0, -particle.size * 2);
            ctx.lineTo(0, particle.size * 2);
            ctx.strokeStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.restore();
        }

        return particle.life > 0;
      });

      // Continue animation if particles remain
      if (particlesRef.current.length > 0 || frameCountRef.current < 100) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (onComplete) {
          onComplete();
        }
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      particlesRef.current = [];
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
