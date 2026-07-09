'use strict';

const $ = id => document.getElementById(id);

// ── State ──────────────────────────────────────────────
const state = {
  file: null, img: null, w: 0, h: 0, ratio: 1,
  aspectLocked: true,
  targetW: 800, targetH: 600,
  zoom: 1, ox: 0, oy: 0,
  dragging: false, dx: 0, dy: 0, lx: 0, ly: 0,
  enhance: { brightness:0, contrast:0, saturation:0, hue:0, sharpness:0, blur:0, grayscale:0, sepia:0 },
  showOriginal: false,
};

// ── DOM ────────────────────────────────────────────────
const uploadZone = $('upload-zone'), fileInput = $('file-input');
const uploadSection = $('upload-section'), editorSection = $('editor-section');
const thumbImg = $('thumb-img');
const infoFilename = $('info-filename'), infoOrigSize = $('info-original-size');
const infoDimensions = $('info-dimensions'), infoFormat = $('info-format');
const changeBtn = $('change-image-btn');
const tabResize = $('tab-resize'), tabEnhance = $('tab-enhance');
const panelResize = $('panel-resize'), panelEnhance = $('panel-enhance');
const widthIn = $('target-width'), heightIn = $('target-height');
const lockBtn = $('aspect-lock-btn'), linkLabel = $('aspect-link-label');
const lockLinked = $('lock-icon-linked'), lockFree = $('lock-icon-free');
const targetKb = $('target-kb'), outputFormat = $('output-format');
const applyBtn = $('apply-resize-btn'), dlResizeBtn = $('download-resize-btn');
const resultResize = $('result-card-resize');
const rOrig = $('r-orig'), rOut = $('r-out'), rDims = $('r-dims');
const rSavings = $('r-savings'), rFill = $('r-savings-fill'), savingWrap = $('saving-wrap');
const pixelCanvas = $('pixel-canvas'), borderOverlay = $('canvas-border-overlay');
const canvasStage = $('canvas-stage'), zoomSlider = $('zoom-slider'), zoomVal = $('zoom-value');
const fitBtn = $('fit-btn'), centerBtn = $('center-btn'), resetZoomBtn = $('reset-zoom-btn');
const enhanceCanvas = $('enhance-canvas');
const compareToggle = $('compare-toggle');
const dlEnhanceBtn = $('download-enhance-btn'), enhanceFormat = $('enhance-format');
const loadOverlay = $('loading-overlay'), loadText = $('loading-text');

// ── Helpers ────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
function fmt(b) { return b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(2)+' MB'; }
function showLoad(t='Processing…') { loadText.textContent=t; loadOverlay.classList.remove('hidden'); }
function hideLoad() { loadOverlay.classList.add('hidden'); }
function toBlob(c,t,q) { return new Promise(r=>c.toBlob(r,t,q)); }

// ── Upload ─────────────────────────────────────────────
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' ') fileInput.click(); });
fileInput.addEventListener('change', e => { if(e.target.files[0]) loadImg(e.target.files[0]); });
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  const f=e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) loadImg(f);
});
changeBtn.addEventListener('click', () => {
  editorSection.classList.add('hidden'); uploadSection.classList.remove('hidden');
  fileInput.value=''; state.file=null;
});

// ── Load Image ─────────────────────────────────────────
function loadImg(file) {
  state.file = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.img=img; state.w=img.naturalWidth; state.h=img.naturalHeight;
    state.ratio=img.naturalWidth/img.naturalHeight;
    thumbImg.src=url;
    infoFilename.textContent = file.name.length>28?file.name.slice(0,25)+'…':file.name;
    infoOrigSize.textContent = fmt(file.size);
    infoDimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
    infoFormat.textContent = file.type.split('/')[1].toUpperCase();
    uploadSection.classList.add('hidden');
    editorSection.classList.remove('hidden');
    const mw=Math.min(img.naturalWidth,1920);
    widthIn.value=mw; heightIn.value=Math.round(mw/state.ratio);
    state.targetW=parseInt(widthIn.value); state.targetH=parseInt(heightIn.value);
    dlResizeBtn.disabled=true;
    resultResize.classList.add('hidden');
    state.zoom=1; state.ox=0; state.oy=0;
    initCanvas();
    resetEnhance();
    renderEnhance();
    renderFilterThumbs();
  };
  img.src=url;
}

