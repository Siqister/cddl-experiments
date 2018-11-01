const POSITION_LOCATION = 2;
const COLOR_LOCATION = 3;
const OFFSET_LOCATION = 0;
const ROTATION_LOCATION = 1;

const vs = `#version 300 es
	#define OFFSET_LOCATION ${OFFSET_LOCATION}
	#define ROTATION_LOCATION ${ROTATION_LOCATION}
	#define POSITION_LOCATION ${POSITION_LOCATION}
	#define COLOR_LOCATION ${COLOR_LOCATION}

  precision highp float;
  precision highp int;

  layout(location = POSITION_LOCATION) in vec2 a_position;
  layout(location = OFFSET_LOCATION) in vec2 a_offset;
  layout(location = ROTATION_LOCATION) in float a_rotation;
  layout(location = COLOR_LOCATION) in vec3 a_color;

  out vec3 v_color;

  void main(){
    //convert float rotation into a mat2 rotation matrix
    float cos_r = cos(a_rotation);
    float sin_r = sin(a_rotation);
    mat2 rot = mat2(
      cos_r, sin_r,
      -sin_r, cos_r
    );

    gl_Position = vec4(rot * a_position + a_offset, 0.0, 1.0);

    v_color = a_color;
  }
`;

const fs = `#version 300 es
  #define ALPHA 0.9
  
  precision highp float;
  precision highp int;

  in vec3 v_color;

  out vec4 color;

  void main(){
    color = vec4(v_color * ALPHA, ALPHA);
  }
`;

const transformVs = `#version 300 es
  #define OFFSET_LOCATION ${OFFSET_LOCATION}
  #define ROTATION_LOCATION ${ROTATION_LOCATION}
  #define M_2PI 6.28318530718

  #define MAP_HALF_LENGTH 1.01
  #define WANDER_CIRCLE_R 0.01
  #define WANDER_CIRCLE_OFFSET 0.04
  #define MOVE_DELTA 0.001

  precision highp float;
  precision highp int;

  uniform float u_time;

  layout(location = OFFSET_LOCATION) in vec2 a_offset;
  layout(location = ROTATION_LOCATION) in float a_rotation;
  
  //These two varyings are transformFeedback outputs
  out vec2 v_offset;
  out float v_rotation;

  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main(){
    float theta = M_2PI * rand(vec2(u_time, a_rotation + a_offset.x + a_offset.y));

    //create 2D rotation matrix from current a_rotation
    float cos_r = cos(a_rotation);
    float sin_r = sin(a_rotation);
    mat2 rot = mat2(
        cos_r, sin_r,
        -sin_r, cos_r
    );

    //compute target vec2 to move towards at each step
    vec2 p = WANDER_CIRCLE_R * vec2(cos(theta), sin(theta)) + vec2(WANDER_CIRCLE_OFFSET, 0.0);
    vec2 target = normalize(rot * p);

    //Move each particle towards target, and record rotation
    v_rotation = atan(target.y, target.x);
    v_offset = a_offset + MOVE_DELTA * target;

    //Wrapping at edges, in case particle moves off screen
    v_offset = vec2 ( 
        v_offset.x > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH : ( v_offset.x < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.x ) , 
        v_offset.y > MAP_HALF_LENGTH ? - MAP_HALF_LENGTH : ( v_offset.y < - MAP_HALF_LENGTH ? MAP_HALF_LENGTH : v_offset.y )
        );

    gl_Position = vec4(v_offset, 0.0, 1.0);
  }
`;

const transformFs = `#version 300 es
  void main(){
    //no-op, since we don't render fragments during transform feedback step
  }
`;