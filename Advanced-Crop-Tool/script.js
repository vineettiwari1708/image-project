const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const rotationSlider = document.getElementById('rotation');

const cropBtn = document.getElementById('cropBtn');
const resetCropBtn = document.getElementById('resetCropBtn');
const cropSizeDisplay = document.getElementById('cropSize');

const imageInput = document.getElementById('imageInput');

let originalImage = null;
let brightness = 100;
let contrast = 100;
let rotation = 0;

let cropRect = null; // { x, y, w, h }
const handleSize = 10;

let dragTarget = null; // 'move' or 0-7 for handles
let dragOffset = { x: 0, y: 0 };
let isDragging = false;

function drawImage() {
  if (!originalImage) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.drawImage(
    originalImage,
    -originalImage.width / 2,
    -originalImage.height / 2,
    originalImage.width,
    originalImage.height
  );
  ctx.restore();

  if (cropRect) {
    drawCropRect();
  }
}

function drawCropRect() {
  if (!cropRect) return;

  ctx.save();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.setLineDash([6]);
  ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
  ctx.setLineDash([]);

  // Draw handles
  const handles = getHandles();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'red';
  handles.forEach(({ x, y }) => {
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  });
  ctx.restore();
}

function getHandles() {
  if (!cropRect) return [];
  const { x, y, w, h } = cropRect;
  return [
    { x: x, y: y },             // top-left
    { x: x + w / 2, y: y },     // top-center
    { x: x + w, y: y },         // top-right
    { x: x + w, y: y + h / 2 }, // middle-right
    { x: x + w, y: y + h },     // bottom-right
    { x: x + w / 2, y: y + h }, // bottom-center
    { x: x, y: y + h },         // bottom-left
    { x: x, y: y + h / 2 },     // middle-left
  ];
}

function pointInHandle(px, py) {
  if (!cropRect) return null;
  const handles = getHandles();
  for (let i = 0; i < handles.length; i++) {
    const { x, y } = handles[i];
    if (
      px >= x - handleSize / 2 &&
      px <= x + handleSize / 2 &&
      py >= y - handleSize / 2 &&
      py <= y + handleSize / 2
    ) {
      return i;
    }
  }
  return null;
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function constrainRect(rect) {
  // Keep crop rectangle inside canvas
  if (rect.x < 0) rect.x = 0;
  if (rect.y < 0) rect.y = 0;
  if (rect.x + rect.w > canvas.width) rect.x = canvas.width - rect.w;
  if (rect.y + rect.h > canvas.height) rect.y = canvas.height - rect.h;
  if (rect.w < 10) rect.w = 10;
  if (rect.h < 10) rect.h = 10;
}

function updateCropSizeDisplay() {
  if (!cropRect) {
    cropSizeDisplay.textContent = 'Crop Size: 0 x 0';
    return;
  }
  cropSizeDisplay.textContent = `Crop Size: ${Math.round(cropRect.w)} x ${Math.round(cropRect.h)}`;
}

canvas.addEventListener('mousedown', (e) => {
  if (!originalImage) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const handleIdx = pointInHandle(mouseX, mouseY);
  if (handleIdx !== null) {
    dragTarget = handleIdx;
    isDragging = true;
    return;
  }

  if (cropRect && pointInRect(mouseX, mouseY, cropRect)) {
    dragTarget = 'move';
    isDragging = true;
    dragOffset.x = mouseX - cropRect.x;
    dragOffset.y = mouseY - cropRect.y;
    return;
  }

  // Start new crop rect if click outside current crop rect
  cropRect = { x: mouseX, y: mouseY, w: 0, h: 0 };
  dragTarget = 7; // bottom-left handle for resizing from start point
  isDragging = true;
  updateCropSizeDisplay();
  drawImage();
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging || !cropRect) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (dragTarget === 'move') {
    // Move crop rectangle
    cropRect.x = mouseX - dragOffset.x;
    cropRect.y = mouseY - dragOffset.y;
    constrainRect(cropRect);
  } else if (typeof dragTarget === 'number') {
    // Resize crop rectangle using handles
    resizeCropRect(dragTarget, mouseX, mouseY);
  }

  updateCropSizeDisplay();
  drawImage();
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    dragTarget = null;
    cropBtn.disabled = !(cropRect && cropRect.w > 10 && cropRect.h > 10);
    resetCropBtn.disabled = false;
  }
});

