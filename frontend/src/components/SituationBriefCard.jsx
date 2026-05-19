import ConversationOpener from './ConversationOpener'
import DigitalSignalsSection from './DigitalSignalsSection'
import FieldSituationSection from './FieldSituationSection'
import GrowerScanFlags from './GrowerScanFlags'
import InventorySection from './InventorySection'

export default function SituationBriefCard({ brief }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          30-Second Situation Brief
        </span>
        <span className="text-xs text-gray-300">—</span>
        <span className="text-xs font-medium text-gray-500">{brief.tehsil}</span>
      </div>

      <ConversationOpener text={brief.conversation_opener} />

      <FieldSituationSection
        crop={brief.dominant_crop}
        stage={brief.current_stage}
        products={brief.recommended_products}
      />

      {brief.digital_signals && (
        <DigitalSignalsSection signals={brief.digital_signals} />
      )}

      <InventorySection items={brief.inventory} />

      <GrowerScanFlags flags={brief.grower_scan_flags} />
    </div>
  )
}
