import { useState, useRef, useCallback } from 'react'

const MAX_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const styles = {
  // ── Layout ──────────────────────────────────────────────────────────────
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  header: {
    borderBottom: '1px solid var(--border)',
    padding: '18px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    background: 'var(--accent)',
    color: '#000',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 500,
    padding: '3px 7px',
    borderRadius: '4px',
    letterSpacing: '0.04em',
  },
  headerSep: {
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    marginLeft: 'auto',
    letterSpacing: '0.05em',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 24px 40px',
    gap: '48px',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '560px',
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(36px, 5vw, 52px)',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1.05,
    marginBottom: '14px',
    color: 'var(--text)',
  },
  heroAccent: {
    color: 'var(--accent)',
  },
  heroSub: {
    color: 'var(--text-dim)',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    lineHeight: 1.6,
  },
  // ── Drop Zone ────────────────────────────────────────────────────────────
  dropZone: {
    width: '100%',
    maxWidth: '620px',
    border: '1.5px dashed var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '52px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: 'transparent',
    position: 'relative',
  },
  dropZoneActive: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-dim)',
  },
  dropZoneIcon: {
    width: '48px',
    height: '48px',
    opacity: 0.4,
  },
  dropZoneLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
  },
  dropZoneSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.03em',
  },
  browseBtn: {
    marginTop: '8px',
    padding: '10px 24px',
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    transition: 'background 0.15s, transform 0.1s',
  },
  hiddenInput: {
    display: 'none',
  },
  // ── File info card ────────────────────────────────────────────────────────
  fileCard: {
    width: '100%',
    maxWidth: '620px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  fileIcon: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    background: 'var(--accent-dim)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '3px',
    letterSpacing: '0.03em',
  },
  clearBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    transition: 'border-color 0.15s, color 0.15s',
    flexShrink: 0,
  },
  convertBtn: {
    width: '100%',
    maxWidth: '620px',
    padding: '16px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '16px',
    letterSpacing: '-0.01em',
    color: '#000',
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
  },
  convertBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  // ── Progress ──────────────────────────────────────────────────────────────
  progressWrap: {
    width: '100%',
    maxWidth: '620px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  progressLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: '4px',
    background: 'var(--surface-2)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  progressStatus: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--text-dim)',
  },
  // ── Result ────────────────────────────────────────────────────────────────
  resultCard: {
    width: '100%',
    maxWidth: '620px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  resultHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  resultTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '3px 8px',
    background: 'rgba(77, 255, 145, 0.12)',
    color: 'var(--success)',
    borderRadius: '4px',
    letterSpacing: '0.04em',
  },
  resultActions: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '15px',
    color: '#000',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    transition: 'background 0.15s',
    textDecoration: 'none',
  },
  resetBtn: {
    padding: '12px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    letterSpacing: '0.02em',
  },
  meta: {
    display: 'flex',
    gap: '24px',
    padding: '0 24px 20px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metaKey: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--text)',
    fontWeight: 500,
  },
  // ── Error ────────────────────────────────────────────────────────────────
  errorCard: {
    width: '100%',
    maxWidth: '620px',
    background: 'rgba(255,77,77,0.06)',
    border: '1px solid rgba(255,77,77,0.25)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
  },
  errorText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--danger)',
    lineHeight: 1.6,
  },
  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.04em',
  },
}

