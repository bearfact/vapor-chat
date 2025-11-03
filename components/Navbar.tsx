'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  mode?: 'create' | 'join' | null;
  onModeChange?: (mode: 'create' | 'join') => void;
  showTabs?: boolean;
}

export default function Navbar({ mode, onModeChange, showTabs = true }: NavbarProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <nav className="bg-charcoal border-b border-accent-magenta/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <span className="text-2xl font-bold tracking-tight text-foreground group-hover:text-accent-magenta transition-colors duration-300">
                Vapor
              </span>
              <span className="text-2xl font-bold tracking-tight text-accent-lime">
                Chat
              </span>
              <div className="absolute -inset-1 bg-accent-magenta/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </Link>

          {isHomePage && showTabs && onModeChange && (
            <div className="flex gap-2">
              <button
                onClick={() => onModeChange('create')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  mode === 'create'
                    ? 'bg-accent-magenta text-background shadow-[0_0_15px_rgba(255,31,240,0.4)]'
                    : 'bg-background text-foreground border border-gray/30 hover:border-accent-magenta/50'
                }`}
              >
                Create a Room
              </button>
              <button
                onClick={() => onModeChange('join')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  mode === 'join'
                    ? 'bg-accent-cyan text-background shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                    : 'bg-background text-foreground border border-gray/30 hover:border-accent-cyan/50'
                }`}
              >
                Join a Room
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
