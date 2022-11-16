precision mediump float;

#define PI 3.1415926535897932384626433832795

// postions et normales
varying vec4 pos3D;
varying vec3 N;

// texture cubemap
uniform samplerCube u_skybox;

uniform mat4 uInverseRotMatrix;
uniform float uRatio;
uniform bool uIsMirroir;
uniform bool uIsTransparence;
uniform vec3 uColorObj;
uniform int uNumberIteration;
uniform float ualpha;


float getPhi(float rand){
  return rand*2.0*PI;
}

float getTheta(float rand){
  return atan(sqrt(-(ualpha*ualpha)*log(1.0-rand)));
}

vec3 randPosition(float rand1, float rand2){
  float phi = getPhi(rand1);
  float theta = getTheta(rand2);
  float x=sin(theta)*cos(phi);
  float y=sin(theta)*sin(phi);
  float z=cos(theta);


  return vec3(x,y,z);
}

float coefFrenel(vec3 i, vec3 m, float ni){
  //Facteur de Fresnel
    float c = dot(i,m);
    float g = sqrt(ni*ni+c*c-1.0);
    float gmc = g-c;
    float gpc = g+c;
    float cgpc = c*(gpc)-1.0;
    float cgmc = c*(gmc)+1.0;
    return 0.5*(gmc*gmc)/(gpc*gpc)*(1.0+(cgpc*cgpc)/(cgmc*cgmc));
}

float coefBeckmann(vec3 o, vec3 m){
  float cosTheta = dot(o,m)/dot(abs(o),abs(m));
  float sinTheta = sqrt(1.0-(cosTheta*cosTheta));
  float tanTheta = sinTheta/cosTheta;

  return (1.0/(PI*(ualpha*ualpha)*(cosTheta*cosTheta*cosTheta*cosTheta)))*exp(-(tanTheta*tanTheta)/2.0*(ualpha*ualpha));

}

float coefOmbrage(vec3 n, vec3 m, vec3 o, vec3 i){
  float val1 = 2.0*(dot(n,m)*dot(n,o)/(dot(o,m)));
  float val2 = 2.0*(dot(n,m)*dot(n,i)/(dot(i,m)));

  return min(1.0,min(val1,val2));
}

vec3 getm(vec3 o, vec3 i){
  return normalize(i+o);
}


vec3 getBRDF(vec3 Kd, vec3 i, vec3 o,vec3 m,vec3 n, float ni){
  float F = coefFrenel(i, m, ni);
  float D = coefBeckmann(i, m);
  float G = coefOmbrage(n, m, o, i);

  return (1.0-F)*(Kd/PI)+(F*D*G)/(4.0*dot(i*n,o*n));
}

void main() {
  float ni= uRatio;
  float R;
  float T;

  vec3 n = normalize(N);
  vec3 o = normalize(-pos3D.xyz);
  vec3 i = -normalize(vec3(1.0,0.0,0.0)-pos3D.xyz);

  
  vec3 directionR = (mat3(uInverseRotMatrix)*reflect(-o,n)).xzy;
  vec3 directionT = mat3(uInverseRotMatrix)*refract(-o,n,1.0/ni);
  


  vec3 Kd = uColorObj;
  vec3 Li = vec3(1.0,1.0,1.0);

  
  vec3 m = getm(o, i);
  
  vec3 brdf = getBRDF(Kd,i,o,m,n,ni);

  float cosThetaI = dot(m,i)/dot(abs(m),abs(i));

  vec3 colorCook = Li*brdf*cosThetaI;

  gl_FragColor = vec4((textureCube(u_skybox, directionR).xyz*colorCook),1.0);

}