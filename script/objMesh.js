
let tabObj = [];

var ni = 1.3;
var sigma = 0.01;
var nbIteration = 90.0;
var intensiteLumineuse = 1.0;
// =====================================================
var isMirroir = false;
var isTransparence = false;
var isCookerTorrance = false;
var isEchantionnage = false;
var isMiroirDePoli = false;
var isWalterGGX = false;

var colors = [1.0,1.0,1.0];

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

		this.shader.uColor = gl.getUniformLocation(this.shader,"uColorObj");
		gl.uniform3fv(this.shader.uColor,colors);

		gl.uniform1i(gl.getUniformLocation(this.shader,'uIsMirroir'),isMirroir);
		gl.uniform1i(gl.getUniformLocation(this.shader,'uIsTransparence'),isTransparence);
		gl.uniform1i(gl.getUniformLocation(this.shader,'uIsCookerTorrance'),isCookerTorrance);
		gl.uniform1i(gl.getUniformLocation(this.shader,'uIsMiroirDepoli'),isMiroirDePoli);
		gl.uniform1f(gl.getUniformLocation(this.shader,'uIsWalterGGX'),isWalterGGX);
		gl.uniform1f(gl.getUniformLocation(this.shader,'usigma'),sigma);

		
		gl.uniform3fv(gl.getUniformLocation(this.shader,'uLight.pos'),LIGHT.position);
		gl.uniform3fv(gl.getUniformLocation(this.shader,'uLight.color'),LIGHT.color);

		gl.uniform1f(gl.getUniformLocation(this.shader,"uNbIteration"),nbIteration);
		gl.uniform1i(gl.getUniformLocation(this.shader,"uIsEchantillonnage"),isEchantionnage);

		gl.uniform1f(gl.getUniformLocation(this.shader,"uIntensiteLumineuse"),intensiteLumineuse);

		this.shader.ratio = gl.getUniformLocation(this.shader, "uNi");
		var skyboxLocation = gl.getUniformLocation(this.shader, "uskybox");
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
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		}
	}
}