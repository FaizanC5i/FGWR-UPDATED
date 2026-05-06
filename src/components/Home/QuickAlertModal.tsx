import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import { SuccessMessage } from './SuccessMessage';

interface QuickAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anomaly: {
    severity: 'critical' | 'warning';
    title: string;
    product: string;
    location: string;
    week: string;
    dollarValue: string | null;
    casesValue: string;
    source: string;
  } | null;
}

export function QuickAlertModal({ open, onOpenChange, anomaly }: QuickAlertModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successDescription, setSuccessDescription] = useState('');

  if (!anomaly) return null;

  const handleSendEmailAlert = () => {
    setSuccessTitle('Email Alert Sent');
    setSuccessDescription('Your email alert has been sent successfully.');
    setShowSuccess(true);
  };

  const handleSendSmsAlert = () => {
    setSuccessTitle('SMS Alert Sent');
    setSuccessDescription('Your SMS alert has been sent successfully.');
    setShowSuccess(true);
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    onOpenChange(false);
  };

  const severityColors = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
  };

  const emailSubject = `⚠ Alert: ${anomaly.title} | ${anomaly.location}`;
  const emailMessage = `Hi team, an anomaly has been flagged on the C5i dashboard requiring your immediate attention:\n\nIssue: ${anomaly.title} at ${anomaly.location} (${anomaly.week}). ${anomaly.dollarValue ? `Damage cost: ${anomaly.dollarValue}.` : ''} Please review and take corrective action.\n\n— Sent via C5i Insights Snapshot`;

  const smsMessage = `C5i Alert: ${anomaly.title}, ${anomaly.location}. ${anomaly.dollarValue ? `Damage: ${anomaly.dollarValue}.` : ''} Action required. — C5i Dashboard`;
  const smsCharCount = smsMessage.length;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-[480px] max-h-[85vh] overflow-y-auto z-50">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${severityColors[anomaly.severity]}`}></div>
                <Dialog.Title className="font-bold text-slate-900">Send Alert</Dialog.Title>
              </div>
              <Dialog.Close className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <p className="text-sm text-slate-600 mb-6">{anomaly.title}</p>

            {/* Email Section */}
            <div className="mb-6">
              <label className="text-xs text-slate-500 uppercase tracking-wide mb-3 block">Email</label>

              <div className="mb-3">
                <label className="text-xs text-slate-700 mb-1.5 block">To:</label>
                <div className="flex items-center gap-2 flex-wrap p-2 border border-slate-300 rounded-lg">
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                      DC
                    </span>
                    DC Operations Team &lt;dc-ops@c5i.com&gt;
                  </span>
                  <button className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-700 mb-1.5 block">Subject:</label>
                <input
                  type="text"
                  value={emailSubject}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px]"
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-700 mb-1.5 block">Message:</label>
                <textarea
                  value={emailMessage}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-[13px] leading-relaxed"
                  rows={6}
                  readOnly
                />
              </div>

              <button
                onClick={handleSendEmailAlert}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                Send Email Alert
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-xs text-slate-500">or</span>
            </div>

            {/* SMS Section */}
            <div className="mb-6">
              <label className="text-xs text-slate-500 uppercase tracking-wide mb-3 block">SMS / Phone</label>

              <div className="mb-3">
                <label className="text-xs text-slate-700 mb-1.5 block">Phone Number:</label>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px]">
                    <option>+1</option>
                    <option>+44</option>
                    <option>+91</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px]"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-700 mb-1.5 block">Message Preview:</label>
                <div className="relative">
                  <textarea
                    value={smsMessage}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-[13px] leading-relaxed resize-none"
                    rows={3}
                    readOnly
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-slate-500">
                    {smsCharCount}/160
                  </span>
                </div>
              </div>

              <button
                onClick={handleSendSmsAlert}
                className="w-full px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 font-medium text-sm transition-colors"
              >
                Send SMS Alert
              </button>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-2">
                Alert will include anomaly details and a link to the {anomaly.source} page for full context.
              </p>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Customize template →
              </button>
            </div>
          </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <SuccessMessage
        visible={showSuccess}
        onComplete={handleSuccessComplete}
        title={successTitle}
        description={successDescription}
      />
    </>
  );
}
