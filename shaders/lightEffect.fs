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
uniform bool uIsEchantillonnage;
uniform float uNbIteration;
uniform vec3 uColorObj;
uniform float usigma;
uniform Light uLight;

float coefFrenel(vec3 i, vec3 m){
  //Facteur de Fresnel
  float c = dot(i,m);
  if(c<=0.0){
    return 0.0;
  }
  float g = sqrt(uNi*uNi+c*c-1.0);
  float gmc = g-c;
  float gpc = g+c;
  float cgpc = c*(gpc)-1.0;
  float cgmc = c*(gmc)+1.0;
  return 0.5*((gmc*gmc)/(gpc*gpc))*(1.0+(cgpc*cgpc)/(cgmc*cgmc));
}

float coefBeckmann(vec3 m,vec3 vecN)
{

	float sigma = usigma*usigma;
	float cosTheta = dot(vecN,m);
	float cos2Theta = cosTheta*cosTheta;
	float cos4Theta = cos2Theta*cos2Theta;
	float tan2Theta = (1. - cos2Theta) / cos2Theta;

	float f1 = exp(-tan2Theta / (2.0 * sigma));
	float f2 = PI * sigma * cos4Theta;
	return (1.0 / f2) * f1;
}

float coefOmbrage(vec3 vecN, vec3 m, vec3 vecO, vec3 i){
  float NM = max(0.0,dot(vecN,m));
  float NO = max(0.0,dot(vecN,vecO));
  float OM = max(0.0,dot(vecO,m));
  float NI = max(0.0,dot(vecN,i));
  float IM = max(0.0,dot(i,m));

  float val1 = (2.0*NM*NO)/OM;
  float val2 = (2.0*NM*NI)/IM;

  return min(1.0,min(val1,val2));
}

vec3 getM(vec3 vecO, vec3 i){
  return normalize(i+vecO);
}

vec3 getCookTorrance(vec3 Kd, vec3 i, vec3 vecO, vec3 vecN, vec3 m){
  float F = coefFrenel(i, m);
  float D = coefBeckmann(m,vecN);
  float G = coefOmbrage(vecN, m, vecO, i);

  float IN = dot(i,vecN);
  float ON = dot(vecO,vecN);

  float brdf = (F*D*G)/(4.0*IN*ON);
  
  return (1.0-F)*(Kd/PI)+brdf;
}

float random(in vec2 uv){
	return fract(sin(dot(uv, vec2(12.9898,78.233)))* 43758.5453);
}

vec3 rotZ(in vec3 v, float ang){
	vec4 rot = vec4(cos(ang), sin(ang), 0., 1.);
	rot.w = -rot.y;
	return vec3(dot(rot.xwz, v), dot(rot.yxz, v), v.z);
}

vec3 rotY(in vec3 v, float ang){
	vec4 rot = vec4(cos(ang), sin(ang), 0., 1.);
	rot.w = -rot.y;
	return vec3(dot(rot.xzy, v), v.y, dot(rot.wzx, v));
}


vec3 getEchantillonnage(float iter, vec3 Kd, vec3 vecN, vec3 vecO, vec3 vecI){
  
  vec3 color = vec3(0.0);
  float currentIteration = 0.0;
  for(float i = 0.0; i < 100.0; ++i) {
    if(i>iter){break;}
    currentIteration = i;

    float rand1 = random(pos3D.xy + i);
    float rand2 = random(pos3D.xy + rand1);

    float phi = rand1 * 2.0 * PI;
    float theta = atan(sqrt(- usigma * usigma * log(1.0 - rand2)));

    float x = sin(theta) * cos(phi);
    float y = sin(theta) * sin(phi);
    float z = cos(theta);
    
    // vec3 m = vec3(x,y,z);

    vec3 m = normalize(rotZ(vecN,phi));
    m= normalize(rotY(m,theta));
    
    float pdf = coefBeckmann(m,vecN) * cos(theta);
    vec3 cookTorrance = getCookTorrance(Kd,vecI,vecO,vecN,m);

    color += (cookTorrance/pdf);

  }

  return (color/currentIteration);
}

void main() {
  vec3 colorAmbiant = vec3(0.2,0.2,0.2);
  vec3 color = uColorObj;
  vec3 Kd = uColorObj;

  vec3 vecN = normalize(N);
  vec3 vecO = normalize(-pos3D.xyz);
  vec3 vecI = normalize(uLight.pos-pos3D.xyz);
  
  vec3 directionR = (mat3(uInverseRotMatrix)*reflect(-vecO,vecN)).xzy;
  vec3 directionT = (mat3(uInverseRotMatrix)*refract(-vecO,vecN,1.0/uNi)).xzy;


  if(uIsEchantillonnage){
    vec3 echantillon = getEchantillonnage(uNbIteration,Kd,vecN,vecO,vecI);
    float cosThetaI = max(0.0,dot(vecI,vecN));
    color = (uLight.color*echantillon*cosThetaI)+(Kd/PI);
  }else if(uIsCookerTorrance){
    vec3 m = getM(vecO,vecI);
    vec3 cookTorrance = getCookTorrance(Kd,vecI,vecO,vecN,m);
    float cosThetaI = max(0.0,dot(vecI,vecN));
    color = (uLight.color*cookTorrance*cosThetaI);
  }

  if (uIsMirroir && uIsTransparence){
    
    float R = coefFrenel(vecO,vecN);
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