uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform vec3 ambientLightColor;
uniform vec3 directionalLightColor;
uniform vec3 directionalLightDirection;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Ambient light
  vec3 ambient = ambientLightColor * diffuse;
  
  // Directional light
  float dotNL = dot(normal, directionalLightDirection);
  vec3 irradiance = directionalLightColor * max(0.0, dotNL);
  
  // Diffuse reflection
  vec3 diffuseColor = irradiance * diffuse;
  
  // Specular reflection
  vec3 reflectDir = reflect(-directionalLightDirection, normal);
  float specularStrength = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  vec3 specularColor = irradiance * specular * specularStrength;
  
  // Final color
  vec3 outgoingLight = emissive + ambient + diffuseColor + specularColor;
  
  gl_FragColor = vec4(outgoingLight, opacity);
}