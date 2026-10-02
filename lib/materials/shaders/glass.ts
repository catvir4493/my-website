import { studioReflection } from "./studio";

// Medium uses the same angle-dependent edge response without a scene-copy pass.
export const glassVertex = `
varying vec3 vGlassNormal;
varying vec3 vGlassView;
varying vec3 vGlassPosition;
varying vec3 vGlassWorldNormal;
varying vec3 vGlassWorldView;
void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vGlassNormal = normalize(normalMatrix * normal);
  vGlassView = normalize(-viewPosition.xyz);
  vGlassPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vGlassWorldNormal = normalize(mat3(modelMatrix) * normal);
  vGlassWorldView = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewPosition;
}`;
export const glassFragment = `
uniform vec3 tint;
uniform float edgeStrength;
uniform float glassIor;
uniform float glassThickness;
uniform float filmStrength;
varying vec3 vGlassNormal;
varying vec3 vGlassView;
varying vec3 vGlassPosition;
varying vec3 vGlassWorldNormal;
varying vec3 vGlassWorldView;
${studioReflection}
void main() {
  float cosine = abs(dot(normalize(vGlassNormal), normalize(vGlassView)));
  float edge = pow(1.0 - cosine, 5.0);
  float f0 = pow((glassIor - 1.0) / (glassIor + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * edge;
  float surface = sin(vGlassPosition.x * 41.0) * sin(vGlassPosition.y * 37.0) * 0.001;
  float absorption = 1.0 - exp(-glassThickness * 0.85 / max(cosine, 0.18));
  vec3 direction = reflect(-normalize(vGlassWorldView), normalize(vGlassWorldNormal));
  vec3 reflection = studioReflection(direction, 0.12);
  vec3 film = mix(tint, vec3(0.31, 0.26, 0.45), 1.0 - cosine);
  vec3 color = mix(vec3(0.06, 0.09, 0.115), reflection, 0.38 + fresnel * 0.35);
  color = mix(color, film, filmStrength * edge);
  gl_FragColor = vec4(color, clamp(absorption + f0 + edge * edgeStrength + surface, 0.0, 0.3));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