// ── Tabs ───────────────────────────────────────────────
tabResize.addEventListener('click', () => switchTab('resize'));
tabEnhance.addEventListener('click', () => switchTab('enhance'));
function switchTab(t) {
  const r=t==='resize';
  tabResize.classList.toggle('active',r); tabEnhance.classList.toggle('active',!r);
  tabResize.setAttribute('aria-selected',r); tabEnhance.setAttribute('aria-selected',!r);
  panelResize.classList.toggle('active',r); panelEnhance.classList.toggle('active',!r);
  if(!r) renderEnhance();
}

// ── Aspect Lock ────────────────────────────────────────
function updateLockUI() {
  lockBtn.classList.toggle('locked',state.aspectLocked);
  lockLinked.classList.toggle('hidden',!state.aspectLocked);
  lockFree.classList.toggle('hidden',state.aspectLocked);
  linkLabel.textContent=state.aspectLocked?'Linked':'Free';
  linkLabel.style.color=state.aspectLocked?'var(--violet)':'var(--tm)';
}
lockBtn.addEventListener('click', () => {
  state.aspectLocked=!state.aspectLocked;
  if(state.aspectLocked&&state.img) state.ratio=state.img.naturalWidth/state.img.naturalHeight;
  updateLockUI();
});
widthIn.addEventListener('input', () => {
  const w=parseInt(widthIn.value); if(!w||w<1) return;
  if(state.aspectLocked&&state.img) heightIn.value=Math.max(1,Math.round(w/state.ratio));
});
heightIn.addEventListener('input', () => {
  const h=parseInt(heightIn.value); if(!h||h<1) return;
  if(state.aspectLocked&&state.img) widthIn.value=Math.max(1,Math.round(h*state.ratio));
});

// ── KB Presets ─────────────────────────────────────────
document.querySelectorAll('.kb-preset').forEach(b => b.addEventListener('click', () => targetKb.value=b.dataset.kb));

// ── Social Presets ─────────────────────────────────────
document.querySelectorAll('.preset-btn-social').forEach(b => b.addEventListener('click', () => {
  widthIn.value=b.dataset.w; heightIn.value=b.dataset.h;
  state.aspectLocked=false; updateLockUI();
}));

// ── Apply & Preview ────────────────────────────────────
applyBtn.addEventListener('click', () => {
  if(!state.img) return;
  const w=parseInt(widthIn.value)||800, h=parseInt(heightIn.value)||600;
  if(w<1||h<1||w>20000||h>20000){alert('Invalid dimensions (1–20000px).');return;}
  state.targetW=w; state.targetH=h;
  state.zoom=1; state.ox=0; state.oy=0;
  initCanvas();
  dlResizeBtn.disabled=false;
  dlResizeBtn.title=`Download at ${w}×${h}`;
});

// ── Download Resize ────────────────────────────────────
// drawScaled: scales the original image into target W×H using CONTAIN (letterbox)
// White padding on sides/top-bottom — preview always matches download exactly.
function drawScaled(ctx, img, w, h) {
  // Fill background with white (for JPEG transparency / letterbox areas)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  // Scale to FIT (contain) — no cropping, maintain aspect ratio
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = w / h;
  let dw, dh, dx, dy;
  if (srcRatio > dstRatio) {
    // source is wider — fit by width, pad top/bottom
    dw = w;
    dh = Math.round(w / srcRatio);
    dx = 0;
    dy = Math.round((h - dh) / 2);
  } else {
    // source is taller — fit by height, pad left/right
    dh = h;
    dw = Math.round(h * srcRatio);
    dy = 0;
    dx = Math.round((w - dw) / 2);
  }
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
}

