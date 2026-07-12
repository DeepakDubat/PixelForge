'use strict';

const $ = id => document.getElementById(id);

// ── State ──────────────────────────────────────────────
const state = {
  // Single image
  file: null, img: null, w: 0, h: 0, ratio: 1,
  aspectLocked: true,
  targetW: 800, targetH: 600,
  zoom: 1, ox: 0, oy: 0,
  dragging: false, dx: 0, dy: 0, lx: 0, ly: 0,
  enhance: { brightness:0, contrast:0, saturation:0, hue:0, sharpness:0, blur:0, grayscale:0, sepia:0 },
  showOriginal: false,
  
  // Watermark
  watermark: {
    type: 'none', // 'none' | 'text' | 'image'
    text: '© PixelForge',
    color: '#ffffff',
    size: 30,
    position: 'bottom-right',
    opacity: 50,
    padding: 20,
    img: null,
    logoScale: 15
  },

  // Crop
  crop: {
    active: false,
    rect: { x: 0, y: 0, w: 0, h: 0 }, // in target canvas space
    draggingHandle: null, // null | 'TL' | 'TR' | 'BL' | 'BR' | 'T' | 'B' | 'L' | 'R' | 'move'
    lockRatio: true,
    dragStart: null
  },

  // Batch Mode
  currentTab: 'single', // 'single' | 'batch'
  batchFiles: [],
  batchAspectLocked: true,
  batchWidth: 800,
  batchHeight: 600
};

// ── DOM Elements ───────────────────────────────────────
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

// New DOM Elements
const themeToggle = $('theme-toggle');
const navSingle = $('nav-single'), navBatch = $('nav-batch');
const singleImageFlow = $('single-image-flow'), batchImageFlow = $('batch-image-flow');
const cropToggleBtn = $('crop-toggle-btn'), cropControlsRow = $('crop-controls-row');
const cropApplyBtn = $('crop-apply-btn'), cropCancelBtn = $('crop-cancel-btn'), cropLockRatio = $('crop-lock-ratio');

// Watermark DOM Elements
const watermarkType = $('watermark-type');
const wmTextSettings = $('wm-text-settings'), wmImageSettings = $('wm-image-settings'), wmSharedSettings = $('wm-shared-settings');
const wmText = $('wm-text'), wmColor = $('wm-color'), wmSize = $('wm-size');
const wmImageInput = $('wm-image-input'), wmImageSelectBtn = $('wm-image-select-btn'), wmImageFilename = $('wm-image-filename');
const wmLogoScale = $('wm-logo-scale'), wmLogoScaleVal = $('wm-logo-scale-val');
const wmPosition = $('wm-position'), wmOpacity = $('wm-opacity'), wmOpacityVal = $('wm-opacity-val'), wmPadding = $('wm-padding');

// Batch DOM Elements
const batchUploadSection = $('batch-upload-section'), batchEditorSection = $('batch-editor-section');
const batchUploadZone = $('batch-upload-zone'), batchFileInput = $('batch-file-input');
const batchWidth = $('batch-width'), batchHeight = $('batch-height'), batchAspectLock = $('batch-aspect-lock');
const batchFormat = $('batch-format'), batchKb = $('batch-kb'), batchWmType = $('batch-wm-type'), batchWmTextRow = $('batch-wm-text-row'), batchWmText = $('batch-wm-text');
const batchProcessBtn = $('batch-process-btn'), batchClearBtn = $('batch-clear-btn'), batchQueueList = $('batch-queue-list'), batchCount = $('batch-count');
const batchAddMoreBtn = $('batch-add-more-btn'), batchAddMoreInput = $('batch-add-more-input');

// ── Helpers ────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
function fmt(b) { return b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(2)+' MB'; }
function showLoad(t='Processing…') { loadText.textContent=t; loadOverlay.classList.remove('hidden'); }
function hideLoad() { loadOverlay.classList.add('hidden'); }
function toBlob(c,t,q) { return new Promise(r=>c.toBlob(r,t,q)); }

// ── Theme Logic ────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'light' || (!saved && !prefersDark)) {
    document.body.classList.add('light-theme');
    themeToggle.querySelector('.sun-icon').classList.add('hidden');
    themeToggle.querySelector('.moon-icon').classList.remove('hidden');
  }
}
themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  themeToggle.querySelector('.sun-icon').classList.toggle('hidden', isLight);
  themeToggle.querySelector('.moon-icon').classList.toggle('hidden', !isLight);
});
initTheme();

