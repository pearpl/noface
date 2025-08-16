import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // Add WebGL backend
import '@tensorflow/tfjs-backend-cpu'; // Add CPU backend as fallback
import * as blazeface from '@tensorflow-models/blazeface';
import { DetectedFace } from '@/store/anonSnap';
import { SupportedModels, createDetector, type FaceDetector, type Face } from '@tensorflow-models/face-detection';

let model: blazeface.BlazeFaceModel | null = null;
let mpDetector: FaceDetector | null = null;
let isInitializing = false;

export const initializeFaceDetection = async (): Promise<void> => {
  if (model) return;
  if (isInitializing) {
    // Wait for existing initialization
    while (isInitializing && !model) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  try {
    isInitializing = true;
  // if (window?.location?.hostname.endsWith('.loc')) console.log('Starting TensorFlow.js initialization...');
    
    // Set backend preference
    await tf.setBackend('webgl').catch(async () => {
  // if (window?.location?.hostname.endsWith('.loc')) console.log('WebGL backend failed, falling back to CPU...');
      await tf.setBackend('cpu');
    });
    
    await tf.ready();
  // if (window?.location?.hostname.endsWith('.loc')) console.log('TensorFlow.js ready, backend:', tf.getBackend());
    
  // if (window?.location?.hostname.endsWith('.loc')) console.log('Loading BlazeFace model (tuned params)...');
    const t0 = performance.now();
    try {
      model = await blazeface.load({
        maxFaces: 50, // raise ceiling
        iouThreshold: 0.2, // default 0.3; lower to keep more overlapping boxes
        scoreThreshold: 0.65 // default ~0.75; capture lower-confidence faces
      });
    } catch (e) {
      console.error('BlazeFace load() threw:', e);
      throw e;
    }
    const t1 = performance.now();
  // if (window?.location?.hostname.endsWith('.loc')) console.log(`BlazeFace model loaded successfully in ${(t1 - t0).toFixed(0)}ms`);
    
  } catch (error) {
    console.error('Face detection initialization error:', error);
    // Surface more actionable info
    let hint = '';
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      if (!('WebGLRenderingContext' in window)) {
        hint += ' WebGL not supported; ensure GPU/driver available.';
      }
      if (!(await tf.getBackend())) {
        hint += ' No TFJS backend active.';
      }
    }
    throw new Error(`Failed to initialize face detection: ${error instanceof Error ? error.message : 'Unknown error'}.${hint}`);
  } finally {
    isInitializing = false;
  }
};

/**
 * Run detection with a primary pass and a fallback relaxed pass if few faces are found.
 */
interface DetectionConfig {
  iouSuppress: number; // IoU threshold for merging
  minBoxSize: number;  // minimum width/height
  blazeScore: number;  // BlazeFace score threshold (passed at load time only once)
  mediaPipeMinFacesForFallback: number; // trigger MP fallback if below
  boxExpansion: number; // expansion ratio for final boxes
  enableTiling: boolean; // tile large images
  tileSize: number; // tile size (square)
  tileOverlap: number; // overlap ratio 0..1
  nmsIoU: number; // IoU threshold for final score-based NMS
  nmsContainment: number; // containment ratio to suppress (intersection / smaller area)
  nmsCenterDistFrac: number; // fraction of avg dim for near-center suppression
  nmsSizeDiffFrac: number; // max relative size diff for considering near-duplicate
  postMergeIoU: number; // looser IoU for final clustering
  postMergeCenterFrac: number; // center distance fraction for clustering
  postMergeSizeFrac: number; // size similarity fraction for clustering
}

const config: DetectionConfig = {
  iouSuppress: 0.7,  // more aggressive overlap suppression
  minBoxSize: 8,
  blazeScore: 0.7,
  mediaPipeMinFacesForFallback: 8,
  boxExpansion: 0.05, // reduce expansion to limit artificial overlaps
  enableTiling: true,
  tileSize: 800,
  tileOverlap: 0.2,
  nmsIoU: 0.55,
  nmsContainment: 0.85,
  nmsCenterDistFrac: 0.12,
  nmsSizeDiffFrac: 0.18,
  postMergeIoU: 0.4,
  postMergeCenterFrac: 0.18,
  postMergeSizeFrac: 0.28,
};

