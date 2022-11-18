// =====================================================
// Light, lumière
// =====================================================

class Light {

	constructor(pos, col) {
		this.position = pos ;
		this.color = col ;
		this.rotX = -1;
		this.rotY = 0; 
	}

// =====================================================
	rotate(){
		mat4.identity(mvLightMatrix);
		mat4.rotate(mvLightMatrix, this.rotX, [1, 0, 0]);
		mat4.rotate(mvLightMatrix, this.rotY, [0, 0, 1]);

		let rotDir = mat4.multiplyVec3(mvLightMatrix, [1., 0., 0.]);
		this.position = vec3.scale(rotDir, 10, this.position);
	}
}