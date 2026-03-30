const s = {
  root: {
    width: 200,
    padding: 12,
    background: '#1e1e2e',
    borderRadius: 8,
    border: '1px solid #313244',
    flexShrink: 0,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#cdd6f4',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    overflowY: 'auto' as const,
    maxHeight: '80vh',
  },
  heading: { color: '#89b4fa', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  sub: { color: '#a6adc8', marginBottom: 3 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 6 },
  val: { color: '#cba6f7', fontWeight: 'bold' },
  example: {
    background: '#181825',
    border: '1px solid #313244',
    borderRadius: 4,
    padding: '5px 7px',
    color: '#a6adc8',
    lineHeight: 1.6,
    marginTop: 4,
  },
  tile: {
    display: 'inline-block',
    padding: '1px 5px',
    border: '1px solid #45475a',
    borderRadius: 3,
    background: '#1e1e2e',
    color: '#cdd6f4',
  },
  good: { color: '#a6e3a1' },
  warn: { color: '#f38ba8' },
  divider: { borderTop: '1px solid #313244' },
}

export function RulesPanel() {
  return (
    <div style={s.root}>
      <div>
        <div style={s.heading}>How to Score</div>
        <div style={s.sub}>Play up to 5 tiles per hand. Score = Base × Multiplier.</div>
      </div>

      <div style={s.divider} />

      {/* Base Score */}
      <div>
        <div style={s.heading}>📊 Base Score</div>
        <div style={s.sub}>Sum of all pip values on every tile played.</div>
        <div style={s.example}>
          <span style={s.tile}>[2|3]</span> <span style={s.tile}>[3|5]</span><br />
          Base = 2+3+3+5 = <span style={s.good}>13</span>
        </div>
      </div>

      <div style={s.divider} />

      {/* Chain Bonus */}
      <div>
        <div style={s.heading}>🔗 Chain Bonus</div>
        <div style={s.sub}>Based on your longest unbroken sequence.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          <div style={s.row}><span>1–3 tiles</span><span style={s.val}>×1</span></div>
          <div style={s.row}><span>4 tiles</span><span style={s.val}>×2</span></div>
          <div style={s.row}><span>5 tiles</span><span style={s.val}>×3</span></div>
        </div>
        <div style={s.example}>
          <span style={s.tile}>[1|3]</span><span style={s.tile}>[3|5]</span><span style={s.tile}>[5|2]</span><br />
          3 connected → <span style={s.val}>×1</span>
        </div>
      </div>

      <div style={s.divider} />

      {/* Double Bonus */}
      <div>
        <div style={s.heading}>🎯 Double Bonus</div>
        <div style={s.sub}>+0.5 for each double tile in your longest segment.</div>
        <div style={s.example}>
          <span style={s.tile}>[4|4]</span> is a double<br />
          +<span style={s.val}>0.5</span> to multiplier
        </div>
        <div style={s.example}>
          Two doubles in chain<br />
          +<span style={s.val}>1.0</span> total
        </div>
      </div>

      <div style={s.divider} />

      {/* Run Bonus */}
      <div>
        <div style={s.heading}>🏃 Run Bonus</div>
        <div style={s.sub}>+1 when the shared pip at a connection increases by exactly 1.</div>
        <div style={s.example}>
          <span style={s.tile}>[2|3]</span>—<span style={s.tile}>[3|4]</span><br />
          shared: 3→4 (+1) = <span style={s.val}>+1</span>
        </div>
        <div style={s.example}>
          <span style={s.tile}>[1|2]</span>—<span style={s.tile}>[2|3]</span>—<span style={s.tile}>[3|4]</span><br />
          2→3→4 = <span style={s.val}>+2</span> run bonus
        </div>
      </div>

      <div style={s.divider} />

      {/* Broken Link */}
      <div>
        <div style={s.heading}>💔 Broken Link</div>
        <div style={s.sub}>Pips don't match at a connection. Chain resets — only the longest segment counts.</div>
        <div style={s.example}>
          <span style={s.tile}>[1|2]</span>—<span style={s.warn}>[4|5]</span><br />
          Break after tile 1.<br />
          Longest = 1 tile → <span style={s.val}>×1</span>
        </div>
        <div style={{ color: '#f38ba8', marginTop: 4, fontSize: 11 }}>
          Pips still count toward base score.
        </div>
      </div>

      <div style={s.divider} />

      {/* Full example */}
      <div>
        <div style={s.heading}>✨ Full Example</div>
        <div style={s.example}>
          <span style={s.tile}>[2|3]</span>—<span style={s.tile}>[3|4]</span>—<span style={s.tile}>[4|4]</span><br />
          Base: 2+3+3+4+4+4 = <span style={s.good}>20</span><br />
          Chain (3): <span style={s.val}>×1</span><br />
          Double [4|4]: <span style={s.val}>+0.5</span><br />
          Run 3→4: <span style={s.val}>+1</span><br />
          Total mult: <span style={s.val}>×2.5</span><br />
          Score: 20 × 2.5 = <span style={s.good}>50</span>
        </div>
      </div>

      <div style={s.divider} />

      {/* Discard */}
      <div>
        <div style={s.heading}>🗑 Discard</div>
        <div style={s.sub}>Clears the board. Select tiles to remove permanently, then draw replacements.</div>
        <div style={{ color: '#f38ba8', fontSize: 11, marginTop: 2 }}>4 discards per match.</div>
      </div>
    </div>
  )
}
