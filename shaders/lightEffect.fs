precision mediump float;

#define PI 3.14159265

struct Light{
  vec3 pos;
  vec3 color;
};

// postions et normales
varying vec4 pos3D;
varying vec3 N;

// texture cubemap
uniform samplerCube uskybox;

uniform mat4 uInverseRotMatrix;
uniform float uNi;
uniform bool uIsMirroir;
uniform bool uIsTransparence;
uniform bool uIsCookerTorrance;
uniform vec3 uColorObj;
uniform float ualpha;
uniform Light uLight;

float coefFrenel(vec3 i, vec3 m){
  //Facteur de Fresnel
  float c = dot(i,m);
  float g = sqrt(uNi*uNi+c*c-1.0);
  float gmc = g-c;
  float gpc = g+c;
  float cgpc = c*(gpc)-1.0;
  float cgmc = c*(gmc)+1.0;
  return 0.5*(gmc*gmc)/(gpc*gpc)*(1.0+(cgpc*cgpc)/(cgmc*cgmc));
}

float coefBeckmann(vec3 M)
{

	float sigma = ualpha*ualpha;
	float cosTheta = dot(N,M);
	float cos2Theta = cosTheta*cosTheta;
	float cos4Theta = cos2Theta*cos2Theta;
	float tan2Theta = (1. - cos2Theta) / cos2Theta;

	float f1 = exp(-tan2Theta / (2.0 * sigma));
	float f2 = PI * sigma * cos4Theta;
	float f = (1.0 / f2) * f1;

	return f;

}

float coefOmbrage(vec3 n, vec3 m, vec3 o, vec3 i){
  float nm = max(0.0,dot(n,m));
  float no = max(0.0,dot(n,o));
  float om = max(0.0,dot(o,m));
  float ni = max(0.0,dot(n,i));
  float im = max(0.0,dot(i,m));

  float val1 = (2.0*nm*no)/om;
  float val2 = (2.0*nm*ni)/im;

  return min(1.0,min(val1,val2));
}

vec3 getM(vec3 o, vec3 i){
  return normalize(i+o);
}

vec3 getCookTorrance(vec3 Kd, vec3 i, vec3 o,vec3 n){
  vec3 m = getM(o,i);
  float F = coefFrenel(i, m);
  float D = coefBeckmann(m);
  float G = coefOmbrage(n, m, o, i);

  float IN = dot(i,n);
  float ON = dot(o,n);

  float brdf = (F*D*G)/(4.0*IN*ON);
  
  return (1.0-F)*(Kd/PI)+brdf;
}



void main() {
  vec3 color = uColorObj;
  vec3 Kd = color;

  vec3 n = normalize(N);
  vec3 o = normalize(-pos3D.xyz);
  vec3 i = normalize(uLight.pos-pos3D.xyz);
  
  vec3 directionR = (mat3(uInverseRotMatrix)*reflect(-o,n)).xzy;
  vec3 directionT = (mat3(uInverseRotMatrix)*refract(-o,n,1.0/uNi)).xzy;

  if(uIsCookerTorrance){
    vec3 cookTorrance = getCookTorrance(Kd,i,o,n);
    float cosThetaI = max(0.0,normalize(dot(i,n)));
    color = (uLight.color*cookTorrance*cosThetaI);
  }

  if (uIsMirroir && uIsTransparence){
    
    float R = coefFrenel(o,n);
    float T = 1.0 - R;
    vec4 colR = vec4(textureCube(uskybox, directionR).xyz*R,1.0);
    vec4 colT = vec4(textureCube(uskybox, directionT).xyz*T,1.0);

    gl_FragColor = vec4((colT+colR).xyz*color,1);
  }else if(uIsMirroir){
    gl_FragColor = vec4(textureCube(uskybox, directionR).xyz*color,1.0);
  }else if (uIsTransparence){
    gl_FragColor = vec4(textureCube(uskybox, directionT).xyz*color,1.0);
  }else{
    gl_FragColor=vec4(color,1.0);
  }

}