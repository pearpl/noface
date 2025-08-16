import React, { useEffect, useRef, useState } from 'react';
import { useAnonSnapStore } from '@/store/anonSnap';
import { detectFaces, detectFacesAggressive, generateFaceThumbnail, initializeFaceDetection } from '@/utils/faceDetection';
import { loadImageFromFile, applyPixelationToRegion, downloadImage } from '@/utils/imageProcessing';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, EyeOff, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n';
import confetti from 'canvas-confetti';

export const ImageProcessor: React.FC = () => {
  const {
    processing,
    anonymizationSettings,
    setDetectedFaces,
    setProcessingState,
    setAnonymizationSettings,
  toggleFaceSelection,
  selectAllFaces,
  addFace,
  incrementSessionCount,
  resetProcessing,
  } = useAnonSnapStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useI18n();
  const [isInitialized, setIsInitialized] = useState(false);
  // Manual drawing always enabled
  const drawMode = true;
  const [draftRect, setDraftRect] = useState<null | {x:number;y:number;width:number;height:number}>(null);
  const dragStart = useRef<null | {x:number;y:number}>(null);
  const [zoom, setZoom] = useState(1); // zoom factor (CSS transform)
  const [pan, setPan] = useState({ x: 0, y: 0 }); // pan offset in CSS pixels
  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [manualAddMode, setManualAddMode] = useState(false);
  const panDragStart = useRef<null | { x: number; y: number; origX: number; origY: number }>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  // Pointer drawing support (for touch + mouse unified)
  const pointerDrawing = useRef(false);
  // Drag face box state
  const draggingFaceId = useRef<string | null>(null);
  const dragOffset = useRef<{dx:number;dy:number} | null>(null);
  const dragFrame = useRef<number | null>(null);

  // Convert client (screen) coordinates to intrinsic image coordinates accounting for transform + current canvas bounding box
  const clientToImageCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    // Raw position inside container
    const rawX = clientX - containerRect.left;
    const rawY = clientY - containerRect.top;
    // Remove pan then divide by zoom (pan & zoom are applied via CSS transform on intrinsic pixels)
    const transformedX = (rawX - pan.x) / zoom;
    const transformedY = (rawY - pan.y) / zoom;
    // Account for potential CSS downscaling of the canvas (width style vs intrinsic width)
    const renderedRect = canvas.getBoundingClientRect();
    const intrinsicW = canvas.width;
    const intrinsicH = canvas.height;
    // Effective scale already mostly handled by zoom, but if device pixel ratio / layout scaling introduces difference, adjust:
    const cssScaleX = renderedRect.width / (intrinsicW * zoom);
    const cssScaleY = renderedRect.height / (intrinsicH * zoom);
    const ix = transformedX / cssScaleX;
    const iy = transformedY / cssScaleY;
    return { x: ix, y: iy };
  };

  const clampZoom = (z:number) => Math.min(5, Math.max(0.2, z));
  const zoomIn = () => setZoom(z => clampZoom(+ (z * 1.2).toFixed(3)));
  const zoomOut = () => setZoom(z => clampZoom(+ (z / 1.2).toFixed(3)));
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Keep pan within bounds whenever zoom changes
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const holder = containerRef.current;
    const canvasW = canvas.width * zoom;
    const canvasH = canvas.height * zoom;
    const viewW = holder.clientWidth;
    const viewH = 600; // fixed max height used below
    setPan(p => ({
      x: Math.min(0, Math.max(p.x, viewW - canvasW)),
      y: Math.min(0, Math.max(p.y, viewH - canvasH))
    }));
  }, [zoom]);

  // Initialize face detection model
  useEffect(() => {
    const init = async () => {
      try {
        setProcessingState({ isProcessing: true, progress: 10 });
        await initializeFaceDetection();
        setIsInitialized(true);
        setProcessingState({ progress: 30 });
      } catch (error) {
        setProcessingState({ 
          error: 'Failed to initialize face detection model',
          isProcessing: false 
        });
      }
    };

    if (processing.originalImage && !isInitialized) {
      init();
    }
  }, [processing.originalImage, isInitialized, setProcessingState]);

  // Detect faces when image is loaded and model is ready
  useEffect(() => {
    const processImage = async () => {
      if (!processing.originalImage || !isInitialized || processing.detectedFaces.length > 0) {
        return;
      }

      try {
  setProcessingState({ isProcessing: true, progress: 50, error: null });
        
  const image = await loadImageFromFile(processing.originalImage);
  const faces = await detectFaces(image);
        
        // Generate thumbnails for faces
        const facesWithThumbnails = faces.map(face => ({
          ...face,
          thumbnail: generateFaceThumbnail(image, face),
        }));
        
        setDetectedFaces(facesWithThumbnails);
        setProcessingState({ 
          progress: 80,
          currentStep: 'anonymizing',
          isProcessing: false,
          error: null
        });

        // Draw original image to canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            ctx.drawImage(image, 0, 0);
            // Draw all faces (selected green, unselected amber)
            faces.forEach((f,i)=>{
              const color = f.isSelected ? 'rgba(0,200,0,0.9)' : 'rgba(255,0,0,0.9)';
              ctx.strokeStyle = color;
              ctx.lineWidth = f.isSelected ? 6 : 3; // thicker for selected
              ctx.font = '14px sans-serif';
              ctx.fillStyle = color;
              ctx.strokeRect(f.bbox.x, f.bbox.y, f.bbox.width, f.bbox.height);
              ctx.fillText(String(i+1), f.bbox.x + 4, f.bbox.y + 16);
            });
          }
        }
        

        toast({
          title: `${faces.length} ${t('anonymize.faces')}`,
          description: t('faces.detected'),
        });
      } catch (error) {
        setProcessingState({ 
          error: 'Failed to detect faces in the image',
          isProcessing: false 
        });
      }
    };

    processImage();
  }, [processing.originalImage, isInitialized, processing.detectedFaces.length, setDetectedFaces, setProcessingState]);

  const handleAnonymize = async () => {
    if (!canvasRef.current || !processing.originalImage) return;

    try {
      setProcessingState({ isProcessing: true, progress: 0 });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Reload original image
      const image = await loadImageFromFile(processing.originalImage);
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);

      // Apply anonymization to selected faces
      const selectedFaces = processing.detectedFaces.filter(face => face.isSelected);
      
      selectedFaces.forEach((face, index) => {
        const progress = ((index + 1) / selectedFaces.length) * 100;
        setProcessingState({ progress });

  if (anonymizationSettings.method === 'pixelate') {
          applyPixelationToRegion(
            canvas,
            ctx,
            face.bbox.x,
            face.bbox.y,
            face.bbox.width,
            face.bbox.height,
            anonymizationSettings.intensity
          );
        } else if (anonymizationSettings.method === 'color') {
          ctx.save();
          ctx.fillStyle = anonymizationSettings.color || '#000000';
          ctx.fillRect(
            face.bbox.x,
            face.bbox.y,
            face.bbox.width,
            face.bbox.height
          );
          ctx.restore();
        }
      });

      const processedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setProcessingState({ 
        processedImage: processedDataUrl,
        currentStep: 'complete',
        isProcessing: false,
        progress: 100 
      });

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#06B6D4', '#A855F7']
      });

      toast({
  title: t('anonymize.action'),
  description: `${selectedFaces.length} ${t('anonymize.faces')}`,
      });

      // Fire-and-forget counter update (faces only; image increment now happens on upload)
      try {
        const res = await fetch('/api/counter.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: 0, faces: selectedFaces.length })
        });
        if (res.ok) {
          window.dispatchEvent(new Event('noface:counters:sync'));
        }
      } catch {}

    } catch (error) {
      setProcessingState({ 
        error: 'Failed to anonymize image',
        isProcessing: false 
      });
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const originalName = processing.originalImage?.name.replace(/\.[^/.]+$/, '') || 'image';
    const filename = `${originalName}_anon.jpg`;
    
    downloadImage(canvasRef.current, filename);
    incrementSessionCount();
    toast({
      title: t('download'),
      description: filename,
    });
  };

  const selectedFaceCount = processing.detectedFaces.filter(face => face.isSelected).length;

  // Helper: redraw canvas with current faces
  const redraw = async () => {
    if (!processing.originalImage || !canvasRef.current) return;
    const img = await loadImageFromFile(processing.originalImage);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img,0,0);
    processing.detectedFaces.forEach((f,i)=>{
      const color = f.isSelected ? 'rgba(0,200,0,0.9)' : 'rgba(255,0,0,0.9)';
      ctx.strokeStyle = color;
      ctx.lineWidth = f.isSelected ? 6 : 3;
      ctx.font = '14px sans-serif';
      ctx.fillStyle = color;
      ctx.strokeRect(f.bbox.x, f.bbox.y, f.bbox.width, f.bbox.height);
      ctx.fillText(String(i+1), f.bbox.x + 4, f.bbox.y + 16);
    });
  };

  // Redraw when faces or their selection state change
  useEffect(()=>{ redraw(); }, [processing.detectedFaces, processing.originalImage]);

  if (!processing.originalImage) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Processing status */}
      {processing.isProcessing && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
            <span className="font-semibold">
              {processing.currentStep === 'detecting' ? 'Detecting faces...' : 'Processing...'}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${processing.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Face detection results */}
      {processing.detectedFaces.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">
              {t('faces.detected')} ({processing.detectedFaces.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllFaces(true)}
              >
                <Eye className="w-4 h-4 mr-1" />
                {t('faces.selectAll')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllFaces(false)}
              >
                <EyeOff className="w-4 h-4 mr-1" />
                {t('faces.deselectAll')}
              </Button>
              {/* Overlay toggle & manual mode removed – boxes always visible for selected faces */}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!processing.originalImage) return;
                  try {
                    setProcessingState({ isProcessing: true });
                    const img = await loadImageFromFile(processing.originalImage);
                    const more = await detectFacesAggressive(img);
                    const existing = processing.detectedFaces;
                    const existingIds = new Set(existing.map(f=>f.id));
                    const newOnes = more.filter(f=>!existingIds.has(f.id)).map(f => ({
                      ...f,
                      thumbnail: generateFaceThumbnail(img, f),
                    }));
                    const merged = [...existing, ...newOnes];
                    setDetectedFaces(merged);
                    if (merged.length > 0) {
                      setProcessingState({ error: null });
                    }
                  } finally {
                    setProcessingState({ isProcessing: false });
                  }
                }}
              >{t('faces.aggressive')}</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-6">
            {processing.detectedFaces.map((face) => (
              <div 
                key={face.id}
                className={`
                  relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                  ${face.isSelected 
                    ? 'border-brand-purple shadow-glow-primary' 
                    : 'border-border hover:border-brand-cyan'
                  }
                `}
                onClick={() => toggleFaceSelection(face.id)}
              >
                {face.thumbnail && (
                  <img 
                    src={face.thumbnail} 
                    alt={`Face ${face.id}`}
                    className="w-full h-20 object-cover"
                  />
                )}
                <div className="absolute top-1 right-1">
                  <Checkbox 
                    checked={face.isSelected}
                    className="bg-background/80 pointer-events-none"
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Help panel */}
          <div className="mb-6 rounded-xl border bg-muted/30 dark:bg-muted/20 backdrop-blur-sm p-4 text-sm leading-relaxed">
            <h4 className="font-medium mb-2 text-foreground/90">{t('faces.help.title')}</h4>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>{t('faces.help.add')}</li>
              <li>{t('faces.help.move')}</li>
              <li>{t('faces.help.delete')}</li>
            </ul>
          </div>

          {/* Anonymization controls */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                variant={anonymizationSettings.method === 'pixelate' ? 'default' : 'outline'}
                onClick={() => setAnonymizationSettings({ method: 'pixelate', intensity: 7 })}
                className="flex-1 min-w-[120px]"
              >
                {t('anonymize.pixelate')}
              </Button>
              <Button
                variant={anonymizationSettings.method === 'color' ? 'default' : 'outline'}
                onClick={() => setAnonymizationSettings({ method: 'color' })}
                className="flex-1 min-w-[120px]"
              >
                {t('anonymize.color')}
              </Button>
              {anonymizationSettings.method === 'color' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">{t('anonymize.color')}</label>
                  <input
                    type="color"
                    value={anonymizationSettings.color || '#000000'}
                    onChange={(e)=> setAnonymizationSettings({ color: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
                    aria-label="Block color"
                  />
                </div>
              )}
            </div>

            {/* Intensity slider removed: pixelate locked at 7 */}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="gradient"
                size="lg"
                onClick={handleAnonymize}
                disabled={selectedFaceCount === 0 || processing.isProcessing}
                className="flex-1"
              >
                {processing.isProcessing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-5 h-5 mr-2" />
                )}
                {t('anonymize.action')} {selectedFaceCount} {t('anonymize.faces')}
              </Button>

              {processing.processedImage && (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleDownload}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t('download')}
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={resetProcessing}
              >
                {t('new.image')}
              </Button>
            </div>
            {processing.processedImage && (
              <p className="mt-2 text-xs text-muted-foreground leading-snug">
                {t('exif.note')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Canvas for image processing with zoom & pan controls */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={zoomOut} disabled={zoom <= 0.25}>-</Button>
            <Button size="sm" variant="outline" onClick={zoomIn} disabled={zoom >= 5}>+</Button>
            <Button size="sm" variant="outline" onClick={resetZoom} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label="Reset zoom">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground select-none">Zoom {Math.round(zoom * 100)}%</div>
          <Button size="sm" variant={isPanMode ? 'default' : 'outline'} onClick={() => setIsPanMode(m => !m)}>
            {isPanMode ? 'Pan On' : 'Pan Off'}
          </Button>
          <div className="text-xs text-muted-foreground">Drag to {isPanMode ? 'move image' : 'draw face box'}</div>
          <Button
            type="button"
            variant="gradient"
            size="sm"
            onClick={() => setManualAddMode(m => !m)}
            className={`ml-auto px-4 ${manualAddMode ? 'ring-2 ring-brand-purple/50 scale-[1.02]' : ''}`}
          >
            <span className="text-lg leading-none">+</span>
            <span>{manualAddMode ? t('faces.addManualOn') : t('faces.addManual')}</span>
          </Button>
        </div>
        <div
          ref={containerRef}
          className={`relative inline-block max-w-full touch-none select-none ${isPanMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : manualAddMode ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{ maxHeight: 600, overflow: 'hidden' }}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const direction = e.deltaY < 0 ? 1.1 : 0.9;
              const oldZoom = zoom;
              const newZoom = clampZoom(zoom * direction);
              if (newZoom === oldZoom) return;
              if (canvasRef.current) {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const mx = e.clientX - rect.left - pan.x;
                const my = e.clientY - rect.top - pan.y;
                const scale = newZoom / oldZoom;
                setPan(p => ({ x: p.x - (mx * (scale - 1)), y: p.y - (my * (scale - 1)) }));
              }
              setZoom(newZoom);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2) {
              e.preventDefault();
              const t1 = e.touches.item(0)!;
              const t2 = e.touches.item(1)!;
              const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
              if (lastTouchDistance.current != null) {
                const ratio = dist / lastTouchDistance.current;
                if (Math.abs(ratio - 1) > 0.02) setZoom(z => clampZoom(z * ratio));
              }
              lastTouchDistance.current = dist;
            } else if (e.touches.length === 1 && isPanMode) {
              const t = e.touches[0];
              if (!panDragStart.current) {
                panDragStart.current = { x: t.clientX, y: t.clientY, origX: pan.x, origY: pan.y };
              } else {
                const dx = t.clientX - panDragStart.current.x;
                const dy = t.clientY - panDragStart.current.y;
                setPan({ x: panDragStart.current.origX + dx, y: panDragStart.current.origY + dy });
              }
            }
          }}
          onTouchEnd={(e) => {
            if (e.touches.length < 2) lastTouchDistance.current = null;
            if (e.touches.length === 0) panDragStart.current = null;
          }}
  >
          <canvas
            ref={canvasRef}
            className={`max-w-full h-auto rounded-lg shadow-lg origin-top-left touch-none ${isPanMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : manualAddMode ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ maxHeight: '600px', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left', imageRendering: 'crisp-edges' }}
            onPointerDown={e => {
              // Distinguish two-finger gestures handled at container onTouchMove
              if (e.pointerType === 'touch' && e.isPrimary === false) return;
              if (!canvasRef.current) return;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              if (isPanMode) {
                setIsPanning(true);
                panDragStart.current = { x: e.clientX, y: e.clientY, origX: pan.x, origY: pan.y };
                return;
              }
              if (!manualAddMode) return; // only allow drawing when enabled
              const { x, y } = clientToImageCoords(e.clientX, e.clientY);
              dragStart.current = { x, y };
              pointerDrawing.current = true;
            }}
            onPointerMove={e => {
              if (isPanMode && panDragStart.current) {
                const dx = e.clientX - panDragStart.current.x;
                const dy = e.clientY - panDragStart.current.y;
                setPan({ x: panDragStart.current.origX + dx, y: panDragStart.current.origY + dy });
                return;
              }
              if (!manualAddMode) return;
              if (!pointerDrawing.current || !dragStart.current) return;
              const { x: cx, y: cy } = clientToImageCoords(e.clientX, e.clientY);
              const w = cx - dragStart.current.x;
              const h = cy - dragStart.current.y;
              setDraftRect({
                x: Math.min(dragStart.current.x, cx),
                y: Math.min(dragStart.current.y, cy),
                width: Math.abs(w),
                height: Math.abs(h)
              });
            }}
            onPointerUp={async e => {
              if (isPanMode) { setIsPanning(false); panDragStart.current = null; return; }
              if (!manualAddMode) { pointerDrawing.current = false; dragStart.current = null; setDraftRect(null); return; }
              if (pointerDrawing.current && draftRect && draftRect.width > 5 && draftRect.height > 5) {
                if (processing.originalImage) {
                  const img = await loadImageFromFile(processing.originalImage);
                  addFace(draftRect, generateFaceThumbnail(img, { id:'tmp', bbox: draftRect, isSelected:true } as any));
                  // redraw overlay with new face
                  if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                      canvasRef.current.width = img.naturalWidth;
                      canvasRef.current.height = img.naturalHeight;
                      ctx.drawImage(img,0,0);
                      [...processing.detectedFaces, { id:'tmp', bbox: draftRect, isSelected:true } as any]
                        .forEach((f,i)=>{
                          const color = f.isSelected ? 'rgba(0,200,0,0.9)' : 'rgba(255,0,0,0.9)';
                          ctx.strokeStyle = color;
                          ctx.lineWidth = f.isSelected ? 6 : 3;
                          ctx.font = '14px sans-serif';
                          ctx.fillStyle = color;
                          ctx.strokeRect(f.bbox.x, f.bbox.y, f.bbox.width, f.bbox.height);
                          ctx.fillText(String(i+1), f.bbox.x + 4, f.bbox.y + 16);
                        });
                    }
                  }
                }
              }
              pointerDrawing.current = false;
              dragStart.current = null; setDraftRect(null);
            }}
            onPointerCancel={() => { pointerDrawing.current = false; dragStart.current = null; setDraftRect(null); }}
          />
          
          {draftRect && (() => {
            if (!canvasRef.current || !containerRef.current) return null;
            const canvasEl = canvasRef.current;
            const containerEl = containerRef.current;
            const canvasRect = canvasEl.getBoundingClientRect();
            const containerRect = containerEl.getBoundingClientRect();
            // Effective rendered scale (includes zoom * any responsive layout scaling)
            const scaleX = canvasRect.width / canvasEl.width;
            const scaleY = canvasRect.height / canvasEl.height;
            // Canvas top-left inside container (since canvas is transformed, use rect delta)
            const baseLeft = canvasRect.left - containerRect.left;
            const baseTop = canvasRect.top - containerRect.top;
            const style: React.CSSProperties = {
              left: baseLeft + draftRect.x * scaleX,
              top: baseTop + draftRect.y * scaleY,
              width: draftRect.width * scaleX,
              height: draftRect.height * scaleY
            };
            return <div className="absolute border-4 border-fuchsia-500 pointer-events-none" style={style} />;
          })()}
          {/* Legend for box colors */}
          {processing.detectedFaces.length > 0 && (
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[rgba(0,200,0,0.9)]"/> Selected</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[rgba(255,0,0,0.9)]"/> Unselected</div>
            </div>
          )}
          {/* Deletion buttons overlay */}
          {processing.detectedFaces.map(face => {
            if (!canvasRef.current || !containerRef.current) return null;
            const canvasEl = canvasRef.current;
            const containerEl = containerRef.current;
            const canvasRect = canvasEl.getBoundingClientRect();
            const containerRect = containerEl.getBoundingClientRect();
            const scaleX = canvasRect.width / canvasEl.width;
            const scaleY = canvasRect.height / canvasEl.height;
            const left = (canvasRect.left - containerRect.left) + face.bbox.x * scaleX;
            const top = (canvasRect.top - containerRect.top) + face.bbox.y * scaleY;
            const width = face.bbox.width * scaleX;
            const height = face.bbox.height * scaleY;
            return (
              <div
                key={face.id+':hoverWrap'}
                className={`absolute z-20 group ${draggingFaceId.current===face.id ? 'cursor-grabbing' : 'cursor-move'}`}
                style={{ left, top, width, height }}
                onPointerDown={(e)=>{
                  if (e.button!==0) return; // left only
                  // If clicking the delete button (or its children), don't start drag
                  const target = e.target as HTMLElement;
                  if (target.closest('button[data-face-delete]')) return;
                  draggingFaceId.current = face.id;
                  const startX = e.clientX; const startY = e.clientY;
                  dragOffset.current = { dx: startX - left, dy: startY - top };
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  // Store initial position to differentiate click vs drag
                  (e.currentTarget as any)._dragStartPoint = { x: startX, y: startY, moved: false };
                }}
                onPointerMove={(e)=>{
                  if (draggingFaceId.current !== face.id || !dragOffset.current || !canvasRef.current || !containerRef.current) return;
                  const wrap = e.currentTarget as any;
                  if (wrap._dragStartPoint && !wrap._dragStartPoint.moved) {
                    const dx = e.clientX - wrap._dragStartPoint.x;
                    const dy = e.clientY - wrap._dragStartPoint.y;
                    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return; // below threshold: treat as click so far
                    wrap._dragStartPoint.moved = true;
                  }
                  const canvasRectLive = canvasRef.current.getBoundingClientRect();
                  const containerRectLive = containerRef.current.getBoundingClientRect();
                  const scaleXLive = canvasRectLive.width / canvasRef.current.width;
                  const scaleYLive = canvasRectLive.height / canvasRef.current.height;
                  const newLeft = e.clientX - dragOffset.current.dx;
                  const newTop = e.clientY - dragOffset.current.dy;
                  // Convert back to image coords
                  const imgX = (newLeft - (canvasRectLive.left - containerRectLive.left)) / scaleXLive;
                  const imgY = (newTop - (canvasRectLive.top - containerRectLive.top)) / scaleYLive;
                  // Clamp within image bounds
                  const clampedX = Math.max(0, Math.min(imgX, canvasRef.current.width - face.bbox.width));
                  const clampedY = Math.max(0, Math.min(imgY, canvasRef.current.height - face.bbox.height));
                  // Update face bbox in store (throttle via rAF)
                  if (dragFrame.current) cancelAnimationFrame(dragFrame.current);
                  dragFrame.current = requestAnimationFrame(()=>{
                    useAnonSnapStore.setState(state=>({ processing: { ...state.processing, detectedFaces: state.processing.detectedFaces.map(f=> f.id===face.id ? { ...f, bbox: { ...f.bbox, x: clampedX, y: clampedY } } : f ) }}));
                  });
                }}
                onPointerUp={(e)=>{
                  if (draggingFaceId.current===face.id) {
                    // Capture id then clear drag refs
                    const finishedId = draggingFaceId.current;
                    draggingFaceId.current = null; dragOffset.current = null;
                    // Regenerate thumbnail for moved face (use current bbox after latest rAF commit)
                    try {
                      const state = useAnonSnapStore.getState();
                      const proc = state.processing;
                      const moved = proc.detectedFaces.find(f=>f.id===finishedId);
                      if (moved && proc.originalImage) {
                        // Load image file to Image object (cached by browser if already loaded elsewhere)
                        const file = proc.originalImage;
                        const imgEl = new Image();
                        const fileUrl = URL.createObjectURL(file);
                        imgEl.onload = () => {
                          // Generate new thumbnail and update store
                          const thumb = generateFaceThumbnail(imgEl, moved as any);
                          URL.revokeObjectURL(fileUrl);
                          useAnonSnapStore.setState(s=>({ processing: { ...s.processing, detectedFaces: s.processing.detectedFaces.map(f=> f.id===moved.id ? { ...f, thumbnail: thumb } : f ) }}));
                        };
                        imgEl.onerror = () => {
                          URL.revokeObjectURL(fileUrl);
                        };
                        imgEl.src = fileUrl;
                      }
                    } catch {}
                  }
                }}
                onPointerLeave={(e)=>{
                  if (draggingFaceId.current===face.id && e.buttons===0) {
                    draggingFaceId.current = null; dragOffset.current = null;
                  }
                }}
              >
                <button
                  data-face-delete
                  className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition bg-red-600/90 hover:bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow"
                  title="Delete face"
                  onClick={(e)=>{ e.stopPropagation(); useAnonSnapStore.setState(state=>({ processing: { ...state.processing, detectedFaces: state.processing.detectedFaces.filter(f=>f.id!==face.id) }})); }}
                >×</button>
              </div>
            );
          })}
        </div>
      </div>
  {/* Duplicate manual add button removed */}

  {processing.error && processing.detectedFaces.length === 0 && (
        <div className="glass-card rounded-2xl p-6 border-destructive/50">
          <p className="text-destructive">{processing.error}</p>
        </div>
      )}
    </div>
  );
};