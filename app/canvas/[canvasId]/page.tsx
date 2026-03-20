'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type ElementType = 'text' | 'sticky' | 'shape' | 'image' | 'video'
type ToolType = 'select' | 'text' | 'sticky' | 'shape' | 'image' | 'video' | 'connect'

interface CE {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  content: string
  style: string
}

interface Edge {
  id: string
  fromId: string
  toId: string
  label?: string | null
  canvasId: string
}

interface CanvasData {
  id: string
  title: string
  team?: { name: string }
  elements: CE[]
  edges: Edge[]
}

// ─── Default sizes ────────────────────────────────────────────────────────────

function defaultSize(type: ElementType): { width: number; height: number } {
  switch (type) {
    case 'text':   return { width: 200, height: 60 }
    case 'sticky': return { width: 200, height: 150 }
    case 'shape':  return { width: 150, height: 80 }
    case 'image':  return { width: 250, height: 180 }
    case 'video':  return { width: 320, height: 200 }
  }
}

// ─── YouTube helper ──────────────────────────────────────────────────────────

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

// ─── SVG Arrow Marker ────────────────────────────────────────────────────────

function SvgDefs() {
  return (
    <defs>
      <marker id="arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
        <polygon points="0 0, 6 2.5, 0 5" fill="#93c5fd" />
      </marker>
      <marker id="arrowhead-selected" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
        <polygon points="0 0, 6 2.5, 0 5" fill="#f87171" />
      </marker>
    </defs>
  )
}

// ─── Side-center connection point ────────────────────────────────────────────

function sideCenter(el: { x: number; y: number; width: number; height: number }, other: { x: number; y: number; width: number; height: number }) {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const ox = other.x + other.width / 2
  const oy = other.y + other.height / 2
  const dx = ox - cx
  const dy = oy - cy
  // Pick the side whose axis has the stronger relative displacement
  if (Math.abs(dx) / (el.width / 2) >= Math.abs(dy) / (el.height / 2)) {
    return dx >= 0
      ? { x: el.x + el.width, y: cy, horiz: true,  sign: 1  }
      : { x: el.x,             y: cy, horiz: true,  sign: -1 }
  } else {
    return dy >= 0
      ? { x: cx, y: el.y + el.height, horiz: false, sign: 1  }
      : { x: cx, y: el.y,             horiz: false, sign: -1 }
  }
}

// ─── Bezier path between two elements ────────────────────────────────────────

