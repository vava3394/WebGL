precision mediump float;
 
uniform samplerCube u_skybox;
uniform mat4 viewMatrix;

varying vec4 v_position;
void main() {
  vec4 t = viewMatrix * v_position;
  gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
}