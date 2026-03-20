import { cn } from '@/lib/utils';

function SpeedBars({ compact, tone }) {
  const bars = compact
    ? ['w-7', 'w-7', 'w-7']
    : ['w-10 sm:w-12', 'w-10 sm:w-12', 'w-10 sm:w-12'];

  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col justify-end', compact ? 'gap-1.5 pb-1' : 'gap-2 pb-2')}
    >
      {bars.map((width, index) => (
        <span
          // The real KTM mark uses three fast horizontal strokes before the wordmark.
          key={`${width}-${index}`}
          className={cn(
            'block -skew-x-[28deg] rounded-sm bg-gradient-to-r shadow-[0_4px_14px_rgba(182,133,31,0.18)]',
            width,
            compact ? 'h-[0.34rem]' : 'h-[0.42rem] sm:h-[0.48rem]',
            tone === 'dark'
              ? 'from-[#B6851F] via-[#E0BC58] to-[#F7D978]'
              : 'from-[#B6851F] via-[#D9B04B] to-[#F2D06A]'
          )}
        />
      ))}
    </div>
  );
}

export default function KtmWordmark({
  className,
  compact = false,
  tone = 'light',
  showSubtitle = true,
  subtitle = 'ထိုင်းမှ မြန်မာသို့ ယုံကြည်စိတ်ချရသော ဝန်ဆောင်မှု',
}) {
  return (
    <div className={cn('flex items-end gap-3', className)}>
      <SpeedBars compact={compact} tone={tone} />

      <div className="leading-none">
        <div
          aria-label="KTM"
          className={cn(
            'select-none font-black uppercase italic tracking-[-0.12em] text-transparent bg-clip-text',
            compact ? 'text-[2.3rem] sm:text-[2.7rem]' : 'text-[3.6rem] sm:text-[4.5rem]',
            tone === 'dark'
              ? 'bg-gradient-to-b from-[#F7E3A4] via-[#D9B04B] to-[#A87417]'
              : 'bg-gradient-to-b from-[#F2D06A] via-[#D4A63A] to-[#A77418]'
          )}
          style={{
            WebkitTextStroke:
              tone === 'dark'
                ? '1px rgba(252, 229, 163, 0.28)'
                : '1px rgba(120, 86, 19, 0.24)',
            textShadow:
              tone === 'dark'
                ? '0 10px 28px rgba(212, 166, 58, 0.18)'
                : '0 10px 24px rgba(182, 133, 31, 0.16)',
            fontFamily: "'Oswald', 'Bebas Neue', sans-serif",
          }}
        >
          KTM
        </div>

        {showSubtitle ? (
          <p
            className={cn(
              'mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em]',
              tone === 'dark' ? 'text-[#D8CCBC]' : 'text-[#7A6A57]'
            )}
          >
            Cargo Express
          </p>
        ) : null}

        {showSubtitle && subtitle ? (
          <p
            className={cn(
              'mt-1 text-xs sm:text-sm',
              tone === 'dark' ? 'text-[#E8DDC9]' : 'text-[#5B5147]'
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
