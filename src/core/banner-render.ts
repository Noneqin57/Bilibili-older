// ========== Types ==========

export interface LayerResource {
  src: string;
  id?: number;
}

export interface LayerScale {
  initial?: number;
  offset?: number;
  offsetCurve?: [number, number, number, number];
}

export interface LayerTranslate {
  initial?: [number, number];
  offset?: [number, number];
  offsetCurve?: [number, number, number, number];
}

export interface LayerRotate {
  initial?: number;
  offset?: number;
  offsetCurve?: [number, number, number, number];
}

export interface LayerBlur {
  initial?: number;
  offset?: number;
  wrap?: 'clamp' | 'alternate';
}

export interface LayerOpacity {
  initial?: number;
  offset?: number;
  wrap?: 'clamp' | 'alternate';
}

export interface Layer {
  resources: LayerResource[];
  scale?: LayerScale;
  rotate?: LayerRotate;
  translate?: LayerTranslate;
  blur?: LayerBlur;
  opacity?: LayerOpacity;
  id?: number;
  name?: string;
}

export interface SplitLayerData {
  version: string;
  layers: Layer[];
}

export interface LayersV2 {
  resources: LayerResource[];
  scale?: LayerScale;
  rotate?: LayerRotate;
  translate?: LayerTranslate;
  blur?: LayerBlur;
  opacity?: LayerOpacity;
  id?: number;
  name?: string;
}

export interface MultiLayerConfig {
  version: number;
  layers: LayersV2[];
}

export interface BannerConfig {
  type: 'multi-layer';
  multiLayer: MultiLayerConfig;
}

type WrappableProperty = {
  wrap?: 'clamp' | 'alternate';
  offsetCurve?: [number, number, number, number];
};

// ========== Renderer ==========

const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 1e-7;
const SUBDIVISION_MAX_ITERATIONS = 10;
const K_SPLINE_TABLE_SIZE = 11;
const K_SAMPLE_STEP_SIZE = 1 / (K_SPLINE_TABLE_SIZE - 1);

function calcA(a1: number, a2: number) { return 1 - 3 * a2 + 3 * a1; }
function calcB(a1: number, a2: number) { return 3 * a2 - 6 * a1; }
function calcC(a1: number) { return 3 * a1; }

function calcBezier(t: number, a1: number, a2: number) {
  return ((calcA(a1, a2) * t + calcB(a1, a2)) * t + calcC(a1)) * t;
}

function getSlope(t: number, a1: number, a2: number) {
  return 3 * calcA(a1, a2) * t * t + 2 * calcB(a1, a2) * t + calcC(a1);
}

function binarySubdivide(x: number, a: number, b: number, mX1: number, mX2: number): number {
  let currentT = a + (b - a) / 2;
  let currentX = calcBezier(currentT, mX1, mX2) - x;
  let i = 0;
  while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS) {
    currentX > 0 ? b = currentT : a = currentT;
    currentT = a + (b - a) / 2;
    currentX = calcBezier(currentT, mX1, mX2) - x;
  }
  return currentT;
}

function newtonRaphsonIterate(x: number, guessT: number, mX1: number, mX2: number): number {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const slope = getSlope(guessT, mX1, mX2);
    if (slope === 0) return guessT;
    guessT -= (calcBezier(guessT, mX1, mX2) - x) / slope;
  }
  return guessT;
}

function bezier(mX1: number, mY1: number, mX2: number, mY2: number): (x: number) => number {
  if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }
  if (mX1 === mY1 && mX2 === mY2) return (x) => x;

  const sampleValues = new Float32Array(K_SPLINE_TABLE_SIZE);
  for (let i = 0; i < K_SPLINE_TABLE_SIZE; ++i) {
    sampleValues[i] = calcBezier(i * K_SAMPLE_STEP_SIZE, mX1, mX2);
  }

  function getTForX(x: number): number {
    let intervalStart = 0;
    let currentSample = 1;
    const lastSample = K_SPLINE_TABLE_SIZE - 1;
    for (; currentSample !== lastSample && sampleValues[currentSample] <= x; ++currentSample) {
      intervalStart += K_SAMPLE_STEP_SIZE;
    }
    --currentSample;
    const dist = (x - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessT = intervalStart + dist * K_SAMPLE_STEP_SIZE;
    const slope = getSlope(guessT, mX1, mX2);
    if (slope >= NEWTON_MIN_SLOPE) return newtonRaphsonIterate(x, guessT, mX1, mX2);
    else if (slope === 0) return guessT;
    else return binarySubdivide(x, intervalStart, intervalStart + K_SAMPLE_STEP_SIZE, mX1, mX2);
  }

  return (x: number) => {
    if (x === 0 || x === 1) return x;
    return calcBezier(getTForX(x), mY1, mY2);
  };
}

