precision mediump float;

// postions et normales
varying vec4 pos3D;
varying vec3 N;

// texture.
uniform samplerCube u_skybox;

uniform mat4 uInverseRotMatrix;
uniform float uRatio;
uniform bool uIsMirroir;
uniform bool uIsTransparence;
uniform vec3 uColorObj;

void main() {
  float ni= uRatio;
  float R;
  float T;

  vec3 worldNormal = normalize(N);
  vec3 Vo = normalize(-pos3D.xyz);
  vec3 directionR = mat3(uInverseRotMatrix)*reflect(-Vo,worldNormal);
  vec3 directionT = mat3(uInverseRotMatrix)*refract(-Vo,worldNormal,1.0/ni);

  if(uIsTransparence){
    float c = dot(Vo,worldNormal);
    float g = sqrt(ni*ni+c*c-1.0);
    float gmc = g-c;
    float gpc = g+c;
    float cgpc = c*(gpc)-1.0;
    float cgmc = c*(gmc)+1.0;
    R = 0.5*(gmc*gmc)/(gpc*gpc)*(1.0+(cgpc*cgpc)/(cgmc*cgmc));
    T = 1.0-R;
  }

  if(uIsMirroir && uIsTransparence ){
    vec4 colR = vec4(textureCube(u_skybox, directionR.xzy).xyz*R,1.0);
    vec4 colT = vec4(textureCube(u_skybox, directionT.xzy).xyz*T,1.0);

    gl_FragColor = vec4((colT+colR).xyz*uColorObj,1);
  }
  else if(uIsMirroir){
    gl_FragColor = vec4(textureCube(u_skybox, directionR.xzy).xyz*uColorObj,1.0);
  }else if (uIsTransparence){
    gl_FragColor = vec4(textureCube(u_skybox, directionT.xzy).xyz*uColorObj,1.0);
  }else{
    gl_FragColor=vec4(uColorObj,1.0);
  }
}