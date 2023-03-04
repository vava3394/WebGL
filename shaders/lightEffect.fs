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
uniform bool uIsMiroirDepoli;
uniform bool uIsWalterGGX;
uniform bool uIsBTDF;
uniform vec3 uColorObj;
uniform float usigma;
uniform float uIntensiteLumineuse;
uniform float uNbIteration;
uniform Light uLight;

// --------------------------------------------
//fonction permettant de retourner le produit scalaire de deux vecteurs si négatifs retourne zéro
float myDot(vec3 a, vec3 b){
  return max(0.0,dot(a,b));
}

// --------------------------------------------
//calcule du coefficient de frenel
float coefFrenel(vec3 i, vec3 m){
  //Facteur de Fresnel
  float c = myDot(i,m);

  float g = sqrt(uNi*uNi+c*c-1.0);
  float gmc = g-c;
  float gpc = g+c;
  float cgpc = c*(gpc)-1.0;
  float cgmc = c*(gmc)+1.0;
  return 0.5*((gmc*gmc)/(gpc*gpc))*(1.0+(cgpc*cgpc)/(cgmc*cgmc));
}

// --------------------------------------------
//calcule du coefficient de ditribution avec le calcule de GGX
float coefDistibutionGGX(vec3 m, vec3 n){
  float sigmaCarre = usigma*usigma;
  float cosTheta = myDot(n,m);
	float cos2Theta = cosTheta*cosTheta;
	float cos4Theta = cos2Theta*cos2Theta;
  float tan2Theta = (1. - cos2Theta) / cos2Theta;

  float f1 = PI*cos4Theta;
  float f2 = (sigmaCarre + tan2Theta) * (sigmaCarre + tan2Theta);

  return sigmaCarre/(f1*f2);
}

// --------------------------------------------
//calcule du coefficient d'ombrage avec le calcule de GGX
float coefOmbrageGGX(float cosThetaV){
  float sigmaCarre = usigma*usigma;
  float cos2Theta = cosThetaV*cosThetaV;
  float tan2Theta = (1. - cos2Theta) / cos2Theta;
  float racine = sqrt(1.0+sigmaCarre*tan2Theta);

  return 2.0/(1.0+racine);
}

// --------------------------------------------
//calcule du coefficient de ditribution avec le calcule de Backman
float coefBeckmann(vec3 m,vec3 n)
{
	float sigmaCarre = usigma*usigma;
	float cosTheta = myDot(n,m);
	float cos2Theta = cosTheta*cosTheta;
	float cos4Theta = cos2Theta*cos2Theta;
	float tan2Theta = (1. - cos2Theta) / cos2Theta;

	float f1 = exp(-tan2Theta / (2.0 * sigmaCarre));
	float f2 = PI * sigmaCarre * cos4Theta;
	return (1.0 / f2) * f1;
}

// --------------------------------------------
//calcule du coefficient d'ombrage
float coefOmbrage(vec3 n, vec3 m, vec3 o, vec3 i){
  float NM = myDot(n,m);
  float NO = myDot(n,o);
  float OM = myDot(o,m);
  float NI = myDot(n,i);
  float IM = myDot(i,m);

  float val1 = (2.0*NM*NO)/OM;
  float val2 = (2.0*NM*NI)/IM;

  return min(1.0,min(val1,val2));
}

// --------------------------------------------
//retourne le vecteur de la normale de la microFacette
vec3 getNormalMicroFacette(vec3 o, vec3 i){
  return normalize(i+o);
}

// --------------------------------------------
//retourne la couleur via les calcule de Cook et Torrance
vec3 getCookTorrance(vec3 Kd, vec3 i, vec3 o,vec3 n,vec3 m){
  float F = coefFrenel(i, m);
  float D;
  float G;
  if(!uIsWalterGGX){
    D = coefBeckmann(m,n);
    G = coefOmbrage(n, m, o, i);
  }else{
    D = coefDistibutionGGX(m,n);
    G = coefOmbrageGGX(myDot(o,m))*coefOmbrageGGX(myDot(i,m));
  }
  
  float IN = myDot(i,n);
  float ON = myDot(o,n);

  return (((1.0-F)*(Kd/PI))+(F*D*G)/(4.0*IN*ON));
}

// --------------------------------------------
//fonction permettant de récupérer un entier aléatoire;
float random(in vec2 uv){
	return fract(sin(dot(uv, vec2(12.9898,78.233)))* 43758.5453);
}

// --------------------------------------------
//retourne un matrix de rotation
mat3 rotate(vec3 N){
  vec3 i = vec3(1.0,0.0,0.0);

  if(myDot(i,N)> 0.9){
    i = vec3(0.0,1.0,0.0);
  }
  vec3 j = cross(N,i);
  i = cross(j,N);
  return mat3(i,j,N);
}

