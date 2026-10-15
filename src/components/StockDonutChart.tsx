import React from 'react';

interface StockDonutChartProps {
  safe: number;
  warning: number;
  expired: number;
}

export const StockDonutChart: React.FC<StockDonutChartProps> = ({ safe, warning, expired }) => {
  const total = safe + warning + expired;

  if (total === 0) {
    return (
      <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">
        0
      </div>
    );
  }

  const radius = 26;
  const circumference = 2 * Math.PI * radius;

  const safePercent = safe / total;
  const warningPercent = warning / total;
  const expiredPercent = expired / total;

  const safeDash = safePercent * circumference;
  const warningDash = warningPercent * circumference;
  const expiredDash = expiredPercent * circumference;

  const safeOffset = 0;
  const warningOffset = -safeDash;
  const expiredOffset = -(safeDash + warningDash);

  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
        {/* Background track */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          className="stroke-slate-800"
          strokeWidth="7"
          fill="transparent"
        />
        {/* Safe slice (Green) */}
        {safe > 0 && (
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#10b981"
            strokeWidth="7"
            strokeDasharray={`${safeDash} ${circumference}`}
            strokeDashoffset={safeOffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500"
          />
        )}
        {/* Warning slice (Amber) */}
        {warning > 0 && (
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#f59e0b"
            strokeWidth="7"
            strokeDasharray={`${warningDash} ${circumference}`}
            strokeDashoffset={warningOffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500"
          />
        )}
        {/* Expired slice (Red) */}
        {expired > 0 && (
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#ef4444"
            strokeWidth="7"
            strokeDasharray={`${expiredDash} ${circumference}`}
            strokeDashoffset={expiredOffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs font-heading font-extrabold text-white leading-none">{total}</span>
        <span className="text-[7px] text-slate-400 uppercase tracking-tighter">SKU</span>
      </div>
    </div>
  );
};
