import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X, Settings2, Eye } from 'lucide-react';
import { SuccessMessage } from './SuccessMessage';
import { PDFPreviewPanel } from './PDFPreviewPanel';

interface CustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomizationDialog({ open, onOpenChange }: CustomizationDialogProps) {
  const [cadence, setCadence] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [timezone, setTimezone] = useState('EST');
  const [recipients, setRecipients] = useState('moni.roy@c5i.com');
  const [includeScreenshots, setIncludeScreenshots] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAI, setIncludeAI] = useState(true);
  const [includeAnomalies, setIncludeAnomalies] = useState(true);
  const [outputFormat, setOutputFormat] = useState('Email summary');
  const [selectedPages, setSelectedPages] = useState({
    executiveSummary: true,
    stales: true,
    damages: true,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setShowSuccess(true);
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[880px] h-[580px] overflow-hidden flex flex-col z-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Customize Automated Summaries
                </Dialog.Title>
                <Dialog.Close className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-blue-600 border-b-2 border-blue-600 pb-1">
                  <Settings2 className="w-4 h-4" />
                  <span className="font-medium">Settings</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel - Settings */}
              <div className="w-[400px] border-r border-slate-200 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium text-slate-900 mb-2 block">Summary Cadence</label>
                    <div className="flex gap-2">
                      {(['Daily', 'Weekly', 'Monthly'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => setCadence(option)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            cadence === option
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-900 mb-2 block">Delivery Time</label>
                      <input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-900 mb-2 block">Time Zone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EST">EST</option>
                        <option value="CST">CST</option>
                        <option value="PST">PST</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-900 mb-2 block">Recipients</label>
                    <input
                      type="text"
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      placeholder="Email addresses (comma separated)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-900">Include Screenshots</label>
                      <Switch.Root
                        checked={includeScreenshots}
                        onCheckedChange={setIncludeScreenshots}
                        className="w-11 h-6 bg-slate-300 rounded-full data-[state=checked]:bg-blue-600 transition-colors"
                      >
                        <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5 shadow-sm" />
                      </Switch.Root>
                    </div>

                    {includeScreenshots && (
                      <div className="ml-4 space-y-2">
                        <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                          Select Pages to Capture
                        </div>
                        {[
                          { key: 'executiveSummary', label: 'Executive Summary' },
                          { key: 'stales', label: 'Stales' },
                          { key: 'damages', label: 'Damages' },
                        ].map((page) => (
                          <label key={page.key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedPages[page.key as keyof typeof selectedPages]}
                              onChange={(e) =>
                                setSelectedPages({ ...selectedPages, [page.key]: e.target.checked })
                              }
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{page.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-900">Include Charts</label>
                    <Switch.Root
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                      className="w-11 h-6 bg-slate-300 rounded-full data-[state=checked]:bg-blue-600 transition-colors"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5 shadow-sm" />
                    </Switch.Root>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-900">Include AI Insights</label>
                    <Switch.Root
                      checked={includeAI}
                      onCheckedChange={setIncludeAI}
                      className="w-11 h-6 bg-slate-300 rounded-full data-[state=checked]:bg-blue-600 transition-colors"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5 shadow-sm" />
                    </Switch.Root>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-900">Include Anomaly Recap</label>
                    <Switch.Root
                      checked={includeAnomalies}
                      onCheckedChange={setIncludeAnomalies}
                      className="w-11 h-6 bg-slate-300 rounded-full data-[state=checked]:bg-blue-600 transition-colors"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5 shadow-sm" />
                    </Switch.Root>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-900 mb-2 block">Output Format</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Email summary', 'PDF snapshot', 'Teams message'].map((format) => (
                        <button
                          key={format}
                          onClick={() => setOutputFormat(format)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            outputFormat === format
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Preview updates automatically as you change settings.
                  </p>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="bg-white border-t border-slate-200 p-4 flex gap-3 justify-end flex-shrink-0">
                  <Dialog.Close className="px-6 py-2 text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-200">
                    Cancel
                  </Dialog.Close>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save Automation
                  </button>
                </div>
              </div>

              {/* Right Panel - PDF Preview */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <PDFPreviewPanel
                  includeCharts={includeCharts}
                  includeAI={includeAI}
                  includeAnomalies={includeAnomalies}
                  includeScreenshots={includeScreenshots}
                  selectedPages={selectedPages}
                />
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <SuccessMessage visible={showSuccess} onComplete={handleSuccessComplete} />
    </>
  );
}
