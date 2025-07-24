const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const maskInput = document.getElementById('maskInput');
const imageInput = document.getElementById('imageInput');
const downloadBtn = document.getElementById('downloadBtn');

let maskImage = null;
let contentImage = null;

function updateCanvasSize() {
  const width = parseInt(canvasWidthInput.value, 10);
  const height = parseInt(canvasHeightInput.value, 10);
  canvas.width = width;
  canvas.height = height;
}

function drawMaskedImage() {
  if (!maskImage || !contentImage) return;

  updateCanvasSize();

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Draw mask
  ctx.drawImage(maskImage, 0, 0, width, height);

  // Apply masking
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(contentImage, 0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  downloadBtn.href = canvas.toDataURL('image/png');
  downloadBtn.classList.remove('hidden');
}

function loadImageFromFile(input, callback) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = () => callback(img);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

maskInput.addEventListener('change', () => {
  loadImageFromFile(maskInput, (img) => {
    maskImage = img;
    drawMaskedImage();
  });
});

imageInput.addEventListener('change', () => {
  loadImageFromFile(imageInput, (img) => {
    contentImage = img;
    drawMaskedImage();
  });
});

canvasWidthInput.addEventListener('input', drawMaskedImage);
canvasHeightInput.addEventListener('input', drawMaskedImage);
