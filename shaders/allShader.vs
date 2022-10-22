attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uRMatrix;

varying vec4 pos3D;
varying vec3 N;

void main() {
  	pos3D = uMVMatrix * aVertexPosition;
	N = vec3(uRMatrix * vec4(aVertexNormal,1.0));
	gl_Position = uPMatrix * pos3D;
}
