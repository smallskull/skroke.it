let canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var io = io.connect('http://localhost:6969');

let ctx = canvas.getContext("2d");

let mouseDown = false;
let x, y;
let startX, startY;
let currentTool = "marker";
let currentColor = "black";
let brushSize = 10;
let previewImageData = null;

// Helper to load a dataURL onto the canvas
function loadCanvasFromDataURL(dataURL) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!dataURL) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = dataURL;
}

// Helper to convert ImageData to dataURL
function previewImageDataToDataURL(imgData) {
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d').putImageData(imgData, 0, 0);
    return tempCanvas.toDataURL();
}


io.on('ondraw', ({ x, y, tool, color, size }) => {
    applyDraw(x, y, tool, color, size);
});

io.on('ondown', ({ x, y }) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
});

io.on('onshape', ({ shape, startX, startY, endX, endY, color }) => {
    drawShape(shape, startX, startY, endX, endY, color);
});

io.on('onundo', (dataURL) => {
    loadCanvasFromDataURL(dataURL); 
});

io.on('onredo', (dataURL) => {
    loadCanvasFromDataURL(dataURL); 
});

io.on('onclear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});


function toggleSizePanel(tool) {
    const panels = {
        marker: { panel: "markerPanel", btn: "markerTool" },
        eraser: { panel: "eraserPanel", btn: "eraserTool" },
        shapes: { panel: "shapesPanel", btn: "shapesTool" },
    };
    if (!panels[tool]) return;

    Object.values(panels).forEach(({ panel, btn }) => {
        let panelEl = document.getElementById(panel);
        let btnEl = document.getElementById(btn);
        if (panelEl) panelEl.style.display = "none";
        if (btnEl) btnEl.classList.remove("active");
    });

    let panelEl = document.getElementById(panels[tool].panel);
    let btnEl = document.getElementById(panels[tool].btn);
    let isVisible = window.getComputedStyle(panelEl).display !== "none";
    panelEl.style.display = isVisible ? "none" : "flex";
    btnEl.classList.toggle("active", !isVisible);
}

// Set active tool
function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll(".main-btn, .sub-buttons button").forEach((btn) => btn.classList.remove("active"));
    let selectedBtn = document.querySelector(`[data-tool="${tool}"]`);
    if (selectedBtn) selectedBtn.classList.add("active");
}

// Drawing helper
function applyDraw(x, y, tool, color, size) {
    ctx.strokeStyle = tool.startsWith("esize") ? "white" : color;
    ctx.lineWidth = size;
    ctx.lineTo(x, y);
    ctx.stroke();
}

// Shape helper
function drawShape(shape, startX, startY, endX, endY, color) {
    ctx.strokeStyle = color;
    if (shape === "rectangle") {
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(startX, startY, Math.hypot(endX - startX, endY - startY), 0, Math.PI * 2);
        ctx.stroke();
    } else if (shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX - (endX - startX), endY);
        ctx.lineTo(startX + (endX - startX), endY);
        ctx.closePath();
        ctx.stroke();
    }
}

// Mouse events
canvas.onmousedown = (e) => {
    startX = x = e.clientX;
    startY = y = e.clientY;
    mouseDown = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Save image for preview

    io.emit('down', {
        x,
        y,
        before: canvas.toDataURL() // Save current state
    });
};

canvas.onmouseup = (e) => {
    if (!mouseDown) return;
    mouseDown = false;

    if (["rectangle", "circle", "triangle"].includes(currentTool)) {
        let endX = e.clientX;
        let endY = e.clientY;
        let beforeDataURL = previewImageDataToDataURL(previewImageData); 
        drawShape(currentTool, startX, startY, endX, endY, currentColor);
        io.emit('onshape', {
            shape: currentTool,
            startX,
            startY,
            endX,
            endY,
            color: currentColor,
            before: beforeDataURL
        });

        // Save this action for undo:
        io.emit('oncommit', { before: beforeDataURL });
    } else {
        // Marker or eraser strokes ended; save pre-stroke state:
        let beforeDataURL = previewImageDataToDataURL(previewImageData); 
        io.emit('oncommit', { before: beforeDataURL });
    }
};


