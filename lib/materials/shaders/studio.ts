// Analytic softboxes: constant world-space lights, no HDR download or PMREM render target.
export const studioReflection = `
vec3 studioReflection(vec3 direction, float roughness) {
  float exponent = mix(100.0, 6.0, roughness * roughness);
  float key = pow(max(0.0, dot(direction, normalize(vec3(0.3, 0.8, 0.65)))), exponent);
  float strip = pow(max(0.0, dot(direction, normalize(vec3(-0.8, 0.12, 0.58)))), exponent * 1.4);
  float rim = pow(max(0.0, dot(direction, normalize(vec3(0.65, -0.4, -0.55)))), exponent);
  return vec3(0.032, 0.044, 0.056) + key * vec3(0.7, 0.8, 0.86) + strip * vec3(0.24, 0.35, 0.43) + rim * vec3(0.17, 0.13, 0.24);
}`;
export const studioResponse = `
vec3 studioDirection = inverseTransformDirection(reflect(-normalize(vViewPosition), normal), viewMatrix);
outgoingLight += studioReflection(studioDirection, roughnessFactor) * studioIntensity * material.specularColorBlended * (1.0 - roughnessFactor * 0.35);
`;
