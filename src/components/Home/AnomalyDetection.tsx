import { useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { QuickAlertModal } from './QuickAlertModal';

interface AnomalyItem {
  severity: 'critical' | 'warning';
  title: string;
  context: string;
  impactValue: string;
  impactColor: string;
  source: string;
  product: string;
  location: string;
  week: string;
  dollarValue: string | null;
  casesValue: string;
}

const anomalies: AnomalyItem[] = [
  {
    severity: 'critical',
    title: 'Loose Case Shipping',
    context: '442 instances · Braintree DC · Week 08x1',
    impactValue: '$362K',
    impactColor: 'text-[#D32F2F]',
    source: 'Damages',
    product: 'Product 1234',
    location: 'Braintree DC',
    week: 'Week 08x1',
    dollarValue: '$362K',
    casesValue: '15.16K cases',
  },
  {
    severity: 'critical',
    title: 'Multiple Batch Risk',
    context: '3 batches · Product 1234 · Braintree DC',
    impactValue: '$275K',
    impactColor: 'text-[#D32F2F]',
    source: 'Damages',
    product: 'Product 1234',
    location: 'Braintree DC',
    week: 'Week 08x1',
    dollarValue: '$275K',
    casesValue: '15.16K cases',
  },
  {
    severity: 'warning',
    title: 'FEFO Misrotation',
    context: '52,765 units misrotated · All Plants',
    impactValue: '$742K',
    impactColor: 'text-[#E65100]',
    source: 'Stales',
    product: 'All Products',
    location: 'All Plants',
    week: 'This Week',
    dollarValue: '$742K',
    casesValue: '52,765 units',
  },
  {
    severity: 'warning',
    title: 'Discontinued Exposure',
    context: '298,315 units still active in stales pipeline',
    impactValue: '298K units',
    impactColor: 'text-slate-600',
    source: 'Stales',
    product: 'All Products',
    location: 'All Plants',
    week: 'YTD',
    dollarValue: null,
    casesValue: '298,315 units',
  },
  {
    severity: 'warning',
    title: 'High Forecast Gap',
    context: '2,607 units · Food 010',
    impactValue: '2,607 units',
    impactColor: 'text-slate-600',
    source: 'Stales',
    product: 'Food 010',
    location: 'All Plants',
    week: 'This Week',
    dollarValue: null,
    casesValue: '2,607 units',
  },
];

export function AnomalyDetection() {
  const navigate = useNavigate();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);

  const handleSendAlert = (anomaly: AnomalyItem) => {
    setSelectedAnomaly(anomaly);
    setAlertModalOpen(true);
  };

  const handleViewAnomaly = (anomaly: AnomalyItem) => {
    const targetPage = anomaly.source === 'Damages' ? '/damages' : '/stales';
    navigate(targetPage, {
      state: {
        anomaly: {
          title: anomaly.title,
          context: anomaly.context,
        },
      },
    });
  };

  return (
    <Tooltip.Provider>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
        <div className="bg-[#FFF3E0] px-5 py-3 border-b-2 border-[#F5A623] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#F5A623]" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Anomaly Detection</h3>
              <p className="text-[11px] text-slate-600">Flagged from Stales and Damages</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-red-600 text-white text-[11px] font-medium rounded-full">
            5 Active Anomalies
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {anomalies.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-4 py-3 border-b border-[#EEEEEE] ${
                item.severity === 'critical' ? 'bg-[rgba(211,47,47,0.04)]' : ''
              }`}
              style={{ minHeight: '52px' }}
            >
              {/* Left Zone */}
              <div className="flex items-start gap-2.5 flex-1">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                    item.severity === 'critical' ? 'bg-[#D32F2F]' : 'bg-[#E65100]'
                  }`}
                ></div>
                <div>
                  <h4
                    className={`text-[13px] leading-tight mb-0.5 ${
                      item.severity === 'critical'
                        ? 'font-bold text-[#1A1A1A]'
                        : 'font-semibold text-[#3D3D3D]'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-tight">{item.context}</p>
                </div>
              </div>

              {/* Right Zone */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className={`text-[13px] font-semibold ${item.impactColor}`}>
                  {item.impactValue}
                </span>
                <button
                  onClick={() => handleSendAlert(item)}
                  className="p-1 hover:bg-blue-50 rounded transition-colors"
                  title="Send Alert"
                >
                  <Send className="w-4 h-4 text-[#BDBDBD] hover:text-[#1565C0]" />
                </button>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={() => handleViewAnomaly(item)}
                      className="text-[11px] text-[#1565C0] hover:text-[#1976D2] font-medium"
                    >
                      View
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md shadow-lg z-50"
                      sideOffset={5}
                    >
                      View in {item.source}
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs">
          <button className="text-[#1565C0] hover:text-[#1976D2] font-medium">
            All anomalies →
          </button>
          <span className="text-slate-500 text-[11px]">Last scanned: 5/5/2026 2:45 PM</span>
        </div>

        <QuickAlertModal
          open={alertModalOpen}
          onOpenChange={setAlertModalOpen}
          anomaly={selectedAnomaly}
        />
      </div>
    </Tooltip.Provider>
  );
}
