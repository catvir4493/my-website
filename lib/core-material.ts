// Static edge lighting only: no displacement, post-processing, bloom, or extra canvas.
export const coreGlassVertex = `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-viewPosition.xyz);
  gl_Position = projectionMatrix * viewPosition;
}`;
export const coreGlassFragment = `
uniform vec3 tint;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float edge = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.5);
  gl_FragColor = vec4(mix(vec3(0.08, 0.12, 0.15), tint, edge), 0.04 + edge * 0.22);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
