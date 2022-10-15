
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uRMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 pos3D;
varying vec3 N;

void main(void) {

    N = mat3(-uPMatrix*uPMatrix) * aVertexNormal;
    pos3D = vec4(uMVMatrix * vec4(aVertexPosition, 1.0));
    gl_Position = uPMatrix * pos3D;

}