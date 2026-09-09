const vertexSource = `
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUv;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uTime;
uniform float uVelocity;
uniform float uHover;
uniform float uEffect;
uniform vec2 uTilt;
varying vec2 vUv;
varying float vDepth;
varying float vEdge;
void main(){
  vec2 p=aPosition;
  vec2 centered=aUv-.5;
  float edgeX=pow(abs(centered.x)*2.0,2.0);
  float edgeY=pow(abs(centered.y)*2.0,2.0);
  float curl=(centered.x*uTilt.x-centered.y*uTilt.y)*uHover;
  float velocityBend=centered.x*centered.x*sign(centered.x)*uVelocity*.075;
  float pointerDistance=distance(aUv,uPointer);
  float pointerRipple=sin(pointerDistance*18.0-uTime*5.0)*exp(-pointerDistance*7.0)*uHover*.018;
  float personality=0.0;
  if(uEffect<.5) personality=sin(centered.y*9.0+uTime*3.0)*uHover*.012;
  else if(uEffect<1.5) personality=sin(uTime*2.0)*uHover*.010*(1.0-edgeX);
  else if(uEffect<2.5) personality=sin(centered.y*18.0+uTime*2.6)*uHover*.014;
  else if(uEffect<3.5) personality=-sin(uHover*1.5708)*edgeX*.025;
  else personality=sin(centered.y*42.0-uTime*7.0)*uHover*.007;
  float depth=(edgeX*.085+edgeY*.022)+curl*.13+velocityBend+personality;
  p.x+=centered.y*uTilt.x*uHover*.08+velocityBend+pointerRipple*normalize(centered+vec2(.001)).x;
  p.y-=centered.x*uTilt.y*uHover*.055-pointerRipple*normalize(centered+vec2(.001)).y;
  p*=1.0-depth*.045;
  gl_Position=vec4(uCenter+p*uSize,depth*.28,1.0+depth*.08);
  vUv=aUv;vDepth=depth;vEdge=max(edgeX,edgeY);
}`;

const fragmentSource = `
precision mediump float;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uVelocity;
uniform float uHover;
uniform float uEffect;
uniform vec2 uPointer;
varying vec2 vUv;
varying float vDepth;
varying float vEdge;
void main(){
  vec2 uv=vUv;
  if(uEffect<.5) uv.x+=sin(uv.y*13.0+uTime*2.7)*uHover*.004;
  else if(uEffect<1.5){float breath=sin(uTime*1.8)*uHover*.003;uv=(uv-.5)*(1.0-breath)+.5;}
  else if(uEffect<2.5){uv.x+=sin(uv.y*26.0+uTime*3.0)*uHover*.0035;uv.y+=sin(uv.x*14.0-uTime*2.0)*uHover*.002;}
  else if(uEffect<3.5){float magnet=exp(-distance(uv,uPointer)*7.0)*uHover;uv+=(uPointer-.5)*magnet*.006;}
  else {float scan=smoothstep(.035,0.0,abs(fract(uv.y*8.0-uTime*.55)-.5));uv.x+=(scan-.5)*uHover*.004;}
  uv.x+=sin(uv.y*9.0+uTime)*uVelocity*.0025;
  vec4 color=texture2D(uTexture,clamp(uv,.001,.999));
  float paperLight=1.0+uHover*.035-vDepth*.32;
  float bevel=1.0-vEdge*.025+smoothstep(.94,1.0,vEdge)*.04;
  color.rgb*=paperLight*bevel;
  gl_FragColor=color;
}`;

function makeShader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function makeProgram(gl){const p=gl.createProgram();gl.attachShader(p,makeShader(gl,gl.VERTEX_SHADER,vertexSource));gl.attachShader(p,makeShader(gl,gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}

export class CardRenderer{
  constructor(canvas,items){
    this.canvas=canvas;this.items=items;this.segments=32;
    this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
    if(!this.gl)throw new Error('WebGL unavailable');
    this.program=makeProgram(this.gl);const gl=this.gl;
    this.loc={pos:gl.getAttribLocation(this.program,'aPosition'),uv:gl.getAttribLocation(this.program,'aUv'),center:gl.getUniformLocation(this.program,'uCenter'),size:gl.getUniformLocation(this.program,'uSize'),pointer:gl.getUniformLocation(this.program,'uPointer'),time:gl.getUniformLocation(this.program,'uTime'),velocity:gl.getUniformLocation(this.program,'uVelocity'),hover:gl.getUniformLocation(this.program,'uHover'),effect:gl.getUniformLocation(this.program,'uEffect'),tilt:gl.getUniformLocation(this.program,'uTilt'),texture:gl.getUniformLocation(this.program,'uTexture')};
    this.buffer=this.makeBuffer();this.textures=[];this.ready=false;this.resize();
  }
  makeBuffer(){const gl=this.gl,data=[];for(let y=0;y<this.segments;y++)for(let x=0;x<this.segments;x++){const x0=x/this.segments,x1=(x+1)/this.segments,y0=y/this.segments,y1=(y+1)/this.segments;const push=(u,v)=>data.push(u-.5,v-.5,u,1-v);push(x0,y0);push(x1,y0);push(x0,y1);push(x0,y1);push(x1,y0);push(x1,y1);}this.vertexCount=data.length/4;const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b;}
  loadTexture(src){const gl=this.gl;return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);resolve(t);};img.onerror=reject;img.src=src;});}
  async load(){this.textures=await Promise.all(this.items.map(x=>this.loadTexture(x.asset)));this.ready=true;}
  resize(){const dpr=Math.min(window.devicePixelRatio||1,2),w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.w=w;this.h=h;this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
  draw(cards,state){if(!this.ready)return;const gl=this.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(this.loc.pos);gl.vertexAttribPointer(this.loc.pos,2,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(this.loc.uv);gl.vertexAttribPointer(this.loc.uv,2,gl.FLOAT,false,16,8);gl.uniform1i(this.loc.texture,0);
    cards.forEach((card,i)=>{if(card.x+card.w<-150||card.x>this.w+150)return;const cx=((card.x+card.w/2)/this.w)*2-1,cy=1-((card.y+card.h/2)/this.h)*2,sx=(card.w/this.w)*2,sy=(card.h/this.h)*2,px=(state.pointer.x-card.x)/card.w,py=(state.pointer.y-card.y)/card.h;gl.uniform2f(this.loc.center,cx,cy);gl.uniform2f(this.loc.size,sx,sy);gl.uniform2f(this.loc.pointer,px,py);gl.uniform1f(this.loc.time,state.time);gl.uniform1f(this.loc.velocity,Math.max(-2.5,Math.min(2.5,state.velocity/70)));gl.uniform1f(this.loc.hover,card.hover);gl.uniform1f(this.loc.effect,card.effect);gl.uniform2f(this.loc.tilt,card.tiltX,card.tiltY);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[i]);gl.drawArrays(gl.TRIANGLES,0,this.vertexCount);});
  }
}
