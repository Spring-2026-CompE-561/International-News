"use client"

import { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"
import { useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

const MOVEMENT_DAMPING = 1400
const THETA = 0.3

export interface GlobeArticle {
  id: number
  storyId: number
  title: string
  dek: string | null
  image_url: string | null
  topic: string | null
  source: string | null
  published_at: string | null
  source_count: number
  country_count: number
}

export interface GlobeMarker {
  location: [number, number]
  size: number
  country: string
  articles: GlobeArticle[]
}

interface Props {
  className?: string
  markers: GlobeMarker[]
  isDark?: boolean
  onMarkerClick: (marker: GlobeMarker) => void
}

const LIGHT = {
  dark: 0, diffuse: 0.4, mapBrightness: 1.2,
  baseColor: [1, 1, 1] as [number, number, number],
  glowColor: [1, 1, 1] as [number, number, number],
}

const DARK = {
  dark: 1, diffuse: 1.2, mapBrightness: 6,
  baseColor: [0.3, 0.3, 0.3] as [number, number, number],
  glowColor: [1, 1, 1] as [number, number, number],
}

// Projects lat/lng to normalised screen coords [-1,1] using cobe v2's exact math.
// Cobe's U(lat,lng) = [cos(lat)*cos(lng), sin(lat), -cos(lat)*sin(lng)]
// Markers are rendered at elevation 0.85 (ee=0.8 + markerElevation=0.05).
function projectMarker(lat: number, lng: number, phi: number) {
  const E = 0.85 // cobe default elevation
  const latR = (lat * Math.PI) / 180
  const lngR = (lng * Math.PI) / 180
  const cosLat = Math.cos(latR)
  const x = cosLat * Math.cos(lngR) * E
  const y = Math.sin(latR) * E
  const z = -cosLat * Math.sin(lngR) * E

  const sp = Math.sin(phi), cp = Math.cos(phi)
  const st = Math.sin(THETA), ct = Math.cos(THETA)

  // cobe's screen-x and screen-y in [-1,1] (square canvas, scale=1, offset=[0,0])
  const sx = cp * x + sp * z
  const sy = sp * st * x + ct * y - cp * st * z
  const visible = -sp * ct * x + st * y + cp * ct * z > 0

  return { x: sx, y: sy, visible }
}

export function GlobeInteractive({ className, markers, isDark = false, onMarkerClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(0)
  const widthRef = useRef(0)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const currentPhiRef = useRef(0)
  const pointerDownPos = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const r = useMotionValue(0)
  const rs = useSpring(r, { mass: 1, damping: 30, stiffness: 100 })

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current)
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  const getNearestMarker = useCallback(
    (nx: number, ny: number) => {
      const phi = currentPhiRef.current
      let closestDist = Infinity
      let closest: GlobeMarker | null = null
      for (const m of markers) {
        const proj = projectMarker(m.location[0], m.location[1], phi)
        if (!proj.visible) continue
        const d = Math.sqrt((nx - proj.x) ** 2 + (ny - proj.y) ** 2)
        if (d < closestDist) { closestDist = d; closest = m }
      }
      return { marker: closest, dist: closestDist }
    },
    [markers]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleClick = (e: MouseEvent) => {
      if (isDragging.current) return
      const rect = canvas.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = 1 - ((e.clientY - rect.top) / rect.height) * 2
      const { marker, dist } = getNearestMarker(nx, ny)
      if (marker && dist < 0.12) onMarkerClick(marker)
    }

    const handleHover = (e: MouseEvent) => {
      if (pointerInteracting.current !== null) return
      const rect = canvas.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = 1 - ((e.clientY - rect.top) / rect.height) * 2
      const { dist } = getNearestMarker(nx, ny)
      canvas.style.cursor = dist < 0.12 ? "pointer" : "grab"
    }

    canvas.addEventListener("click", handleClick)
    canvas.addEventListener("mousemove", handleHover)
    return () => {
      canvas.removeEventListener("click", handleClick)
      canvas.removeEventListener("mousemove", handleHover)
    }
  }, [getNearestMarker, onMarkerClick])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onResize = () => { widthRef.current = canvas.offsetWidth }
    window.addEventListener("resize", onResize)
    onResize()

    const colors = isDark ? DARK : LIGHT
    const globe = createGlobe(canvas, {
      width: (widthRef.current || 600) * 2,
      height: (widthRef.current || 600) * 2,
      devicePixelRatio: 2,
      phi: 0,
      theta: THETA,
      mapSamples: 16000,
      markerColor: [242 / 255, 181 / 255, 68 / 255],
      markers: markers.map((m) => ({ location: m.location, size: m.size })),
      ...colors,
    })

    // cobe v2 has no onRender — drive the animation loop manually
    let rafId: number
    function animate() {
      if (!pointerInteracting.current) phiRef.current += 0.005
      const phi = phiRef.current + rs.get()
      currentPhiRef.current = phi
      const w = canvas!.offsetWidth || widthRef.current
      globe.update({ phi, width: w * 2, height: w * 2 })
      rafId = requestAnimationFrame(animate)
    }
    animate()

    setTimeout(() => { canvas.style.opacity = "1" }, 0)

    return () => {
      cancelAnimationFrame(rafId)
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [rs, markers, isDark])

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[560px]", className)}>
      <canvas
        ref={canvasRef}
        className="size-full opacity-0 transition-opacity duration-500 contain-[layout_paint_size]"
        style={{ cursor: "grab" }}
        onPointerDown={(e) => {
          isDragging.current = false
          pointerDownPos.current = { x: e.clientX, y: e.clientY }
          updatePointerInteraction(e.clientX)
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => {
          const dx = e.clientX - pointerDownPos.current.x
          const dy = e.clientY - pointerDownPos.current.y
          if (Math.sqrt(dx * dx + dy * dy) > 4) isDragging.current = true
          updateMovement(e.clientX)
        }}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  )
}
