precision mediump float;

// postions et normales
varying vec4 pos3D;
varying vec3 N;

// texture.
uniform samplerCube u_skybox;

uniform mat4 uinverseRotMatrix;

void main() {
  vec3 worldNormal = normalize(N);
  vec3 Vo = normalize(-pos3D.xyz);
  vec3 dir = reflect(-Vo,worldNormal);
  vec3 direction = mat3(uinverseRotMatrix)*dir;

  gl_FragColor = textureCube(u_skybox, direction.xzy);

}