import ConversationOpener from './ConversationOpener'
import DigitalSignalsSection from './DigitalSignalsSection'
import FieldSituationSection from './FieldSituationSection'
import GrowerScanFlags from './GrowerScanFlags'
import InventorySection from './InventorySection'

export default function SituationBriefCard({ brief }) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-600 uppercase tracking-widest">
        30-Second Situation Brief — {brief.tehsil}
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