// --------------------------------------------
//retourne la couleur via un calcule d'échantillonnage
vec3 getEchantillonnage(float iter, vec3 vecN, vec3 vecO){
  
  vec3 color = vec3(0.0);
  mat3 rotateM = rotate(vecN);
  int nbIter = 0;
  float eps = 0.001;

  //on boucle seulement pour un nombre max d'échantions
  for(float i = 0.0; i < 100.0; ++i) {
    //condition permettant de stoper la boucle pour un nombre échantions choisie min 1 max 100
    if(i>=iter){break;}

    //on récupérer deux nombre aléatoire afin de créer notre nouveau vecteur qui correspondra à la normale de la microfacette
    float rand1 = random(pos3D.xy + i);
    float rand2 = random(pos3D.xy + rand1);

    float phi = rand1 * 2.0 * PI;
    float theta = atan(sqrt(- (usigma * usigma) * log(1.0 - rand2)));

    float x = sin(theta) * cos(phi);
    float y = sin(theta) * sin(phi);
    float z = cos(theta);
    
    //après avoir calculer les points x , y ,z on le transforme en vecteur
    vec3 m = vec3(x,y,z);
    //on lui applique une rotation et normalise 
    m = rotateM * m;
    m = normalize(m);
    //on récupère le cos Théta par rapport à la normale de la microfacette et de la normal
    float cosThetaM = myDot(m,vecN);

    //Icam est le vecteur directeur du reflet par rapport a la caméra
    vec3 Icam = reflect(-vecO,m);
    float IN = myDot(Icam,vecN);
    float ON = myDot(vecO,vecN);

    //afin d'éviter les divisions par zéro et les valeurs trop basse
    if(cosThetaM<eps || IN<eps || ON<eps) {
      continue;
    } else {
      //calcule des coeficiants
      float F = coefFrenel(Icam,m);
      float D;
      float G;
      //choix possible calcule par Beckman ou GGX
      if(!uIsWalterGGX){
        D = coefBeckmann(m,vecN);
        G = coefOmbrage(vecN,m,vecO,Icam);
      }else{
        D = coefDistibutionGGX(m,vecN);
        G = coefOmbrageGGX(myDot(vecO,m))*coefOmbrageGGX(myDot(Icam,m));
      }

      float pdf = D*cosThetaM; 
      //Iobj est un vecteur directeur au Icam subit une rotation afin d'atteindre la bonne couleur de la skybox
      vec3 Iobj = (mat3(uInverseRotMatrix)*Icam).xzy;
      //on récupère la couleur de la skybox
      vec3 colorReflect = textureCube(uskybox, Iobj).xyz;
      
      if(!uIsMiroirDepoli){
        float IM = myDot(Icam,m);
        float OM = myDot(vecO,m);

        float brdf = (F*D*G)/(4.0*IN*ON);
        //choix possible d'ajouté la refraction
        if(uIsBTDF){
          float numerateurBTDF = (uNi*uNi)*((1.0-F)*G*D);
          float denominateurBTDF = (uNi*IM)+(OM);
          vec3 IRefract = refract(-vecO,m,1.0/uNi);
          vec3 IobjRefract = (mat3(uInverseRotMatrix)*IRefract).xzy;
          vec3 colorRefract = textureCube(uskybox, IobjRefract).xyz;;
          float btdf = (IM*OM/IN*ON)*(numerateurBTDF/(denominateurBTDF*denominateurBTDF));
          color += ((colorReflect*brdf+colorRefract*btdf)*IN)/pdf;
        }else{
          color += ((colorReflect*brdf)*IN)/pdf;
        }
      }else{
        color += colorReflect;
      }
     
      nbIter++;
    }    
  }

  return (color/float(nbIter));
}

// --------------------------------------------
void main() {
  vec3 colorFinal = uColorObj;
  vec3 Kd = uColorObj;

  vec3 vecN = normalize(N);
  vec3 vecO = normalize(-pos3D.xyz);
  vec3 i = normalize(uLight.pos-pos3D.xyz);
  
  vec3 directionR = (mat3(uInverseRotMatrix)*reflect(-vecO,vecN)).xzy;
  vec3 directionT = (mat3(uInverseRotMatrix)*refract(-vecO,vecN,1.0/uNi)).xzy;

  if(uIsEchantillonnage){
    vec3 echantillon = getEchantillonnage(uNbIteration,vecN,vecO);
    colorFinal = echantillon;
  }

  else if(uIsCookerTorrance){
    vec3 m = getNormalMicroFacette(vecO,i);
    vec3 cookTorrance = getCookTorrance(Kd,i,vecO,vecN,m);
    float cosThetaI = myDot(i,vecN);
    colorFinal = (uLight.color*cookTorrance*cosThetaI);
  }

  else if (uIsMirroir && uIsTransparence){
    
    float R = coefFrenel(vecO,vecN);
    float T = 1.0 - R;
    vec4 colR = vec4(textureCube(uskybox, directionR).xyz*R,1.0);
    vec4 colT = vec4(textureCube(uskybox, directionT).xyz*T,1.0);

    colorFinal = (colT+colR).xyz*colorFinal;
  }else if(uIsMirroir){
    colorFinal = textureCube(uskybox, directionR).xyz*colorFinal;
  }else if (uIsTransparence){
    colorFinal = textureCube(uskybox, directionT).xyz*colorFinal;
  }
    
  gl_FragColor=vec4(colorFinal*uIntensiteLumineuse,1.0);

}