function getBezierPath(from: CE, to: CE): string {
  const p1 = sideCenter(from, to)
  const p2 = sideCenter(to, from)

  const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  const offset = Math.min(dist * 0.45, 160)

  const cp1x = p1.horiz ? p1.x + p1.sign * offset : p1.x
  const cp1y = p1.horiz ? p1.y                     : p1.y + p1.sign * offset
  const cp2x = p2.horiz ? p2.x + p2.sign * offset  : p2.x
  const cp2y = p2.horiz ? p2.y                     : p2.y + p2.sign * offset

  return `M${p1.x},${p1.y} C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CanvasEditor() {
  const router = useRouter()
  const params = useParams()
  const canvasId = params.canvasId as string

  const [canvas, setCanvas] = useState<CanvasData | null>(null)
  const [elements, setElements] = useState<CE[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saved, setSaved] = useState(true)

  // Viewport
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Tool / selection
  const [tool, setTool] = useState<ToolType>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Live connection drag
  const [liveEdge, setLiveEdge] = useState<{ fromId: string; x1: number; y1: number; mx: number; my: number } | null>(null)
  const liveEdgeRef = useRef<typeof liveEdge>(null)

  // Image modal
  const [imageModal, setImageModal] = useState<{ elementId: string } | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video modal
  const [videoModal, setVideoModal] = useState<{ elementId: string } | null>(null)
  const [videoUrl, setVideoUrl] = useState('')

  // Panning state
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const panOriginRef = useRef({ x: 0, y: 0 })

  // Drag state
  const draggingRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null)

  // Resize state
  const resizingRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startW: number; startH: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // ─── Load canvas ─────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem('kanban_user')
    if (!saved) { router.replace('/login'); return }
    fetch(`/api/canvas/${canvasId}`)
      .then((r) => r.json())
      .then((data: CanvasData) => {
        setCanvas(data)
        setTitle(data.title)
        setElements(data.elements)
        setEdges(data.edges)
      })
  }, [canvasId, router])

  // Keep liveEdgeRef in sync with state (for access inside event handlers)
  useEffect(() => { liveEdgeRef.current = liveEdge }, [liveEdge])

  // ─── Title save ──────────────────────────────────────────────────────────

  async function saveTitle(newTitle: string) {
    if (!newTitle.trim()) return
    setTitle(newTitle.trim())
    setEditingTitle(false)
    setSaved(false)
    await fetch(`/api/canvas/${canvasId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    setSaved(true)
  }

  // ─── Create element ───────────────────────────────────────────────────────

  async function createElement(type: ElementType, cx: number, cy: number) {
    const { width, height } = defaultSize(type)
    const x = (cx - pan.x) / zoom - width / 2
    const y = (cy - pan.y) / zoom - height / 2
    const body = { type, x, y, width, height, content: '', style: '{}' }
    setSaved(false)
    const res = await fetch(`/api/canvas/${canvasId}/elements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const el: CE = await res.json()
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
    setSaved(true)

    if (type === 'image') {
      setImageModal({ elementId: el.id })
    } else if (type === 'video') {
      setVideoModal({ elementId: el.id })
    }

    return el
  }

  // ─── Update element (local + DB) ─────────────────────────────────────────

  async function patchElement(id: string, data: Partial<CE>) {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)))
    setSaved(false)
    await fetch(`/api/canvas/${canvasId}/elements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaved(true)
  }

  // ─── Delete element ───────────────────────────────────────────────────────

  async function deleteElement(id: string) {
    setElements((prev) => prev.filter((e) => e.id !== id))
    setEdges((prev) => prev.filter((e) => e.fromId !== id && e.toId !== id))
    setSelectedId(null)
    setSaved(false)
    await fetch(`/api/canvas/${canvasId}/elements/${id}`, { method: 'DELETE' })
    setSaved(true)
  }

  // ─── Create edge ──────────────────────────────────────────────────────────

  async function createEdge(fromId: string, toId: string) {
    setSaved(false)
    const res = await fetch(`/api/canvas/${canvasId}/edges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromId, toId }),
    })
    const edge: Edge = await res.json()
    setEdges((prev) => [...prev, edge])
    setSaved(true)
  }

  // ─── Delete edge ──────────────────────────────────────────────────────────

  async function deleteEdge(id: string) {
    setEdges((prev) => prev.filter((e) => e.id !== id))
    setSelectedEdgeId(null)
    setSaved(false)
    await fetch(`/api/canvas/${canvasId}/edges/${id}`, { method: 'DELETE' })
    setSaved(true)
  }

  // ─── Canvas click (create elements) ──────────────────────────────────────

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    setSelectedId(null)
    setSelectedEdgeId(null)
    setConnectFrom(null)
    if (tool === 'select') return

    const rect = e.currentTarget.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    if (['text', 'sticky', 'shape', 'image', 'video'].includes(tool)) {
      createElement(tool as ElementType, cx, cy)
      setTool('select')
    }
  }

  // ─── Zoom ─────────────────────────────────────────────────────────────────

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.min(3, Math.max(0.2, zoom * delta))
    setPan((p) => ({
      x: mx - (mx - p.x) * (newZoom / zoom),
      y: my - (my - p.y) * (newZoom / zoom),
    }))
    setZoom(newZoom)
  }

  function zoomIn() {
    const newZoom = Math.min(3, zoom * 1.2)
    setZoom(newZoom)
  }

  function zoomOut() {
    const newZoom = Math.max(0.2, zoom / 1.2)
    setZoom(newZoom)
  }

  function fitToScreen() {
    if (elements.length === 0) { setPan({ x: 0, y: 0 }); setZoom(1); return }
    const minX = Math.min(...elements.map((e) => e.x))
    const minY = Math.min(...elements.map((e) => e.y))
    const maxX = Math.max(...elements.map((e) => e.x + e.width))
    const maxY = Math.max(...elements.map((e) => e.y + e.height))
    const cw = containerRef.current?.clientWidth ?? 800
    const ch = containerRef.current?.clientHeight ?? 600
    const padding = 60
    const scaleX = (cw - padding * 2) / (maxX - minX || 1)
    const scaleY = (ch - padding * 2) / (maxY - minY || 1)
    const newZoom = Math.min(3, Math.max(0.2, Math.min(scaleX, scaleY)))
    setPan({
      x: (cw - (maxX - minX) * newZoom) / 2 - minX * newZoom,
      y: (ch - (maxY - minY) * newZoom) / 2 - minY * newZoom,
    })
    setZoom(newZoom)
  }

  // ─── Pan handlers ─────────────────────────────────────────────────────────

  function handleMouseDownCanvas(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (tool !== 'select') return
    isPanningRef.current = true
    panStartRef.current = { x: e.clientX, y: e.clientY }
    panOriginRef.current = { ...pan }
    e.currentTarget.style.cursor = 'grabbing'
  }

  function handleMouseMoveGlobal(e: React.MouseEvent<HTMLDivElement>) {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setPan({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy })
    }
    if (draggingRef.current) {
      const { id, startMouseX, startMouseY, startX, startY } = draggingRef.current
      const dx = (e.clientX - startMouseX) / zoom
      const dy = (e.clientY - startMouseY) / zoom
      setElements((prev) => prev.map((el) => el.id === id ? { ...el, x: startX + dx, y: startY + dy } : el))
    }
    if (resizingRef.current) {
      const { id, startMouseX, startMouseY, startW, startH } = resizingRef.current
      const dx = (e.clientX - startMouseX) / zoom
      const dy = (e.clientY - startMouseY) / zoom
      setElements((prev) => prev.map((el) => el.id === id
        ? { ...el, width: Math.max(60, startW + dx), height: Math.max(40, startH + dy) }
        : el
      ))
    }
    if (liveEdgeRef.current) {
      const rect = containerRef.current!.getBoundingClientRect()
      setLiveEdge((prev) => prev ? { ...prev, mx: e.clientX - rect.left, my: e.clientY - rect.top } : null)
    }
  }

  function handleMouseUpGlobal(e: React.MouseEvent<HTMLDivElement>) {
    if (isPanningRef.current) {
      isPanningRef.current = false
      if (containerRef.current) containerRef.current.style.cursor = 'default'
    }
    if (draggingRef.current) {
      const { id } = draggingRef.current
      const el = elements.find((e) => e.id === id)
      if (el) patchElement(id, { x: el.x, y: el.y })
      draggingRef.current = null
    }
    if (resizingRef.current) {
      const { id } = resizingRef.current
      const el = elements.find((e) => e.id === id)
      if (el) patchElement(id, { width: el.width, height: el.height })
      resizingRef.current = null
    }
    if (liveEdgeRef.current) {
      liveEdgeRef.current = null
      setLiveEdge(null)
    }
  }

  // ─── Element mouse down (drag) ────────────────────────────────────────────

  function handleElementMouseDown(e: React.MouseEvent, el: CE) {
    e.stopPropagation()
    if (editingId === el.id) return

    if (tool === 'connect') {
      if (!connectFrom) {
        setConnectFrom(el.id)
      } else if (connectFrom !== el.id) {
        createEdge(connectFrom, el.id)
        setConnectFrom(null)
        setTool('select')
      }
      return
    }

    setSelectedId(el.id)
    setSelectedEdgeId(null)

    if (tool === 'select') {
      draggingRef.current = {
        id: el.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: el.x,
        startY: el.y,
      }
    }
  }

  // ─── Resize handle mouse down ─────────────────────────────────────────────

  function handleResizeMouseDown(e: React.MouseEvent, el: CE) {
    e.stopPropagation()
    e.preventDefault()
    resizingRef.current = {
      id: el.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: el.width,
      startH: el.height,
    }
  }

  // ─── Connection handle mouse down ────────────────────────────────────────

  function handleHandleMouseDown(e: React.MouseEvent, el: CE, side: 'top' | 'right' | 'bottom' | 'left') {
    e.stopPropagation()
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const ex = el.x * zoom + pan.x
    const ey = el.y * zoom + pan.y
    const ew = el.width * zoom
    const eh = el.height * zoom
    let x1: number, y1: number
    if (side === 'top')         { x1 = ex + ew / 2; y1 = ey }
    else if (side === 'right')  { x1 = ex + ew;     y1 = ey + eh / 2 }
    else if (side === 'bottom') { x1 = ex + ew / 2; y1 = ey + eh }
    else                        { x1 = ex;           y1 = ey + eh / 2 }
    const live = { fromId: el.id, x1, y1, mx: e.clientX - rect.left, my: e.clientY - rect.top }
    liveEdgeRef.current = live
    setLiveEdge(live)
  }

  async function handleHandleMouseUp(toEl: CE) {
    if (!liveEdgeRef.current || liveEdgeRef.current.fromId === toEl.id) {
      liveEdgeRef.current = null
      setLiveEdge(null)
      return
    }
    const fromId = liveEdgeRef.current.fromId
    liveEdgeRef.current = null
    setLiveEdge(null)
    const res = await fetch(`/api/canvas/${canvasId}/edges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromId, toId: toEl.id }),
    })
    const edge = await res.json()
    setEdges((prev) => [...prev, edge])
  }

  // ─── Double-click (edit text) ─────────────────────────────────────────────

  function handleElementDoubleClick(e: React.MouseEvent, el: CE) {
    e.stopPropagation()
    if (['text', 'sticky', 'shape'].includes(el.type)) {
      setEditingId(el.id)
    }
  }

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && editingId !== selectedId) deleteElement(selectedId)
        if (selectedEdgeId) deleteEdge(selectedEdgeId)
      }
      if (e.key === 'Escape') { setTool('select'); setConnectFrom(null); setSelectedId(null); setSelectedEdgeId(null); setEditingId(null) }
      if (e.key === 't' || e.key === 'T') setTool('text')
      if (e.key === 's' || e.key === 'S') setTool('sticky')
      if (e.key === 'r' || e.key === 'R') setTool('shape')
      if (e.key === 'i' || e.key === 'I') setTool('image')
      if (e.key === 'v' || e.key === 'V') setTool('video')
      if (e.key === 'c' || e.key === 'C') setTool('connect')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, selectedEdgeId, editingId, elements, edges])

  // ─── Image modal handlers ─────────────────────────────────────────────────

  async function handleImageUrlSubmit() {
    if (!imageModal || !imageUrl.trim()) return
    await patchElement(imageModal.elementId, { content: imageUrl.trim() })
    setImageModal(null)
    setImageUrl('')
  }

  async function handleImageFileUpload(file: File) {
    if (!imageModal) return
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (data.url) {
      await patchElement(imageModal.elementId, { content: data.url })
    }
    setImageModal(null)
    setImageUrl('')
  }

  async function handleVideoUrlSubmit() {
    if (!videoModal || !videoUrl.trim()) return
    await patchElement(videoModal.elementId, { content: videoUrl.trim() })
    setVideoModal(null)
    setVideoUrl('')
  }

  // ─── Render element content ───────────────────────────────────────────────

  function renderElementContent(el: CE) {
    const isEditing = editingId === el.id
    const isSelected = selectedId === el.id
    const isConnectFrom = connectFrom === el.id
    const showHandles = (hoveredId === el.id || isSelected) && !isEditing

    const ex = el.x * zoom + pan.x
    const ey = el.y * zoom + pan.y
    const ew = el.width * zoom
    const eh = el.height * zoom

    const contentStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      cursor: tool === 'select' ? 'grab' : 'crosshair',
      userSelect: isEditing ? 'text' : 'none',
    }

    let content: React.ReactNode = null

    if (el.type === 'text') {
      content = (
        <div
          style={{ ...contentStyle, color: '#1a1a1a', fontSize: 15 * zoom, padding: `${4 * zoom}px ${6 * zoom}px`, overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4 }}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
          onDoubleClick={(e) => handleElementDoubleClick(e, el)}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => { patchElement(el.id, { content: e.currentTarget.textContent ?? '' }); setEditingId(null) }}
        >
          {!isEditing && (el.content || <span style={{ color: 'rgba(0,0,0,0.25)', fontStyle: 'italic' }}>Texto</span>)}
          {isEditing && el.content}
        </div>
      )
    } else if (el.type === 'sticky') {
      content = (
        <div
          style={{ ...contentStyle, background: '#f2d600', borderRadius: 8 * zoom, padding: `${8 * zoom}px`, boxShadow: `0 ${4 * zoom}px ${12 * zoom}px rgba(0,0,0,0.15)`, color: '#1a1a1a', fontSize: 13 * zoom, overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
          onDoubleClick={(e) => handleElementDoubleClick(e, el)}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => { patchElement(el.id, { content: e.currentTarget.textContent ?? '' }); setEditingId(null) }}
        >
          {!isEditing && (el.content || <span style={{ color: 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}>Nota...</span>)}
          {isEditing && el.content}
        </div>
      )
    } else if (el.type === 'shape') {
      content = (
        <div
          style={{ ...contentStyle, background: '#4f8ef7', borderRadius: 8 * zoom, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13 * zoom, fontWeight: 600 }}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
          onDoubleClick={(e) => handleElementDoubleClick(e, el)}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => { patchElement(el.id, { content: e.currentTarget.textContent ?? '' }); setEditingId(null) }}
        >
          {!isEditing && (el.content || <span style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>Forma</span>)}
          {isEditing && el.content}
        </div>
      )
    } else if (el.type === 'image') {
      content = (
        <div
          style={{ ...contentStyle, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 * zoom, overflow: 'hidden' }}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
        >
          {el.content ? (
            <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', border: `2px dashed #e2e8f0`, borderRadius: 8 * zoom }}>
              <svg width={24 * zoom} height={24 * zoom} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontSize: 11 * zoom }}>Clique para adicionar imagem</span>
              <button style={{ background: '#4f8ef7', border: 'none', borderRadius: 4 * zoom, color: 'white', padding: `${3 * zoom}px ${8 * zoom}px`, fontSize: 11 * zoom, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setImageModal({ elementId: el.id }); setSelectedId(el.id) }}>Upload</button>
            </div>
          )}
        </div>
      )
    } else if (el.type === 'video') {
      const ytId = extractYoutubeId(el.content)
      content = (
        <div
          style={{ ...contentStyle, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 * zoom, overflow: 'hidden' }}
          onMouseDown={(e) => handleElementMouseDown(e, el)}
        >
          {ytId ? (
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ display: 'block', pointerEvents: isSelected ? 'auto' : 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', border: `2px dashed #e2e8f0`, borderRadius: 8 * zoom }}>
              <svg width={24 * zoom} height={24 * zoom} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              <span style={{ fontSize: 11 * zoom }}>Adicionar vídeo YouTube</span>
              <button style={{ background: '#4f8ef7', border: 'none', borderRadius: 4 * zoom, color: 'white', padding: `${3 * zoom}px ${8 * zoom}px`, fontSize: 11 * zoom, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setVideoModal({ elementId: el.id }); setSelectedId(el.id) }}>URL</button>
            </div>
          )}
        </div>
      )
    }

    // Handles positioned relative to the element container using CSS transform
    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#ffffff',
      border: '1.5px solid #93c5fd',
      cursor: 'crosshair',
      zIndex: 20,
      transition: 'transform 0.12s, box-shadow 0.12s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    }

    return (
      <div
        key={el.id}
        style={{
          position: 'absolute',
          left: ex,
          top: ey,
          width: ew,
          height: eh,
          boxSizing: 'border-box',
          outline: isConnectFrom ? '2px solid #22d3ee' : isSelected ? '2px solid #4f8ef7' : 'none',
          outlineOffset: 2,
          borderRadius: 8 * zoom,
          zIndex: isSelected ? 10 : 1,
        }}
        onMouseEnter={() => setHoveredId(el.id)}
        onMouseLeave={() => setHoveredId(null)}
        onMouseUp={() => handleHandleMouseUp(el)}
      >
        {content}

        {/* Connection handles — centered on each side */}
        {showHandles && (<>
          <div onMouseDown={(e) => handleHandleMouseDown(e, el, 'top')}    style={{ ...handleStyle, top: 0,    left: '50%', transform: 'translate(-50%, -50%)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,197,253,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)' }} />
          <div onMouseDown={(e) => handleHandleMouseDown(e, el, 'right')}  style={{ ...handleStyle, top: '50%', right: 0,  transform: 'translate(50%, -50%)' }}  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(50%, -50%) scale(1.5)';  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,197,253,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(50%, -50%) scale(1)';  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)' }} />
          <div onMouseDown={(e) => handleHandleMouseDown(e, el, 'bottom')} style={{ ...handleStyle, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }}  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1.5)';  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,197,253,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1)';  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)' }} />
          <div onMouseDown={(e) => handleHandleMouseDown(e, el, 'left')}   style={{ ...handleStyle, top: '50%', left: 0,   transform: 'translate(-50%, -50%)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,197,253,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)' }} />
        </>)}

        {/* Resize handle — bottom-right corner */}
        {isSelected && !isEditing && (
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, el)}
            style={{ position: 'absolute', right: 0, bottom: 0, transform: 'translate(50%, 50%)', width: 10, height: 10, background: '#4f8ef7', border: '2px solid white', borderRadius: 3, cursor: 'se-resize', zIndex: 20 }}
          />
        )}
      </div>
    )
  }

  // ─── Toolbar tools definition ─────────────────────────────────────────────

  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut?: string }[] = [
    {
      id: 'select',
      label: 'Selecionar',
      shortcut: 'Esc',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 3l14 9-7 1-4 7z"/>
        </svg>
      ),
    },
    {
      id: 'text',
      label: 'Texto (T)',
      shortcut: 'T',
      icon: <span style={{ fontWeight: 800, fontSize: 16 }}>T</span>,
    },
    {
      id: 'sticky',
      label: 'Nota (S)',
      shortcut: 'S',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
        </svg>
      ),
    },
    {
      id: 'shape',
      label: 'Forma (R)',
      shortcut: 'R',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="12" rx="3"/>
        </svg>
      ),
    },
    {
      id: 'image',
      label: 'Imagem (I)',
      shortcut: 'I',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
    },
    {
      id: 'video',
      label: 'Vídeo (V)',
      shortcut: 'V',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      ),
    },
    {
      id: 'connect',
      label: 'Conectar (C)',
      shortcut: 'C',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      ),
    },
  ]

  // ─── Dot grid background ──────────────────────────────────────────────────

  const dotSpacing = 24 * zoom
  const dotSize = 0.8
  const dotOffsetX = pan.x % dotSpacing
  const dotOffsetY = pan.y % dotSpacing

  const dotOpacity = Math.min(0.25, Math.max(0, (zoom - 0.4) * 0.4))
  const dotPattern = `radial-gradient(circle, rgba(0,0,0,${dotOpacity.toFixed(2)}) ${dotSize}px, transparent ${dotSize}px)`

  if (!canvas) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1923', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Carregando canvas...
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: '#0f1923', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Keyframe styles */}
      <style>{`
        @keyframes connectPulse {
          0%, 100% { box-shadow: 0 0 0 0px rgba(34,211,238,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(34,211,238,0); }
        }
      `}</style>

      {/* Header */}
      <header style={{ height: 50, background: 'rgba(15,25,35,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 50, backdropFilter: 'blur(10px)' }}>
        <button
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={() => router.push('/canvas')}
          onMouseEnter={(e) => e.currentTarget.style.color = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Canvas
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

        {editingTitle ? (
          <input
            autoFocus
            defaultValue={title}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(79,142,247,0.5)', borderRadius: 5, color: '#e2e8f0', fontSize: 14, fontWeight: 700, padding: '3px 8px', outline: 'none', minWidth: 200 }}
            onBlur={(e) => saveTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setEditingTitle(false)
            }}
          />
        ) : (
          <span
            style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', cursor: 'text', padding: '3px 6px', borderRadius: 5, transition: 'background 0.15s' }}
            onClick={() => setEditingTitle(true)}
            title="Clique para editar"
          >
            {title}
          </span>
        )}

        {canvas.team && (
          <span style={{ fontSize: 12, color: '#4f8ef7', background: 'rgba(79,142,247,0.12)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
            {canvas.team.name}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12, color: '#64748b', minWidth: 45, textAlign: 'right' }}>
          {Math.round(zoom * 100)}%
        </span>

        <span style={{ fontSize: 12, color: saved ? '#22d3ee' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: saved ? '#22d3ee' : '#f59e0b' }} />
          {saved ? 'Salvo' : 'Salvando...'}
        </span>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left Toolbar */}
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 30, background: 'rgba(15,25,40,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          {tools.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => { setTool(t.id); setConnectFrom(null) }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tool === t.id ? 'white' : '#94a3b8',
                background: tool === t.id ? '#4f8ef7' : 'transparent',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                if (tool !== t.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = '#e2e8f0'
                }
              }}
              onMouseLeave={(e) => {
                if (tool !== t.id) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
            >
              {t.icon}
            </button>
          ))}

          {/* Separator */}
          <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px auto' }} />

          {/* Zoom In */}
          <button
            title="Zoom in"
            onClick={zoomIn}
            style={{ width: 36, height: 36, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'background 0.12s, color 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#e2e8f0' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>

          {/* Zoom Out */}
          <button
            title="Zoom out"
            onClick={zoomOut}
            style={{ width: 36, height: 36, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'background 0.12s, color 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#e2e8f0' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>

          {/* Fit to screen */}
          <button
            title="Ajustar tela"
            onClick={fitToScreen}
            style={{ width: 36, height: 36, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'background 0.12s, color 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#e2e8f0' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
          </button>
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            cursor: tool === 'select' ? 'default' : 'crosshair',
            background: '#ffffff',
            backgroundImage: dotPattern,
            backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
            backgroundPosition: `${dotOffsetX}px ${dotOffsetY}px`,
          }}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveGlobal}
          onMouseUp={handleMouseUpGlobal}
          onMouseLeave={handleMouseUpGlobal}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        >
          {/* SVG for edges */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 5 }}
          >
            <SvgDefs />
            {/* Live edge preview while dragging from a handle */}
            {liveEdge && (() => {
              const dx = Math.abs(liveEdge.mx - liveEdge.x1) * 0.5
              const d = `M${liveEdge.x1},${liveEdge.y1} C${liveEdge.x1 + dx},${liveEdge.y1} ${liveEdge.mx - dx},${liveEdge.my} ${liveEdge.mx},${liveEdge.my}`
              return <path d={d} fill="none" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            })()}
            {edges.map((edge) => {
              const from = elements.find((e) => e.id === edge.fromId)
              const to = elements.find((e) => e.id === edge.toId)
              if (!from || !to) return null
              const scaledFrom = { ...from, x: from.x * zoom + pan.x, y: from.y * zoom + pan.y, width: from.width * zoom, height: from.height * zoom }
              const scaledTo = { ...to, x: to.x * zoom + pan.x, y: to.y * zoom + pan.y, width: to.width * zoom, height: to.height * zoom }
              const isEdgeSel = selectedEdgeId === edge.id
              return (
                <path
                  key={edge.id}
                  d={getBezierPath(scaledFrom, scaledTo)}
                  fill="none"
                  stroke={isEdgeSel ? '#f87171' : '#93c5fd'}
                  strokeWidth={isEdgeSel ? 2 : 1.5}
                  markerEnd={isEdgeSel ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEdgeId(isEdgeSel ? null : edge.id)
                    setSelectedId(null)
                  }}
                />
              )
            })}
          </svg>

          {/* Elements */}
          {elements.map((el) => renderElementContent(el))}
        </div>
      </div>

      {/* Image modal */}
      {imageModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setImageModal(null)}
        >
          <div
            style={{ background: '#1a2535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, width: 360, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 18 }}>Adicionar Imagem</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Upload de arquivo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFileUpload(f) }}
              />
              <button
                className="btn-secondary"
                style={{ width: '100%', fontSize: 13 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Escolher arquivo
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 8 }}>URL da imagem</label>
              <input
                className="input-field"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleImageUrlSubmit() }}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setImageModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleImageUrlSubmit} disabled={!imageUrl.trim()}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {videoModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setVideoModal(null)}
        >
          <div
            style={{ background: '#1a2535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, width: 360, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 18 }}>Adicionar Vídeo YouTube</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 8 }}>URL do YouTube</label>
              <input
                className="input-field"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVideoUrlSubmit() }}
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setVideoModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleVideoUrlSubmit} disabled={!videoUrl.trim()}>Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
