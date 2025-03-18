uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}