dlResizeBtn.addEventListener('click', async () => {
  if(!state.img||dlResizeBtn.disabled) return;
  showLoad('Resizing image…'); await sleep(30);
  const w=state.targetW, h=state.targetH;
  const off=document.createElement('canvas'); off.width=w; off.height=h;
  const ctx=off.getContext('2d');
  // Clean resize to exact target dimensions
  drawScaled(ctx, state.img, w, h);
  const kb=parseFloat(targetKb.value);
  const fmt2=outputFormat.value;
  let blob;
  if(kb&&kb>0) {
    blob = await compressTo(off, w, h, state.img, kb*1024, fmt2);
  } else {
    blob = await toBlob(off, fmt2, 0.92);
  }
  const rawExt=fmt2.split('/')[1];
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const base=(state.file.name.replace(/\.[^/.]+$/,'')||'image');
  download(blob,`${base}_${w}x${h}.${ext}`);
  rOrig.textContent=fmt(state.file.size);
  rOut.textContent=fmt(blob.size);
  rDims.textContent=`${w} × ${h} px`;
  const sav=Math.max(0,Math.round((1-blob.size/state.file.size)*100));
  if(kb&&kb>0){
    rSavings.textContent=sav+'%'; rFill.style.width=sav+'%';
    savingWrap.classList.remove('hidden');
  } else { savingWrap.classList.add('hidden'); }
  resultResize.classList.remove('hidden');
  hideLoad();
});

// ── Compress to KB ─────────────────────────────────────
// Compresses using quality reduction ONLY — pixel dimensions are NEVER changed.
// The output image will ALWAYS be exactly w × h pixels as the user set.
async function compressTo(offCanvas, w, h, img, targetBytes, format){
  // Draw the image at the FIXED target size first
  offCanvas.width = w; offCanvas.height = h;
  const ctx2 = offCanvas.getContext('2d');
  drawScaled(ctx2, img, w, h);

  // PNG is lossless — cannot reduce by quality, return as-is at target size
  if(format === 'image/png'){
    return await toBlob(offCanvas, format, 1);
  }

  // Binary search for the best quality that fits within targetBytes
  let lo = 0.01, hi = 1.0, quality = 0.85, blob = null;
  for(let i = 0; i < 24; i++){
    const mid = (lo + hi) / 2;
    quality = mid;
    blob = await toBlob(offCanvas, format, quality);
    const diff = Math.abs(blob.size - targetBytes) / targetBytes;
    if(diff < 0.015) break; // within 1.5% — good enough
    if(blob.size > targetBytes) hi = mid;
    else lo = mid;
    if(hi - lo < 0.004) break;
  }

  // Always return at exact pixel dimensions — even if we couldn't hit target KB
  // (quality floor is 0.01 which is very aggressive but keeps dimensions intact)
  return blob;

}

// ── Canvas Engine ──────────────────────────────────────
const SMAXW=600, SMAXH=420;
function initCanvas(){
  if(!state.img) return;
  const tw=state.targetW, th=state.targetH;
  const ds=Math.min(SMAXW/tw,SMAXH/th,1);
  const dw=Math.round(tw*ds), dh=Math.round(th*ds);
  pixelCanvas.width=tw; pixelCanvas.height=th;
  pixelCanvas.style.width=dw+'px'; pixelCanvas.style.height=dh+'px';
  borderOverlay.style.cssText=`width:${dw}px;height:${dh}px;left:50%;top:50%;transform:translate(-50%,-50%)`;
  canvasStage.style.minHeight=Math.max(SMAXH,dh+40)+'px';
  fitCanvas(); drawCanvas();
}
function fitCanvas(){
  if(!state.img) return;
  // Zoom so the image fits within the canvas display area (SMAXW × SMAXH)
  const tw=state.targetW, th=state.targetH;
  const ds=Math.min(SMAXW/tw,SMAXH/th,1); // display scale factor
  const dispW=tw*ds, dispH=th*ds;          // canvas element size in CSS px
  // Scale image to fit within the displayed canvas box
  const zx=dispW/state.img.naturalWidth, zy=dispH/state.img.naturalHeight;
  state.zoom=Math.min(zx,zy);
  // Center the image inside the target canvas (in target-pixel space)
  state.ox=(tw-state.img.naturalWidth*state.zoom)/2;
  state.oy=(th-state.img.naturalHeight*state.zoom)/2;
  updateZoomUI();
}
function drawCanvas(){
  if(!state.img) return;
  const ctx=pixelCanvas.getContext('2d'), tw=state.targetW, th=state.targetH;
  ctx.clearRect(0,0,tw,th);
  const t=16;
  for(let y=0;y<th;y+=t) for(let x=0;x<tw;x+=t){
    ctx.fillStyle=((x/t+y/t)%2===0)?'#1e2035':'#161828'; ctx.fillRect(x,y,t,t);
  }
  ctx.drawImage(state.img,state.ox,state.oy,state.img.naturalWidth*state.zoom,state.img.naturalHeight*state.zoom);
}
function updateZoomUI(){
  const p=Math.round(state.zoom*100);
  zoomVal.textContent=p+'%';
  const mn=parseInt(zoomSlider.min),mx=parseInt(zoomSlider.max);
  const v=Math.min(Math.max(p,mn),mx); zoomSlider.value=v;
  zoomSlider.style.setProperty('--val',((v-mn)/(mx-mn)*100)+'%');
}

