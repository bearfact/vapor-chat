export default function Footer() {
  return (
    <footer className="bg-charcoal border-t border-accent-cyan/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray">
              <span className="text-accent-magenta font-semibold">VaporWatch</span> Chat
            </p>
            <p className="text-xs text-gray/70 mt-1">
              Ephemeral conversations. Zero trace.
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs text-gray/70 tracking-wide uppercase">
              Make Them Say{' '}
              <span className="text-accent-lime font-bold text-sm relative inline-block">
                Whoa
                <span className="absolute inset-0 animate-pulse bg-accent-lime/20 blur-md -z-10"></span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
