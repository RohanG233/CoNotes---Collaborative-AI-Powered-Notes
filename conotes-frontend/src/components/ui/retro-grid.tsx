import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/* ─── WebGL constants ───────────────────────────────────────────── */
const DUR = 15
const FALLBACK_KF = 'retro-grid-fallback-scroll'
const FALLBACK_CSS = `
@keyframes ${FALLBACK_KF} {
  from { transform: translateY(-50%); }
  to   { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  [data-retro-grid-scroll] { animation: none !important; transform: translateY(-50%) !important; }
}
`

const VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

/* Inline the numeric constants directly so the shader compiles without
   needing template interpolation at import time */
const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 u_container_size;
uniform vec2 u_viewport_size;
uniform vec4 u_line_color;
uniform float u_angle;
uniform float u_cell_size;
uniform float u_device_pixel_ratio;
uniform float u_time;
float renderLine(float coord, float aaWidth, float soft) {
  return 1.0 - smoothstep(0.92, 0.92 + aaWidth * (1.5 + soft), coord);
}
void main() {
  float angle = radians(clamp(u_angle, 1.0, 89.0));
  float sinA = sin(angle); float cosA = cos(angle);
  vec2 screen = vec2(
    (gl_FragCoord.x / u_device_pixel_ratio) - u_container_size.x * 0.5,
    u_container_size.y * 0.5 - (gl_FragCoord.y / u_device_pixel_ratio)
  );
  vec3 ro = vec3(0.0, 0.0, 200.0);
  vec3 rd = normalize(vec3(screen, -200.0));
  vec3 pX = vec3(1.0, 0.0, 0.0);
  vec3 pY = vec3(0.0, cosA, sinA);
  vec3 pN = normalize(cross(pX, pY));
  float denom = dot(rd, pN);
  if (abs(denom) < 0.0001) { discard; }
  float dist = dot(-ro, pN) / denom;
  if (dist <= 0.0) { discard; }
  vec3 hit = ro + rd * dist;
  float lx = hit.x;
  float ly = dot(hit, pY);
  float gW = u_viewport_size.x * 6.0;
  float gH = u_viewport_size.y * 3.0;
  float speed = (gH * 0.5) / 15.0;
  float offY = u_time * speed;
  float gLeft = -0.5 * u_container_size.x + -2.0 * u_container_size.x;
  float gTop  = -0.5 * u_container_size.y + -0.5 * gH;
  vec2 pos = vec2(lx - gLeft, ly - gTop);
  if (pos.x < 0.0 || pos.y < 0.0 || pos.x > gW || pos.y > gH) { discard; }
  vec2 pat = vec2(pos.x, pos.y - offY);
  vec2 wrap = mod(pat + vec2(0.5), u_cell_size);
  vec2 dd = max(fwidth(pat), vec2(0.0001));
  vec2 aa = dd * 0.9;
  float hSpan = u_cell_size / dd.y;
  float hComp = 1.0 - smoothstep(1.2, 2.8, hSpan);
  float vSpan = u_cell_size / dd.x;
  float side = abs((pos.x / gW) * 2.0 - 1.0);
  float vEdge = smoothstep(0.45, 0.95, side);
  float vTop  = 1.0 - smoothstep(u_cell_size * 2.0, u_cell_size * 6.0, pos.y);
  float vComp = (1.0 - smoothstep(1.0, 2.6, vSpan)) * vEdge * vTop;
  float hSoft = 1.0 + hComp * 3.0;
  float vSoft = 1.0 + vComp * 3.5;
  float vLod  = smoothstep(0.22, 0.64, vComp);
  float vFine = renderLine(wrap.x, aa.x, vSoft);
  float vWrapLod = mod(pat.x + 0.5, u_cell_size * 2.0);
  float vCoarse  = renderLine(vWrapLod, aa.x, vSoft + vLod);
  float vLine = max(vFine * (1.0 - vLod), vCoarse * vLod);
  float hLod1 = 1.0 - smoothstep(2.8, 5.6, hSpan);
  float hLod2 = 1.0 - smoothstep(1.4, 3.0, hSpan);
  float hFine  = renderLine(wrap.y, aa.y, hSoft);
  float hWrap1 = mod(pat.y + 0.5, u_cell_size * 2.0);
  float hWrap2 = mod(pat.y + 0.5, u_cell_size * 4.0);
  float hCoarse = renderLine(hWrap1, aa.y, hSoft + hLod1);
  float hExtra  = renderLine(hWrap2, aa.y, hSoft + hLod1 + hLod2);
  float hRed  = max(hFine * (1.0 - hLod1), hCoarse * hLod1);
  float hLine = max(hRed  * (1.0 - hLod2), hExtra  * hLod2);
  float line = max(vLine, hLine);
  if (line <= 0.001) { discard; }
  float alpha = u_line_color.a * line;
  gl_FragColor = vec4(u_line_color.rgb * alpha, alpha);
}
`

/* ─── Helpers ───────────────────────────────────────────────────── */
function clampVal(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi)
}

let resolveCtx: CanvasRenderingContext2D | null | undefined
function getResolveCtx() {
  if (resolveCtx !== undefined) return resolveCtx
  const c = document.createElement('canvas'); c.width = 1; c.height = 1
  resolveCtx = c.getContext('2d', { willReadFrequently: true })
  return resolveCtx
}

function resolveColor(color: string, el: HTMLElement): Float32Array {
  const span = document.createElement('span')
  span.style.cssText = `color:${color};opacity:0;pointer-events:none;position:absolute`
  el.appendChild(span)
  const raw = getComputedStyle(span).color
  span.remove()
  const ctx = getResolveCtx()
  if (!ctx) return new Float32Array([0.5, 0.5, 0.5, 1])
  ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = raw; ctx.fillRect(0, 0, 1, 1)
  const px = ctx.getImageData(0, 0, 1, 1).data
  return new Float32Array([px[0] / 255, px[1] / 255, px[2] / 255, px[3] / 255])
}

function makeShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src); gl.compileShader(s)
  if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s
  console.error(gl.getShaderInfoLog(s))
  gl.deleteShader(s); return null
}

function makeProgram(gl: WebGLRenderingContext) {
  const vs = makeShader(gl, gl.VERTEX_SHADER, VERT)
  const fs = makeShader(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  const p = gl.createProgram()!
  gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p)
  gl.deleteShader(vs); gl.deleteShader(fs)
  if (gl.getProgramParameter(p, gl.LINK_STATUS)) return p
  console.error(gl.getProgramInfoLog(p))
  gl.deleteProgram(p); return null
}

function isDark(qs: MediaQueryList) {
  const cl = document.documentElement.classList
  if (cl.contains('dark')) return true
  if (cl.contains('light')) return false
  return qs.matches
}

/* ─── Props ─────────────────────────────────────────────────────── */
interface RetroGridProps extends HTMLAttributes<HTMLDivElement> {
  angle?: number
  cellSize?: number
  opacity?: number
  lightLineColor?: string
  darkLineColor?: string
}

/* ─── Component ─────────────────────────────────────────────────── */
export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.6,
  lightLineColor = 'gray',
  darkLineColor = 'gray',
  style,
  ...props
}: RetroGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  /* Keep mutable refs for values used inside the RAF loop */
  const angleRef = useRef(angle)
  const cellRef = useRef(cellSize)
  const darkRef = useRef(darkLineColor)
  const lightRef = useRef(lightLineColor)
  const syncRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    angleRef.current = angle
    cellRef.current = cellSize
    darkRef.current = darkLineColor
    lightRef.current = lightLineColor
    syncRef.current?.()
  }, [angle, cellSize, darkLineColor, lightLineColor])

  useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return

    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cs = window.matchMedia('(prefers-color-scheme: dark)')

    let rafId: number | null = null
    let w = 0, h = 0, dpr = 1
    let gl: WebGLRenderingContext | null = null
    let prog: WebGLProgram | null = null
    let buf: WebGLBuffer | null = null
    let lineColor = resolveColor(lightRef.current, root)
    let visible = true, ctxLost = false

    // uniform locations
    let uAngle: WebGLUniformLocation | null = null
    let uCell: WebGLUniformLocation | null = null
    let uContSize: WebGLUniformLocation | null = null
    let uDpr: WebGLUniformLocation | null = null
    let uColor: WebGLUniformLocation | null = null
    let uTime: WebGLUniformLocation | null = null
    let uVpSize: WebGLUniformLocation | null = null
    let aPos = -1

    const init = (): boolean => {
      const g = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true })
      if (!g || !g.getExtension('OES_standard_derivatives')) return false
      gl = g

      const p = makeProgram(gl)
      if (!p) return false
      prog = p

      aPos = gl.getAttribLocation(prog, 'a_position')
      uAngle = gl.getUniformLocation(prog, 'u_angle')
      uCell = gl.getUniformLocation(prog, 'u_cell_size')
      uContSize = gl.getUniformLocation(prog, 'u_container_size')
      uDpr = gl.getUniformLocation(prog, 'u_device_pixel_ratio')
      uColor = gl.getUniformLocation(prog, 'u_line_color')
      uTime = gl.getUniformLocation(prog, 'u_time')
      uVpSize = gl.getUniformLocation(prog, 'u_viewport_size')

      const b = gl.createBuffer()
      if (!b) return false
      buf = b
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      return true
    }

    const resize = () => {
      w = Math.floor(root.clientWidth)
      h = Math.floor(root.clientHeight)
      if (!w || !h || !gl) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const updateColor = () => {
      lineColor = resolveColor(isDark(cs) ? darkRef.current : lightRef.current, root)
    }

    const draw = (ts: number) => {
      if (!w || !h || !gl || !prog || !buf || ctxLost) return
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uAngle, clampVal(angleRef.current, 1, 89))
      gl.uniform1f(uCell, Math.max(cellRef.current, 1))
      gl.uniform2f(uContSize, w, h)
      gl.uniform1f(uDpr, dpr)
      gl.uniform4fv(uColor, lineColor)
      gl.uniform1f(uTime, rm.matches ? 0 : ts / 1000)
      gl.uniform2f(uVpSize, window.innerWidth, window.innerHeight)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const stop = () => { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null } }

    const loop = (ts: number) => {
      draw(ts)
      if (!rm.matches && visible) { rafId = requestAnimationFrame(loop) } else { rafId = null }
    }

    const sync = () => {
      if (ctxLost) { stop(); setReady(false); return }
      if (!gl || !prog || !buf) {
        if (!init()) { stop(); setReady(false); return }
      }
      resize()
      if (!w || !h) { stop(); return }
      updateColor()
      draw(performance.now())
      setReady(true)
      if (rm.matches || !visible) { stop(); return }
      if (rafId === null) rafId = requestAnimationFrame(loop)
    }

    syncRef.current = sync

    const ro = new ResizeObserver(sync); ro.observe(root)
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? false
      visible ? sync() : stop()
    }); io.observe(root)
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const onResize = sync
    const onLost = (e: Event) => { e.preventDefault(); ctxLost = true; stop(); setReady(false) }
    const onRestored = () => { ctxLost = false; sync() }

    rm.addEventListener('change', sync)
    cs.addEventListener('change', sync)
    window.addEventListener('resize', onResize)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    sync()

    return () => {
      stop()
      syncRef.current = null
      ro.disconnect(); io.disconnect(); mo.disconnect()
      rm.removeEventListener('change', sync)
      cs.removeEventListener('change', sync)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      if (gl) {
        if (buf) gl.deleteBuffer(buf)
        if (prog) gl.deleteProgram(prog)
      }
    }
  }, [])

  const norm = clampVal(angle, 1, 89)
  const normCell = Math.max(cellSize, 1)
  const fbLight: CSSProperties = {
    animation: `${FALLBACK_KF} ${DUR}s linear infinite`,
    backgroundImage: `linear-gradient(to right,${lightLineColor} 1px,transparent 0),linear-gradient(to bottom,${lightLineColor} 1px,transparent 0)`,
    backgroundSize: `${normCell}px ${normCell}px`,
    transform: 'translateY(-50%)',
  }
  const fbDark: CSSProperties = {
    ...fbLight,
    backgroundImage: `linear-gradient(to right,${darkLineColor} 1px,transparent 0),linear-gradient(to bottom,${darkLineColor} 1px,transparent 0)`,
  }

  return (
    <div
      ref={rootRef}
      className={cn('retro-grid-root', className)}
      style={style}
      {...props}
    >
      <style>{FALLBACK_CSS}</style>

      {/* CSS fallback — shown until WebGL is ready */}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, perspective: '200px', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, transform: `rotateX(${norm}deg)` }}>
            <div
              data-retro-grid-scroll
              className="retro-grid-fallback-light"
              style={{ position: 'absolute', inset: 0, marginLeft: '-200%', height: '300vh', width: '600vw', ...fbLight }}
            />
            <div
              data-retro-grid-scroll
              className="retro-grid-fallback-dark"
              style={{ position: 'absolute', inset: 0, marginLeft: '-200%', height: '300vh', width: '600vw', ...fbDark }}
            />
          </div>
        </div>
      )}

      {/* WebGL canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          opacity: ready ? opacity : 0,
          pointerEvents: 'none',
          transition: 'opacity 600ms ease',
        }}
      />

      {/* Fade overlay — bg colour bleeds up from the bottom */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, var(--color-bg) 0%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
