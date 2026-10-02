// Shared, anisotropic area-like lobes. Directions are in world space; no PMREM pass.
export const studioReflection = `
uniform vec4 lightChannels;
uniform vec3 bounceTint;
uniform float bounceStrength;
uniform float materialDetailLevel;
uniform float depthHaze;
uniform float cameraDepth;
uniform float opticalGain;
uniform vec3 internalWorldPosition;
float softboxLobe(vec3 d, vec3 axis, vec3 tangent, vec2 width) {
  tangent = normalize(tangent - axis * dot(axis, tangent));
  vec3 bitangent = normalize(cross(axis, tangent));
  vec2 offset = vec2(dot(d, tangent), dot(d, bitangent)) / width;
  return exp(-dot(offset, offset)) * smoothstep(0.25, 0.7, dot(d, axis));
}
vec3 studioReflection(vec3 direction, float roughness) {
  float spread = roughness * roughness * 0.42;
  float top = softboxLobe(direction, normalize(vec3(0.24, 0.55, 0.8)), vec3(1.0, 0.0, 0.0), vec2(0.58, 0.12) + spread);
  float left = softboxLobe(direction, normalize(vec3(-0.65, 0.12, 0.75)), vec3(0.0, 1.0, 0.0), vec2(0.6, 0.075) + spread);
  float right = softboxLobe(direction, normalize(vec3(0.75, -0.2, -0.63)), vec3(0.0, 1.0, 0.0), vec2(0.4, 0.065) + spread);
  return vec3(0.018, 0.026, 0.035) * lightChannels.z
    + top * vec3(0.58, 0.68, 0.73) * lightChannels.x
    + left * vec3(0.2, 0.29, 0.34) * lightChannels.z
    + right * vec3(0.085, 0.07, 0.12) * lightChannels.y;
}`;
export const studioResponse = `
vec3 studioDirection = inverseTransformDirection(reflect(-normalize(vViewPosition), normal), viewMatrix);
float opticalDistance = smoothstep(cameraDepth - 0.8, cameraDepth + 2.0, length(vViewPosition));
vec3 opticalReflection = studioReflection(studioDirection, roughnessFactor);
vec3 internalDirection = internalWorldPosition - vMaterialWorldPosition;
float bounceFalloff = 1.0 / (1.0 + dot(internalDirection, internalDirection) * 18.0);
float bounceFacing = max(0.0, dot(inverseTransformDirection(normal, viewMatrix), normalize(internalDirection + vec3(0.0, 0.0, 0.04))));
opticalReflection += bounceTint * bounceStrength * bounceFalloff * bounceFacing * lightChannels.w;
outgoingLight += opticalReflection * studioIntensity * material.specularColorBlended * (1.0 - roughnessFactor * 0.35) * (1.0 - opticalDistance * 0.22) * opticalGain;
outgoingLight = mix(outgoingLight, outgoingLight * vec3(0.75, 0.84, 0.92), opticalDistance * depthHaze);
`;
