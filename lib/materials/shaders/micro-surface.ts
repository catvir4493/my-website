// Object-space detail changes light response, not the silhouette. No time-dependent noise.
export const microSurfaceVertex = `
varying vec3 vMaterialPosition;
`;
export const microSurfaceFragment = `
varying vec3 vMaterialPosition;
uniform float microNormalStrength;
uniform float roughnessVariation;
uniform float surfaceDirection;
float surfaceNoise(vec2 p) {
  // Band-limited interference: stable in WebKit and without a noise texture.
  return sin(p.x * 37.0 + sin(p.y * 23.0)) * sin(p.y * 41.0 + p.x * 11.0);
}
float surfaceHeight(vec2 p) {
  vec2 q = mix(p, p.yx, surfaceDirection);
  return sin(q.y * 230.0) * 0.65 + surfaceNoise(p * 1.7) * 0.35;
}
`;
export const microRoughness = `
roughnessFactor = clamp(roughnessFactor + surfaceNoise(vMaterialPosition.xy) * roughnessVariation, 0.065, 0.98);
`;
export const microNormal = `
float materialHeight = surfaceHeight(vMaterialPosition.xy) * microNormalStrength;
vec3 materialDx = dFdx(-vViewPosition);
vec3 materialDy = dFdy(-vViewPosition);
vec3 materialR1 = cross(materialDy, normal);
vec3 materialR2 = cross(normal, materialDx);
float materialDet = dot(materialDx, materialR1);
vec3 materialGradient = sign(materialDet) * (dFdx(materialHeight) * materialR1 + dFdy(materialHeight) * materialR2);
normal = normalize(abs(materialDet) * normal - materialGradient);
`;
