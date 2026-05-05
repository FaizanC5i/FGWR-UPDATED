import React, { useState } from 'react';
import { SituationStatusBar } from './SituationStatusBar';
import { AIKeyHighlightsNew } from './AIKeyHighlightsNew';
import { AnomalyDetection } from './AnomalyDetection';
import { ShareInsightsModal } from './ShareInsightsModal';
import { CustomizationDialog } from './CustomizationDialog';

const SupplyChainLanding: React.FC = () => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);

  return (
    <>
      <div className="h-[calc(100vh-5rem)] overflow-hidden">
        <div className="h-full flex flex-col p-6">
          {/* Situation Status Bar */}
          <div className="mb-4">
            <SituationStatusBar onConfigure={() => setCustomizationOpen(true)} />
          </div>

          {/* Main Content Body - 2 Columns */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left Column: AI Key Highlights - 58% */}
            <div className="flex-[58]">
              <AIKeyHighlightsNew onShareClick={() => setShareModalOpen(true)} />
            </div>

            {/* Right Column: Anomaly Detection - 42% */}
            <div className="flex-[42]">
              <AnomalyDetection />
            </div>
          </div>
        </div>
      </div>

      <ShareInsightsModal open={shareModalOpen} onOpenChange={setShareModalOpen} />
      <CustomizationDialog open={customizationOpen} onOpenChange={setCustomizationOpen} />
    </>
  );
};

export default SupplyChainLanding;