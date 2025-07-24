const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let img = new Image();
let drawing = false;
let path = [];
let paths = [];

document.getElementById('upload').addEventListener('change', handleUpload);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);

function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function startDrawing(e) {
  drawing = true;
  path = [[e.offsetX, e.offsetY]];
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function hexToRgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
function draw(e) {
  if (!drawing) return;

  const brushSize = document.getElementById('brushSize').value;
  path.push([e.offsetX, e.offsetY]);
  ctx.lineTo(e.offsetX, e.offsetY);
  const hex = document.getElementById('colorPicker').value;
ctx.strokeStyle = hexToRgba(hex, 0.3);
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function endDrawing() {
  if (drawing) {
    drawing = false;
    paths.push(path);
    ctx.closePath();
  }
}

function applyColor() {
  const color = hexToRgb(document.getElementById('colorPicker').value);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  paths.forEach(p => {
    const region = new Path2D();
    region.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) region.lineTo(p[i][0], p[i][1]);
    region.closePath();

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (ctx.isPointInPath(region, x, y)) {
          const idx = (y * canvas.width + x) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
        }
      }
    }
  });

  ctx.putImageData(imageData, 0, 0);
  paths = [];
}

function undo() {
  if (paths.length > 0) {
    paths.pop();
    redraw();
  }
}

function clearSelection() {
  paths = [];
  redraw();
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const brushSize = document.getElementById('brushSize').value;

  paths.forEach(p => {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
  });
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'edited-image.png';
  link.href = canvas.toDataURL();
  link.click();
}
