'use client'

type MoralAlignment = {
  axis_law_chaos: number
  axis_good_evil: number
  dominant: string
  title: string
}

export default function AlignmentMeter({
  alignment,
}: {
  alignment: MoralAlignment
  lastShift?: { law_chaos: number; good_evil: number }
}) {
  const dotLeft = 50 + alignment.axis_law_chaos * 0.4
  const dotTop = 50 - alignment.axis_good_evil * 0.4
  return (
    <div className="alignment-meter">
      <div className="alignment-title">Your Path: {alignment.title}</div>
      <div className="alignment-grid" style={{ position: 'relative' }}>
        {['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'].map(cell => (
          <div key={cell} className={`alignment-cell ${cell.includes('Good') ? 'good-cell' : cell.includes('Evil') ? 'evil-cell' : 'neutral-cell'}`}>{cell}</div>
        ))}
        <div className="alignment-dot" style={{ left: `${Math.max(2, Math.min(98, dotLeft))}%`, top: `${Math.max(4, Math.min(96, dotTop))}%` }} />
      </div>
      <div className="alignment-axis-label"><span>Chaotic</span><span>Lawful</span></div>
      <div className="alignment-axis-bar">
        <div className="alignment-center-mark" />
        {alignment.axis_law_chaos >= 0 ? <div className="alignment-axis-fill lawful" style={{ width: `${Math.abs(alignment.axis_law_chaos) / 2}%` }} /> : <div className="alignment-axis-fill chaotic" style={{ width: `${Math.abs(alignment.axis_law_chaos) / 2}%` }} />}
      </div>
      <div className="alignment-axis-label"><span>Evil</span><span>Good</span></div>
      <div className="alignment-axis-bar">
        <div className="alignment-center-mark" />
        {alignment.axis_good_evil >= 0 ? <div className="alignment-axis-fill good-fill" style={{ width: `${Math.abs(alignment.axis_good_evil) / 2}%` }} /> : <div className="alignment-axis-fill evil-fill" style={{ width: `${Math.abs(alignment.axis_good_evil) / 2}%` }} />}
      </div>
    </div>
  )
}