// Zoom slider
zoomSlider.addEventListener('input',()=>{
  const p=parseInt(zoomSlider.value), mn=parseInt(zoomSlider.min), mx=parseInt(zoomSlider.max);
  zoomSlider.style.setProperty('--val',((p-mn)/(mx-mn)*100)+'%');
  const prev=state.zoom; state.zoom=p/100;
  const cx=state.targetW/2, cy=state.targetH/2;
  state.ox=cx-(cx-state.ox)*(state.zoom/prev);
  state.oy=cy-(cy-state.oy)*(state.zoom/prev);
  zoomVal.textContent=p+'%'; drawCanvas();
});

// Mouse wheel
pixelCanvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const r=pixelCanvas.getBoundingClientRect(), sc=state.targetW/r.width;
  const mx=(e.clientX-r.left)*sc, my=(e.clientY-r.top)*sc;
  const f=e.deltaY<0?1.1:0.91, prev=state.zoom;
  state.zoom=Math.min(Math.max(state.zoom*f,0.05),10);
  state.ox=mx-(mx-state.ox)*(state.zoom/prev);
  state.oy=my-(my-state.oy)*(state.zoom/prev);
  updateZoomUI(); drawCanvas();
},{passive:false});

// Drag
pixelCanvas.addEventListener('mousedown',e=>{state.dragging=true;state.dx=e.clientX;state.dy=e.clientY;state.lx=state.ox;state.ly=state.oy;});
window.addEventListener('mousemove',e=>{
  if(!state.dragging) return;
  const r=pixelCanvas.getBoundingClientRect(),sc=state.targetW/r.width;
  state.ox=state.lx+(e.clientX-state.dx)*sc; state.oy=state.ly+(e.clientY-state.dy)*sc; drawCanvas();
});
window.addEventListener('mouseup',()=>{ state.dragging=false; });

// Touch drag
pixelCanvas.addEventListener('touchstart',e=>{
  if(e.touches.length!==1) return;
  const t=e.touches[0]; state.dragging=true;state.dx=t.clientX;state.dy=t.clientY;state.lx=state.ox;state.ly=state.oy;
},{passive:true});
pixelCanvas.addEventListener('touchmove',e=>{
  if(!state.dragging||e.touches.length!==1) return; e.preventDefault();
  const t=e.touches[0],r=pixelCanvas.getBoundingClientRect(),sc=state.targetW/r.width;
  state.ox=state.lx+(t.clientX-state.dx)*sc; state.oy=state.ly+(t.clientY-state.dy)*sc; drawCanvas();
},{passive:false});
window.addEventListener('touchend',()=>{ state.dragging=false; });

fitBtn.addEventListener('click',()=>{ fitCanvas(); drawCanvas(); });
centerBtn.addEventListener('click',()=>{
  if(!state.img) return;
  state.ox=(state.targetW-state.img.naturalWidth*state.zoom)/2;
  state.oy=(state.targetH-state.img.naturalHeight*state.zoom)/2; drawCanvas();
});
resetZoomBtn.addEventListener('click',()=>{ state.zoom=1; updateZoomUI(); drawCanvas(); });

// ── Download helper ────────────────────────────────────
function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}

