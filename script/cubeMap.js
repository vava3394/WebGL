// =====================================================
// CUBEMAP
// =====================================================
let tabNameTexture=["chateau","space","plage"]
let tabTextCubeMap=[];
var textCubeMap;

function loadTextCubeMap(url,value=0, type = "jpg" ,width = 2048, height = 2048){
	tabTextCubeMap[value] = gl.createTexture();
	
	const faceInfos = [
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			url: 'images/'+url+'/posx.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			url: 'images/'+url+'/negx.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			url: 'images/'+url+'/posy.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			url: 'images/'+url+'/negy.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			url: 'images/'+url+'/posz.'+type,
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			url: 'images/'+url+'/negz.'+type,
		},
		];
	faceInfos.forEach((faceInfos) => {
		let {target, url} = faceInfos;

		const level = 0;
		const internalFormat = gl.RGBA;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
	

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, tabTextCubeMap[value]);//on bind la texture	 
		//chargement des préférence de la texture
		gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

		//chargement de l'image et envoie au GPU
		const image = new Image();
		image.crossOrigin="anonymous"
		image.src = url;
		image.addEventListener('load', function() {	
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, tabTextCubeMap[value]);	 
			gl.texImage2D(target, level, internalFormat, format, type, image);
			gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);//on desactive la texture du bind
		});
		
	});

}

function setImageTextCubeMap(value){
    textCubeMap = tabTextCubeMap[value];
}

class cubemap {

	// --------------------------------------------
	constructor(){
		this.objName = 'cubemap';
		this.shaderName = 'cubemap';
		this.loaded = -1;
		this.shader = null;
		//position afin de créer un quad de vue de la skybox
		this.positions = new Float32Array(
			[
			  -1, -1,
			 1, -1,
			-1,  1,
			-1,  1,
			 1, -1,
			 1,  1,
			]);
		this.init();
	}

	// --------------------------------------------
	init(){
		tabNameTexture.forEach((name,i)=>{
			loadTextCubeMap(name,i);
		})
		textCubeMap = tabTextCubeMap[0];
  		loadShaders(this);	
	}

	// --------------------------------------------
	setShadersParams(){
		gl.useProgram(this.shader);

		this.shader.positionLocation = gl.getAttribLocation(this.shader, "a_position");
		this.shader.skyboxLocation = gl.getUniformLocation(this.shader, "u_skybox");
		this.shader.viewDirectionProjectionInverseLocation =
			  gl.getUniformLocation(this.shader, "uViewMatrix");
		var positionBuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
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
	draw(){
		if(this.shader && this.loaded==4) {	
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, textCubeMap);	
			this.setShadersParams();
			this.setMatrixUniforms();
			gl.depthFunc(gl.LEQUAL);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);	
		}
	}

}