function makeCurve(curve: [number, number, number, number]): (x: number) => number {
  const bezierCurve = bezier(...curve);
  return (x: number) => (x > 0 ? bezierCurve(x) : -bezierCurve(-x));
}

const IDENTITY_CURVE = (x: number) => x;
type CurveResolver = typeof IDENTITY_CURVE;

function resolveScalarCurve(prop: WrappableProperty | undefined): CurveResolver {
  return prop?.offsetCurve ? makeCurve(prop.offsetCurve) : IDENTITY_CURVE;
}

function applyAlternateOpacity(value: number): number {
  let foldedOpacity = Math.abs(value % 1);
  if (Math.abs(value % 2) >= 1) foldedOpacity = 1 - foldedOpacity;
  return foldedOpacity;
}

function resolveBlurValue(initial: number, offset: number, curve: CurveResolver, normalizedDisplacementX: number, prop: WrappableProperty): number {
  const value = initial + offset * curve(normalizedDisplacementX);
  return (!prop.wrap || prop.wrap === 'clamp') ? Math.max(0, value) : Math.abs(value);
}

function resolveOpacityValue(initial: number, offset: number, curve: CurveResolver, normalizedDisplacementX: number, prop: WrappableProperty): number {
  const value = initial + offset * curve(normalizedDisplacementX);
  if (!prop.wrap || prop.wrap === 'clamp') return Math.max(0, Math.min(1, value));
  return applyAlternateOpacity(value);
}

interface LayerSnapshot {
  dynamicScale: number;
  initialScale: number;
  rotate: number;
  translate: [number, number];
  blur: number;
  opacity: number;
}

interface LayerCurves {
  scale: CurveResolver;
  rotate: CurveResolver;
  translate: CurveResolver;
  blur: CurveResolver;
  opacity: CurveResolver;
}

interface ResourceMetrics {
  intrinsicWidth: number;
  intrinsicHeight: number;
}

type ResourceElement = HTMLImageElement | HTMLCanvasElement;

const VIDEO_DRAW_INTERVAL_MS = 30.3;

export class DynamicBannerRenderer {
  private container: HTMLElement | null = null;
  private layers: LayersV2[] = [];
  private layerElements: HTMLElement[] = [];
  private resourceElements: ResourceElement[] = [];
  private videoElements: Array<HTMLVideoElement | null> = [];
  private canvasContexts: Array<CanvasRenderingContext2D | null> = [];
  private layerSnapshots: LayerSnapshot[] = [];
  private resourceMetrics: ResourceMetrics[] = [];
  private layerCurves: LayerCurves[] = [];
  private videoDrawTimerId = 0;
  private idmObserver: MutationObserver | null = null;
  private idmScanFrameId = 0;

  private normalizedDisplacementX = 0;
  private pointerAnchorClientX = 0;
  private bannerHeightScale = 1;
  private lastRenderedDisplacementX = NaN;
  private animationFrameId = 0;
  private isPointerActiveInBanner = false;

  private _boundMouseEnter: (e: MouseEvent) => void;
  private _boundMouseMove: (e: MouseEvent) => void;
  private _boundMouseLeave: () => void;
  private _boundResize: () => void;
  private _boundBlur: () => void;
  private _frameCallback: () => void;

