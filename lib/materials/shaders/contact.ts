export const contactVertex = `
varying vec2 vContactUv;
void main() {
  vContactUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
export const contactFragment = `
varying vec2 vContactUv;
void main() {
  vec2 inset = min(vContactUv, 1.0 - vContactUv);
  float seam = (1.0 - smoothstep(0.0, 0.075, min(inset.x, inset.y))) * 0.24;
  gl_FragColor = vec4(vec3(0.025, 0.035, 0.04), seam);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
