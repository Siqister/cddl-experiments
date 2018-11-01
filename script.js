//DOM and WebGL context creation
const container = document.querySelector('.container');
const canvas = container.appendChild(document.createElement('canvas'));
canvas.width = container.clientWidth;
canvas.height = container.clientHeight;
const gl = canvas.getContext('webgl2');

//Generate data for random instances
//Colors, offsets, and rotations are for per instance attributes
const MAX_INSTANCES = 5000;
const positions = new Float32Array([
  0.0075, 0.0, 
  -0.005, 0.005, 
  -0.005, -0.005,
]);
const colors = new Float32Array(
	Array
		.from({length:MAX_INSTANCES})
		.map(() => [Math.random(), Math.random(), Math.random()])
		.reduce((acc,v) => acc.concat(v), [])
);
const offsets = new Float32Array(
	Array
		.from({length:MAX_INSTANCES})
		.map(() => [Math.random()*2-1, Math.random()*2-1])
		.reduce((acc,v) => acc.concat(v), [])
);
const rotations = new Float32Array(
	Array
		.from({length:MAX_INSTANCES})
		.map(() => Math.random()*2*Math.PI)
);

//Compile shaders and programs
//Program for render step
const vertexShader = compileShader(gl, vs, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fs, gl.FRAGMENT_SHADER);
const program = createProgram(gl, vertexShader, fragmentShader);
//Program for transform step
const tfVertexShader = compileShader(gl, transformVs, gl.VERTEX_SHADER);
const tfFragmentShader = compileShader(gl, transformFs, gl.FRAGMENT_SHADER);
const tfProgram = createProgram(gl, tfVertexShader, tfFragmentShader, 'v_offset', 'v_rotation');
const uTimeLocation = gl.getUniformLocation(tfProgram, 'u_time');

//Initialize two sets of VAOs and transformFeedBack objects, to be ping-ponged
const {vaos, tfs, buffers} = initVAOs(gl);

//Set up transform feedback and rendering
//First, perform transform feedback into destination buffers (offset and rotation)
//Then, use values in the destination buffer to render
let sourceIdx = 0;
initGL();
render();

function initGL(){
	gl.viewport(0, 0, canvas.height, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.useProgram(program);
}

function transform(){
	const destIdx = (sourceIdx + 1)%2;
	const sourceVAO = vaos[sourceIdx];
	const destTf = tfs[destIdx];
	const destBuffer = buffers[destIdx];

	gl.useProgram(tfProgram);

	gl.bindVertexArray(sourceVAO);
	gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, destTf);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, destBuffer[OFFSET_LOCATION]);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, destBuffer[ROTATION_LOCATION]);

	gl.vertexAttribDivisor(OFFSET_LOCATION, 0);
	gl.vertexAttribDivisor(ROTATION_LOCATION, 0);

	gl.enable(gl.RASTERIZER_DISCARD);

	//gl.uniform1f(uTimeLocation, Date.now());

	//Run transformFeedback
	gl.beginTransformFeedback(gl.POINTS);
	gl.drawArrays(gl.POINTS, 0, MAX_INSTANCES);
	gl.endTransformFeedback();

	//Restore state
  gl.disable(gl.RASTERIZER_DISCARD);
  gl.useProgram(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
  gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

  //Update idx to ping-pong
  sourceIdx = (sourceIdx + 1)%2;
}

function render(){

	transform();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

	gl.uniform1f(uTimeLocation, Date.now());

  gl.bindVertexArray(vaos[sourceIdx]);
  gl.vertexAttribDivisor(OFFSET_LOCATION, 1);
  gl.vertexAttribDivisor(ROTATION_LOCATION, 1);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, MAX_INSTANCES);

  requestAnimationFrame(render);
}