// ── Single/Batch Mode Switching ────────────────────────
navSingle.addEventListener('click', () => switchFlow('single'));
navBatch.addEventListener('click', () => switchFlow('batch'));
function switchFlow(mode) {
  state.currentTab = mode;
  navSingle.classList.toggle('active', mode === 'single');
  navBatch.classList.toggle('active', mode === 'batch');
  navSingle.setAttribute('aria-selected', mode === 'single');
  navBatch.setAttribute('aria-selected', mode === 'batch');
  
  singleImageFlow.classList.toggle('hidden', mode !== 'single');
  batchImageFlow.classList.toggle('hidden', mode !== 'batch');
  if (mode === 'single') {
    initCanvas();
  }
}

// ── Single Upload ──────────────────────────────────────
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
    
    // Reset crop state
    state.crop.active = false;
    cropControlsRow.classList.add('hidden');
    cropToggleBtn.classList.remove('active');
    
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

// ── Watermark Implementation ───────────────────────────
watermarkType.addEventListener('change', () => {
  const type = watermarkType.value;
  state.watermark.type = type;
  wmTextSettings.classList.toggle('hidden', type !== 'text');
  wmImageSettings.classList.toggle('hidden', type !== 'image');
  wmSharedSettings.classList.toggle('hidden', type === 'none');
  drawCanvas();
});

wmText.addEventListener('input', () => { state.watermark.text = wmText.value; drawCanvas(); });
wmColor.addEventListener('input', () => { state.watermark.color = wmColor.value; drawCanvas(); });
wmSize.addEventListener('input', () => { state.watermark.size = parseInt(wmSize.value) || 20; drawCanvas(); });
wmPosition.addEventListener('change', () => { state.watermark.position = wmPosition.value; drawCanvas(); });
wmOpacity.addEventListener('input', () => {
  state.watermark.opacity = parseInt(wmOpacity.value);
  wmOpacityVal.textContent = state.watermark.opacity + '%';
  drawCanvas();
});
wmPadding.addEventListener('input', () => { state.watermark.padding = parseInt(wmPadding.value) || 20; drawCanvas(); });

wmImageSelectBtn.addEventListener('click', () => wmImageInput.click());
wmImageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  wmImageFilename.textContent = file.name;
  const reader = new FileReader();
  reader.onload = ev => {
    const logoImg = new Image();
    logoImg.onload = () => {
      state.watermark.img = logoImg;
      drawCanvas();
    };
    logoImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});
wmLogoScale.addEventListener('input', () => {
  state.watermark.logoScale = parseInt(wmLogoScale.value);
  wmLogoScaleVal.textContent = state.watermark.logoScale + '%';
  drawCanvas();
});