// ── ENHANCER ──────────────────────────────────────────
const FILTER_PRESETS = {
  natural:  { brightness:0,contrast:0,saturation:0,hue:0,sharpness:0,blur:0,grayscale:0,sepia:0 },
  vivid:    { brightness:10,contrast:25,saturation:60,hue:0,sharpness:2,blur:0,grayscale:0,sepia:0 },
  warm:     { brightness:8,contrast:10,saturation:20,hue:-15,sharpness:1,blur:0,grayscale:0,sepia:25 },
  cool:     { brightness:5,contrast:5,saturation:10,hue:20,sharpness:0,blur:0,grayscale:0,sepia:0 },
  vintage:  { brightness:-5,contrast:10,saturation:-30,hue:0,sharpness:0,blur:0,grayscale:0,sepia:50 },
  bw:       { brightness:0,contrast:15,saturation:0,hue:0,sharpness:2,blur:0,grayscale:100,sepia:0 },
  fade:     { brightness:15,contrast:-20,saturation:-30,hue:0,sharpness:0,blur:0,grayscale:0,sepia:15 },
  drama:    { brightness:-10,contrast:50,saturation:-10,hue:0,sharpness:4,blur:0,grayscale:0,sepia:0 },
};
const SLIDERS = ['brightness','contrast','saturation','hue','sharpness','blur','grayscale','sepia'];

function buildFilterString(e,extraBlur=0){
  const br=1+(e.brightness/100), co=1+(e.contrast/100)*1.5;
  const sa=1+(e.saturation/100)*2, hu=e.hue;
  const bl=e.blur+extraBlur, gr=e.grayscale/100, se=e.sepia/100;
  return `brightness(${br}) contrast(${co}) saturate(${sa}) hue-rotate(${hu}deg) blur(${bl}px) grayscale(${gr}) sepia(${se})`;
}

function resetEnhance(){
  SLIDERS.forEach(k=>{ state.enhance[k]=0; });
  SLIDERS.forEach(k=>{ const sl=$('sl-'+k); if(sl) sl.value=0; });
  updateSliderUI();
  document.querySelectorAll('.filter-preset').forEach(b=>b.classList.remove('active'));
  $('fp-natural').classList.add('active');
}

function updateSliderUI(){
  const e=state.enhance;
  const show = (id,v,suf='') => { const el=$(id); if(el){ el.textContent=(v>0?'+':'')+v+suf; } };
  show('val-brightness',e.brightness);
  show('val-contrast',e.contrast);
  show('val-saturation',e.saturation);
  show('val-hue',e.hue,'°');
  show('val-sharpness',e.sharpness);
  show('val-blur',e.blur,'px');
  show('val-grayscale',e.grayscale,'%');
  show('val-sepia',e.sepia,'%');
  SLIDERS.forEach(k=>{
    const sl=$('sl-'+k); if(!sl) return;
    const mn=parseFloat(sl.min),mx=parseFloat(sl.max),v=parseFloat(sl.value);
    sl.style.setProperty('--val',((v-mn)/(mx-mn)*100)+'%');
  });
}

// Slider events
SLIDERS.forEach(k=>{
  const sl=$('sl-'+k); if(!sl) return;
  sl.addEventListener('input',()=>{
    state.enhance[k]=parseFloat(sl.value);
    updateSliderUI();
    document.querySelectorAll('.filter-preset').forEach(b=>b.classList.remove('active'));
    renderEnhance();
  });
});

// Filter presets
document.querySelectorAll('.filter-preset').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const p=FILTER_PRESETS[btn.dataset.preset]; if(!p) return;
    Object.assign(state.enhance,p);
    SLIDERS.forEach(k=>{ const sl=$('sl-'+k); if(sl) sl.value=p[k]; });
    updateSliderUI();
    document.querySelectorAll('.filter-preset').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderEnhance();
  });
});

$('reset-enhance-btn').addEventListener('click',()=>{ resetEnhance(); renderEnhance(); });

// Compare toggle
compareToggle.addEventListener('change',()=>{
  state.showOriginal=compareToggle.checked;
  renderEnhance();
});

