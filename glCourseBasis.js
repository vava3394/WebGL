
// =====================================================
var gl;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;

var textCubeMap;
// =====================================================

var OBJ1 = null;
var PLANE = null;
var CUBEMAP = null;

// =====================================================
// CUBEMAP
// =====================================================

class cubemap {

	constructor(){
		this.objName = 'cubemap';
		this.shaderName = 'cubemap';
		this.loaded = -1;
		this.shader = null;
		this.init();
	}

	init(){
		textCubeMap = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, textCubeMap);	 

		const faceInfos = [
			{
			  target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			  url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-x.jpg',
			},
			{
			  target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			  url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-x.jpg',
			},
			{
			  target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			  url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-y.jpg',
			},
			{
			  target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			  url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-y.jpg',
			},
			{
			  target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			  url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-z.jpg',
			},
			{
			  target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			  url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-z.jpg',
			},
		  ];
		faceInfos.forEach((faceInfos) => {
		  	const {target, url} = faceInfos;

			// Upload the canvas to the cubemap face.
			const level = 0;
			const internalFormat = gl.RGBA;
			const width = 512;
			const height = 512;
			const format = gl.RGBA;
			const type = gl.UNSIGNED_BYTE;
		
			// setup each face so it's immediately renderable
			gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
		
			//charger l'image et envoie au GPU
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

		loadShaders(this);
	}

	draw(){

		if(this.shader && this.loaded==4) {		

			// Tell it to use our program (pair of shaders)
			gl.useProgram(this.shader);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, textCubeMap);
			// look up where the vertex data needs to go.
			var positionLocation = gl.getAttribLocation(this.shader, "a_position");

			// lookup uniforms
			var skyboxLocation = gl.getUniformLocation(this.shader, "u_skybox");
			var viewDirectionProjectionInverseLocation =
      			gl.getUniformLocation(this.shader, "viewMatrix");

			this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
			this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");

			// Create a buffer for positions
			var positionBuffer = gl.createBuffer();
			// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			// Put the positions in the buffer
			setGeometry(gl);
				
			// Turn on the position attribute
			gl.enableVertexAttribArray(positionLocation);
		
			// Bind the position buffer.
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
			// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
			var size = 2;          // 2 components per iteration
			var type = gl.FLOAT;   // the data is 32bit floats
			var normalize = false; // don't normalize the data
			var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
			var offset = 0;        // start at the beginning of the buffer
			gl.vertexAttribPointer(
				positionLocation, size, type, normalize, stride, offset);

			mat4.identity(mvMatrix);
			mat4.translate(mvMatrix, [0,0.2, 1]);
			mat4.multiply(mvMatrix, rotMatrix)
			
			gl.uniformMatrix4fv(
				viewDirectionProjectionInverseLocation, false,
				mat4.inverse(mvMatrix));

			gl.uniform1i(skyboxLocation, 0);

			gl.depthFunc(gl.LEQUAL);
		
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}
		
	}

}

function setGeometry(gl) {
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

	OBJ1 = new objmesh('sphere.obj','mirroir');
	//OBJ2 = new objmesh('porsche.obj');
	
	tick();
}

// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	PLANE.draw();
	CUBEMAP.draw();
	OBJ1.draw();
	
	//OBJ2.draw();
}



