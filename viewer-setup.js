import './vendor/model-viewer.min.js';
const Viewer = customElements.get('model-viewer');
Viewer.meshoptDecoderLocation = new URL('./vendor/meshopt-decoder.js', import.meta.url).href;
Viewer.minimumRenderScale = 0.75;