// Desired target count to decide if we run heavier augment passes
let targetFaceCount = 14;
export const setTargetFaceCount = (n: number) => { targetFaceCount = n; };

export const setDetectionConfig = (partial: Partial<DetectionConfig>) => {
  Object.assign(config, partial);
  // if (window?.location?.hostname.endsWith('.loc')) console.log('Updated detection config', config);
};

// Expose for quick console experimentation (dev only safeguard)
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__setDetectionConfig = setDetectionConfig;
}

// Basic mobile / iOS detection (user agent heuristics)
const isIOS = typeof navigator !== 'undefined' && /iP(ad|hone|od)/.test(navigator.userAgent);
const isLowMemoryDevice = typeof (navigator as any)?.deviceMemory === 'number' && (navigator as any).deviceMemory <= 4;

export const detectFaces = async (image: HTMLImageElement): Promise<DetectedFace[]> => {
  try {
    // Mobile GPU memory mitigation: downscale very large images for detection passes.
    // Keep original image for final anonymization elsewhere.
    const MAX_DETECT_DIM = (isIOS || isLowMemoryDevice) ? 1280 : 1600; // tighter cap for iOS / low mem
    let workingImage: HTMLImageElement | HTMLCanvasElement = image;
    let workingScale = 1; // workingImage = original * workingScale (<=1)
    if (Math.max(image.naturalWidth, image.naturalHeight) > MAX_DETECT_DIM) {
      workingScale = MAX_DETECT_DIM / Math.max(image.naturalWidth, image.naturalHeight);
      const c = document.createElement('canvas');
      c.width = Math.round(image.naturalWidth * workingScale);
      c.height = Math.round(image.naturalHeight * workingScale);
      c.getContext('2d')!.drawImage(image, 0, 0, c.width, c.height);
      workingImage = c;
  // if (window?.location?.hostname.endsWith('.loc')) console.log(`Downscaled source for detection to ${c.width}x${c.height} (scale ${(workingScale).toFixed(3)})`);
    }
    // Ensure primary MediaPipe detector first
    if (!mpDetector) {
      try {
  // console.log('Loading primary MediaPipe detector (full)...');
        mpDetector = await createDetector(SupportedModels.MediaPipeFaceDetector, {
          runtime: 'tfjs',
          maxFaces: 100,
          modelType: 'full'
        });
      } catch (e) {
  // console.warn('Primary MediaPipe load failed, falling back to BlazeFace first', e);
      }
    }
    // Load BlazeFace lazily as supplemental
    if (!model) {
  // console.log('BlazeFace model not yet loaded, initializing (supplemental)...');
      await initializeFaceDetection();
    }
    if (!mpDetector && !model) throw new Error('No face detector available');

  // console.log('Running face detection...');
    interface RawDetection { x1: number; y1: number; x2: number; y2: number; score: number; source: string; }
    const raw: RawDetection[] = [];
    const pushDet = (x1: number, y1: number, x2: number, y2: number, score: number, source: string) => {
      const w = x2 - x1; const h = y2 - y1;
      if (w < config.minBoxSize || h < config.minBoxSize) return;
      raw.push({ x1, y1, x2, y2, score, source });
    };
    const addFromBlaze = (preds: blazeface.NormalizedFace[], scaleFactor: number, source: string) => {
      preds.forEach(p => {
        const tl = p.topLeft as [number, number];
        const br = p.bottomRight as [number, number];
        if (scaleFactor !== 1) {
          tl[0] /= scaleFactor; tl[1] /= scaleFactor; br[0] /= scaleFactor; br[1] /= scaleFactor;
        }
        let prob = 0.75;
        const pr: any = (p as any).probability;
        if (Array.isArray(pr) && pr.length) prob = pr[0];
        pushDet(tl[0], tl[1], br[0], br[1], prob, source);
      });
    };
    // Helper: run BlazeFace on a canvas or image and scale boxes if needed
    const runBlaze = async (target: HTMLImageElement | HTMLCanvasElement, scaleFactor: number) => {
      const preds = await model!.estimateFaces(target as any, false);
      addFromBlaze(preds, scaleFactor, 'blaze');
    };

  // Precompute base dimensions in *working* coordinate space
  const baseW = (workingImage as any).naturalWidth || (workingImage as HTMLCanvasElement).width;
  const baseH = (workingImage as any).naturalHeight || (workingImage as HTMLCanvasElement).height;

  // 1. Primary MediaPipe detection (full working image)
    if (mpDetector) {
      try {
    const mpFaces: Face[] = await mpDetector.estimateFaces(workingImage as any, { flipHorizontal: false });
        mpFaces.forEach(f => {
          const tl: [number, number] = [f.box.xMin, f.box.yMin];
          const br: [number, number] = [f.box.xMax, f.box.yMax];
          pushDet(tl[0], tl[1], br[0], br[1], 0.9, 'mediapipe-primary');
        });
  // console.log(`Primary MediaPipe pass added ${mpFaces.length} faces (unique now ${collected.length})`);
      } catch (e) {
  // console.warn('Primary MediaPipe detect failed', e);
      }
    }

    // 2. Supplemental Blaze multi-scale & tiling for any missed faces
    if (model) {
      // Fewer scales for constrained devices to save GPU memory
      const scales = (isIOS || isLowMemoryDevice)
        ? [1, 0.8, 0.6, 0.45]
        : [1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.28, 0.22];
      for (const s of scales) {
        if (s === 1) {
          await runBlaze(workingImage as any, 1);
        } else {
          const off = document.createElement('canvas');
          off.width = Math.max(40, Math.round((workingImage as any).naturalWidth ? (workingImage as HTMLImageElement).naturalWidth * s : (workingImage as HTMLCanvasElement).width * s));
          off.height = Math.max(40, Math.round((workingImage as any).naturalHeight ? (workingImage as HTMLImageElement).naturalHeight * s : (workingImage as HTMLCanvasElement).height * s));
          off.getContext('2d')!.drawImage(workingImage as any, 0, 0, off.width, off.height);
          await runBlaze(off, s);
        }
      }
  // (baseW/baseH already computed)
  if (!isIOS && config.enableTiling && (baseW > config.tileSize || baseH > config.tileSize)) {
        const { tileSize, tileOverlap } = config;
        const step = Math.round(tileSize * (1 - tileOverlap));
        for (let y = 0; y < baseH; y += step) {
          for (let x = 0; x < baseW; x += step) {
            const w = Math.min(tileSize, baseW - x);
            const h = Math.min(tileSize, baseH - y);
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = w; tileCanvas.height = h;
            tileCanvas.getContext('2d')!.drawImage(workingImage as any, x, y, w, h, 0, 0, w, h);
            const preds = await model.estimateFaces(tileCanvas as any, false);
            preds.forEach(p => {
              (p.topLeft as [number, number])[0] += x;
              (p.topLeft as [number, number])[1] += y;
              (p.bottomRight as [number, number])[0] += x;
              (p.bottomRight as [number, number])[1] += y;
            });
            addFromBlaze(preds as any, 1, 'blaze-tile');
          }
        }
      }
    }
  // console.log(`After MediaPipe + Blaze passes collected ${collected.length} faces`);

  // 3. High-res contrast / sharpening assisted pass (duplicate canvas adjustments)
  if (!isIOS && raw.length < targetFaceCount) {
      try {
        const scaleUp = 1.4; // mild upscale
        const up = document.createElement('canvas');
    up.width = Math.round(baseW * scaleUp);
    up.height = Math.round(baseH * scaleUp);
        const uctx = up.getContext('2d')!;
        uctx.imageSmoothingEnabled = true;
    uctx.drawImage(workingImage as any, 0, 0, up.width, up.height);
        // Simple contrast enhancement via pixel manipulation
        const imgData = uctx.getImageData(0,0,up.width, up.height);
        const d = imgData.data; const factor = 1.25; const intercept = 128*(1-factor);
        for (let i=0;i<d.length;i+=4){
          d[i] = Math.min(255, Math.max(0, d[i]*factor + intercept));
          d[i+1] = Math.min(255, Math.max(0, d[i+1]*factor + intercept));
          d[i+2] = Math.min(255, Math.max(0, d[i+2]*factor + intercept));
        }
        uctx.putImageData(imgData,0,0);
        if (mpDetector) {
          const ups = await mpDetector.estimateFaces(up as any, { flipHorizontal: false });
          ups.forEach(f => {
            const tl: [number, number] = [f.box.xMin/scaleUp, f.box.yMin/scaleUp];
            const br: [number, number] = [f.box.xMax/scaleUp, f.box.yMax/scaleUp];
            pushDet(tl[0], tl[1], br[0], br[1], 0.85, 'mediapipe-upscaled');
          });
        }
        if (model) {
          const blazeUps = await model.estimateFaces(up as any, false);
          addFromBlaze(blazeUps as any, scaleUp, 'blaze-upscaled');
        }
  // console.log(`After high-res contrast pass faces=${collected.length}`);
      } catch(e){
  // console.warn('High-res pass failed', e);
      }
    }

    // 4. Super-scale + rotation augmentation passes if still low
  if (!isIOS && raw.length < targetFaceCount) {
      try {
        const superScale = 2.0;
        const base = document.createElement('canvas');
    base.width = Math.round(baseW * superScale);
    base.height = Math.round(baseH * superScale);
        const bctx = base.getContext('2d')!;
        bctx.imageSmoothingEnabled = true;
    bctx.drawImage(workingImage as any, 0, 0, base.width, base.height);

        const rotations = [ -6, -3, 3, 6 ];
        for (const angle of rotations) {
          if (raw.length >= targetFaceCount) break;
            const rad = angle * Math.PI / 180;
            const rc = document.createElement('canvas');
            rc.width = base.width; rc.height = base.height;
            const rctx = rc.getContext('2d')!;
            rctx.translate(rc.width/2, rc.height/2);
            rctx.rotate(rad);
            rctx.drawImage(base, -base.width/2, -base.height/2);
            // Detect on rotated image
            if (mpDetector) {
              const rf = await mpDetector.estimateFaces(rc as any, { flipHorizontal: false });
              rf.forEach(f => {
                // inverse rotate box center back to original coordinate system
                const cx = (f.box.xMin + f.box.xMax)/2 - rc.width/2;
                const cy = (f.box.yMin + f.box.yMax)/2 - rc.height/2;
                const cos = Math.cos(-rad); const sin = Math.sin(-rad);
                const ocx = cx * cos - cy * sin + rc.width/2;
                const ocy = cx * sin + cy * cos + rc.height/2;
                const bw = (f.box.xMax - f.box.xMin);
                const bh = (f.box.yMax - f.box.yMin);
                const tl: [number, number] = [ (ocx - bw/2)/superScale, (ocy - bh/2)/superScale ];
                const br: [number, number] = [ (ocx + bw/2)/superScale, (ocy + bh/2)/superScale ];
                pushDet(tl[0], tl[1], br[0], br[1], 0.82, 'mediapipe-rot');
              });
            }
            if (model) {
              const blazeR = await model.estimateFaces(rc as any, false);
              addFromBlaze(blazeR as any, superScale, 'blaze-rot');
            }
            // console.log(`Rotation ${angle}° pass collected=${collected.length}`);
        }
      } catch (e) {
  // console.warn('Super-scale/rotation augmentation failed', e);
      }
    }

    // MediaPipe fallback if still too few
  if (raw.length < config.mediaPipeMinFacesForFallback) {
      try {
        if (!mpDetector) {
          // console.log('Loading MediaPipe Face Detector fallback...');
          mpDetector = await createDetector(SupportedModels.MediaPipeFaceDetector, {
            runtime: 'tfjs',
            maxFaces: 50,
      modelType: 'full',
          });
        }
    const mpFaces: Face[] = await mpDetector.estimateFaces(workingImage as any, { flipHorizontal: false });
  // console.log(`MediaPipe fallback found ${mpFaces.length} faces`);
        mpFaces.forEach(f => {
          const tl: [number, number] = [f.box.xMin, f.box.yMin];
          const br: [number, number] = [f.box.xMax, f.box.yMax];
          pushDet(tl[0], tl[1], br[0], br[1], 0.88, 'mediapipe-fallback');
        });
  // console.log(`Total after MediaPipe merge: ${collected.length}`);
      } catch (e) {
  // console.warn('MediaPipe fallback failed', e);
      }
    }

    // CPU fallback if suspiciously low
  if (raw.length < 3 && tf.getBackend() === 'webgl') {
  // console.log('Attempting CPU fallback due to low detections...');
      try {
        await tf.setBackend('cpu'); await tf.ready();
  const retry = await model.estimateFaces(workingImage as any, false);
        addFromBlaze(retry as any, 1, 'blaze-cpu-retry');
  // console.log(`CPU retry added; total faces now ${collected.length}`);
      } catch (e) {
  // console.warn('CPU fallback failed', e);
      } finally {
        // Switch back to webgl for performance if we changed
        if (tf.getBackend() === 'cpu') {
          await tf.setBackend('webgl').catch(()=>{});
        }
      }
    }
    // Score-based Non-Maximum Suppression (NMS)
    const iou = (a: RawDetection, b: RawDetection) => {
      const ix1 = Math.max(a.x1, b.x1); const iy1 = Math.max(a.y1, b.y1);
      const ix2 = Math.min(a.x2, b.x2); const iy2 = Math.min(a.y2, b.y2);
      const iw = Math.max(0, ix2 - ix1); const ih = Math.max(0, iy2 - iy1);
      const inter = iw * ih;
      const aw = (a.x2 - a.x1); const ah = (a.y2 - a.y1);
      const bw = (b.x2 - b.x1); const bh = (b.y2 - b.y1);
      const union = aw*ah + bw*bh - inter;
      return inter / (union || 1);
    };
    // Sort by score descending; if equal, smaller (tighter) box first
    raw.sort((a,b)=> b.score - a.score || ((a.x2-a.x1)*(a.y2-a.y1) - (b.x2-b.x1)*(b.y2-b.y1)));
    const keep: RawDetection[] = [];
    const nmsThresh = config.nmsIoU;
    for (const det of raw) {
      let drop = false;
      let replaceIndex = -1;
      for (let i=0;i<keep.length;i++) {
        const k = keep[i];
        const theIoU = iou(det, k);
        if (theIoU > nmsThresh) { drop = true; break; }
        const dw = det.x2-det.x1; const dh = det.y2-det.y1; const kw = k.x2-k.x1; const kh = k.y2-k.y1;
        const ix1 = Math.max(det.x1, k.x1); const iy1 = Math.max(det.y1, k.y1);
        const ix2 = Math.min(det.x2, k.x2); const iy2 = Math.min(det.y2, k.y2);
        const iw = Math.max(0, ix2 - ix1); const ih = Math.max(0, iy2 - iy1);
        const inter = iw * ih;
        const containment = inter / Math.min(dw*dh, kw*kh);
        const cx = det.x1 + dw/2; const cy = det.y1 + dh/2; const kcx = k.x1 + kw/2; const kcy = k.y1 + kh/2;
        const centerDist = Math.hypot(cx-kcx, cy-kcy);
        const avgDim = (Math.max(dw,dh)+Math.max(kw,kh))/2;
        const sizeClose = Math.abs(dw-kw)/Math.max(dw,kw) < config.nmsSizeDiffFrac && Math.abs(dh-kh)/Math.max(dh,kh) < config.nmsSizeDiffFrac;
        const centersClose = centerDist < avgDim*config.nmsCenterDistFrac;
        if (containment > config.nmsContainment || (centersClose && sizeClose)) {
          // choose the box with higher score, if tie choose tighter (smaller area)
          const kArea = kw*kh; const dArea = dw*dh;
          if (det.score > k.score || (Math.abs(det.score - k.score) < 1e-4 && dArea < kArea)) {
            replaceIndex = i; // mark for replacement
          }
          drop = replaceIndex === -1; // if we won't replace we drop
          break;
        }
      }
      if (!drop) {
        if (replaceIndex >= 0) keep[replaceIndex] = det; else keep.push(det);
      }
    }
    // Secondary clustering to collapse any residual near-duplicates that slipped through (looser thresholds)
    const cluster: typeof keep = [];
    const looseIoU = config.postMergeIoU;
    for (const det of keep) {
      let merged = false;
      for (let i=0;i<cluster.length;i++) {
        const c = cluster[i];
        // compute overlap
        const ix1 = Math.max(det.x1, c.x1); const iy1 = Math.max(det.y1, c.y1);
        const ix2 = Math.min(det.x2, c.x2); const iy2 = Math.min(det.y2, c.y2);
        const iw = Math.max(0, ix2 - ix1); const ih = Math.max(0, iy2 - iy1);
        const inter = iw * ih;
        const da = (det.x2-det.x1)*(det.y2-det.y1); const ca = (c.x2-c.x1)*(c.y2-c.y1);
        const union = da + ca - inter;
        const curIoU = inter / (union || 1);
        const dw = det.x2-det.x1; const dh = det.y2-det.y1; const cw = c.x2-c.x1; const ch = c.y2-c.y1;
        const cx = det.x1 + dw/2; const cy = det.y1 + dh/2; const ccx = c.x1 + cw/2; const ccy = c.y1 + ch/2;
        const centerDist = Math.hypot(cx-ccx, cy-ccy);
        const avgDim = (Math.max(dw,dh)+Math.max(cw,ch))/2;
        const sizeClose = Math.abs(dw-cw)/Math.max(dw,cw) < config.postMergeSizeFrac && Math.abs(dh-ch)/Math.max(dh,ch) < config.postMergeSizeFrac;
        const centersClose = centerDist < avgDim * config.postMergeCenterFrac;
        if (curIoU > looseIoU || (centersClose && sizeClose)) {
          // Merge by weighted average favoring higher score; pick tighter bounds envelope
          const totalScore = det.score + c.score;
          const wx = det.score / totalScore;
          // Combine centers then reconstruct box by averaging sizes (or using min envelope?)
          const newX1 = Math.min(det.x1, c.x1);
          const newY1 = Math.min(det.y1, c.y1);
          const newX2 = Math.max(det.x2, c.x2);
          const newY2 = Math.max(det.y2, c.y2);
          cluster[i] = {
            x1: newX1,
            y1: newY1,
            x2: newX2,
            y2: newY2,
            score: Math.max(det.score, c.score),
            source: c.source + '+' + det.source
          };
          merged = true;
          break;
        }
      }
      if (!merged) cluster.push(det);
    }
    const finalBoxes = cluster;
    const invScale = 1 / workingScale;
    return finalBoxes.map((d, index) => {
      const expand = config.boxExpansion;
      let nx = Math.max(0, d.x1 - (d.x2 - d.x1) * expand);
      let ny = Math.max(0, d.y1 - (d.y2 - d.y1) * expand);
      let nw = (d.x2 - d.x1) * (1 + expand * 2);
      let nh = (d.y2 - d.y1) * (1 + expand * 2);
      if (workingScale !== 1) { nx *= invScale; ny *= invScale; nw *= invScale; nh *= invScale; }
      return {
        id: `face-${index}-${Date.now()}`,
        bbox: { x: nx, y: ny, width: nw, height: nh },
        isSelected: true,
      };
    });
  } catch (error) {
    console.error('Face detection error:', error);
    throw error;
  }
};

