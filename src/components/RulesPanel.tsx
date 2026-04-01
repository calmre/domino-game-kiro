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
        <div style={s.sub}>Additive bonus based on chain length.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          <div style={s.row}><span>3 tiles</span><span style={s.val}>+2</span></div>
          <div style={s.row}><span>4 tiles</span><span style={s.val}>+3</span></div>
          <div style={s.row}><span>5 tiles</span><span style={s.val}>+4</span></div>
        </div>
        <div style={s.example}>
          <span style={s.tile}>[1|3]</span><span style={s.tile}>[3|5]</span><span style={s.tile}>[5|2]</span><br />
          3 connected → <span style={s.val}>+2</span> bonus
        </div>
      </div>

      <div style={s.divider} />

      {/* Run Multiplier */}
      <div>
        <div style={s.heading}>🏃 Run Multiplier</div>
        <div style={s.sub}>Check if ALL pips from played tiles form a sequential +1 order.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          <div style={s.row}><span>Sequential pips (e.g., 1,2,3,4)</span><span style={s.val}>×1.25</span></div>
        </div>
        <div style={s.example}>
          <span style={s.tile}>[1|2]</span>—<span style={s.tile}>[2|3]</span>—<span style={s.tile}>[3|4]</span><br />
          Pips: 1,2,2,3,3,4 → 1-4 sequential! → <span style={s.val}>×1.25</span>
        </div>
        <div style={{ color: '#89b4fa', fontSize: 11, marginTop: 2 }}>
          Note: Broken chain doesn't break run check (separate logic)
        </div>
      </div>

      <div style={s.divider} />

      {/* Double Multiplier */}
      <div>
        <div style={s.heading}>🎯 Double Multiplier</div>
        <div style={s.sub}>Each double tile multiplies total by ×1.15.</div>
        <div style={s.example}>
          <span style={s.tile}>[4|4]</span> is a double<br />
          ×<span style={s.val}>1.15</span> multiplier
        </div>
        <div style={s.example}>
          Two doubles in chain<br />
          ×<span style={s.val}>1.32</span> total (1.15 × 1.15)
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
          Longest = 1 tile → no bonus
        </div>
        <div style={{ color: '#f38ba8', marginTop: 4, fontSize: 11, fontWeight: 'bold' }}>
          KILL-SWITCH: Any broken link completely deactivates the Run Multiplier for that hand!
        </div>
        <div style={{ color: '#f38ba8', marginTop: 2, fontSize: 11 }}>
          Pips still count toward base score.
        </div>
      </div>

      <div style={s.divider} />

      {/* Full example */}
      <div>
        <div style={s.heading}>✨ Full Example (Domino Soul Rules)</div>
        <div style={s.example}>
          <span style={s.tile}>[2|3]</span>—<span style={s.tile}>[3|4]</span>—<span style={s.tile}>[4|4]</span><br />
          Base: 2+3+3+4+4+4 = <span style={s.good}>20</span><br />
          Chain (3 matching): <span style={s.val}>+2</span> to base 1.0x<br />
          Run (pips 2,3,3,4,4,4 = sequential? No) → <span style={s.val}>×1.0</span><br />
          Double [4|4]: <span style={s.val}>×1.15</span><br />
          Total mult: (1 + 2) × 1.0 × 1.15 = <span style={s.val}>×3.45</span><br />
          Score: 20 × 3.45 = <span style={s.good}>69</span>
        </div>
        <div style={s.example}>
          <span style={s.tile}>[1|2]</span>—<span style={s.tile}>[2|3]</span>—<span style={s.tile}>[3|4]</span><br />
          Base: 1+2+2+3+3+4 = <span style={s.good}>15</span><br />
          Chain (3 matching): <span style={s.val}>+2</span><br />
          Run (pips 1,2,2,3,3,4 = sequential 1-4? Yes!) → <span style={s.val}>×1.25</span><br />
          No doubles: <span style={s.val}>×1.0</span><br />
          Total mult: (1 + 2) × 1.25 × 1.0 = <span style={s.val}>×3.75</span><br />
          Score: 15 × 3.75 = <span style={s.good}>56</span>
        </div>
      </div>

      <div style={s.divider} />

      {/* Domino! Bonus */}
      <div>
        <div style={s.heading}>🎯 Domino! Bonus</div>
        <div style={s.sub}>Play all tiles in your hand to activate ×1.75 final multiplier.</div>
        <div style={s.example}>
          Empty hand when submitting<br />
          → <span style={{ ...s.val, color: '#a6e3a1' }}>×1.75</span> final multiplier
        </div>
        <div style={{ color: '#a6e3a1', fontSize: 11, marginTop: 2, fontWeight: 'bold' }}>
          Goal: Play all 5 tiles for maximum score!
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
