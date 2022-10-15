
precision mediump float;

varying vec4 pos3D;
varying vec3 N;


uniform samplerCube u_skybox;

// ==============================================
void main(void)
{
    vec3 R = reflect(normalize(vec3(pos3D)), normalize(N));
    gl_FragColor = vec4(textureCube(u_skybox, R).rgb, 1.0);

}