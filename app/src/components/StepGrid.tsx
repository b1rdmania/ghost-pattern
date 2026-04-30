import { useStore } from '../store'
import type { PatternDocument } from '../types'

const CELL_SIZE = 28
const CELL_GAP = 3
const LABEL_WIDTH = 72

const VELOCITY_COLORS = ['transparent', '#1e3a2a', '#2d6644', '#4ade80'] as const
const VELOCITY_BORDER = ['#2a2a2a', '#2a4a36', '#3a7a54', '#4ade80'] as const

interface Props {
  doc: PatternDocument
  onDocChange: (doc: PatternDocument) => void
}

export function StepGrid({ doc, onDocChange }: Props) {
  const currentStep = useStore(s => s.currentStep)
  const isPlaying = useStore(s => s.isPlaying)

  const totalSteps = doc.stepsPerBar * doc.bars

  function cycleVelocity(laneId: string, stepIndex: number) {
    const current = doc.steps[laneId][stepIndex]
    const next = (current + 1) % 4
    onDocChange({
      ...doc,
      steps: {
        ...doc.steps,
        [laneId]: doc.steps[laneId].map((v, i) => i === stepIndex ? next : v),
      },
      metadata: { ...doc.metadata, role: 'user-generated' },
    })
  }

  const stepsPerGroup = 4  // highlight every beat boundary

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'inline-block', minWidth: LABEL_WIDTH + totalSteps * (CELL_SIZE + CELL_GAP) }}>
        {doc.lanes.map(lane => (
          <div
            key={lane.id}
            style={{ display: 'flex', alignItems: 'center', marginBottom: CELL_GAP }}
          >
            {/* Lane label */}
            <div style={{
              width: LABEL_WIDTH,
              paddingRight: 12,
              textAlign: 'right',
              fontSize: 11,
              color: '#555',
              letterSpacing: 1,
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              {lane.name}
            </div>

            {/* Steps */}
            {doc.steps[lane.id]?.map((velocity, stepIndex) => {
              const isCurrentStep = isPlaying && stepIndex === currentStep
              const isTriggered = isCurrentStep && velocity > 0
              const isBeatStart = stepIndex % stepsPerGroup === 0

              return (
                <button
                  key={stepIndex}
                  onClick={() => cycleVelocity(lane.id, stepIndex)}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    marginRight: CELL_GAP,
                    flexShrink: 0,
                    border: `1px solid ${isTriggered ? '#fff' : VELOCITY_BORDER[velocity]}`,
                    borderRadius: 4,
                    background: isCurrentStep
                      ? isTriggered
                        ? '#ffffff18'
                        : '#ffffff06'
                      : VELOCITY_COLORS[velocity],
                    cursor: 'pointer',
                    padding: 0,
                    outline: 'none',
                    transition: isTriggered ? 'none' : 'background 0.08s',
                    opacity: isBeatStart && !velocity ? 0.7 : 1,
                    // beat group separator
                    marginLeft: isBeatStart && stepIndex !== 0 ? CELL_GAP + 4 : 0,
                  }}
                  title={`${lane.name} step ${stepIndex + 1} — velocity ${velocity}`}
                />
              )
            })}
          </div>
        ))}

        {/* Step number row */}
        <div style={{ display: 'flex', marginLeft: LABEL_WIDTH }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              style={{
                width: CELL_SIZE,
                marginRight: CELL_GAP,
                marginLeft: i % stepsPerGroup === 0 && i !== 0 ? CELL_GAP + 4 : 0,
                textAlign: 'center',
                fontSize: 9,
                color: i % stepsPerGroup === 0 ? '#444' : '#2a2a2a',
              }}
            >
              {i % stepsPerGroup === 0 ? i / stepsPerGroup + 1 : '·'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
