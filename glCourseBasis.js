
// =====================================================
var gl;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;

var textCubeMap;
var ni = 1.3;
var isMirroir = true;
// =====================================================

var OBJ1 = null;
var PLANE = null;
var CUBEMAP = null;

// =====================================================
// CUBEMAP
// =====================================================


function loadTextCubeMap(url,type,width,height){
	var textCubeMap = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, textCubeMap);	 

	const faceInfos = [
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			url: url+'posx.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			url: url+'negx.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			url: url+'posy.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			url: url+'negy.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			url: url+'posz.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			url: url+'negz.'+type,
		},
		];
	faceInfos.forEach((faceInfos) => {
		const {target, url} = faceInfos;

		const level = 0;
		const internalFormat = gl.RGBA;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
	
		//chargement des préférence de la texture
		gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
	
		//chargement de l'image et envoie au GPU
		const image = new Image();
		image.crossOrigin="anonymous"
		image.src = url;
		image.addEventListener('load', function() {
			gl.texImage2D(target, level, internalFormat, format, type, image);
			gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
		});
	});
	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

	return textCubeMap;
}

class cubemap {

	// --------------------------------------------
	constructor(){
		this.objName = 'cubemap';
		this.shaderName = 'cubemap';
		this.loaded = -1;
		this.shader = null;
		this.init();
	}

	// --------------------------------------------
	init(){
		textCubeMap = loadTextCubeMap('images/','jpg',2048,2048)
		loadShaders(this);	
	}

	// --------------------------------------------
	setShadersParams(){
		gl.useProgram(this.shader);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, textCubeMap);

		this.shader.positionLocation = gl.getAttribLocation(this.shader, "a_position");
		this.shader.skyboxLocation = gl.getUniformLocation(this.shader, "u_skybox");
		this.shader.viewDirectionProjectionInverseLocation =
			  gl.getUniformLocation(this.shader, "uViewMatrix");
		var positionBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		this.setGeometry(gl);
		gl.enableVertexAttribArray(this.shader.positionLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(
			this.shader.positionLocation, 2, gl.FLOAT, false, 0, 0);
	}

	// --------------------------------------------
	setMatrixUniforms(){
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [0,0, -1]);
		mat4.multiply(mvMatrix, pMatrix)
		mat4.multiply(mvMatrix, rotMatrix)

		gl.uniformMatrix4fv(
			this.shader.viewDirectionProjectionInverseLocation, false,
			mat4.inverse(mvMatrix));
		gl.uniform1i(this.shader.skyboxLocation, 0);
	}

	// --------------------------------------------
	//position afin de créer un quad de vue de la skybox
	setGeometry(gl) {
		var positions = new Float32Array(
		  [
			-1, -1,
		   1, -1,
		  -1,  1,
		  -1,  1,
		   1, -1,
		   1,  1,
		  ]);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	}

	// --------------------------------------------
	draw(){
		if(this.shader && this.loaded==4) {		
			this.setShadersParams();
			this.setMatrixUniforms();
			gl.depthFunc(gl.LEQUAL);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}
	}

}

// =====================================================
// OBJET 3D, lecture fichier obj
// =====================================================

class objmesh {

	// --------------------------------------------
	constructor(objFname,shaderName) {
		this.objName = objFname;
		this.shaderName = shaderName;
		this.loaded = -1;
		this.shader = null;
		this.mesh = null;
		
		loadObjFile(this);
		loadShaders(this);
	}

	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.inverseRotMatrix = gl.getUniformLocation(this.shader, "uInverseRotMatrix");
		gl.uniform1i(gl.getUniformLocation(this.shader,'isMirroir'),isMirroir);
		this.shader.ratio = gl.getUniformLocation(this.shader, "uRatio");
		var skyboxLocation = gl.getUniformLocation(this.shader, "u_skybox");
		gl.uniform1i(skyboxLocation, 0);
	}
	
	// --------------------------------------------
	setMatrixUniforms() {
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);
		gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.inverseRotMatrix ,false,mat4.inverse(rotMatrix));
		gl.uniform1f(this.shader.ratio,ni);
		mat4.inverse(rotMatrix)
	}
	
	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4 && this.mesh != null) {
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, textCubeMap);
			this.setShadersParams();
			this.setMatrixUniforms();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}
}



