//DOM and WebGL context creation
const container = document.querySelector('.container');
const canvas = container.appendChild(document.createElement('canvas'));
canvas.width = container.clientWidth;
canvas.height = container.clientHeight;
const gl = canvas.getContext('webgl2');

//Color choices
const colorRamp = [
	213,14,80,
	255,207,1,
	76,183,72,
	28,77,161,
	147,38,143,
	230,132,139,
	255,233,166,
	154,207,141,
	144,153,205,
	191,142,192
].map(d => d/255);

//Generate data for random instances
//Colors, offsets, and rotations are for per instance attributes
const MAX_INSTANCES = 5000;
const positions = new Float32Array([
  5.0, 0.0, 
  -0.1, 3.0, 
  -0.1, -3.0,
]); //triangular vertices of each instance
const colors = new Float32Array(
	Array
		.from({length:MAX_INSTANCES})
		.map((d,i) => {
			const color = i%10;
			return [colorRamp[color], colorRamp[color+1], colorRamp[color+2]];
		})
		.reduce((acc,v) => acc.concat(v), [])
);
const randomNormal = d3.randomNormal(.5,.2);
const offsets = new Float32Array(
	Array
		.from({length:MAX_INSTANCES})
		.map(() => [(randomNormal() + 0.3)*canvas.height/2, Math.random()*Math.PI*2])
		.map(([r, theta]) => [r * Math.cos(theta)+canvas.width/2, r * Math.sin(theta)+canvas.height/2])
		.reduce((acc,v) => acc.concat(v), [])
);
const rotations = new Float32Array(
	Array
		.from({length:MAX_INSTANCES})
		.map(() => Math.random()*2*Math.PI)
);
const age = new Float32Array(
	Array
		.from({length:MAX_INSTANCES})
		.map(() => Math.random())
)
//Motion parameters
const motionParams = {
	decay:0.005,
	randomWalkSpeed:0.5,
	angularSpeed:1.0
}

//Compile shaders and programs
//Program for render step
const vertexShader = compileShader(gl, vs, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fs, gl.FRAGMENT_SHADER);
const program = createProgram(gl, vertexShader, fragmentShader);
const uWLocation = gl.getUniformLocation(program, 'u_w');
const uHLocation = gl.getUniformLocation(program, 'u_h');
//Program for transform step
const tfVertexShader = compileShader(gl, transformVs, gl.VERTEX_SHADER);
const tfFragmentShader = compileShader(gl, transformFs, gl.FRAGMENT_SHADER);
const tfProgram = createProgram(gl, tfVertexShader, tfFragmentShader, 'v_offset', 'v_rotation', 'v_age');
const tf_uTimeLocation = gl.getUniformLocation(tfProgram, 'u_time');
const tf_uWLocation = gl.getUniformLocation(tfProgram, 'u_w');
const tf_uHLocation = gl.getUniformLocation(tfProgram, 'u_h');
const tf_uDecay = gl.getUniformLocation(tfProgram, 'u_decay');
const tf_uRandomWalkSpeed = gl.getUniformLocation(tfProgram, 'u_random_walk_speed');
const tf_uCircularSpeed = gl.getUniformLocation(tfProgram, 'u_circular_speed');

//Initialize two sets of VAOs and transformFeedBack objects, to be ping-ponged
const {vaos, tfs, buffers} = initVAOs(gl);

//Set up transform feedback and rendering
//First, perform transform feedback into destination buffers (offset and rotation)
//Then, use values in the destination buffer to render
let sourceIdx = 0;
initGL();
render();

function initGL(){
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	gl.useProgram(program);
	gl.uniform1f(uWLocation, canvas.width);
	gl.uniform1f(uHLocation, canvas.height);

	gl.useProgram(tfProgram);
	gl.uniform1f(tf_uWLocation, canvas.width);
	gl.uniform1f(tf_uHLocation, canvas.height);
	gl.uniform1f(tf_uDecay, motionParams.decay);
	gl.uniform1f(tf_uRandomWalkSpeed, motionParams.randomWalkSpeed);
	gl.uniform1f(tf_uCircularSpeed, motionParams.angularSpeed);
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
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, destBuffer[AGE_LOCATION]);

	gl.vertexAttribDivisor(OFFSET_LOCATION, 0);
	gl.vertexAttribDivisor(ROTATION_LOCATION, 0);
	gl.vertexAttribDivisor(AGE_LOCATION, 0);

	gl.enable(gl.RASTERIZER_DISCARD);

	gl.uniform1f(tf_uTimeLocation, Math.random());

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
  gl.bindVertexArray(vaos[sourceIdx]);
  gl.vertexAttribDivisor(OFFSET_LOCATION, 1);
  gl.vertexAttribDivisor(ROTATION_LOCATION, 1);
  gl.vertexAttribDivisor(AGE_LOCATION, 1);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, MAX_INSTANCES);

  requestAnimationFrame(render);
}

//GUI
const gui = new dat.GUI();
const f1 = gui.addFolder('Adjust motion simulation');

f1.add(motionParams, 'decay', 0, 0.05).onChange(val => {
	gl.useProgram(tfProgram);
	gl.uniform1f(tf_uDecay, motionParams.decay);
});
f1.add(motionParams, 'randomWalkSpeed', 0, 2.0).onChange(val => {
	gl.useProgram(tfProgram);
	gl.uniform1f(tf_uRandomWalkSpeed, motionParams.randomWalkSpeed);
});
f1.add(motionParams, 'angularSpeed', 0, 4.0).onChange(val => {
	gl.useProgram(tfProgram);
	gl.uniform1f(tf_uCircularSpeed, motionParams.angularSpeed);
});