// Extremely aggressive secondary function (skips some performance safeguards)
export const detectFacesAggressive = async (image: HTMLImageElement): Promise<DetectedFace[]> => {
  // Temporarily relax config
  setDetectionConfig({ iouSuppress: 0.7, minBoxSize: 4, boxExpansion: 0.14 });
  setTargetFaceCount(20);
  return detectFaces(image);
};

/** Optional debug overlay for bounding boxes */
export const drawFaceDebugOverlay = (image: HTMLImageElement, faces: DetectedFace[]): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  ctx.strokeStyle = 'rgba(0,255,0,0.8)';
  ctx.lineWidth = 2;
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(0,255,0,0.8)';
  faces.forEach((f, i) => {
    ctx.strokeRect(f.bbox.x, f.bbox.y, f.bbox.width, f.bbox.height);
    ctx.fillText(String(i+1), f.bbox.x + 4, f.bbox.y + 18);
  });
  return canvas;
};

export const generateFaceThumbnail = (
  image: HTMLImageElement,
  face: DetectedFace,
  size: number = 80
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = size;
  canvas.height = size;
  
  // Add padding around the face
  const padding = 0.3;
  const paddedWidth = face.bbox.width * (1 + padding * 2);
  const paddedHeight = face.bbox.height * (1 + padding * 2);
  const paddedX = face.bbox.x - face.bbox.width * padding;
  const paddedY = face.bbox.y - face.bbox.height * padding;
  
  // Draw the face region to the thumbnail canvas
  ctx.drawImage(
    image,
    paddedX,
    paddedY,
    paddedWidth,
    paddedHeight,
    0,
    0,
    size,
    size
  );
  
  return canvas.toDataURL();
};