// =====================================================
// PLAN 3D, Support géométrique
// =====================================================

class plane {
	
	// --------------------------------------------
	constructor() {
		this.objName = 'plane';
		this.shaderName='plane';
		this.loaded=-1;
		this.shader=null;
		this.initAll();
	}
		
	// --------------------------------------------
	initAll() {
		var size=1.0;
		var vertices = [
			-size, -size, 0.1,
			 size, -size, 0.1,
			 size, size, 0.1,
			-size, size, 0.1
		];

		var texcoords = [
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0
		];

		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 4;

		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 4;

		loadShaders(this);
	}
	
	
	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);

		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
	}

	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4) {		
			this.setShadersParams();
			
			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vBuffer.numItems);
			gl.drawArrays(gl.LINE_LOOP, 0, this.vBuffer.numItems);
		}
	}

}


// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================



// =====================================================
function initGL(canvas)
{
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clearColor(0.7, 0.7, 0.7, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK); 
	} catch (e) {}
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}


// =====================================================
loadObjFile = function(OBJ3D)
{
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var tmpMesh = new OBJ.Mesh(xhttp.responseText);
			OBJ.initMeshBuffers(gl,tmpMesh);
			OBJ3D.mesh=tmpMesh;
		}
	}



	xhttp.open("GET", OBJ3D.objName, true);
	xhttp.send();
}



// =====================================================
function loadShaders(Obj3D) {
	loadShaderText(Obj3D,'.vs');
	loadShaderText(Obj3D,'.fs');
}

// =====================================================
function loadShaderText(Obj3D,ext) {   // lecture asynchrone...
  var xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
		if(ext=='.vs') { Obj3D.vsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(ext=='.fs') { Obj3D.fsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(Obj3D.loaded==2) {
			Obj3D.loaded ++;
			compileShaders(Obj3D);
			Obj3D.loaded ++;
		}
	}
  }
  
  Obj3D.loaded = 0;
  xhttp.open("GET", 'shaders/'+Obj3D.shaderName+ext, true);
  xhttp.send();
}

// =====================================================
function compileShaders(Obj3D)
{
	Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
	gl.compileShader(Obj3D.vshader);
	if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
		console.log("Vertex Shader FAILED... "+Obj3D.shaderName+".vs");
		console.log(gl.getShaderInfoLog(Obj3D.vshader));
	}

	Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
	gl.compileShader(Obj3D.fshader);
	if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
		console.log("Fragment Shader FAILED... "+Obj3D.shaderName+".fs");
		console.log(gl.getShaderInfoLog(Obj3D.fshader));
	}

	Obj3D.shader = gl.createProgram();
	gl.attachShader(Obj3D.shader, Obj3D.vshader);
	gl.attachShader(Obj3D.shader, Obj3D.fshader);
	gl.linkProgram(Obj3D.shader);
	if (!gl.getProgramParameter(Obj3D.shader, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
		console.log(gl.getShaderInfoLog(Obj3D.shader));
	}
	console.log(Obj3D.objName);
	console.log(Obj3D.shader);
}


// =====================================================
function webGLStart() {
	
	var canvas = document.getElementById("WebGL-test");

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	initGL(canvas);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(rotMatrix);
	mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
	mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

	distCENTER = vec3.create([0,-0.2,-3]);
	
	CUBEMAP = new cubemap();

	PLANE = new plane();

	OBJ1 = new objmesh('objs/porsche.obj','transparent');
	OBJ2 = new objmesh('objs/sphere.obj','allShader');
	
	tick();
}

// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	// PLANE.draw();
	CUBEMAP.draw();
	// OBJ1.draw();
	
	OBJ2.draw();
}