function resizeCropRect(handleIdx, mouseX, mouseY) {
  const r = cropRect;

  switch (handleIdx) {
    case 0: // top-left
      r.w += r.x - mouseX;
      r.h += r.y - mouseY;
      r.x = mouseX;
      r.y = mouseY;
      break;
    case 1: // top-center
      r.h += r.y - mouseY;
      r.y = mouseY;
      break;
    case 2: // top-right
      r.w = mouseX - r.x;
      r.h += r.y - mouseY;
      r.y = mouseY;
      break;
    case 3: // middle-right
      r.w = mouseX - r.x;
      break;
    case 4: // bottom-right
      r.w = mouseX - r.x;
      r.h = mouseY - r.y;
      break;
    case 5: // bottom-center
      r.h = mouseY - r.y;
      break;
    case 6: // bottom-left
      r.w += r.x - mouseX;
      r.x = mouseX;
      r.h = mouseY - r.y;
      break;
    case 7: // middle-left
      r.w += r.x - mouseX;
      r.x = mouseX;
      break;
  }

  // Prevent negative width/height by flipping rect if needed
  if (r.w < 0) {
    r.x += r.w;
    r.w *= -1;
    dragTarget = mirrorHandleHorizontally(dragTarget);
  }
  if (r.h < 0) {
    r.y += r.h;
    r.h *= -1;
    dragTarget = mirrorHandleVertically(dragTarget);
  }

  constrainRect(r);
}

function mirrorHandleHorizontally(handle) {
  // Maps handle idx horizontally flipped
  const map = [2,1,0,7,6,5,4,3];
  return map[handle] ?? handle;
}

function mirrorHandleVertically(handle) {
  // Maps handle idx vertically flipped
  const map = [6,5,4,3,2,1,0,7];
  return map[handle] ?? handle;
}

cropBtn.addEventListener('click', () => {
  if (!cropRect) return;

  // Create an offscreen canvas to crop the rotated image properly
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');

  // Get rotated image bounding box size
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const wRotated = originalImage.width * cos + originalImage.height * sin;
  const hRotated = originalImage.width * sin + originalImage.height * cos;

  // Offcanvas matches current canvas size (rotated image size)
  offCanvas.width = canvas.width;
  offCanvas.height = canvas.height;

  // Draw rotated image on offcanvas
  offCtx.translate(offCanvas.width / 2, offCanvas.height / 2);
  offCtx.rotate(rad);
  offCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  offCtx.drawImage(
    originalImage,
    -originalImage.width / 2,
    -originalImage.height / 2
  );

  // Get the cropped image data from offcanvas
  const cropX = cropRect.x;
  const cropY = cropRect.y;
  const cropW = cropRect.w;
  const cropH = cropRect.h;

  // Crop the area from offcanvas
  const croppedData = offCtx.getImageData(cropX, cropY, cropW, cropH);

  // Resize main canvas to cropped size and put cropped data
  canvas.width = cropW;
  canvas.height = cropH;
  ctx.putImageData(croppedData, 0, 0);

  // Update originalImage to cropped image for further editing
  originalImage = new Image();
  originalImage.onload = () => {
    // Reset crop rect after cropping
    cropRect = null;
    cropBtn.disabled = true;
    resetCropBtn.disabled = true;
    cropSizeDisplay.textContent = 'Crop Size: 0 x 0';
    drawImage();
  };
  originalImage.src = canvas.toDataURL();
});

resetCropBtn.addEventListener('click', () => {
  if (!originalImage) return;
  // Reset canvas size to image size
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  cropRect = null;
  cropBtn.disabled = true;
  resetCropBtn.disabled = true;
  cropSizeDisplay.textContent = 'Crop Size: 0 x 0';
  brightness = 100;
  contrast = 100;
  rotation = 0;
  brightnessSlider.value = brightness;
  contrastSlider.value = contrast;
  rotationSlider.value = rotation;
  drawImage();
});

brightnessSlider.addEventListener('input', () => {
  brightness = brightnessSlider.value;
  drawImage();
});

contrastSlider.addEventListener('input', () => {
  contrast = contrastSlider.value;
  drawImage();
});

rotationSlider.addEventListener('input', () => {
  rotation = rotationSlider.value;
  // Resize canvas to fit rotated image bounding box
  if (!originalImage) return;
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const wRotated = originalImage.width * cos + originalImage.height * sin;
  const hRotated = originalImage.width * sin + originalImage.height * cos;
  canvas.width = wRotated;
  canvas.height = hRotated;
  drawImage();
});

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      canvas.width = img.width;
      canvas.height = img.height;
      cropRect = null;
      cropBtn.disabled = true;
      resetCropBtn.disabled = true;
      brightness = 100;
      contrast = 100;
      rotation = 0;
      brightnessSlider.value = brightness;
      contrastSlider.value = contrast;
      rotationSlider.value = rotation;
      cropSizeDisplay.textContent = 'Crop Size: 0 x 0';
      drawImage();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});