  constructor() {
    this._boundMouseEnter = this._handleMouseEnter.bind(this);
    this._boundMouseMove = this._handleMouseMove.bind(this);
    this._boundMouseLeave = this._handleMouseLeave.bind(this);
    this._boundResize = this._handleResize.bind(this);
    this._boundBlur = this._handleBlur.bind(this);
    this._frameCallback = this._renderFrame.bind(this);
  }

  public render(container: HTMLElement, bannerConfig: BannerConfig): void {
    if (!bannerConfig || bannerConfig.type !== 'multi-layer' || bannerConfig.multiLayer.version !== 2) {
      console.warn('[DynamicBannerRenderer] 不支持的 Banner 配置或类型');
      return;
    }

    this.container = container;
    this.layers = bannerConfig.multiLayer.layers;
    this.bannerHeightScale = container.clientHeight / 155;

    this._buildSnapshots();
    this._buildDOM();
    this._startIdmSuppression();

    this.container.addEventListener('mouseenter', this._boundMouseEnter);
    this.container.addEventListener('mousemove', this._boundMouseMove);
    this.container.addEventListener('mouseleave', this._boundMouseLeave);
    window.addEventListener('resize', this._boundResize);
    window.addEventListener('blur', this._boundBlur);
  }

  public dispose(): void {
    if (this.container) {
      this.container.removeEventListener('mouseenter', this._boundMouseEnter);
      this.container.removeEventListener('mousemove', this._boundMouseMove);
      this.container.removeEventListener('mouseleave', this._boundMouseLeave);
    }
    window.removeEventListener('resize', this._boundResize);
    window.removeEventListener('blur', this._boundBlur);
    cancelAnimationFrame(this.animationFrameId);
    if (this.videoDrawTimerId) {
      window.clearInterval(this.videoDrawTimerId);
      this.videoDrawTimerId = 0;
    }
    this._stopIdmSuppression();

    this.videoElements.forEach(video => {
      if (!video) return;
      video.pause();
      video.src = '';
      video.load();
    });

    if (this.container) {
      const wrapper = this.container.querySelector('.dynamic-banner-wrapper');
      wrapper?.remove();
    }

    this.container = null;
    this.layers = [];
    this.layerElements = [];
    this.resourceElements = [];
    this.videoElements = [];
    this.canvasContexts = [];
    this.layerSnapshots = [];
    this.resourceMetrics = [];
    this.layerCurves = [];
    this.normalizedDisplacementX = 0;
    this.pointerAnchorClientX = 0;
    this.bannerHeightScale = 1;
    this.lastRenderedDisplacementX = NaN;
    this.animationFrameId = 0;
    this.isPointerActiveInBanner = false;
  }

  private _buildSnapshots(): void {
    this.layerSnapshots = this.layers.map(layer => ({
      dynamicScale: 1,
      initialScale: layer.scale?.initial ?? 1,
      rotate: 0,
      translate: [layer.translate?.initial?.[0] ?? 0, layer.translate?.initial?.[1] ?? 0],
      blur: layer.blur?.initial ?? 0,
      opacity: layer.opacity?.initial ?? 1,
    }));
    this.resourceMetrics = this.layers.map(() => ({ intrinsicWidth: 0, intrinsicHeight: 0 }));
    this.layerCurves = this.layers.map(layer => ({
      scale: resolveScalarCurve(layer.scale),
      rotate: resolveScalarCurve(layer.rotate),
      translate: resolveScalarCurve(layer.translate),
      blur: resolveScalarCurve(layer.blur),
      opacity: resolveScalarCurve(layer.opacity),
    }));
  }

  private _buildDOM(): void {
    if (!this.container) return;

    const existingLayers = this.container.querySelectorAll('.layer');
    existingLayers.forEach(l => l.remove());

    let wrapper = this.container.querySelector('.dynamic-banner-wrapper') as HTMLElement;
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'dynamic-banner-wrapper';
      wrapper.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;';
      this.container.appendChild(wrapper);
    }

    this.layerElements = [];
    this.resourceElements = [];
    this.videoElements = this.layers.map(() => null);
    this.canvasContexts = this.layers.map(() => null);
    const fragment = document.createDocumentFragment();

    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
      const layer = this.layers[layerIndex];
      const layerElement = document.createElement('div');
      layerElement.className = 'layer';
      layerElement.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';