// ── State machine ────────────────────────────────────────────────────────
// idle → selected → converting → done | error
// ─────────────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState('idle') // idle | selected | converting | done | error
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState(null) // { url, pages, fileName, size }
  const fileInputRef = useRef(null)

  const resetAll = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url)
    setPhase('idle')
    setFile(null)
    setProgress(0)
    setErrorMsg('')
    setResult(null)
  }, [result])

  const selectFile = useCallback((incoming) => {
    if (!incoming) return
    if (incoming.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are accepted.')
      setPhase('error')
      return
    }
    if (incoming.size > MAX_SIZE_BYTES) {
      setErrorMsg(`File is too large (${formatBytes(incoming.size)}). Maximum is 100 MB.`)
      setPhase('error')
      return
    }
    setFile(incoming)
    setPhase('selected')
    setErrorMsg('')
  }, [])

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    selectFile(dropped)
  }
  const onFileChange = (e) => selectFile(e.target.files[0])

  // ── Convert ──────────────────────────────────────────────────────────────
  const convert = useCallback(async () => {
    if (!file) return
    setPhase('converting')
    setProgress(10)

    const formData = new FormData()
    formData.append('file', file)

    // Fake progress pulse while waiting for server
    const pulse = setInterval(() => {
      setProgress((p) => (p < 85 ? p + Math.random() * 6 : p))
    }, 600)

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      })

      clearInterval(pulse)

      if (!response.ok) {
        let msg = 'Conversion failed.'
        try {
          const body = await response.json()
          msg = body.error || msg
        } catch {}
        setErrorMsg(msg)
        setPhase('error')
        return
      }

      const totalPages = Number(response.headers.get('X-Total-Pages') || 0)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      setProgress(100)
      setResult({
        url,
        pages: totalPages,
        fileName: file.name.replace(/\.pdf$/i, '') + '_pages.zip',
        pdfSize: file.size,
        zipSize: blob.size,
      })
      setPhase('done')
    } catch (err) {
      clearInterval(pulse)
      setErrorMsg('Network error — make sure the server is running.')
      setPhase('error')
    }
  }, [file])

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>PDF</span>
          to JPEG
        </div>
        <span style={styles.headerSep}>100 MB LIMIT · ALL PAGES · FREE</span>
      </header>

      {/* ── Main ── */}
      <main style={styles.main}>
        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>
            Convert PDF to<br />
            <span style={styles.heroAccent}>JPEG images</span>
          </h1>
          <p style={styles.heroSub}>
            Upload a PDF and get every page as a high-quality JPEG,
            bundled in a zip file. No sign-up, no limits on pages.
          </p>
        </div>

        {/* ── Drop zone (idle or selected) ── */}
        {(phase === 'idle' || phase === 'selected') && (
          <>
            <div
              style={{
                ...styles.dropZone,
                ...(isDragging ? styles.dropZoneActive : {}),
              }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => phase === 'idle' && fileInputRef.current?.click()}
            >
              <svg style={styles.dropZoneIcon} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="4" width="24" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M28 4v8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M24 28v-10M20 22l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="36" cy="36" r="8" fill="var(--accent)" />
                <path d="M36 32v8M32 36h8" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={styles.dropZoneLabel}>
                {isDragging ? 'Drop it here' : 'Drag & drop your PDF'}
              </span>
              <span style={styles.dropZoneSub}>PDF files only · max 100 MB</span>
              {phase === 'idle' && (
                <button
                  style={styles.browseBtn}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  onMouseEnter={e => e.target.style.background = 'var(--accent-hover)'}
                  onMouseLeave={e => e.target.style.background = 'var(--accent)'}
                >
                  Browse file
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={styles.hiddenInput}
                onChange={onFileChange}
              />
            </div>

            {/* File card */}
            {phase === 'selected' && file && (
              <div style={styles.fileCard}>
                <div style={styles.fileIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="1" width="10" height="14" rx="1" stroke="var(--accent)" strokeWidth="1.5"/>
                    <path d="M10 1v4h4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6 8h6M6 11h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={styles.fileInfo}>
                  <div style={styles.fileName}>{file.name}</div>
                  <div style={styles.fileSize}>{formatBytes(file.size)}</div>
                </div>
                <button
                  style={styles.clearBtn}
                  onClick={resetAll}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--border-hover)'; e.target.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Convert button */}
            <button
              style={{
                ...styles.convertBtn,
                ...(phase !== 'selected' ? styles.convertBtnDisabled : {}),
              }}
              disabled={phase !== 'selected'}
              onClick={convert}
              onMouseEnter={e => { if (phase === 'selected') e.target.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => { e.target.style.background = 'var(--accent)' }}
            >
              Convert to JPEG →
            </button>
          </>
        )}

        {/* ── Converting ── */}
        {phase === 'converting' && (
          <div style={styles.progressWrap}>
            <span style={styles.progressLabel}>Converting</span>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            </div>
            <span style={styles.progressStatus}>
              Processing pages — this may take a moment for large files…
            </span>
          </div>
        )}

        {/* ── Done ── */}
        {phase === 'done' && result && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <span style={styles.resultTitle}>Conversion complete</span>
              <span style={styles.badge}>✓ DONE</span>
            </div>
            <div style={styles.meta}>
              <div style={styles.metaItem}>
                <span style={styles.metaKey}>Pages</span>
                <span style={styles.metaVal}>{result.pages}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaKey}>Source size</span>
                <span style={styles.metaVal}>{formatBytes(result.pdfSize)}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaKey}>ZIP size</span>
                <span style={styles.metaVal}>{formatBytes(result.zipSize)}</span>
              </div>
            </div>
            <div style={styles.resultActions}>
              <a
                href={result.url}
                download={result.fileName}
                style={styles.downloadBtn}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2v9M5 8l4 4 4-4M3 14h12" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download ZIP ({result.pages} {result.pages === 1 ? 'image' : 'images'})
              </a>
              <button
                style={styles.resetBtn}
                onClick={resetAll}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--border-hover)'; e.target.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)' }}
              >
                Convert another PDF
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {phase === 'error' && (
          <>
            <div style={styles.errorCard}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="9" cy="9" r="7" stroke="var(--danger)" strokeWidth="1.5"/>
                <path d="M9 6v4M9 12v.5" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={styles.errorText}>{errorMsg}</span>
            </div>
            <button
              style={styles.convertBtn}
              onClick={resetAll}
              onMouseEnter={e => e.target.style.background = 'var(--accent-hover)'}
              onMouseLeave={e => e.target.style.background = 'var(--accent)'}
            >
              Try again
            </button>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <span>PDF → JPEG</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span>All conversion happens server-side. Files are never stored.</span>
      </footer>
    </div>
  )
}
