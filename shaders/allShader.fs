precision mediump float;

// postions et normales
varying vec4 pos3D;
varying vec3 N;

// texture.
uniform samplerCube u_skybox;

uniform mat4 uInverseRotMatrix;
uniform float uRatio;
uniform bool isMirroir;

void main() {
  float ni= uRatio;

  vec3 worldNormal = normalize(N);
  vec3 Vo = normalize(-pos3D.xyz);
  vec3 dirR = reflect(-Vo,worldNormal);
  vec3 directionR = mat3(uInverseRotMatrix)*dirR;

  if(isMirroir){
    gl_FragColor = textureCube(u_skybox, directionR.xzy);
  }else{
    vec3 dirT = refract(-Vo,worldNormal,1.0/ni);
    vec3 directionT = mat3(uInverseRotMatrix)*dirT;

    float c = dot(Vo,worldNormal);
    float g = sqrt(ni*ni+c*c-1.0);
    float gmc = g-c;
    float gpc = g+c;
    float cgpc = c*(gpc)-1.0;
    float cgmc = c*(gmc)+1.0;
    float R = 0.5*(gmc*gmc)/(gpc*gpc)*(1.0+(cgpc*cgpc)/(cgmc*cgmc));
    float T = 1.0-R;

    vec4 colR = vec4(textureCube(u_skybox, directionR.xzy).xyz*R,1.0);
    vec4 colT = vec4(textureCube(u_skybox, directionT.xzy).xyz*T,1.0);

    gl_FragColor = colT+colR;
  }

  



  
  

}