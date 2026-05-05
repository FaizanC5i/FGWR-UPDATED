import { ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIKeyHighlightsNewProps {
  onShareClick: () => void;
}

export function AIKeyHighlightsNew({ onShareClick }: AIKeyHighlightsNewProps) {
  const navigate = useNavigate();

  const insights = [
    {
      text: 'Damages have risen 17.6% this period to $889K, driven primarily by loose case shipping anomalies at Braintree DC. Product 1234 alone recorded 442 instances in Week 08x1 — the highest single contributor this week.',
      link: 'View in Damages',
      route: '/damages',
    },
    {
      text: 'Stales continue to improve, down 37.3% year-over-year to $1,699K. The reduction is concentrated in FEFO compliance gains across Plant 3 ($923K stales) and Plant 1 ($392K stales), though both plants remain the top two contributors to total waste.',
      link: 'View in Stales',
      route: '/stales',
    },
    {
      text: 'Total Waste stands at $2,588K this period, a 25.3% improvement vs 2025. However, the damage trajectory (↑17.6%) warrants attention as it offsets the stales improvement.',
      link: 'View in Executive Summary',
      route: '/analytics',
    },
  ];

  const handleLinkClick = (route: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(route);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      {/* Section Header with Blue Design System */}
      <div className="bg-[#E3F0FB] px-5 py-3 border-b-2 border-[#1565C0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#1565C0]" />
            <h3 className="font-semibold text-slate-900 text-sm">Key Highlights</h3>
            <span className="text-xs text-slate-500">· 4 insights</span>
            <span className="text-xs text-slate-500">· Powered by AI</span>
          </div>
          <button
            onClick={onShareClick}
            className="px-4 py-1.5 bg-[#1565C0] text-white rounded-full hover:bg-[#1976D2] font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            Share Insights
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Analyst Briefing Section */}
        <div className="px-5 py-4">
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1565C0] flex-shrink-0 mt-2"></div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 leading-relaxed mb-1">
                    {insight.text.split(/(\d+\.?\d*%|\$[\d,]+K?|Product \d+|Plant \d+|Week \d+x?\d*|442 instances|Braintree DC)/).map((part, i) => {
                      const isBold = /(\d+\.?\d*%|\$[\d,]+K?|Product \d+|Plant \d+|Week \d+x?\d*|442 instances|Braintree DC)/.test(part);
                      return isBold ? <strong key={i} className="font-semibold">{part}</strong> : <span key={i}>{part}</span>;
                    })}
                  </p>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(insight.route, e)}
                    className="text-[11px] text-slate-500 hover:text-[#1565C0] hover:underline cursor-pointer"
                  >
                    → {insight.link}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
