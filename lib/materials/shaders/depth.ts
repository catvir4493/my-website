// Front/back orbit separation with depth-tested alpha; no fog volume or extra pass.
export const depthVertex = `
varying float vDepth;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  vDepth = length(p.xyz);
  gl_Position = projectionMatrix * p;
}`;
export const depthFragment = `
uniform vec3 orbitTint;
uniform float cameraDepth;
uniform float orbitOpacity;
varying float vDepth;
void main() {
  float distanceResponse = smoothstep(cameraDepth - 1.5, cameraDepth + 1.8, vDepth);
  vec3 color = mix(orbitTint, vec3(0.23, 0.3, 0.37), distanceResponse * 0.32);
  gl_FragColor = vec4(color, orbitOpacity * (1.0 - distanceResponse * 0.65));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export const signalVertex = `
varying float vSignalStrength;
varying float vFacing;
void main() {
  vec4 local = instanceMatrix * vec4(position, 1.0);
  vec4 p = modelViewMatrix * local;
  vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-p.xyz)));
  vSignalStrength = instanceColor.r;
  gl_Position = projectionMatrix * p;
}`;
export const signalFragment = `
uniform vec3 bounceTint;
uniform vec4 lightChannels;
varying float vSignalStrength;
varying float vFacing;
void main() {
  float center = pow(vFacing, 3.0);
  vec3 light = mix(bounceTint * 0.24, mix(bounceTint, vec3(0.8, 0.9, 0.93), 0.42), center);
  gl_FragColor = vec4(light * vSignalStrength, (0.12 + center * 0.78) * vSignalStrength * lightChannels.w);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