function drawWatermark(ctx, w, h) {
  if (state.watermark.type === 'none') return;
  ctx.save();
  ctx.globalAlpha = state.watermark.opacity / 100;
  const padding = state.watermark.padding;
  
  if (state.watermark.type === 'text') {
    const text = state.watermark.text || '';
    const size = state.watermark.size;
    ctx.font = `bold ${size}px Outfit, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = state.watermark.color || '#ffffff';
    const textMetrics = ctx.measureText(text);
    const textW = textMetrics.width;
    const textH = size;
    
    let x, y;
    switch (state.watermark.position) {
      case 'top-left': x = padding; y = padding; break;
      case 'top-right': x = w - padding - textW; y = padding; break;
      case 'bottom-left': x = padding; y = h - padding - textH; break;
      case 'bottom-right': x = w - padding - textW; y = h - padding - textH; break;
      case 'center': x = (w - textW)/2; y = (h - textH)/2; break;
    }
    ctx.fillText(text, x, y);
  } else if (state.watermark.type === 'image' && state.watermark.img) {
    const logo = state.watermark.img;
    const logoW = Math.round(w * (state.watermark.logoScale / 100));
    const logoH = Math.round(logoW * (logo.naturalHeight / logo.naturalWidth));
    
    let x, y;
    switch (state.watermark.position) {
      case 'top-left': x = padding; y = padding; break;
      case 'top-right': x = w - padding - logoW; y = padding; break;
      case 'bottom-left': x = padding; y = h - padding - logoH; break;
      case 'bottom-right': x = w - padding - logoW; y = h - padding - logoH; break;
      case 'center': x = (w - logoW)/2; y = (h - logoH)/2; break;
    }
    ctx.drawImage(logo, x, y, logoW, logoH);
  }
  ctx.restore();
}

// ── Crop Mode Implementation ───────────────────────────
cropToggleBtn.addEventListener('click', () => {
  if (!state.img) return;
  state.crop.active = !state.crop.active;
  cropToggleBtn.classList.toggle('active', state.crop.active);
  cropControlsRow.classList.toggle('hidden', !state.crop.active);
  
  if (state.crop.active) {
    // Zoom to fit so we can crop cleanly
    fitCanvas();
    // Initialize crop box to 85% of image display size
    const imgW = state.img.naturalWidth * state.zoom;
    const imgH = state.img.naturalHeight * state.zoom;
    
    let cw = imgW * 0.85;
    let ch = imgH * 0.85;
    if (state.crop.lockRatio) {
      // Force ratio
      if (cw / state.ratio > imgH) {
        ch = imgH * 0.85;
        cw = ch * state.ratio;
      } else {
        ch = cw / state.ratio;
      }
    }
    const cx = state.ox + (imgW - cw) / 2;
    const cy = state.oy + (imgH - ch) / 2;
    state.crop.rect = { x: cx, y: cy, w: cw, h: ch };
  }
  drawCanvas();
});

cropCancelBtn.addEventListener('click', () => {
  state.crop.active = false;
  cropToggleBtn.classList.remove('active');
  cropControlsRow.classList.add('hidden');
  drawCanvas();
});

cropLockRatio.addEventListener('change', () => {
  state.crop.lockRatio = cropLockRatio.checked;
  if (state.crop.lockRatio && state.crop.active) {
    // adjust height to match ratio
    const r = state.crop.rect;
    r.h = r.w / state.ratio;
    drawCanvas();
  }
});

cropApplyBtn.addEventListener('click', async () => {
  if (!state.img || !state.crop.active) return;
  showLoad('Cropping image...');
  await sleep(40);
  
  const r = state.crop.rect;
  // Convert canvas space crop box to image space coordinates
  const cropX = (r.x - state.ox) / state.zoom;
  const cropY = (r.y - state.oy) / state.zoom;
  const cropW = r.w / state.zoom;
  const cropH = r.h / state.zoom;
  
  const off = document.createElement('canvas');
  off.width = cropW;
  off.height = cropH;
  const ctx = off.getContext('2d');
  ctx.drawImage(state.img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  
  const dataUrl = off.toDataURL('image/png');
  const newImg = new Image();
  newImg.onload = () => {
    state.img = newImg;
    state.w = newImg.naturalWidth;
    state.h = newImg.naturalHeight;
    state.ratio = newImg.naturalWidth / newImg.naturalHeight;
    thumbImg.src = dataUrl;
    infoDimensions.textContent = `${newImg.naturalWidth} × ${newImg.naturalHeight}`;
    
    // Update original file meta for crop reference
    state.file = new File([state.file], state.file.name.replace(/\.[^/.]+$/, '') + '_cropped.png', { type: 'image/png' });
    infoOrigSize.textContent = fmt(state.file.size);
    infoFormat.textContent = 'PNG';
    
    state.crop.active = false;
    cropToggleBtn.classList.remove('active');
    cropControlsRow.classList.add('hidden');
    initCanvas();
    renderEnhance();
    renderFilterThumbs();
    hideLoad();
  };
  newImg.src = dataUrl;
});

function drawCropOverlay(ctx, tw, th) {
  const r = state.crop.rect;
  ctx.save();
  
  // Draw semi-transparent gray overlay everywhere except crop box
  ctx.fillStyle = 'rgba(10, 11, 20, 0.72)';
  ctx.beginPath();
  ctx.rect(0, 0, tw, th);
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.fill('evenodd');
  
  // Crop box outline
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.setLineDash([]);
  
  // Draw 4 handles (TL, TR, BL, BR)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  const hs = 12;
  const hs2 = hs / 2;
  
  const drawH = (x, y) => {
    ctx.fillRect(x - hs2, y - hs2, hs, hs);
    ctx.strokeRect(x - hs2, y - hs2, hs, hs);
  };
  
  drawH(r.x, r.y); // TL
  drawH(r.x + r.w, r.y); // TR
  drawH(r.x, r.y + r.h); // BL
  drawH(r.x + r.w, r.y + r.h); // BR
  
  if (!state.crop.lockRatio) {
    drawH(r.x + r.w/2, r.y); // T
    drawH(r.x + r.w/2, r.y + r.h); // B
    drawH(r.x, r.y + r.h/2); // L
    drawH(r.x + r.w, r.y + r.h/2); // R
  }
  
  ctx.restore();
}

function getHitHandle(mx, my) {
  if (!state.crop.active) return null;
  const r = state.crop.rect;
  const threshold = 16;
  const dist = (x1, y1, x2, y2) => Math.sqrt((x1-x2)**2 + (y1-y2)**2);
  
  if (dist(mx, my, r.x, r.y) < threshold) return 'TL';
  if (dist(mx, my, r.x + r.w, r.y) < threshold) return 'TR';
  if (dist(mx, my, r.x, r.y + r.h) < threshold) return 'BL';
  if (dist(mx, my, r.x + r.w, r.y + r.h) < threshold) return 'BR';
  
  if (!state.crop.lockRatio) {
    if (dist(mx, my, r.x + r.w/2, r.y) < threshold) return 'T';
    if (dist(mx, my, r.x + r.w/2, r.y + r.h) < threshold) return 'B';
    if (dist(mx, my, r.x, r.y + r.h/2) < threshold) return 'L';
    if (dist(mx, my, r.x + r.w, r.y + r.h/2) < threshold) return 'R';
  }
  
  // Check if inside rect
  if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
    return 'move';
  }
  return null;
}

// ── AI Background Removal ──────────────────────────────
let removeBgModule = null;
async function getRemoveBg() {
  if (!removeBgModule) {
    showLoad('Loading local AI Segmentation models...\n(first run fetches ~30MB, subsequent runs are instant)');
    const { removeBackground } = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm');
    removeBgModule = removeBackground;
  }
  return removeBgModule;
}

$('bg-remove-btn').addEventListener('click', async () => {
  if (!state.file) return;
  try {
    const removeFn = await getRemoveBg();
    showLoad('AI Processing: removing background locally...');
    
    // Execute local background removal
    const resultBlob = await removeFn(state.file);
    const url = URL.createObjectURL(resultBlob);
    const img = new Image();
    img.onload = () => {
      state.img = img;
      state.w = img.naturalWidth;
      state.h = img.naturalHeight;
      state.ratio = img.naturalWidth / img.naturalHeight;
      thumbImg.src = url;
      infoDimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
      
      // Auto switch output formats to PNG to support transparent background
      outputFormat.value = 'image/png';
      enhanceFormat.value = 'image/png';
      
      // Update original file reference to transparent PNG
      state.file = new File([resultBlob], state.file.name.replace(/\.[^/.]+$/, '') + '_nobg.png', { type: 'image/png' });
      infoOrigSize.textContent = fmt(state.file.size);
      infoFormat.textContent = 'PNG';
      
      initCanvas();
      renderEnhance();
      renderFilterThumbs();
      hideLoad();
    };
    img.src = url;
  } catch (err) {
    console.error(err);
    alert('Local background removal failed: ' + err.message);
    hideLoad();
  }
});

// ── Batch Processing Implementation ────────────────────
batchUploadZone.addEventListener('click', () => batchFileInput.click());
batchFileInput.addEventListener('change', e => handleBatchFiles(e.target.files));
batchUploadZone.addEventListener('dragover', e => { e.preventDefault(); batchUploadZone.classList.add('drag-over'); });
batchUploadZone.addEventListener('dragleave', () => batchUploadZone.classList.remove('drag-over'));
batchUploadZone.addEventListener('drop', e => {
  e.preventDefault(); batchUploadZone.classList.remove('drag-over');
  handleBatchFiles(e.dataTransfer.files);
});

batchAddMoreBtn.addEventListener('click', () => batchAddMoreInput.click());
batchAddMoreInput.addEventListener('change', e => handleBatchFiles(e.target.files));

function handleBatchFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  
  let added = false;
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    if (file.type.startsWith('image/')) {
      added = true;
      addBatchFile(file);
    }
  }
  
  if (added) {
    batchUploadSection.classList.add('hidden');
    batchEditorSection.classList.remove('hidden');
  }
}

function addBatchFile(file) {
  const id = Math.random().toString(36).substring(2, 9);
  const item = {
    id, file, name: file.name, origSize: file.size,
    img: null, w: 0, h: 0, status: 'pending', format: 'image/jpeg', blob: null
  };
  state.batchFiles.push(item);
  renderBatchQueue();
  
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      item.img = img;
      item.w = img.naturalWidth;
      item.h = img.naturalHeight;
      renderBatchQueue();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function renderBatchQueue() {
  batchQueueList.innerHTML = '';
  batchCount.textContent = state.batchFiles.length;
  
  state.batchFiles.forEach(item => {
    const el = document.createElement('div');
    el.className = 'batch-item';
    
    // Status Badge
    let statusClass = 'status-pending';
    let statusText = 'Pending';
    if (item.status === 'processing') { statusClass = 'status-processing'; statusText = 'Processing...'; }
    else if (item.status === 'success') { statusClass = 'status-success'; statusText = 'Success'; }
    else if (item.status === 'error') { statusClass = 'status-error'; statusText = 'Error'; }
    
    el.innerHTML = `
      <img class="batch-item-thumb" src="${item.img ? item.img.src : 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23475569%22 stroke-width=%221.5%22><rect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/><circle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/><path d=%22M21 15l-5-5L5 21%22/></svg>'}" alt="Thumb"/>
      <div class="batch-item-info">
        <div class="batch-item-name" title="${item.name}">${item.name}</div>
        <div class="batch-item-meta">
          <span>${fmt(item.origSize)}</span>
          ${item.w > 0 ? `<span>· ${item.w}×${item.h} px</span>` : ''}
        </div>
      </div>
      <span class="batch-item-status ${statusClass}">${statusText}</span>
      <button class="batch-item-remove" data-id="${item.id}" title="Remove file">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    
    el.querySelector('.batch-item-remove').addEventListener('click', () => {
      state.batchFiles = state.batchFiles.filter(x => x.id !== item.id);
      renderBatchQueue();
      if (state.batchFiles.length === 0) {
        batchEditorSection.classList.add('hidden');
        batchUploadSection.classList.remove('hidden');
        batchFileInput.value = '';
        batchAddMoreInput.value = '';
      }
    });
    batchQueueList.appendChild(el);
  });
}

