
precision mediump float;

varying vec4 pos3D;
varying vec3 N;


uniform samplerCube u_skybox;

// ==============================================
void main(void)
{

    float ratio = 1.00 / 1.52;

    vec3 R = refract(normalize(vec3(pos3D)), normalize(N),ratio);
    gl_FragColor = vec4(textureCube(u_skybox, R).rgb, 1.0);

}