// =====================================================
var gl;

// =====================================================
var mvLightMatrix = mat4.create();
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;

let obj;

// =====================================================
var LIGHT;
var OBJ1 = null;
var PLANE = null;
var CUBEMAP = null;

// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================

// =====================================================
function initGL(canvas) {
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
loadObjFile = function (OBJ3D) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var tmpMesh = new OBJ.Mesh(xhttp.responseText);
            OBJ.initMeshBuffers(gl, tmpMesh);
            OBJ3D.mesh = tmpMesh;
        }
    };

    xhttp.open("GET", OBJ3D.objName, true);
    xhttp.send();
};

// =====================================================
function loadShaders(Obj3D) {
    loadShaderText(Obj3D, ".vs");
    loadShaderText(Obj3D, ".fs");
}

// =====================================================
function loadShaderText(Obj3D, ext) {
    // lecture asynchrone...
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            if (ext == ".vs") {
                Obj3D.vsTxt = xhttp.responseText;
                Obj3D.loaded++;
            }
            if (ext == ".fs") {
                Obj3D.fsTxt = xhttp.responseText;
                Obj3D.loaded++;
            }
            if (Obj3D.loaded == 2) {
                Obj3D.loaded++;
                compileShaders(Obj3D);
                Obj3D.loaded++;
            }
        }
    };

    Obj3D.loaded = 0;
    xhttp.open("GET", "shaders/" + Obj3D.shaderName + ext, true);
    xhttp.send();
}

// =====================================================
function compileShaders(Obj3D) {
    Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
    gl.compileShader(Obj3D.vshader);
    if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
        console.log("Vertex Shader FAILED... " + Obj3D.shaderName + ".vs");
        console.log(gl.getShaderInfoLog(Obj3D.vshader));
    }

    Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
    gl.compileShader(Obj3D.fshader);
    if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
        console.log("Fragment Shader FAILED... " + Obj3D.shaderName + ".fs");
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
}

// =====================================================
function webGLStart() {
    var canvas = document.getElementById("WebGL-test");

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width;
    canvas.height = height;

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    canvas.onwheel = handleMouseWheel;

    initGL(canvas);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(rotMatrix);
    mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
    mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

    distCENTER = vec3.create([0, -0.2, -3]);

    CUBEMAP = new cubemap();

    PLANE = new plane();

    LIGHT = new Light([0.0, 0.0, 0.0], [1.0, 1.0, 1.0]);

    tabObj.push(new objmesh("objs/bunny.obj", "lightEffect"));
    tabObj.push(new objmesh("objs/sphere.obj", "lightEffect"));
    tabObj.push(new objmesh("objs/porsche.obj", "lightEffect"));
    tabObj.push(new objmesh("objs/mustang.obj", "lightEffect"));
    tabObj.push(new objmesh("objs/cube.obj", "lightEffect"));
    tabObj.push(new objmesh("objs/Lara_Croft.obj", "lightEffect"));

    obj = tabObj[1];

    tick();
}

// =====================================================
function setObj(value) {
    obj = tabObj[value];
}

// =====================================================
function setIsMirroir(value) {
    isEchantionnage = !value;
    isCookerTorrance = !value;
    isTransparence = !value;
    isMirroir = value;
}

// =====================================================
function setIsCooker(value) {
    isTransparence = !value;
    isEchantionnage = !value;
    isMirroir = !value;

    isCookerTorrance = value;
}

// =====================================================
function setIsTransparence(value) {
    isCookerTorrance = !value;
    isEchantionnage = !value;
    isMirroir = !value;

    isTransparence = value;
}

// =====================================================
function setIsEchantionnage(value) {
    isEchantionnage = value;
}

function setIsEchantion(value) {
    isTransparence = !value;
    isCookerTorrance = !value;
    isMirroir = !value;

    console.log("********************", value);

    isEchantionnage = value;
}

// =====================================================
function setIterationEchantionnage(value) {
    nbIteration = value;
}

// =====================================================
function setNi(value) {
    ni = value;
}

// =====================================================
function setSigma(value) {
    sigma = value;
}

function setIntensiteLumineuse(value) {
    intensiteLumineuse = value;
}

function setNbEchantion(value) {
    nbIteration = value;
}

// =====================================================
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    PLANE.draw();
    gl.enable(gl.CULL_FACE);
    CUBEMAP.draw();
    obj.draw();
}
