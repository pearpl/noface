// Minimal type declarations for @tensorflow-models/face-detection
// This allows us to import the module without full upstream types.
declare module '@tensorflow-models/face-detection' {
  export enum SupportedModels {
    MediaPipeFaceDetector = 'mediapipe_face_detector'
  }

  export interface FaceBox {
    xMin: number; xMax: number; yMin: number; yMax: number;
  }
  export interface Face {
    box: FaceBox;
    keypoints?: Array<{ x: number; y: number; name?: string }>;
  }
  export interface FaceDetector {
    estimateFaces: (input: any, config?: any) => Promise<Face[]>;
  }
  export function createDetector(model: SupportedModels, config?: any): Promise<FaceDetector>;
}
