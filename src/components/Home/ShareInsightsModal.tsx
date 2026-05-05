import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, FileText, ExternalLink } from 'lucide-react';

interface ShareInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareInsightsModal({ open, onOpenChange }: ShareInsightsModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[700px] max-h-[85vh] overflow-y-auto z-50">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                Share Insights
              </Dialog.Title>
              <p className="text-sm text-slate-600 mt-0.5">
                Pre-drafted by AI from this week's highlights — edit and send instantly
              </p>
            </div>
            <Dialog.Close className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-4">
            {/* To Field */}
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">To:</label>
              <div className="flex items-center gap-2 flex-wrap p-2 border border-slate-300 rounded-lg">
                <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                    MR
                  </span>
                  moni.roy@c5i.com
                </span>
                <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Recipient
                </button>
              </div>
            </div>

            {/* CC Field */}
            <div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                + Add CC
              </button>
            </div>

            {/* Subject Field */}
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">Subject:</label>
              <input
                type="text"
                defaultValue="C5i Weekly Briefing — AI Highlights | May 5, 2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">Message:</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm leading-relaxed"
                rows={12}
                defaultValue={`Hi team,\n\nHere are the key highlights from this week's waste management data:\n\n• Damages up 17.6% — Product 1234 at Braintree DC recorded 442 loose case shipping instances. Immediate review recommended.\n• Total Stales down 37.3% YoY — FEFO compliance improvements at Plant 3 and Plant 1 are driving positive results.\n• 5 anomalies flagged this week across Stales and Damages — see attached screenshots for details.\n• Total Waste at $2,588K, a 25.3% improvement vs 2025.\n\nPlease review the attached dashboard screenshots.\nBest,`}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">Attachments:</label>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Executive Summary
                </span>
                <span className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Stales
                </span>
                <span className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Damages
                </span>
              </div>
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Include AI insights summary: ON</span>
              </label>
            </div>
          </div>

          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-6 py-2.5 bg-[#1565C0] text-white rounded-lg hover:bg-[#1976D2] font-medium transition-colors"
            >
              Send Briefing
            </button>
            <button className="px-4 py-2.5 text-[#1565C0] hover:text-[#1976D2] font-medium flex items-center gap-1">
              Edit in full email client
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
