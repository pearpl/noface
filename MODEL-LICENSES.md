# Model & Data Licenses

This project bundles pre-trained face detection models for on-device inference.

## 1. BlazeFace (TensorFlow.js version)
- Source: https://github.com/tensorflow/tfjs-models/tree/master/blazeface
- Files: `public/models/blazeface/*` (model.json, weights.bin) or equivalent in repo
- License: Apache License 2.0 (TensorFlow Models)
- Notice: Copyright (c) Google and TensorFlow authors.

## 2. MediaPipe Face Detection (Short / Full Range)
- Source: https://developers.google.com/mediapipe/solutions/vision/face_detector or TF.js ports
- Files: `public/models/mediapipe-face/*`, `public/models/mediapipe-face-full/*`
- License: Apache License 2.0 (Google MediaPipe)
- Notice: Copyright (c) Google.

## 3. Additional Attribution
If you add new models, list:
- Name + version
- Upstream URL
- License & SPDX identifier
- Any required attribution text verbatim

## Apache 2.0 Snippet
The bundled models under Apache 2.0 require inclusion of the license and NOTICE text. See `NOTICE` file for the composite attribution.

## Integrity
Model files are static and shipped with the app; they are not fetched from remote CDNs at runtime (improves privacy & determinism).

If any licensing concern arises, open an issue or follow SECURITY.md for sensitive disclosures.
