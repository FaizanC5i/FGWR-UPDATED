import { TrendingUp, TrendingDown, Settings } from 'lucide-react';

interface SituationStatusBarProps {
  onConfigure: () => void;
}

export function SituationStatusBar({ onConfigure }: SituationStatusBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-2.5 flex items-center justify-between min-h-[44px]">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <TrendingUp className="w-4 h-4" />
          Damages ▲17.6% Vs 2025
        </div>

        <div className="w-px h-5 bg-slate-300"></div>

        <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
          <TrendingDown className="w-4 h-4" />
          Stales ▼37.3% Vs 2025
        </div>

        <div className="w-px h-5 bg-slate-300"></div>

        <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
          <TrendingDown className="w-4 h-4" />
          Total Waste ▼25.3% Vs 2025
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">Auto Reporting</span>
        </div>
        <span className="px-2.5 py-1 bg-green-600 text-white text-[10px] font-semibold rounded-md uppercase tracking-wide">
          Active
        </span>
        <button
          onClick={onConfigure}
          className="px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
        >
          <Settings className="w-3.5 h-3.5" />
          Configure
        </button>
      </div>
    </div>
  );
}