batchClearBtn.addEventListener('click', () => {
  state.batchFiles = [];
  batchEditorSection.classList.add('hidden');
  batchUploadSection.classList.remove('hidden');
  batchFileInput.value = '';
  batchAddMoreInput.value = '';
  renderBatchQueue();
});

// Aspect Link in Batch
batchAspectLock.addEventListener('click', () => {
  state.batchAspectLocked = !state.batchAspectLocked;
  batchAspectLock.classList.toggle('locked', state.batchAspectLocked);
  batchAspectLock.querySelector('svg').style.color = state.batchAspectLocked ? 'var(--violet)' : 'var(--tm)';
});
batchWidth.addEventListener('input', () => {
  const w = parseInt(batchWidth.value); if (!w || w < 1 || !state.batchAspectLocked) return;
  // Use first image's aspect ratio as reference
  if (state.batchFiles[0] && state.batchFiles[0].w > 0) {
    const ratio = state.batchFiles[0].w / state.batchFiles[0].h;
    batchHeight.value = Math.max(1, Math.round(w / ratio));
  }
});
batchHeight.addEventListener('input', () => {
  const h = parseInt(batchHeight.value); if (!h || h < 1 || !state.batchAspectLocked) return;
  if (state.batchFiles[0] && state.batchFiles[0].w > 0) {
    const ratio = state.batchFiles[0].w / state.batchFiles[0].h;
    batchWidth.value = Math.max(1, Math.round(h * ratio));
  }
});

