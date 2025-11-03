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
}

interface VaporizeEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export default function VaporizeEffect({ isActive, onComplete }: VaporizeEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Color palette matching the app theme
    const colors = [
      '#FF1FF0', // magenta
      '#C4FF1A', // lime
      '#00FFFF', // cyan
      '#FF4D00', // orange
    ];

    // Create particles from multiple explosion points
    const createExplosion = (x: number, y: number, particleCount: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 8 + 4;
        const life = Math.random() * 60 + 40;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          gravity: Math.random() * 0.1 + 0.05,
        });
      }
      return particles;
    };

    // Create multiple explosion points across the screen
    const explosionCount = 8;
    for (let i = 0; i < explosionCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particlesRef.current.push(...createExplosion(x, y, 30));
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Fade out effect instead of clear for trails
      ctx.fillStyle = 'rgba(13, 13, 13, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((particle) => {
        // Update particle physics
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.vx *= 0.99; // Air resistance
        particle.life--;

        // Calculate alpha based on remaining life
        const alpha = particle.life / particle.maxLife;

        // Draw particle with glow effect
        if (alpha > 0) {
          // Outer glow
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size + 4, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size + 4
          );
          gradient.addColorStop(0, particle.color + Math.floor(alpha * 128).toString(16).padStart(2, '0'));
          gradient.addColorStop(1, particle.color + '00');
          ctx.fillStyle = gradient;
          ctx.fill();

          // Inner particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
        }

        return particle.life > 0;
      });

      // Continue animation if particles remain
      if (particlesRef.current.length > 0) {
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
