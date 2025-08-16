import { create } from 'zustand';

export interface DetectedFace {
  id: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isSelected: boolean;
  thumbnail?: string;
}

export interface ProcessingState {
  originalImage: File | null;
  processedImage: string | null;
  detectedFaces: DetectedFace[];
  isProcessing: boolean;
  currentStep: 'upload' | 'detecting' | 'anonymizing' | 'complete';
  progress: number;
  error: string | null;
}

export interface CropSettings {
  preset: string;
  aspectRatio: number;
  width: number;
  height: number;
  x: number;
  y: number;
  zoom: number;
}

export interface AnonymizationSettings {
  method: 'blur' | 'pixelate' | 'color';
  intensity: number; // blur radius or pixel size (ignored for color)
  applyToAll: boolean;
  color?: string; // hex color for color block method
}

export interface AnonSnapState {
  // Processing state
  processing: ProcessingState;
  
  // Settings
  cropSettings: CropSettings;
  anonymizationSettings: AnonymizationSettings;
  
  // UI state
  isDragOver: boolean;
  showCropModal: boolean;
  sessionImageCount: number;
  showDebugOverlay: boolean;
  
  // Actions
  setOriginalImage: (file: File | null) => void;
  setDetectedFaces: (faces: DetectedFace[]) => void;
  toggleFaceSelection: (faceId: string) => void;
  selectAllFaces: (selected: boolean) => void;
  addFace: (bbox: {x:number;y:number;width:number;height:number}, thumbnail?: string) => void;
  setProcessingState: (state: Partial<ProcessingState>) => void;
  setCropSettings: (settings: Partial<CropSettings>) => void;
  setAnonymizationSettings: (settings: Partial<AnonymizationSettings>) => void;
  setIsDragOver: (isDragOver: boolean) => void;
  setShowCropModal: (show: boolean) => void;
  incrementSessionCount: () => void;
  resetProcessing: () => void;
  toggleDebugOverlay: () => void;
}

export const useAnonSnapStore = create<AnonSnapState>((set, get) => ({
  // Initial state
  processing: {
    originalImage: null,
    processedImage: null,
    detectedFaces: [],
    isProcessing: false,
    currentStep: 'upload',
    progress: 0,
    error: null,
  },
  
  cropSettings: {
    preset: 'Instagram Square',
    aspectRatio: 1,
    width: 1080,
    height: 1080,
    x: 0,
    y: 0,
    zoom: 1,
  },
  
  anonymizationSettings: {
    method: 'color', // default to solid color block for stronger anonymization
    intensity: 7, // slightly higher default for when user switches to blur/pixelate
    applyToAll: true,
    color: '#000000',
  },
  
  isDragOver: false,
  showCropModal: false,
  sessionImageCount: 0,
  showDebugOverlay: true,
  
  // Actions
  setOriginalImage: (file) => {
    set((state) => ({
      processing: {
        ...state.processing,
        originalImage: file,
        currentStep: file ? 'detecting' : 'upload',
        error: null,
      },
    }));
  },
  
  setDetectedFaces: (faces) => {
    set((state) => ({
      processing: {
        ...state.processing,
        detectedFaces: faces,
  error: null,
      },
    }));
  },
  
  toggleFaceSelection: (faceId) => {
    set((state) => ({
      processing: {
        ...state.processing,
        detectedFaces: state.processing.detectedFaces.map((face) =>
          face.id === faceId ? { ...face, isSelected: !face.isSelected } : face
        ),
      },
    }));
  },
  addFace: (bbox, thumbnail) => {
    set((state) => ({
      processing: {
        ...state.processing,
        detectedFaces: [
          ...state.processing.detectedFaces,
          { id: `manual-${Date.now()}`, bbox, isSelected: true, thumbnail },
        ],
  error: null,
      },
    }));
  },
  
  selectAllFaces: (selected) => {
    set((state) => ({
      processing: {
        ...state.processing,
        detectedFaces: state.processing.detectedFaces.map((face) => ({
          ...face,
          isSelected: selected,
        })),
      },
    }));
  },
  
  setProcessingState: (newState) => {
    set((state) => ({
      processing: { ...state.processing, ...newState },
    }));
  },
  
  setCropSettings: (settings) => {
    set((state) => ({
      cropSettings: { ...state.cropSettings, ...settings },
    }));
  },
  
  setAnonymizationSettings: (settings) => {
    set((state) => ({
      anonymizationSettings: { ...state.anonymizationSettings, ...settings },
    }));
  },
  
  setIsDragOver: (isDragOver) => {
    set({ isDragOver });
  },
  
  setShowCropModal: (show) => {
    set({ showCropModal: show });
  },
  
  incrementSessionCount: () => {
    set((state) => ({
      sessionImageCount: state.sessionImageCount + 1,
    }));
  },
  
  resetProcessing: () => {
    set((state) => ({
      processing: {
        originalImage: null,
        processedImage: null,
        detectedFaces: [],
        isProcessing: false,
        currentStep: 'upload',
        progress: 0,
        error: null,
      },
    }));
  },
  toggleDebugOverlay: () => {
    set((state) => ({ showDebugOverlay: !state.showDebugOverlay }));
  },
}));