      const src = layer.resources[0]?.src ?? '';
      const resourceElement = this._createResourceElement(src, layerIndex);

      layerElement.appendChild(resourceElement);
      fragment.appendChild(layerElement);
      this.layerElements.push(layerElement);
      this.resourceElements.push(resourceElement);
    }

    wrapper.appendChild(fragment);
    this._startVideoDrawLoop();
    this._scheduleRender(true);
  }

  private _createResourceElement(src: string, layerIndex: number): ResourceElement {
    if (/\.(webm|mp4)$/i.test(src)) {
      const canvas = document.createElement('canvas');
      this.canvasContexts[layerIndex] = canvas.getContext('2d');

      const video = document.createElement('video');
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = 'auto';
      video.controls = false;
      video.disablePictureInPicture = true;
      video.setAttribute('x-webkit-airplay', 'deny');
      video.setAttribute('aria-hidden', 'true');
      const ensurePlay = () => {
        if (video.paused) {
          video.play().catch(() => { });
        }
      };
      video.addEventListener('loadeddata', ensurePlay, { once: true });
      video.addEventListener('canplay', ensurePlay, { once: true });
      video.addEventListener('play', () => this._drawVideoFrame(layerIndex));
      video.addEventListener('error', () => {
        console.warn(`[DynamicBannerRenderer] 视频加载失败: ${src}`);
      });
      this.videoElements[layerIndex] = video;
      this._registerVideoMetrics(video, layerIndex, canvas);
      return canvas;
    }

    const img = document.createElement('img');
    img.src = src;
    this._registerImageMetrics(img, layerIndex);
    return img;
  }

  private _registerImageMetrics(img: HTMLImageElement, layerIndex: number): void {
    const syncMetrics = () => {
      this._captureResourceMetrics(layerIndex, img.naturalWidth, img.naturalHeight, img);
    };
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      syncMetrics();
      return;
    }
    img.addEventListener('load', syncMetrics, { once: true });
  }

  private _registerVideoMetrics(video: HTMLVideoElement, layerIndex: number, resourceElement: ResourceElement): void {
    const syncMetrics = () => {
      this._captureResourceMetrics(layerIndex, video.videoWidth, video.videoHeight, resourceElement);
      this._drawVideoFrame(layerIndex);
    };
    if (video.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0) {
      syncMetrics();
      return;
    }
    video.addEventListener('loadedmetadata', syncMetrics, { once: true });
  }

  private _captureResourceMetrics(layerIndex: number, intrinsicWidth: number, intrinsicHeight: number, resourceElement: ResourceElement): void {
    if (!this.container || intrinsicWidth <= 0 || intrinsicHeight <= 0) return;

    this.resourceMetrics[layerIndex] = { intrinsicWidth, intrinsicHeight };
    this._applyResourceDimensions(layerIndex, resourceElement);
    this._scheduleRender(true);
  }

  private _applyResourceDimensions(layerIndex: number, resourceElement: ResourceElement = this.resourceElements[layerIndex]): void {
    const metrics = this.resourceMetrics[layerIndex];
    const snapshot = this.layerSnapshots[layerIndex];
    if (!resourceElement || !metrics || !snapshot || metrics.intrinsicWidth <= 0 || metrics.intrinsicHeight <= 0) return;

    const renderWidth = metrics.intrinsicWidth * this.bannerHeightScale * snapshot.initialScale;
    const renderHeight = metrics.intrinsicHeight * this.bannerHeightScale * snapshot.initialScale;

    if (resourceElement instanceof HTMLCanvasElement) {
      const width = Math.max(1, Math.round(renderWidth));
      const height = Math.max(1, Math.round(renderHeight));
      if (resourceElement.width !== width) resourceElement.width = width;
      if (resourceElement.height !== height) resourceElement.height = height;
      this._drawVideoFrame(layerIndex);
    }

    resourceElement.style.width = `${renderWidth}px`;
    resourceElement.style.height = `${renderHeight}px`;
  }

  private _startVideoDrawLoop(): void {
    if (this.videoDrawTimerId || !this.videoElements.some(Boolean)) return;
    this.videoDrawTimerId = window.setInterval(() => this._drawAllVideoFrames(), VIDEO_DRAW_INTERVAL_MS);
  }

  private _drawAllVideoFrames(): void {
    for (let layerIndex = 0; layerIndex < this.videoElements.length; layerIndex++) {
      this._drawVideoFrame(layerIndex);
    }
  }

  private _drawVideoFrame(layerIndex: number): void {
    const video = this.videoElements[layerIndex];
    const resourceElement = this.resourceElements[layerIndex];
    if (!video || !(resourceElement instanceof HTMLCanvasElement) || video.readyState < 2) return;

    let context = this.canvasContexts[layerIndex];
    if (!context) {
      context = resourceElement.getContext('2d');
      this.canvasContexts[layerIndex] = context;
    }
    if (!context) return;

    const drawWidth = resourceElement.width || video.videoWidth;
    const drawHeight = resourceElement.height || video.videoHeight;
    if (drawWidth <= 0 || drawHeight <= 0) return;

    try {
      context.clearRect(0, 0, drawWidth, drawHeight);
      context.drawImage(video, 0, 0, drawWidth, drawHeight);
    } catch {
      // Ignore transient decode/cross-origin draw errors and draw again on next tick.
    }
  }

  private _startIdmSuppression(): void {
    if (this.idmObserver || !document.body) return;
    this._hideIdmPanelsNearBanner();
    this.idmObserver = new MutationObserver(() => this._scheduleIdmScan());
    this.idmObserver.observe(document.body, { childList: true, subtree: true });
  }

  private _stopIdmSuppression(): void {
    this.idmObserver?.disconnect();
    this.idmObserver = null;
    if (this.idmScanFrameId) {
      cancelAnimationFrame(this.idmScanFrameId);
      this.idmScanFrameId = 0;
    }
  }

  private _scheduleIdmScan(): void {
    if (this.idmScanFrameId) return;
    this.idmScanFrameId = requestAnimationFrame(() => {
      this.idmScanFrameId = 0;
      this._hideIdmPanelsNearBanner();
    });
  }

  private _hideIdmPanelsNearBanner(): void {
    if (!this.container || !document.body) return;
    const bannerRect = this.container.getBoundingClientRect();
    if (bannerRect.width <= 0 || bannerRect.height <= 0) return;

    const candidates = document.body.querySelectorAll<HTMLElement>(
      '[id*="idm"],[id*="IDM"],[class*="idm"],[class*="IDM"],[title*="IDM"],[title*="Download this video"],[title*="download this video"],[aria-label*="IDM"],[aria-label*="Download this video"],[aria-label*="download this video"],iframe[src*="idm"],iframe[src*="IDM"],iframe[src*="idman"]'
    );

    candidates.forEach((candidate) => {
      if (!this._looksLikeIdmPanel(candidate)) return;
      const rect = candidate.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const overlapsBanner = rect.right > bannerRect.left
        && rect.left < bannerRect.right
        && rect.bottom > bannerRect.top
        && rect.top < bannerRect.bottom;
      if (!overlapsBanner) return;

      candidate.style.setProperty('display', 'none', 'important');
      candidate.style.setProperty('visibility', 'hidden', 'important');
      candidate.style.setProperty('opacity', '0', 'important');
    });
  }

  private _looksLikeIdmPanel(candidate: HTMLElement): boolean {
    if (this.container?.contains(candidate)) return false;

    const markerSource = `${candidate.id} ${candidate.className} ${candidate.getAttribute('aria-label') ?? ''} ${candidate.title ?? ''}`.toLowerCase();
    if (markerSource.includes('idm')) return true;

    const text = (candidate.textContent ?? '').trim().toLowerCase();
    if (!text) return false;
    return text.includes('download this video')
      || text.includes('download with idm');
  }

  private _applyAllResourceDimensions(): void {
    for (let layerIndex = 0; layerIndex < this.resourceElements.length; layerIndex++) {
      this._applyResourceDimensions(layerIndex);
    }
  }

  private _scheduleRender(force = false): void {
    cancelAnimationFrame(this.animationFrameId);
    if (force) this.lastRenderedDisplacementX = NaN;
    this.animationFrameId = requestAnimationFrame(this._frameCallback);
  }

  private _renderFrame(): void {
    if (this.lastRenderedDisplacementX === this.normalizedDisplacementX) return;
    this.lastRenderedDisplacementX = this.normalizedDisplacementX;

    for (let layerIndex = 0; layerIndex < this.layerElements.length; layerIndex++) {
      const resourceElement = this.resourceElements[layerIndex];
      if (!resourceElement) continue;

      const layer = this.layers[layerIndex];
      const snapshot = this.layerSnapshots[layerIndex];
      const curves = this.layerCurves[layerIndex];
      if (!snapshot || !curves) continue;
      const normalizedDisplacementX = this.normalizedDisplacementX;

      const scale = snapshot.dynamicScale + (layer.scale?.offset ?? 0) * curves.scale(normalizedDisplacementX);

      const rotate = snapshot.rotate + (layer.rotate?.offset ?? 0) * curves.rotate(normalizedDisplacementX);

      const translateOffsetX = layer.translate?.offset?.[0] ?? 0;
      const translateOffsetY = layer.translate?.offset?.[1] ?? 0;
      const tx = (snapshot.translate[0] + translateOffsetX * curves.translate(normalizedDisplacementX)) * this.bannerHeightScale * snapshot.initialScale;
      const ty = (snapshot.translate[1] + translateOffsetY * curves.translate(normalizedDisplacementX)) * this.bannerHeightScale * snapshot.initialScale;

      resourceElement.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotate}deg) scale(${scale})`;

      if (layer.blur) {
        const blur = resolveBlurValue(snapshot.blur, layer.blur.offset ?? 0, curves.blur, normalizedDisplacementX, layer.blur);
        resourceElement.style.filter = blur < 0.0001 ? '' : `blur(${blur}px)`;
      } else {
        resourceElement.style.filter = '';
      }

      if (layer.opacity) {
        const opacity = resolveOpacityValue(snapshot.opacity, layer.opacity.offset ?? 0, curves.opacity, normalizedDisplacementX, layer.opacity);
        resourceElement.style.opacity = String(opacity);
      } else {
        resourceElement.style.opacity = '';
      }
    }
  }

  private _handleMouseEnter(e: MouseEvent): void {
    this.isPointerActiveInBanner = true;
    this.pointerAnchorClientX = e.clientX;
    cancelAnimationFrame(this.animationFrameId);
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (!this.container || this.container.clientWidth <= 0) return;

    if (!this.isPointerActiveInBanner) {
      this.isPointerActiveInBanner = true;
      this.pointerAnchorClientX = e.clientX;
    }

    this.normalizedDisplacementX = (e.clientX - this.pointerAnchorClientX) / this.container.clientWidth;
    this._scheduleRender();
  }

  private _handleMouseLeave(): void {
    this._startResetAnimation();
  }

  private _handleBlur(): void {
    this._startResetAnimation();
  }

  private _startResetAnimation(): void {
    this.isPointerActiveInBanner = false;
    this.pointerAnchorClientX = 0;
    cancelAnimationFrame(this.animationFrameId);

    const startDisplacementX = this.normalizedDisplacementX;
    if (Math.abs(startDisplacementX) < 0.0001) {
      this.normalizedDisplacementX = 0;
      this._scheduleRender(true);
      return;
    }

    const startTime = performance.now();
    const RESET_ANIMATION_MS = 200;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < RESET_ANIMATION_MS) {
        this.normalizedDisplacementX = startDisplacementX * (1 - elapsed / RESET_ANIMATION_MS);
        this._renderFrame();
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.normalizedDisplacementX = 0;
        this.lastRenderedDisplacementX = NaN;
        this._renderFrame();
        this.animationFrameId = 0;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private _handleResize(): void {
    if (!this.container) return;
    this.bannerHeightScale = this.container.clientHeight / 155;
    this._applyAllResourceDimensions();
    this._scheduleRender(true);
  }
}