canvas.onmousemove = (e) => {
    if (!mouseDown) return;

    x = e.clientX;
    y = e.clientY;

    if (["rectangle", "circle", "triangle"].includes(currentTool)) {
        ctx.putImageData(previewImageData, 0, 0); // restore preview
        drawShape(currentTool, startX, startY, x, y, currentColor);
        return;
    }

    let width;
    if (currentTool.startsWith("size-")) width = parseInt(currentTool.split("-")[1]) * 3;
    else if (currentTool.startsWith("esize-")) width = parseInt(currentTool.split("-")[1]) * 40;
    else if (currentTool === "marker") width = brushSize;
    else if (currentTool === "eraser") width = 20;

    io.emit('draw', { x, y, tool: currentTool, color: currentColor, size: width });
    applyDraw(x, y, currentTool, currentColor, width);
};

// Undo/Redo/Clear
function undo() {
    io.emit('onundo');
}
function redo() {
    io.emit('onredo');
}
function clearCanvas() {
    io.emit('onclear', canvas.toDataURL());
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Export
document.getElementById('export-png').onclick = () => {
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

document.getElementById('export-pdf').onclick = () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('landscape');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('whiteboard.pdf');
};




  // Helper to reset an <img> back to its base version
  function resetImg(img) {
    img.src = img.src.replace('_hover', '');
  }

  // Helper to set an <img> to its clicked version
  function setClickedImg(img) {
    if (!img.src.includes('_hover')) {
      const dotIndex = img.src.lastIndexOf('.');
      img.src = img.src.slice(0, dotIndex) + '_hover' + img.src.slice(dotIndex);
    }
  }

  const tools = document.querySelectorAll('#toolbar .dropdown[data-icon-name]');
  tools.forEach(tool => {
    const mainButtonImg = tool.querySelector('.main-btn img');
    const subButtons = tool.querySelectorAll('.sub-buttons button img');

    // When any sub-button is clicked:
    subButtons.forEach(img => {
      img.addEventListener('click', () => {
        // 1) Reset all sub-button imgs in this panel
        subButtons.forEach(resetImg);
        // 2) Set clicked image on this sub-button
        setClickedImg(img);

        // 3) Reset all other tools’ mainButtonImg
        tools.forEach(otherTool => {
          if (otherTool !== tool) {
            resetImg(otherTool.querySelector('.main-btn img'));
            otherTool.querySelectorAll('.sub-buttons img').forEach(resetImg);
          }
        });

        // 4) Set the mainButtonImg to its clicked version
        setClickedImg(mainButtonImg);
      });
    });

    // Optional: reset this tool’s icon when clicking its main button
    tool.querySelector('.main-btn').addEventListener('click', () => {
      resetImg(mainButtonImg);
      subButtons.forEach(resetImg); // reset all sub-options too
    });
  });



// Get the buttons
  const exportPngButton = document.getElementById('export-png');
  const exportPdfButton = document.getElementById('export-pdf');
  const exportUndoButton = document.getElementById('undo');
  const exportRedoButton = document.getElementById('redo');
  const exportClearButton = document.getElementById('clear');

  // Save the image elements
  const exportPngImg = exportPngButton.querySelector('img');
  const exportPdfImg = exportPdfButton.querySelector('img');
  const exportUndoImg = exportUndoButton.querySelector('img');
  const exportRedoImg = exportRedoButton.querySelector('img');
  const exportClearImg = exportClearButton.querySelector('img');

  // PNG hover
  exportPngButton.addEventListener('mouseenter', () => {
    exportPngImg.src = '/images/img_exp_hover.jpeg';
  });
  exportPngButton.addEventListener('mouseleave', () => {
    exportPngImg.src = '/images/img_exp.jpeg';
  });

  // PDF hover
  exportPdfButton.addEventListener('mouseenter', () => {
    exportPdfImg.src = '/images/pdf_exp_hover.jpeg';
  });
  exportPdfButton.addEventListener('mouseleave', () => {
    exportPdfImg.src = '/images/pdf_exp.jpeg';
  });

  // undo hover
  exportUndoButton.addEventListener('mouseenter', () => {
    exportUndoImg.src = '/images/undo_hover.jpeg';
  });
  exportUndoButton.addEventListener('mouseleave', () => {
    exportUndoImg.src = '/images/undo.jpeg';
  });

  // redo hover
  exportRedoButton.addEventListener('mouseenter', () => {
    exportRedoImg.src = '/images/redo.jpeg';
  });
  exportRedoButton.addEventListener('mouseleave', () => {
    exportRedoImg.src = '/images/redo_hover.jpeg';
  });

  // clear hover
  exportClearButton.addEventListener('mouseenter', () => {
    exportClearImg.src = '/images/clear_hover.jpeg';
  });
  exportClearButton.addEventListener('mouseleave', () => {
    exportClearImg.src = '/images/clear.jpeg';
  });
