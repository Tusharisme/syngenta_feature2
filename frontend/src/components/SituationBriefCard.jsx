import ConversationOpener from './ConversationOpener'
import DigitalSignalsSection from './DigitalSignalsSection'
import FieldSituationSection from './FieldSituationSection'
import GrowerScanFlags from './GrowerScanFlags'
import InventorySection from './InventorySection'

export default function SituationBriefCard({ brief }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 animate-fade-in">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          30-Second Situation Brief
        </span>
        <span className="text-xs text-gray-300">—</span>
        <span className="text-xs font-medium text-gray-500">{brief.tehsil}</span>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <ConversationOpener text={brief.conversation_opener} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <FieldSituationSection
          crop={brief.dominant_crop}
          stage={brief.current_stage}
          products={brief.recommended_products}
        />
      </div>

      {brief.digital_signals && (
        <div className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <DigitalSignalsSection signals={brief.digital_signals} />
        </div>
      )}

      <div className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <InventorySection items={brief.inventory} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
        <GrowerScanFlags flags={brief.grower_scan_flags} />
      </div>
    </div>
  )
}
