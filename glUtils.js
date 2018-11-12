//gl shader and program
const compileShader = (gl, source, type) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	const log = gl.getShaderInfoLog(shader);
	if(log){
		console.log(log);
		console.log(source);
	}

	return shader;
}

const createProgram = (gl, vs, fs, ...varyings) => {
	const program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);

	//set up transformFeedbackVaryings, if those are present in the program
	if(varyings.length){
		gl.transformFeedbackVaryings(
			program,
			varyings, //as array of strings
			gl.SEPARATE_ATTRIBS
		);
	}

	gl.linkProgram(program);

	const log = gl.getProgramInfoLog(program);
	if(log){
		console.log(log);
	}

	return program;
}

const initVAOs = (gl, offsets, rotations, positions, colors, age) => {
	const vaos = [gl.createVertexArray(), gl.createVertexArray()];
	const tfs = [gl.createTransformFeedback(), gl.createTransformFeedback()];
	const buffers = new Array(vaos.length);

	for(let i = 0; i < vaos.length; i++){
		const vao = vaos[i];
		const tf = tfs[i];
		buffers[i] = new Array(6);
		const buffer = buffers[i];

		//Set up VAO i.e. buffer state
		gl.bindVertexArray(vao);

		buffer[OFFSET_LOCATION] = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer[OFFSET_LOCATION]);
		gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STREAM_COPY);
		gl.vertexAttribPointer(OFFSET_LOCATION, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(OFFSET_LOCATION);
		gl.vertexAttribDivisor(OFFSET_LOCATION, 1); //TODO: remove later

		buffer[ROTATION_LOCATION] = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer[ROTATION_LOCATION]);
		gl.bufferData(gl.ARRAY_BUFFER, rotations, gl.STREAM_COPY);
		gl.vertexAttribPointer(ROTATION_LOCATION, 1, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(ROTATION_LOCATION);
		gl.vertexAttribDivisor(ROTATION_LOCATION, 1); //TODO: remove later

    buffer[POSITION_LOCATION] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer[POSITION_LOCATION]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(POSITION_LOCATION, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(POSITION_LOCATION);
    
    buffer[COLOR_LOCATION] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer[COLOR_LOCATION]);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(COLOR_LOCATION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(COLOR_LOCATION);
    gl.vertexAttribDivisor(COLOR_LOCATION, 1); //attribute is used once per instance

    buffer[AGE_LOCATION] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer[AGE_LOCATION]);
    gl.bufferData(gl.ARRAY_BUFFER, age, gl.STREAM_COPY);
    gl.vertexAttribPointer(AGE_LOCATION, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(AGE_LOCATION);
    gl.vertexAttribDivisor(AGE_LOCATION, 1);

    buffer[INIT_OFFSET_LOCATION] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer[INIT_OFFSET_LOCATION]);
    gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);
    gl.vertexAttribPointer(INIT_OFFSET_LOCATION, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(INIT_OFFSET_LOCATION);
    gl.vertexAttribDivisor(INIT_OFFSET_LOCATION, 0);

		gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		//Set up transformFeedback objects
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer[OFFSET_LOCATION]);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, buffer[ROTATION_LOCATION]);
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, buffer[AGE_LOCATION]);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

	}

	return { vaos, tfs, buffers };

}
