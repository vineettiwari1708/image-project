const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImageData = null;
let img = new Image();

document.getElementById('upload').addEventListener('change', handleUpload);

function handleUpload(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function applyEffect() {
  const effect = document.getElementById('filterSelect').value;
  if (!originalImageData) return;

  const imageData = ctx.createImageData(originalImageData);
  imageData.data.set(originalImageData.data);

  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    switch (effect) {
      case 'grayscale':
        const avg = (r + g + b) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
        break;
      case 'sepia':
        data[i]     = 0.393 * r + 0.769 * g + 0.189 * b;
        data[i + 1] = 0.349 * r + 0.686 * g + 0.168 * b;
        data[i + 2] = 0.272 * r + 0.534 * g + 0.131 * b;
        break;
      case 'invert':
        data[i]     = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
        break;
      case 'brightness':
        data[i]     = r * 1.2;
        data[i + 1] = g * 1.2;
        data[i + 2] = b * 1.2;
        break;
      case 'contrast':
        const factor = (259 * (128 + 20)) / (255 * (259 - 20));
        data[i]     = factor * (r - 128) + 128;
        data[i + 1] = factor * (g - 128) + 128;
        data[i + 2] = factor * (b - 128) + 128;
        break;
      case 'none':
      default:
        // Do nothing
        break;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function resetImage() {
  if (originalImageData) {
    ctx.putImageData(originalImageData, 0, 0);
  }
}

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'effect-image.png';
  link.href = canvas.toDataURL();
  link.click();
}

