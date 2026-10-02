import { studioReflection } from "./studio";
import { legacyStudioReflection } from "./legacy-studio";

// Medium uses the same angle-dependent edge response without a scene-copy pass.
export const glassVertex = `
varying vec3 vGlassNormal;
varying vec3 vGlassView;
varying vec3 vGlassPosition;
varying vec3 vGlassWorldNormal;
varying vec3 vGlassWorldView;
varying float vGlassDepth;
varying vec3 vGlassWorldPosition;
void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vGlassNormal = normalize(normalMatrix * normal);
  vGlassView = normalize(-viewPosition.xyz);
  vGlassDepth = length(viewPosition.xyz);
  vGlassPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vGlassWorldPosition = worldPosition.xyz;
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
varying float vGlassDepth;
varying vec3 vGlassWorldPosition;
${studioReflection}
void main() {
  float cosine = abs(dot(normalize(vGlassNormal), normalize(vGlassView)));
  float edge = pow(1.0 - cosine, 5.0);
  float f0 = pow((glassIor - 1.0) / (glassIor + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * edge;
  float surface = sin(vGlassPosition.x * 41.0) * sin(vGlassPosition.y * 37.0) * 0.0005 * materialDetailLevel;
  float absorption = 1.0 - exp(-glassThickness * 0.85 / max(cosine, 0.18));
  vec3 direction = reflect(-normalize(vGlassWorldView), normalize(vGlassWorldNormal));
  vec3 reflection = studioReflection(direction, 0.12);
  // Offset second interface, not refraction or a scene-copy texture.
  float rearInterface = pow(max(0.0, dot(direction, normalize(vec3(-0.55, 0.25, 0.8)))), 28.0);
  reflection += vec3(0.08, 0.12, 0.14) * rearInterface * glassThickness * 2.0 * lightChannels.x;
  vec3 bounceDistance = vGlassWorldPosition - internalWorldPosition;
  float proximity = 1.0 / (1.0 + dot(bounceDistance, bounceDistance) * 18.0);
  reflection += bounceTint * proximity * bounceStrength * lightChannels.w;
  vec3 film = mix(tint, vec3(0.31, 0.26, 0.45), 1.0 - cosine);
  vec3 color = mix(vec3(0.06, 0.09, 0.115), reflection, 0.38 + fresnel * 0.35);
  color = mix(color, film, filmStrength * edge);
  color *= 1.0 - smoothstep(cameraDepth - 0.8, cameraDepth + 2.0, vGlassDepth) * depthHaze;
  float reflectedAlpha = dot(reflection, vec3(0.2126, 0.7152, 0.0722)) * 0.12 * opticalGain;
  gl_FragColor = vec4(color, clamp(absorption + f0 + edge * edgeStrength + surface + reflectedAlpha, 0.0, 0.26));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const legacyGlassFragment = `
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
${legacyStudioReflection}
void main() {
  float cosine = abs(dot(normalize(vGlassNormal), normalize(vGlassView)));
  float edge = pow(1.0 - cosine, 5.0);
  float f0 = pow((glassIor - 1.0) / (glassIor + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * edge;
  float absorption = 1.0 - exp(-glassThickness * 0.85 / max(cosine, 0.18));
  vec3 direction = reflect(-normalize(vGlassWorldView), normalize(vGlassWorldNormal));
  vec3 reflection = studioReflection(direction, 0.12);
  vec3 film = mix(tint, vec3(0.31, 0.26, 0.45), 1.0 - cosine);
  vec3 color = mix(vec3(0.06, 0.09, 0.115), reflection, 0.38 + fresnel * 0.35);
  color = mix(color, film, filmStrength * edge);
  gl_FragColor = vec4(color, clamp(absorption + f0 + edge * edgeStrength, 0.0, 0.3));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
