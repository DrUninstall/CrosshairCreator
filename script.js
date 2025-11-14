// Crosshair Creator - Main Application

class CrosshairCreator {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pixelCanvas = document.getElementById('pixelCanvas');
        this.pixelCtx = this.pixelCanvas.getContext('2d');

        // Settings
        this.settings = {
            crosshair: {
                style: 'cross',
                gap: 4,
                length: 10,
                thickness: 2,
                outlineThickness: 1,
                color: '#00ff00',
                opacity: 100,
                outlineColor: '#000000',
                customImage: null,
                pixelData: null
            },
            dot: {
                enabled: false,
                style: 'circle',
                size: 4,
                outlineThickness: 1,
                color: '#ffffff',
                opacity: 100,
                outlineColor: '#000000',
                outlineOpacity: 100,
                customImage: null,
                pixelData: null
            },
            overlay: {
                enabled: false,
                image: null,
                size: 100,
                opacity: 50
            },
            showGrid: false
        };

        // State
        this.pixelDrawMode = null; // 'crosshair' or 'dot'
        this.pixelGrid = [];
        this.bookmarks = this.loadBookmarks();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializePixelCanvas();
        this.draw();
        this.loadCommunityPresets();
    }

    setupEventListeners() {
        // Crosshair style
        document.getElementById('crosshairStyle').addEventListener('change', (e) => {
            this.settings.crosshair.style = e.target.value;
            this.toggleCustomUpload('crosshair');
            if (e.target.value === 'pixels') {
                this.openPixelDrawer('crosshair');
            }
            this.draw();
        });

        // Crosshair settings
        this.addRangeListener('crosshairGap', 'gap', 'crosshair', 'gapValue');
        this.addRangeListener('crosshairLength', 'length', 'crosshair', 'lengthValue');
        this.addRangeListener('crosshairThickness', 'thickness', 'crosshair', 'thicknessValue');
        this.addRangeListener('crosshairOutlineThickness', 'outlineThickness', 'crosshair', 'outlineThicknessValue');
        this.addRangeListener('crosshairOpacity', 'opacity', 'crosshair', 'opacityValue');

        document.getElementById('crosshairColor').addEventListener('input', (e) => {
            this.settings.crosshair.color = e.target.value;
            this.draw();
        });

        document.getElementById('crosshairOutlineColor').addEventListener('input', (e) => {
            this.settings.crosshair.outlineColor = e.target.value;
            this.draw();
        });

        // Dot settings
        document.getElementById('dotEnabled').addEventListener('change', (e) => {
            this.settings.dot.enabled = e.target.checked;
            document.getElementById('dotSettings').style.display = e.target.checked ? 'block' : 'none';
            this.draw();
        });

        document.getElementById('dotStyle').addEventListener('change', (e) => {
            this.settings.dot.style = e.target.value;
            this.toggleCustomUpload('dot');
            if (e.target.value === 'pixels') {
                this.openPixelDrawer('dot');
            }
            this.draw();
        });

        this.addRangeListener('dotSize', 'size', 'dot', 'dotSizeValue');
        this.addRangeListener('dotOutlineThickness', 'outlineThickness', 'dot', 'dotOutlineThicknessValue');
        this.addRangeListener('dotOpacity', 'opacity', 'dot', 'dotOpacityValue');
        this.addRangeListener('dotOutlineOpacity', 'outlineOpacity', 'dot', 'dotOutlineOpacityValue');

        document.getElementById('dotColor').addEventListener('input', (e) => {
            this.settings.dot.color = e.target.value;
            this.draw();
        });

        document.getElementById('dotOutlineColor').addEventListener('input', (e) => {
            this.settings.dot.outlineColor = e.target.value;
            this.draw();
        });

        // Overlay settings
        document.getElementById('overlayEnabled').addEventListener('change', (e) => {
            this.settings.overlay.enabled = e.target.checked;
            document.getElementById('overlaySettings').style.display = e.target.checked ? 'block' : 'none';
            this.draw();
        });

        this.addRangeListener('overlaySize', 'size', 'overlay', 'overlaySizeValue');
        this.addRangeListener('overlayOpacity', 'opacity', 'overlay', 'overlayOpacityValue');

        // File uploads
        document.getElementById('crosshairImageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'crosshair');
        });

        document.getElementById('dotImageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'dot');
        });

        document.getElementById('overlayImageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'overlay');
        });

        // Grid toggle
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.settings.showGrid = e.target.checked;
            this.draw();
        });

        // Export buttons
        document.getElementById('exportFullHD').addEventListener('click', () => {
            this.export(1920, 1080);
        });

        document.getElementById('export2K').addEventListener('click', () => {
            this.export(2560, 1440);
        });

        // Action buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetToDefault();
        });

        document.getElementById('saveCrosshair').addEventListener('click', () => {
            this.saveCrosshair();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareCrosshair();
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyPreset(preset);
            });
        });

        // Community tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Pixel drawer
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closePixelDrawer();
        });

        document.getElementById('pixelClear').addEventListener('click', () => {
            this.clearPixelCanvas();
        });

        document.getElementById('pixelDone').addEventListener('click', () => {
            this.savePixelDrawing();
        });

        // Canvas interaction
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasHover(e);
        });
    }

    addRangeListener(elementId, settingKey, category, valueDisplayId) {
        const element = document.getElementById(elementId);
        element.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.settings[category][settingKey] = value;
            document.getElementById(valueDisplayId).textContent = value;
            this.draw();
        });
    }

    toggleCustomUpload(type) {
        const uploadDiv = type === 'crosshair' ?
            document.getElementById('customCrosshairUpload') :
            document.getElementById('customDotUpload');

        const style = type === 'crosshair' ?
            this.settings.crosshair.style :
            this.settings.dot.style;

        uploadDiv.style.display = style === 'custom' ? 'block' : 'none';
    }

    handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                if (type === 'overlay') {
                    this.settings.overlay.image = img;
                } else if (type === 'crosshair') {
                    this.settings.crosshair.customImage = img;
                } else if (type === 'dot') {
                    this.settings.dot.customImage = img;
                }
                this.draw();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Pixel Drawing
    initializePixelCanvas() {
        const gridSize = 32;
        this.pixelGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));

        this.pixelCanvas.addEventListener('mousedown', (e) => this.startPixelDraw(e));
        this.pixelCanvas.addEventListener('mousemove', (e) => this.continuePixelDraw(e));
        this.pixelCanvas.addEventListener('mouseup', () => this.stopPixelDraw());
        this.pixelCanvas.addEventListener('mouseleave', () => this.stopPixelDraw());

        this.isDrawing = false;
    }

    openPixelDrawer(mode) {
        this.pixelDrawMode = mode;
        document.getElementById('pixelDrawModal').classList.add('active');
        this.clearPixelCanvas();

        // Load existing pixel data if available
        const pixelData = mode === 'crosshair' ?
            this.settings.crosshair.pixelData :
            this.settings.dot.pixelData;

        if (pixelData) {
            this.pixelGrid = JSON.parse(JSON.stringify(pixelData));
        }

        this.drawPixelCanvas();
    }

    closePixelDrawer() {
        document.getElementById('pixelDrawModal').classList.remove('active');
    }

    clearPixelCanvas() {
        const gridSize = 32;
        this.pixelGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
        this.drawPixelCanvas();
    }

    startPixelDraw(e) {
        this.isDrawing = true;
        this.drawPixel(e);
    }

    continuePixelDraw(e) {
        if (this.isDrawing) {
            this.drawPixel(e);
        }
    }

    stopPixelDraw() {
        this.isDrawing = false;
    }

    drawPixel(e) {
        const rect = this.pixelCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellSize = this.pixelCanvas.width / 32;
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);

        if (gridX >= 0 && gridX < 32 && gridY >= 0 && gridY < 32) {
            this.pixelGrid[gridY][gridX] = !this.pixelGrid[gridY][gridX];
            this.drawPixelCanvas();
        }
    }

    drawPixelCanvas() {
        const cellSize = this.pixelCanvas.width / 32;
        this.pixelCtx.clearRect(0, 0, this.pixelCanvas.width, this.pixelCanvas.height);

        // Draw grid
        this.pixelCtx.strokeStyle = '#30363d';
        this.pixelCtx.lineWidth = 1;
        for (let i = 0; i <= 32; i++) {
            this.pixelCtx.beginPath();
            this.pixelCtx.moveTo(i * cellSize, 0);
            this.pixelCtx.lineTo(i * cellSize, this.pixelCanvas.height);
            this.pixelCtx.stroke();

            this.pixelCtx.beginPath();
            this.pixelCtx.moveTo(0, i * cellSize);
            this.pixelCtx.lineTo(this.pixelCanvas.width, i * cellSize);
            this.pixelCtx.stroke();
        }

        // Draw pixels
        this.pixelCtx.fillStyle = '#00ff00';
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
                if (this.pixelGrid[y][x]) {
                    this.pixelCtx.fillRect(
                        x * cellSize + 1,
                        y * cellSize + 1,
                        cellSize - 2,
                        cellSize - 2
                    );
                }
            }
        }
    }

    savePixelDrawing() {
        if (this.pixelDrawMode === 'crosshair') {
            this.settings.crosshair.pixelData = JSON.parse(JSON.stringify(this.pixelGrid));
        } else if (this.pixelDrawMode === 'dot') {
            this.settings.dot.pixelData = JSON.parse(JSON.stringify(this.pixelGrid));
        }
        this.closePixelDrawer();
        this.draw();
    }

    // Main drawing function
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (this.settings.showGrid) {
            this.drawGrid();
        }

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Draw crosshair
        this.drawCrosshair(centerX, centerY);

        // Draw overlay image
        if (this.settings.overlay.enabled && this.settings.overlay.image) {
            this.drawOverlay(centerX, centerY);
        }

        // Draw dot
        if (this.settings.dot.enabled) {
            this.drawDot(centerX, centerY);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 20;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawCrosshair(centerX, centerY) {
        const { style, gap, length, thickness, outlineThickness, color, opacity, outlineColor, customImage, pixelData } = this.settings.crosshair;

        if (style === 'custom' && customImage) {
            this.ctx.globalAlpha = opacity / 100;
            const size = 50; // Default size for custom image
            this.ctx.drawImage(customImage, centerX - size / 2, centerY - size / 2, size, size);
            this.ctx.globalAlpha = 1;
            return;
        }

        if (style === 'pixels' && pixelData) {
            this.drawPixelCrosshair(centerX, centerY, pixelData, color, opacity, outlineColor, outlineThickness);
            return;
        }

        this.ctx.save();
        this.ctx.globalAlpha = opacity / 100;

        if (style === 'cross') {
            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;
                this.ctx.lineCap = 'butt';

                // Top
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - gap);
                this.ctx.lineTo(centerX, centerY - gap - length);
                this.ctx.stroke();

                // Bottom
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY + gap);
                this.ctx.lineTo(centerX, centerY + gap + length);
                this.ctx.stroke();

                // Left
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - gap, centerY);
                this.ctx.lineTo(centerX - gap - length, centerY);
                this.ctx.stroke();

                // Right
                this.ctx.beginPath();
                this.ctx.moveTo(centerX + gap, centerY);
                this.ctx.lineTo(centerX + gap + length, centerY);
                this.ctx.stroke();
            }

            // Draw main crosshair
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;
            this.ctx.lineCap = 'butt';

            // Top
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY - gap);
            this.ctx.lineTo(centerX, centerY - gap - length);
            this.ctx.stroke();

            // Bottom
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY + gap);
            this.ctx.lineTo(centerX, centerY + gap + length);
            this.ctx.stroke();

            // Left
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - gap, centerY);
            this.ctx.lineTo(centerX - gap - length, centerY);
            this.ctx.stroke();

            // Right
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + gap, centerY);
            this.ctx.lineTo(centerX + gap + length, centerY);
            this.ctx.stroke();
        } else if (style === 'circle') {
            const radius = gap + length;

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Draw main circle
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawPixelCrosshair(centerX, centerY, pixelData, color, opacity, outlineColor, outlineThickness) {
        const pixelSize = 2; // Size of each pixel
        const gridSize = pixelData.length;
        const totalSize = gridSize * pixelSize;
        const startX = centerX - totalSize / 2;
        const startY = centerY - totalSize / 2;

        this.ctx.save();
        this.ctx.globalAlpha = opacity / 100;

        // Draw outline
        if (outlineThickness > 0) {
            this.ctx.fillStyle = outlineColor;
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    if (pixelData[y][x]) {
                        this.ctx.fillRect(
                            startX + x * pixelSize - outlineThickness,
                            startY + y * pixelSize - outlineThickness,
                            pixelSize + outlineThickness * 2,
                            pixelSize + outlineThickness * 2
                        );
                    }
                }
            }
        }

        // Draw main pixels
        this.ctx.fillStyle = color;
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (pixelData[y][x]) {
                    this.ctx.fillRect(
                        startX + x * pixelSize,
                        startY + y * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }

        this.ctx.restore();
    }

    drawDot(centerX, centerY) {
        const { style, size, outlineThickness, color, opacity, outlineColor, outlineOpacity, customImage, pixelData } = this.settings.dot;

        if (style === 'custom' && customImage) {
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.drawImage(customImage, centerX - size / 2, centerY - size / 2, size, size);
            this.ctx.globalAlpha = 1;
            return;
        }

        if (style === 'pixels' && pixelData) {
            this.drawPixelCrosshair(centerX, centerY, pixelData, color, opacity, outlineColor, outlineThickness);
            return;
        }

        this.ctx.save();

        if (style === 'circle') {
            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.fillStyle = outlineColor;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, size / 2 + outlineThickness, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw main dot
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (style === 'cross') {
            const halfSize = size / 2;

            this.ctx.globalAlpha = opacity / 100;

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = 2 + outlineThickness * 2;
                this.ctx.lineCap = 'butt';

                // Vertical
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - halfSize);
                this.ctx.lineTo(centerX, centerY + halfSize);
                this.ctx.stroke();

                // Horizontal
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - halfSize, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                this.ctx.stroke();
            }

            // Draw main cross
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'butt';

            // Vertical
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY - halfSize);
            this.ctx.lineTo(centerX, centerY + halfSize);
            this.ctx.stroke();

            // Horizontal
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - halfSize, centerY);
            this.ctx.lineTo(centerX + halfSize, centerY);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawOverlay(centerX, centerY) {
        const { image, size, opacity } = this.settings.overlay;
        this.ctx.save();
        this.ctx.globalAlpha = opacity / 100;
        this.ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
        this.ctx.restore();
    }

    // Export functionality
    export(width, height) {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const exportCtx = exportCanvas.getContext('2d');

        const centerX = width / 2;
        const centerY = height / 2;

        // Temporarily switch context
        const originalCtx = this.ctx;
        const originalCanvas = this.canvas;
        this.ctx = exportCtx;
        this.canvas = exportCanvas;

        // Draw crosshair
        this.drawCrosshair(centerX, centerY);

        // Draw overlay
        if (this.settings.overlay.enabled && this.settings.overlay.image) {
            this.drawOverlay(centerX, centerY);
        }

        // Draw dot
        if (this.settings.dot.enabled) {
            this.drawDot(centerX, centerY);
        }

        // Restore context
        this.ctx = originalCtx;
        this.canvas = originalCanvas;

        // Download
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crosshair-${width}x${height}-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Presets
    applyPreset(preset) {
        const presets = {
            valorant: {
                crosshair: { style: 'cross', gap: 3, length: 6, thickness: 2, outlineThickness: 2, color: '#00ff99', opacity: 100, outlineColor: '#000000' },
                dot: { enabled: true, style: 'circle', size: 3, outlineThickness: 2, color: '#00ff99', opacity: 100, outlineColor: '#000000', outlineOpacity: 100 }
            },
            overwatch: {
                crosshair: { style: 'circle', gap: 10, length: 5, thickness: 2, outlineThickness: 1, color: '#00ff00', opacity: 100, outlineColor: '#000000' },
                dot: { enabled: true, style: 'circle', size: 4, outlineThickness: 1, color: '#00ff00', opacity: 100, outlineColor: '#000000', outlineOpacity: 100 }
            },
            cs2: {
                crosshair: { style: 'cross', gap: 0, length: 8, thickness: 1, outlineThickness: 1, color: '#00ff00', opacity: 100, outlineColor: '#000000' },
                dot: { enabled: false, style: 'circle', size: 2, outlineThickness: 0, color: '#ffffff', opacity: 100, outlineColor: '#000000', outlineOpacity: 100 }
            },
            marvel: {
                crosshair: { style: 'cross', gap: 4, length: 10, thickness: 3, outlineThickness: 2, color: '#ff4655', opacity: 90, outlineColor: '#000000' },
                dot: { enabled: true, style: 'circle', size: 5, outlineThickness: 2, color: '#ff4655', opacity: 90, outlineColor: '#000000', outlineOpacity: 100 }
            },
            fortnite: {
                crosshair: { style: 'cross', gap: 2, length: 12, thickness: 2, outlineThickness: 1, color: '#ffffff', opacity: 80, outlineColor: '#000000' },
                dot: { enabled: true, style: 'circle', size: 3, outlineThickness: 1, color: '#ffffff', opacity: 80, outlineColor: '#000000', outlineOpacity: 100 }
            }
        };

        if (presets[preset]) {
            Object.assign(this.settings.crosshair, presets[preset].crosshair);
            Object.assign(this.settings.dot, presets[preset].dot);
            this.updateUIFromSettings();
            this.draw();
        }
    }

    updateUIFromSettings() {
        // Update crosshair UI
        document.getElementById('crosshairStyle').value = this.settings.crosshair.style;
        document.getElementById('crosshairGap').value = this.settings.crosshair.gap;
        document.getElementById('gapValue').textContent = this.settings.crosshair.gap;
        document.getElementById('crosshairLength').value = this.settings.crosshair.length;
        document.getElementById('lengthValue').textContent = this.settings.crosshair.length;
        document.getElementById('crosshairThickness').value = this.settings.crosshair.thickness;
        document.getElementById('thicknessValue').textContent = this.settings.crosshair.thickness;
        document.getElementById('crosshairOutlineThickness').value = this.settings.crosshair.outlineThickness;
        document.getElementById('outlineThicknessValue').textContent = this.settings.crosshair.outlineThickness;
        document.getElementById('crosshairColor').value = this.settings.crosshair.color;
        document.getElementById('crosshairOpacity').value = this.settings.crosshair.opacity;
        document.getElementById('opacityValue').textContent = this.settings.crosshair.opacity;
        document.getElementById('crosshairOutlineColor').value = this.settings.crosshair.outlineColor;

        // Update dot UI
        document.getElementById('dotEnabled').checked = this.settings.dot.enabled;
        document.getElementById('dotSettings').style.display = this.settings.dot.enabled ? 'block' : 'none';
        document.getElementById('dotStyle').value = this.settings.dot.style;
        document.getElementById('dotSize').value = this.settings.dot.size;
        document.getElementById('dotSizeValue').textContent = this.settings.dot.size;
        document.getElementById('dotOutlineThickness').value = this.settings.dot.outlineThickness;
        document.getElementById('dotOutlineThicknessValue').textContent = this.settings.dot.outlineThickness;
        document.getElementById('dotColor').value = this.settings.dot.color;
        document.getElementById('dotOpacity').value = this.settings.dot.opacity;
        document.getElementById('dotOpacityValue').textContent = this.settings.dot.opacity;
        document.getElementById('dotOutlineColor').value = this.settings.dot.outlineColor;
        document.getElementById('dotOutlineOpacity').value = this.settings.dot.outlineOpacity;
        document.getElementById('dotOutlineOpacityValue').textContent = this.settings.dot.outlineOpacity;
    }

    resetToDefault() {
        this.settings = {
            crosshair: {
                style: 'cross',
                gap: 4,
                length: 10,
                thickness: 2,
                outlineThickness: 1,
                color: '#00ff00',
                opacity: 100,
                outlineColor: '#000000',
                customImage: null,
                pixelData: null
            },
            dot: {
                enabled: false,
                style: 'circle',
                size: 4,
                outlineThickness: 1,
                color: '#ffffff',
                opacity: 100,
                outlineColor: '#000000',
                outlineOpacity: 100,
                customImage: null,
                pixelData: null
            },
            overlay: {
                enabled: false,
                image: null,
                size: 100,
                opacity: 50
            },
            showGrid: false
        };
        this.updateUIFromSettings();
        this.draw();
    }

    // Community features
    saveCrosshair() {
        const crosshair = {
            id: Date.now(),
            name: `Crosshair ${new Date().toLocaleDateString()}`,
            game: 'Custom',
            settings: JSON.parse(JSON.stringify(this.settings))
        };

        this.bookmarks.push(crosshair);
        this.saveBookmarks();
        this.renderBookmarks();
        alert('Crosshair saved to bookmarks!');
    }

    shareCrosshair() {
        const settingsString = JSON.stringify(this.settings);
        const encodedSettings = btoa(settingsString);
        const shareUrl = `${window.location.origin}${window.location.pathname}?crosshair=${encodedSettings}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share URL copied to clipboard!');
        }).catch(() => {
            prompt('Copy this URL to share your crosshair:', shareUrl);
        });
    }

    loadBookmarks() {
        const saved = localStorage.getItem('crosshairBookmarks');
        return saved ? JSON.parse(saved) : [];
    }

    saveBookmarks() {
        localStorage.setItem('crosshairBookmarks', JSON.stringify(this.bookmarks));
    }

    renderBookmarks() {
        const container = document.getElementById('bookmarkedCrosshairs');
        if (this.bookmarks.length === 0) {
            container.innerHTML = '<p class="empty-state">No bookmarks yet. Save your favorite crosshairs!</p>';
            return;
        }

        container.innerHTML = '';
        this.bookmarks.forEach((bookmark, index) => {
            const item = this.createCrosshairItem(bookmark, () => {
                this.settings = JSON.parse(JSON.stringify(bookmark.settings));
                this.updateUIFromSettings();
                this.draw();
            });
            container.appendChild(item);
        });
    }

    loadCommunityPresets() {
        const communityPresets = [
            { id: 1, name: 'TenZ VALORANT', game: 'VALORANT', settings: { crosshair: { style: 'cross', gap: 3, length: 6, thickness: 2, outlineThickness: 2, color: '#00ff99', opacity: 100, outlineColor: '#000000' }, dot: { enabled: true, style: 'circle', size: 3, outlineThickness: 2, color: '#00ff99', opacity: 100, outlineColor: '#000000', outlineOpacity: 100 }, overlay: { enabled: false }, showGrid: false } },
            { id: 2, name: 's1mple CS2', game: 'CS2', settings: { crosshair: { style: 'cross', gap: 0, length: 8, thickness: 1, outlineThickness: 1, color: '#00ff00', opacity: 100, outlineColor: '#000000' }, dot: { enabled: false }, overlay: { enabled: false }, showGrid: false } },
            { id: 3, name: 'Classic OW2', game: 'Overwatch 2', settings: { crosshair: { style: 'circle', gap: 10, length: 5, thickness: 2, outlineThickness: 1, color: '#00ff00', opacity: 100, outlineColor: '#000000' }, dot: { enabled: true, style: 'circle', size: 4, outlineThickness: 1, color: '#00ff00', opacity: 100, outlineColor: '#000000', outlineOpacity: 100 }, overlay: { enabled: false }, showGrid: false } },
            { id: 4, name: 'Shroud Special', game: 'CS2', settings: { crosshair: { style: 'cross', gap: 2, length: 7, thickness: 1, outlineThickness: 1, color: '#ffff00', opacity: 100, outlineColor: '#000000' }, dot: { enabled: true, style: 'circle', size: 2, outlineThickness: 1, color: '#ffff00', opacity: 100, outlineColor: '#000000', outlineOpacity: 100 }, overlay: { enabled: false }, showGrid: false } },
            { id: 5, name: 'Ninja Fortnite', game: 'Fortnite', settings: { crosshair: { style: 'cross', gap: 2, length: 12, thickness: 2, outlineThickness: 1, color: '#ffffff', opacity: 80, outlineColor: '#000000' }, dot: { enabled: true, style: 'circle', size: 3, outlineThickness: 1, color: '#ffffff', opacity: 80, outlineColor: '#000000', outlineOpacity: 100 }, overlay: { enabled: false }, showGrid: false } }
        ];

        const container = document.getElementById('popularCrosshairs');
        container.innerHTML = '';
        communityPresets.forEach(preset => {
            const item = this.createCrosshairItem(preset, () => {
                this.settings = JSON.parse(JSON.stringify(preset.settings));
                this.updateUIFromSettings();
                this.draw();
            });
            container.appendChild(item);
        });
    }

    createCrosshairItem(data, onClick) {
        const item = document.createElement('div');
        item.className = 'crosshair-item';
        item.onclick = onClick;

        const preview = document.createElement('div');
        preview.className = 'crosshair-preview';

        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 200;
        previewCanvas.height = 120;
        const previewCtx = previewCanvas.getContext('2d');

        // Draw preview
        const originalCtx = this.ctx;
        const originalCanvas = this.canvas;
        this.ctx = previewCtx;
        this.canvas = previewCanvas;
        const originalSettings = JSON.parse(JSON.stringify(this.settings));
        this.settings = data.settings;

        const centerX = previewCanvas.width / 2;
        const centerY = previewCanvas.height / 2;
        this.drawCrosshair(centerX, centerY);
        if (data.settings.dot && data.settings.dot.enabled) {
            this.drawDot(centerX, centerY);
        }

        this.ctx = originalCtx;
        this.canvas = originalCanvas;
        this.settings = originalSettings;

        preview.appendChild(previewCanvas);

        const info = document.createElement('div');
        info.className = 'crosshair-info';
        info.innerHTML = `
            <h4>${data.name}</h4>
            <p>${data.game || 'Custom'}</p>
        `;

        item.appendChild(preview);
        item.appendChild(info);

        return item;
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tab === 'popular') {
            document.getElementById('popularTab').classList.add('active');
        } else if (tab === 'bookmarks') {
            document.getElementById('bookmarksTab').classList.add('active');
            this.renderBookmarks();
        }
    }

    handleCanvasHover(e) {
        // Optional: Add dynamic preview on hover
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CrosshairCreator();

    // Load shared crosshair from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCrosshair = urlParams.get('crosshair');
    if (sharedCrosshair) {
        try {
            const settings = JSON.parse(atob(sharedCrosshair));
            app.settings = settings;
            app.updateUIFromSettings();
            app.draw();
        } catch (e) {
            console.error('Failed to load shared crosshair:', e);
        }
    }
});
