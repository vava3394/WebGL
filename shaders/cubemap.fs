precision mediump float;
 
uniform samplerCube u_skybox;
uniform mat4 uViewMatrix;

varying vec4 v_position;
void main() {
  vec4 t = uViewMatrix * v_position;
  gl_FragColor = textureCube(u_skybox, normalize(vec3(t.x,t.z,t.y) / t.w));
}