// Presets in Batch
document.querySelectorAll('[id^="batch-pct-"]').forEach(b => {
  b.addEventListener('click', () => {
    const pct = parseFloat(b.dataset.pct) / 100;
    if (state.batchFiles[0] && state.batchFiles[0].w > 0) {
      batchWidth.value = Math.round(state.batchFiles[0].w * pct);
      batchHeight.value = Math.round(state.batchFiles[0].h * pct);
    }
  });
});

batchWmType.addEventListener('change', () => {
  batchWmTextRow.classList.toggle('hidden', batchWmType.value !== 'text');
});

// Process Batch
batchProcessBtn.addEventListener('click', async () => {
  if (state.batchFiles.length === 0) return;
  showLoad('Processing batch resizes...');
  await sleep(40);
  
  const targetW = parseInt(batchWidth.value) || 800;
  const targetH = parseInt(batchHeight.value) || 600;
  const format = batchFormat.value;
  const kb = parseFloat(batchKb.value);
  const wmType = batchWmType.value;
  const wmTextVal = batchWmText.value;
  
  const off = document.createElement('canvas');
  
  for (let i = 0; i < state.batchFiles.length; i++) {
    const item = state.batchFiles[i];
    item.status = 'processing';
    renderBatchQueue();
    await sleep(20);
    
    try {
      if (!item.img) throw new Error('Image not loaded');
      
      let iw = targetW;
      let ih = targetH;
      
      if (state.batchAspectLocked) {
        // Compute for each image individually
        const ratio = item.w / item.h;
        ih = Math.max(1, Math.round(iw / ratio));
      }
      
      off.width = iw;
      off.height = ih;
      const ctx = off.getContext('2d');
      drawScaled(ctx, item.img, iw, ih);
      
      // Draw watermark if configured
      if (wmType === 'text') {
        ctx.save();
        ctx.globalAlpha = 0.5; // 50% opacity
        const size = Math.max(14, Math.round(iw * 0.04)); // Dynamic text size based on width
        ctx.font = `bold ${size}px Outfit, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';
        const textMetrics = ctx.measureText(wmTextVal);
        const textW = textMetrics.width;
        
        // Position: Bottom Right
        const pad = 16;
        ctx.fillText(wmTextVal, iw - pad - textW, ih - pad - size);
        ctx.restore();
      }
      
      // Compress
      let blob;
      if (kb && kb > 0) {
        blob = await compressTo(off, iw, ih, item.img, kb * 1024, format);
      } else {
        blob = await toBlob(off, format, 0.92);
      }
      
      item.blob = blob;
      item.format = format;
      item.status = 'success';
    } catch (err) {
      console.error(err);
      item.status = 'error';
    }
  }
  
  renderBatchQueue();
  
  // Pack ZIP
  showLoad('Creating ZIP archive...');
  await sleep(40);
  
  const zip = new JSZip();
  state.batchFiles.forEach(item => {
    if (item.status === 'success' && item.blob) {
      const rawExt = item.format.split('/')[1];
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
      const base = item.name.replace(/\.[^/.]+$/, '');
      zip.file(`${base}_resized.${ext}`, item.blob);
    }
  });
  
  zip.generateAsync({ type: 'blob' }).then(zipBlob => {
    download(zipBlob, 'pixelforge_batch_resized.zip');
    hideLoad();
  }).catch(err => {
    console.error(err);
    alert('ZIP generation failed: ' + err.message);
    hideLoad();
  });
});

// ── Single Download Resize ────────────────────────────
function drawScaled(ctx, img, w, h) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = w / h;
  let dw, dh, dx, dy;
  if (srcRatio > dstRatio) {
    dw = w;
    dh = Math.round(w / srcRatio);
    dx = 0;
    dy = Math.round((h - dh) / 2);
  } else {
    dh = h;
    dw = Math.round(h * srcRatio);
    dy = 0;
    dx = Math.round((w - dw) / 2);
  }
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
}

function drawInteractive(ctx, img, w, h, format) {
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
  ctx.drawImage(img, state.ox, state.oy, img.naturalWidth * state.zoom, img.naturalHeight * state.zoom);
}

dlResizeBtn.addEventListener('click', async () => {
  if(!state.img||dlResizeBtn.disabled) return;
  showLoad('Resizing image…'); await sleep(30);
  const w=state.targetW, h=state.targetH;
  const off=document.createElement('canvas'); off.width=w; off.height=h;
  const ctx=off.getContext('2d');
  
  const fmt2=outputFormat.value;
  drawInteractive(ctx, state.img, w, h, fmt2);
  drawWatermark(ctx, w, h);
  
  const kb=parseFloat(targetKb.value);
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
async function compressTo(offCanvas, w, h, img, targetBytes, format){
  offCanvas.width = w; offCanvas.height = h;
  const ctx2 = offCanvas.getContext('2d');
  drawInteractive(ctx2, img, w, h, format);
  drawWatermark(ctx2, w, h);

  if(format === 'image/png'){
    return await toBlob(offCanvas, format, 1);
  }

  let lo = 0.01, hi = 1.0, quality = 0.85, blob = null;
  for(let i = 0; i < 24; i++){
    const mid = (lo + hi) / 2;
    quality = mid;
    blob = await toBlob(offCanvas, format, quality);
    const diff = Math.abs(blob.size - targetBytes) / targetBytes;
    if(diff < 0.015) break; 
    if(blob.size > targetBytes) hi = mid;
    else lo = mid;
    if(hi - lo < 0.004) break;
  }
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
  const tw=state.targetW, th=state.targetH;
  const zx=tw/state.img.naturalWidth, zy=th/state.img.naturalHeight;
  state.zoom=Math.min(zx,zy);
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
  
  // Watermark
  drawWatermark(ctx, tw, th);
  
  // Crop overlay
  if (state.crop.active) {
    drawCropOverlay(ctx, tw, th);
  }
}
function updateZoomUI(){
  const p=Math.round(state.zoom*100);
  zoomVal.textContent=p+'%';
  const minVal = Math.max(1, Math.min(10, p));
  zoomSlider.min = minVal;
  const mn=minVal, mx=parseInt(zoomSlider.max);
  const v=Math.min(Math.max(p,mn),mx); zoomSlider.value=v;
  zoomSlider.style.setProperty('--val',((v-mn)/(mx-mn)*100)+'%');
}

zoomSlider.addEventListener('input',()=>{
  const p=parseInt(zoomSlider.value), mn=parseInt(zoomSlider.min), mx=parseInt(zoomSlider.max);
  zoomSlider.style.setProperty('--val',((p-mn)/(mx-mn)*100)+'%');
  const prev=state.zoom; state.zoom=p/100;
  const cx=state.targetW/2, cy=state.targetH/2;
  state.ox=cx-(cx-state.ox)*(state.zoom/prev);
  state.oy=cy-(cy-state.oy)*(state.zoom/prev);
  zoomVal.textContent=p+'%'; drawCanvas();
});

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

// Drag & Crop resize
pixelCanvas.addEventListener('mousedown',e=>{
  const r=pixelCanvas.getBoundingClientRect(), sc=state.targetW/r.width;
  const mx=(e.clientX-r.left)*sc;
  const my=(e.clientY-r.top)*sc;
  
  if (state.crop.active) {
    const handle = getHitHandle(mx, my);
    if (handle) {
      state.crop.draggingHandle = handle;
      state.crop.dragStart = { mx, my, rect: { ...state.crop.rect } };
      return;
    }
  }
  
  state.dragging=true;
  state.dx=e.clientX;
  state.dy=e.clientY;
  state.lx=state.ox;
  state.ly=state.oy;
});

window.addEventListener('mousemove',e=>{
  const rect=pixelCanvas.getBoundingClientRect(), sc=state.targetW/rect.width;
  
  if (state.crop.active && state.crop.draggingHandle) {
    const mx=(e.clientX-rect.left)*sc;
    const my=(e.clientY-rect.top)*sc;
    const start = state.crop.dragStart;
    const dx = mx - start.mx;
    const dy = my - start.my;
    const r = state.crop.rect;
    
    // Bounds of the image on canvas
    const imgX = state.ox;
    const imgY = state.oy;
    const imgW = state.img.naturalWidth * state.zoom;
    const imgH = state.img.naturalHeight * state.zoom;
    
    if (state.crop.draggingHandle === 'move') {
      r.x = Math.max(imgX, Math.min(imgX + imgW - r.w, start.rect.x + dx));
      r.y = Math.max(imgY, Math.min(imgY + imgH - r.h, start.rect.y + dy));
    } else {
      let nw = r.w;
      let nh = r.h;
      let nx = r.x;
      let ny = r.y;
      
      const handle = state.crop.draggingHandle;
      if (handle.includes('R')) nw = Math.max(20, start.rect.w + dx);
      if (handle.includes('L')) {
        const potentialW = start.rect.w - dx;
        if (potentialW >= 20) {
          nw = potentialW;
          nx = start.rect.x + dx;
        }
      }
      if (handle.includes('B')) nh = Math.max(20, start.rect.h + dy);
      if (handle.includes('T')) {
        const potentialH = start.rect.h - dy;
        if (potentialH >= 20) {
          nh = potentialH;
          ny = start.rect.y + dy;
        }
      }
      
      if (state.crop.lockRatio) {
        if (handle === 'BR' || handle === 'TL' || handle === 'TR' || handle === 'BL') {
          // preserve ratio
          if (handle === 'BR' || handle === 'BL' || handle === 'TR') {
            nh = nw / state.ratio;
          } else {
            nw = nh * state.ratio;
            nx = start.rect.x + start.rect.w - nw;
          }
        }
      }
      
      // Enforce image bounds on adjustments
      if (nx >= imgX && nx + nw <= imgX + imgW) {
        r.x = nx;
        r.w = nw;
      }
      if (ny >= imgY && ny + nh <= imgY + imgH) {
        r.y = ny;
        r.h = nh;
      }
    }
    drawCanvas();
    return;
  }
  
  if(!state.dragging) return;
  state.ox=state.lx+(e.clientX-state.dx)*sc; 
  state.oy=state.ly+(e.clientY-state.dy)*sc; 
  drawCanvas();
});

window.addEventListener('mouseup',()=>{ 
  state.dragging=false; 
  if (state.crop.active) {
    state.crop.draggingHandle = null;
  }
});

// Touch drag & Crop resize
pixelCanvas.addEventListener('touchstart',e=>{
  if(e.touches.length!==1) return;
  const t=e.touches[0];
  const r=pixelCanvas.getBoundingClientRect(), sc=state.targetW/r.width;
  const mx=(t.clientX-r.left)*sc;
  const my=(t.clientY-r.top)*sc;
  
  if (state.crop.active) {
    const handle = getHitHandle(mx, my);
    if (handle) {
      state.crop.draggingHandle = handle;
      state.crop.dragStart = { mx, my, rect: { ...state.crop.rect } };
      return;
    }
  }
  
  state.dragging=true;
  state.dx=t.clientX;
  state.dy=t.clientY;
  state.lx=state.ox;
  state.ly=state.oy;
},{passive:true});

pixelCanvas.addEventListener('touchmove',e=>{
  if (state.crop.active && state.crop.draggingHandle) {
    e.preventDefault();
    const t=e.touches[0], rect=pixelCanvas.getBoundingClientRect(), sc=state.targetW/rect.width;
    const mx=(t.clientX-rect.left)*sc;
    const my=(t.clientY-rect.top)*sc;
    const start = state.crop.dragStart;
    const dx = mx - start.mx;
    const dy = my - start.my;
    const r = state.crop.rect;
    
    const imgX = state.ox;
    const imgY = state.oy;
    const imgW = state.img.naturalWidth * state.zoom;
    const imgH = state.img.naturalHeight * state.zoom;
    
    if (state.crop.draggingHandle === 'move') {
      r.x = Math.max(imgX, Math.min(imgX + imgW - r.w, start.rect.x + dx));
      r.y = Math.max(imgY, Math.min(imgY + imgH - r.h, start.rect.y + dy));
    } else {
      let nw = r.w;
      let nh = r.h;
      let nx = r.x;
      let ny = r.y;
      
      const handle = state.crop.draggingHandle;
      if (handle.includes('R')) nw = Math.max(20, start.rect.w + dx);
      if (handle.includes('L')) {
        const potentialW = start.rect.w - dx;
        if (potentialW >= 20) {
          nw = potentialW;
          nx = start.rect.x + dx;
        }
      }
      if (handle.includes('B')) nh = Math.max(20, start.rect.h + dy);
      if (handle.includes('T')) {
        const potentialH = start.rect.h - dy;
        if (potentialH >= 20) {
          nh = potentialH;
          ny = start.rect.y + dy;
        }
      }
      
      if (state.crop.lockRatio) {
        if (handle === 'BR' || handle === 'TL' || handle === 'TR' || handle === 'BL') {
          if (handle === 'BR' || handle === 'BL' || handle === 'TR') {
            nh = nw / state.ratio;
          } else {
            nw = nh * state.ratio;
            nx = start.rect.x + start.rect.w - nw;
          }
        }
      }
      
      if (nx >= imgX && nx + nw <= imgX + imgW) {
        r.x = nx;
        r.w = nw;
      }
      if (ny >= imgY && ny + nh <= imgY + imgH) {
        r.y = ny;
        r.h = nh;
      }
    }
    drawCanvas();
    return;
  }
  
  if(!state.dragging||e.touches.length!==1) return; e.preventDefault();
  const t=e.touches[0],r=pixelCanvas.getBoundingClientRect(),sc=state.targetW/r.width;
  state.ox=state.lx+(t.clientX-state.dx)*sc; 
  state.oy=state.ly+(t.clientY-state.dy)*sc; 
  drawCanvas();
},{passive:false});

window.addEventListener('touchend',()=>{ 
  state.dragging=false; 
  if (state.crop.active) {
    state.crop.draggingHandle = null;
  }
});

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
    
    if(!state.showOriginal && state.enhance.sharpness>0){
      applySharpness(ctx,w,h,state.enhance.sharpness);
    }
    
    // Draw watermark also on enhance preview
    drawWatermark(ctx, w, h);
    
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
  
  // Apply watermark to final output
  drawWatermark(ctx, img.naturalWidth, img.naturalHeight);
  
  const f=enhanceFormat.value;
  const rawExt2=f.split('/')[1];
  const ext2 = rawExt2 === 'jpeg' ? 'jpg' : rawExt2;
  const blob=await toBlob(off,f,0.93);
  const base=(state.file.name.replace(/\.[^/.]+$/,'')||'image');
  download(blob,`${base}_enhanced.${ext2}`);
  hideLoad();
});
