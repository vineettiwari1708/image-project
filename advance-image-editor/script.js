(() => {
  // DOM elements
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content > div');

  const brightnessSlider = document.getElementById('brightness');
  const contrastSlider = document.getElementById('contrast');
  const brightnessVal = document.getElementById('brightnessVal');
  const contrastVal = document.getElementById('contrastVal');
  const resetBCBtn = document.getElementById('resetBC');

  const rotationSlider = document.getElementById('rotationRange');
  const rotationVal = document.getElementById('rotationVal');
  const resetRotationBtn = document.getElementById('resetRotation');

  const cropSizeDisplay = document.getElementById('cropSize');
  const cropBtn = document.getElementById('cropBtn');
  const resetCropBtn = document.getElementById('resetCrop');

  const downloadBtn = document.getElementById('downloadBtn');

  // State variables
  let originalImage = null;
  let brightness = 100;
  let contrast = 100;
  let rotation = 0;

  let isDragging = false;
  let cropStart = null;
  let cropEnd = null;

  // Tab Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const selected = tab.dataset.tab;
      tabContents.forEach(tc => tc.classList.toggle('active', tc.id === selected));
    });
  });

  // Upload image
  document.getElementById('upload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        resetAll();
        drawImage();
        downloadBtn.disabled = false;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  function resetAll() {
    brightness = 100;
    contrast = 100;
    rotation = 0;
    brightnessSlider.value = 100;
    contrastSlider.value = 100;
    rotationSlider.value = 0;
    brightnessVal.textContent = '100';
    contrastVal.textContent = '100';
    rotationVal.textContent = '0';
    cropBtn.disabled = true;
    resetCropBtn.disabled = true;
    cropSizeDisplay.textContent = 'Crop Size: 0 x 0';
    cropStart = null;
    cropEnd = null;
  }

  function drawImage() {
    if (!originalImage) return;

    const rad = rotation * Math.PI / 180;
    const w = originalImage.width;
    const h = originalImage.height;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const newWidth = w * cos + h * sin;
    const newHeight = h * cos + w * sin;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.clearRect(0, 0, newWidth, newHeight);
    ctx.save();
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(rad);
    ctx.drawImage(originalImage, -w / 2, -h / 2);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const filteredData = applyBrightnessContrast(imageData, brightness, contrast);
    ctx.putImageData(filteredData, 0, 0);
  }

  function applyBrightnessContrast(imageData, brightnessVal, contrastVal) {
    const data = new Uint8ClampedArray(imageData.data);
    const bFactor = brightnessVal / 100;
    const cFactor = (contrastVal - 100) / 100;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = (data[i] * bFactor - 128) * (1 + cFactor) + 128;
      data[i + 1] = (data[i + 1] * bFactor - 128) * (1 + cFactor) + 128;
      data[i + 2] = (data[i + 2] * bFactor - 128) * (1 + cFactor) + 128;

      data[i] = Math.min(255, Math.max(0, data[i]));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  // Brightness / Contrast
  brightnessSlider.addEventListener('input', () => {
    brightness = Number(brightnessSlider.value);
    brightnessVal.textContent = brightness;
    drawImage();
  });

  contrastSlider.addEventListener('input', () => {
    contrast = Number(contrastSlider.value);
    contrastVal.textContent = contrast;
    drawImage();
  });

  resetBCBtn.addEventListener('click', () => {
    brightness = 100;
    contrast = 100;
    brightnessSlider.value = 100;
    contrastSlider.value = 100;
    brightnessVal.textContent = '100';
    contrastVal.textContent = '100';
    drawImage();
  });

  // Rotation
  rotationSlider.addEventListener('input', () => {
    rotation = Number(rotationSlider.value);
    rotationVal.textContent = rotation;
    drawImage();
  });

  resetRotationBtn.addEventListener('click', () => {
    rotation = 0;
    rotationSlider.value = 0;
    rotationVal.textContent = '0';
    drawImage();
  });

  // Crop interaction
  canvas.addEventListener('mousedown', e => {
  if (!originalImage || !tabs[2].classList.contains('active')) return;
  isDragging = true;
  cropStart = { x: e.offsetX, y: e.offsetY };
  cropEnd = null;
  cropSizeDisplay.textContent = 'Crop Size: 0 x 0';
  drawImage();
});

canvas.addEventListener('mousemove', e => {
  if (!isDragging || !cropStart || !tabs[2].classList.contains('active')) return;
  cropEnd = { x: e.offsetX, y: e.offsetY };
  drawImage();           // Always redraw base
  drawCropRect();        // Then overlay crop rectangle
  updateCropSize();
});

canvas.addEventListener('mouseup', () => {
  if (!isDragging || !cropStart || !cropEnd || !tabs[2].classList.contains('active')) return;
  isDragging = false;
  cropBtn.disabled = false;
  resetCropBtn.disabled = false;
});

function drawCropRect() {
  if (!cropStart || !cropEnd) return;
  const x = Math.min(cropStart.x, cropEnd.x);
  const y = Math.min(cropStart.y, cropEnd.y);
  const w = Math.abs(cropEnd.x - cropStart.x);
  const h = Math.abs(cropEnd.y - cropStart.y);

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.setLineDash([6]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

function updateCropSize() {
  if (!cropStart || !cropEnd) return;
  const w = Math.abs(cropEnd.x - cropStart.x) | 0;
  const h = Math.abs(cropEnd.y - cropStart.y) | 0;
  cropSizeDisplay.textContent = `Crop Size: ${w} x ${h}`;
}

cropBtn.addEventListener('click', () => {
  if (!cropStart || !cropEnd) return;

  const x = Math.max(0, Math.min(cropStart.x, cropEnd.x)) | 0;
  const y = Math.max(0, Math.min(cropStart.y, cropEnd.y)) | 0;
  const w = Math.abs(cropEnd.x - cropStart.x) | 0;
  const h = Math.abs(cropEnd.y - cropStart.y) | 0;

  if (w === 0 || h === 0) return;

  const croppedData = ctx.getImageData(x, y, w, h);
  canvas.width = w;
  canvas.height = h;
  ctx.putImageData(croppedData, 0, 0);

  // Update image with new cropped content
  const dataURL = canvas.toDataURL();
  const newImg = new Image();
  newImg.onload = () => {
    originalImage = newImg;
    drawImage();
    resetCropUI(); // Reset crop UI state
  };
  newImg.src = dataURL;
});

resetCropBtn.addEventListener('click', () => {
  if (!originalImage) return;
  drawImage();
  resetCropUI();
});

function resetCropUI() {
  cropStart = null;
  cropEnd = null;
  cropBtn.disabled = true;
  resetCropBtn.disabled = true;
  cropSizeDisplay.textContent = 'Crop Size: 0 x 0';
}

  // Download
  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
  });

})();