let enhanceRaf=null;
function renderEnhance(){
  if(enhanceRaf) cancelAnimationFrame(enhanceRaf);
  enhanceRaf=requestAnimationFrame(()=>{
    if(!state.img) return;
    const img=state.img;
    const maxW=600, maxH=480;
    const sc=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight,1);
    const w=Math.round(img.naturalWidth*sc), h=Math.round(img.naturalHeight*sc);
    enhanceCanvas.width=w; enhanceCanvas.height=h;
    enhanceCanvas.style.width=w+'px'; enhanceCanvas.style.height=h+'px';
    const ctx=enhanceCanvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    if(state.showOriginal){
      ctx.filter='none';
    } else {
      ctx.filter=buildFilterString(state.enhance);
    }
    ctx.drawImage(img,0,0,w,h);
    // Sharpness: unsharp mask via overlay blend
    if(!state.showOriginal && state.enhance.sharpness>0){
      applySharpness(ctx,w,h,state.enhance.sharpness);
    }
    enhanceRaf=null;
  });
}

function applySharpness(ctx,w,h,amount){
  if(amount<=0) return;
  const orig=ctx.getImageData(0,0,w,h);
  const off=document.createElement('canvas'); off.width=w; off.height=h;
  const oc=off.getContext('2d');
  oc.filter=`blur(${Math.max(0.5,amount*0.4)}px)`;
  oc.drawImage(enhanceCanvas,0,0,w,h);
  const blurred=oc.getImageData(0,0,w,h);
  const od=orig.data, bd=blurred.data;
  const str=amount*0.18;
  for(let i=0;i<od.length-3;i+=4){
    od[i]  =Math.min(255,Math.max(0, od[i]  +str*(od[i]  -bd[i])));
    od[i+1]=Math.min(255,Math.max(0, od[i+1]+str*(od[i+1]-bd[i+1])));
    od[i+2]=Math.min(255,Math.max(0, od[i+2]+str*(od[i+2]-bd[i+2])));
  }
  ctx.filter='none';
  ctx.putImageData(orig,0,0);
}

// Render filter thumbnails
function renderFilterThumbs(){
  if(!state.img) return;
  const img=state.img;
  Object.keys(FILTER_PRESETS).forEach(key=>{
    const tc=$('ft-'+key); if(!tc) return;
    const s=Math.min(60/img.naturalWidth,60/img.naturalHeight);
    const w=Math.round(img.naturalWidth*s), h=Math.round(img.naturalHeight*s);
    tc.width=60; tc.height=60;
    const ctx=tc.getContext('2d');
    ctx.filter=buildFilterString(FILTER_PRESETS[key]);
    const ox=(60-w)/2, oy=(60-h)/2;
    ctx.drawImage(img,ox,oy,w,h);
  });
}

// Download enhanced image
dlEnhanceBtn.addEventListener('click',async()=>{
  if(!state.img) return;
  showLoad('Applying enhancements…'); await sleep(40);
  const img=state.img;
  const off=document.createElement('canvas'); off.width=img.naturalWidth; off.height=img.naturalHeight;
  const ctx=off.getContext('2d');
  ctx.filter=buildFilterString(state.enhance);
  ctx.drawImage(img,0,0);
  if(state.enhance.sharpness>0){
    const tmp=document.createElement('canvas'); tmp.width=img.naturalWidth; tmp.height=img.naturalHeight;
    const tc=tmp.getContext('2d');
    const orig=ctx.getImageData(0,0,img.naturalWidth,img.naturalHeight);
    tc.filter=`blur(${Math.max(0.5,state.enhance.sharpness*0.4)}px)`;
    tc.drawImage(off,0,0);
    const blr=tc.getImageData(0,0,img.naturalWidth,img.naturalHeight);
    const od=orig.data, bd=blr.data, st=state.enhance.sharpness*0.18;
    for(let i=0;i<od.length-3;i+=4){
      od[i]=Math.min(255,Math.max(0,od[i]+st*(od[i]-bd[i])));
      od[i+1]=Math.min(255,Math.max(0,od[i+1]+st*(od[i+1]-bd[i+1])));
      od[i+2]=Math.min(255,Math.max(0,od[i+2]+st*(od[i+2]-bd[i+2])));
    }
    ctx.filter='none'; ctx.putImageData(orig,0,0);
  }
  const f=enhanceFormat.value;
  const rawExt2=f.split('/')[1];
  const ext2 = rawExt2 === 'jpeg' ? 'jpg' : rawExt2;
  const blob=await toBlob(off,f,0.93);
  const base=(state.file.name.replace(/\.[^/.]+$/,'')||'image');
  download(blob,`${base}_enhanced.${ext2}`);
  hideLoad();
});
