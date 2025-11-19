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
                outlineOpacity: 100,
                rotation: 0,
                customImage: null,
                pixelData: null,
                customOffsetX: 0,
                customOffsetY: 0,
                customScale: 50,
                customScaleX: 100,
                customScaleY: 100
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
                pixelData: null,
                customOffsetX: 0,
                customOffsetY: 0,
                customScale: 50,
                customScaleX: 100,
                customScaleY: 100
            },
            overlay: {
                enabled: false,
                image: null,
                size: 100,
                opacity: 50
            },
            showGrid: false,
            background: 'dark'
        };

        // State
        this.pixelDrawMode = null; // 'crosshair' or 'dot'
        this.pixelGrid = [];
        this.bookmarks = this.loadBookmarks();
        this.mouseX = null;
        this.mouseY = null;
        this.isMouseOverCanvas = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializePixelCanvas();
        this.setupEditableValues();
        this.setupPanelToggle();
        this.resizeCanvas();
        this.draw();
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
        this.addRangeListener('crosshairRotation', 'rotation', 'crosshair', 'rotationValue');
        this.addRangeListener('crosshairOutlineThickness', 'outlineThickness', 'crosshair', 'outlineThicknessValue');
        this.addRangeListener('crosshairOpacity', 'opacity', 'crosshair', 'opacityValue');
        this.addRangeListener('crosshairOutlineOpacity', 'outlineOpacity', 'crosshair', 'outlineOpacityValue');

        // Custom PNG crosshair controls
        this.addRangeListener('crosshairOffsetX', 'customOffsetX', 'crosshair', 'customOffsetXValue');
        this.addRangeListener('crosshairOffsetY', 'customOffsetY', 'crosshair', 'customOffsetYValue');
        this.addRangeListener('crosshairCustomScale', 'customScale', 'crosshair', 'customScaleValue');
        this.addRangeListener('crosshairScaleX', 'customScaleX', 'crosshair', 'customScaleXValue');
        this.addRangeListener('crosshairScaleY', 'customScaleY', 'crosshair', 'customScaleYValue');

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

        // Custom PNG dot controls
        this.addRangeListener('dotOffsetX', 'customOffsetX', 'dot', 'dotOffsetXValue');
        this.addRangeListener('dotOffsetY', 'customOffsetY', 'dot', 'dotOffsetYValue');
        this.addRangeListener('dotCustomScale', 'customScale', 'dot', 'dotCustomScaleValue');
        this.addRangeListener('dotScaleX', 'customScaleX', 'dot', 'dotScaleXValue');
        this.addRangeListener('dotScaleY', 'customScaleY', 'dot', 'dotScaleYValue');

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

        // Background selection
        document.querySelectorAll('input[name="background"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.background = e.target.value;
                this.draw();
            });
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

        document.getElementById('importBtn').addEventListener('click', () => {
            this.importCrosshair();
        });

        // Allow Enter key to import
        document.getElementById('importInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.importCrosshair();
            }
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

        this.canvas.addEventListener('mouseenter', () => {
            this.isMouseOverCanvas = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseOverCanvas = false;
            this.mouseX = null;
            this.mouseY = null;
            this.draw();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Set canvas internal resolution to match display size
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
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

    setupEditableValues() {
        // Find all value display spans in labels
        const valueSpans = document.querySelectorAll('.setting-group label span[id$="Value"]');

        valueSpans.forEach(span => {
            span.addEventListener('click', () => {
                this.makeValueEditable(span);
            });
        });
    }

    setupPanelToggle() {
        const panel = document.getElementById('communityPanel');
        const toggleBtn = document.getElementById('panelToggle');

        // Load saved state from localStorage
        const isPanelCollapsed = localStorage.getItem('panelCollapsed') === 'true';
        if (isPanelCollapsed) {
            panel.classList.add('collapsed');
        }

        // Toggle button click handler
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            const isCollapsed = panel.classList.contains('collapsed');
            localStorage.setItem('panelCollapsed', isCollapsed);
        });
    }

    makeValueEditable(span) {
        // Don't edit if already editing
        if (span.classList.contains('editing')) return;

        const currentValue = parseInt(span.textContent);
        const spanId = span.id;

        // Find the corresponding range input
        const rangeInputId = spanId.replace('Value', '');
        const rangeInput = document.getElementById(rangeInputId);

        if (!rangeInput) return;

        const min = parseFloat(rangeInput.min);
        const max = parseFloat(rangeInput.max);

        // Create input element
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'value-input';
        input.value = currentValue;
        input.min = min;
        input.max = max;

        // Mark span as editing
        span.classList.add('editing');
        span.textContent = '';
        span.appendChild(input);

        // Focus and select
        input.focus();
        input.select();

        const finishEditing = () => {
            let newValue = parseFloat(input.value);

            // Validate and clamp value
            if (isNaN(newValue)) {
                newValue = currentValue;
            } else {
                newValue = Math.max(min, Math.min(max, newValue));
            }

            // Update the range input
            rangeInput.value = newValue;
            rangeInput.dispatchEvent(new Event('input'));

            // Restore span
            span.classList.remove('editing');
            span.textContent = newValue;
        };

        // Handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                span.classList.remove('editing');
                span.textContent = currentValue;
            }
        });

        // Handle blur
        input.addEventListener('blur', finishEditing);
    }

    toggleCustomUpload(type) {
        const uploadDiv = type === 'crosshair' ?
            document.getElementById('customCrosshairUpload') :
            document.getElementById('customDotUpload');

        const controlsDiv = type === 'crosshair' ?
            document.getElementById('customCrosshairControls') :
            document.getElementById('customDotControls');

        const style = type === 'crosshair' ?
            this.settings.crosshair.style :
            this.settings.dot.style;

        const isCustom = style === 'custom';
        uploadDiv.style.display = isCustom ? 'block' : 'none';
        controlsDiv.style.display = isCustom ? 'block' : 'none';
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
        this.drawBackground();

        if (this.settings.showGrid) {
            this.drawGrid();
        }

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Use mouse position if hovering, otherwise center
        const crosshairX = this.isMouseOverCanvas && this.mouseX !== null ? this.mouseX : centerX;
        const crosshairY = this.isMouseOverCanvas && this.mouseY !== null ? this.mouseY : centerY;

        // Draw crosshair (follows cursor when hovering)
        this.drawCrosshair(crosshairX, crosshairY);

        // Draw overlay image (always at center, fixed/static)
        if (this.settings.overlay.enabled && this.settings.overlay.image) {
            this.drawOverlay(centerX, centerY);
        }

        // Draw dot (follows cursor when hovering)
        if (this.settings.dot.enabled) {
            this.drawDot(crosshairX, crosshairY);
        }
    }

    drawBackground() {
        const bg = this.settings.background;

        if (bg === 'dark') {
            // Dark background (default)
            this.ctx.fillStyle = '#0d1117';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (bg === 'light') {
            // Light background
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (bg === 'marble') {
            // Marble-like background with gradient and noise pattern
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            gradient.addColorStop(0, '#d4d4d4');
            gradient.addColorStop(0.5, '#e8e8e8');
            gradient.addColorStop(1, '#c8c8c8');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Add marble texture effect
            this.ctx.globalAlpha = 0.05;
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                const size = Math.random() * 50 + 10;
                this.ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#888888';
                this.ctx.fillRect(x, y, size, 2);
            }
            this.ctx.globalAlpha = 1.0;
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
        const { style, gap, length, thickness, outlineThickness, color, opacity, outlineColor, outlineOpacity, rotation, customImage, pixelData, customOffsetX, customOffsetY, customScale, customScaleX, customScaleY } = this.settings.crosshair;

        if (style === 'custom' && customImage) {
            this.ctx.save();
            this.ctx.globalAlpha = opacity / 100;

            // Calculate final size with scale and aspect ratio adjustments
            const baseWidth = customScale * (customScaleX / 100);
            const baseHeight = customScale * (customScaleY / 100);

            // Apply position offset
            const x = centerX + customOffsetX - baseWidth / 2;
            const y = centerY + customOffsetY - baseHeight / 2;

            this.ctx.drawImage(customImage, x, y, baseWidth, baseHeight);
            this.ctx.restore();
            return;
        }

        if (style === 'pixels' && pixelData) {
            this.drawPixelCrosshair(centerX, centerY, pixelData, color, opacity, outlineColor, outlineThickness);
            return;
        }

        this.ctx.save();
        this.ctx.globalAlpha = opacity / 100;

        // Apply rotation if set
        if (rotation !== 0) {
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((rotation * Math.PI) / 180);
            this.ctx.translate(-centerX, -centerY);
        }

        if (style === 'cross') {
            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
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
            this.ctx.globalAlpha = opacity / 100;
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
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Draw main circle
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (style === 'square') {
            const size = (gap + length) * 2;

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;
                this.ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
            }

            // Draw main square
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;
            this.ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
        } else if (style === 'triangle') {
            const size = gap + length;
            const height = size * Math.sqrt(3) / 2;

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - height * 0.66);
                this.ctx.lineTo(centerX + size, centerY + height * 0.33);
                this.ctx.lineTo(centerX - size, centerY + height * 0.33);
                this.ctx.closePath();
                this.ctx.stroke();
            }

            // Draw main triangle
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY - height * 0.66);
            this.ctx.lineTo(centerX + size, centerY + height * 0.33);
            this.ctx.lineTo(centerX - size, centerY + height * 0.33);
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (style === 'two-lines') {
            // Left and Right only
            this.ctx.lineCap = 'butt';

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

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

            // Draw main lines
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

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
        } else if (style === 'three-lines') {
            // Left, Right, Bottom (no top)
            this.ctx.lineCap = 'butt';

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

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

            // Draw main lines
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

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
        } else if (style === 'three-angled') {
            // Three lines at 120 degree angles (like Mercedes logo)
            const angle1 = -Math.PI / 2; // Top
            const angle2 = Math.PI / 6;   // Bottom right
            const angle3 = 5 * Math.PI / 6; // Bottom left

            this.ctx.lineCap = 'butt';

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

                [angle1, angle2, angle3].forEach(angle => {
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        centerX + Math.cos(angle) * gap,
                        centerY + Math.sin(angle) * gap
                    );
                    this.ctx.lineTo(
                        centerX + Math.cos(angle) * (gap + length),
                        centerY + Math.sin(angle) * (gap + length)
                    );
                    this.ctx.stroke();
                });
            }

            // Draw main lines
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

            [angle1, angle2, angle3].forEach(angle => {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    centerX + Math.cos(angle) * gap,
                    centerY + Math.sin(angle) * gap
                );
                this.ctx.lineTo(
                    centerX + Math.cos(angle) * (gap + length),
                    centerY + Math.sin(angle) * (gap + length)
                );
                this.ctx.stroke();
            });
        } else if (style === 't-shape') {
            // Top, Left, Right (no bottom)
            this.ctx.lineCap = 'butt';

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

                // Top
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - gap);
                this.ctx.lineTo(centerX, centerY - gap - length);
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

            // Draw main lines
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

            // Top
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY - gap);
            this.ctx.lineTo(centerX, centerY - gap - length);
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
        } else if (style === 'one-curve') {
            // Semi-circle on top
            const radius = gap + length;

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, Math.PI, 0);
                this.ctx.stroke();
            }

            // Draw main curve
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, Math.PI, 0);
            this.ctx.stroke();
        } else if (style === 'two-curves') {
            // Two semi-circles facing each other
            const radius = gap + length / 2;
            const offset = gap + length;

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

                // Left curve
                this.ctx.beginPath();
                this.ctx.arc(centerX - offset, centerY, radius, -Math.PI / 2, Math.PI / 2);
                this.ctx.stroke();

                // Right curve
                this.ctx.beginPath();
                this.ctx.arc(centerX + offset, centerY, radius, Math.PI / 2, -Math.PI / 2);
                this.ctx.stroke();
            }

            // Draw main curves
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

            // Left curve
            this.ctx.beginPath();
            this.ctx.arc(centerX - offset, centerY, radius, -Math.PI / 2, Math.PI / 2);
            this.ctx.stroke();

            // Right curve
            this.ctx.beginPath();
            this.ctx.arc(centerX + offset, centerY, radius, Math.PI / 2, -Math.PI / 2);
            this.ctx.stroke();
        } else if (style === 'four-curves') {
            // Four curved lines in circular pattern
            const radius = gap + length;
            const arcLength = Math.PI / 4; // 45 degrees

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

                for (let i = 0; i < 4; i++) {
                    const startAngle = i * Math.PI / 2 - arcLength / 2;
                    const endAngle = i * Math.PI / 2 + arcLength / 2;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                    this.ctx.stroke();
                }
            }

            // Draw main curves
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

            for (let i = 0; i < 4; i++) {
                const startAngle = i * Math.PI / 2 - arcLength / 2;
                const endAngle = i * Math.PI / 2 + arcLength / 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                this.ctx.stroke();
            }
        } else if (style === 'arrow') {
            // Upward pointing arrow
            const headWidth = length;
            const headHeight = length * 0.6;
            const shaftWidth = thickness * 2;
            const shaftHeight = length;

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;
                this.ctx.lineJoin = 'miter';

                this.ctx.beginPath();
                // Arrow head
                this.ctx.moveTo(centerX, centerY - gap - shaftHeight - headHeight);
                this.ctx.lineTo(centerX + headWidth / 2, centerY - gap - shaftHeight);
                this.ctx.lineTo(centerX + shaftWidth / 2, centerY - gap - shaftHeight);
                // Arrow shaft
                this.ctx.lineTo(centerX + shaftWidth / 2, centerY - gap);
                this.ctx.lineTo(centerX - shaftWidth / 2, centerY - gap);
                this.ctx.lineTo(centerX - shaftWidth / 2, centerY - gap - shaftHeight);
                this.ctx.lineTo(centerX - headWidth / 2, centerY - gap - shaftHeight);
                this.ctx.closePath();
                this.ctx.stroke();
            }

            // Draw main arrow
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;
            this.ctx.lineJoin = 'miter';

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY - gap - shaftHeight - headHeight);
            this.ctx.lineTo(centerX + headWidth / 2, centerY - gap - shaftHeight);
            this.ctx.lineTo(centerX + shaftWidth / 2, centerY - gap - shaftHeight);
            this.ctx.lineTo(centerX + shaftWidth / 2, centerY - gap);
            this.ctx.lineTo(centerX - shaftWidth / 2, centerY - gap);
            this.ctx.lineTo(centerX - shaftWidth / 2, centerY - gap - shaftHeight);
            this.ctx.lineTo(centerX - headWidth / 2, centerY - gap - shaftHeight);
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (style === 'dual-arrow') {
            // Vertical double arrow (up and down)
            const headWidth = length * 0.8;
            const headHeight = length * 0.4;
            const shaftWidth = thickness * 2;
            const shaftHeight = gap;

            this.ctx.lineJoin = 'miter';

            // Draw outline for top arrow
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

                // Top arrow
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - shaftHeight - headHeight);
                this.ctx.lineTo(centerX + headWidth / 2, centerY - shaftHeight);
                this.ctx.lineTo(centerX + shaftWidth / 2, centerY - shaftHeight);
                this.ctx.lineTo(centerX + shaftWidth / 2, centerY);
                this.ctx.lineTo(centerX - shaftWidth / 2, centerY);
                this.ctx.lineTo(centerX - shaftWidth / 2, centerY - shaftHeight);
                this.ctx.lineTo(centerX - headWidth / 2, centerY - shaftHeight);
                this.ctx.closePath();
                this.ctx.stroke();

                // Bottom arrow
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY + shaftHeight + headHeight);
                this.ctx.lineTo(centerX + headWidth / 2, centerY + shaftHeight);
                this.ctx.lineTo(centerX + shaftWidth / 2, centerY + shaftHeight);
                this.ctx.lineTo(centerX + shaftWidth / 2, centerY);
                this.ctx.lineTo(centerX - shaftWidth / 2, centerY);
                this.ctx.lineTo(centerX - shaftWidth / 2, centerY + shaftHeight);
                this.ctx.lineTo(centerX - headWidth / 2, centerY + shaftHeight);
                this.ctx.closePath();
                this.ctx.stroke();
            }

            // Draw main arrows
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

            // Top arrow
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY - shaftHeight - headHeight);
            this.ctx.lineTo(centerX + headWidth / 2, centerY - shaftHeight);
            this.ctx.lineTo(centerX + shaftWidth / 2, centerY - shaftHeight);
            this.ctx.lineTo(centerX + shaftWidth / 2, centerY);
            this.ctx.lineTo(centerX - shaftWidth / 2, centerY);
            this.ctx.lineTo(centerX - shaftWidth / 2, centerY - shaftHeight);
            this.ctx.lineTo(centerX - headWidth / 2, centerY - shaftHeight);
            this.ctx.closePath();
            this.ctx.stroke();

            // Bottom arrow
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY + shaftHeight + headHeight);
            this.ctx.lineTo(centerX + headWidth / 2, centerY + shaftHeight);
            this.ctx.lineTo(centerX + shaftWidth / 2, centerY + shaftHeight);
            this.ctx.lineTo(centerX + shaftWidth / 2, centerY);
            this.ctx.lineTo(centerX - shaftWidth / 2, centerY);
            this.ctx.lineTo(centerX - shaftWidth / 2, centerY + shaftHeight);
            this.ctx.lineTo(centerX - headWidth / 2, centerY + shaftHeight);
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (style === 'angled-brackets') {
            // Angled brackets like < > for shotguns
            const bracketWidth = length;
            const bracketHeight = length * 1.5;
            const spacing = gap;

            this.ctx.lineCap = 'butt';
            this.ctx.lineJoin = 'miter';

            // Draw outline
            if (outlineThickness > 0) {
                this.ctx.globalAlpha = outlineOpacity / 100;
                this.ctx.strokeStyle = outlineColor;
                this.ctx.lineWidth = thickness + outlineThickness * 2;

                // Left bracket <
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - spacing, centerY - bracketHeight / 2);
                this.ctx.lineTo(centerX - spacing - bracketWidth, centerY);
                this.ctx.lineTo(centerX - spacing, centerY + bracketHeight / 2);
                this.ctx.stroke();

                // Right bracket >
                this.ctx.beginPath();
                this.ctx.moveTo(centerX + spacing, centerY - bracketHeight / 2);
                this.ctx.lineTo(centerX + spacing + bracketWidth, centerY);
                this.ctx.lineTo(centerX + spacing, centerY + bracketHeight / 2);
                this.ctx.stroke();
            }

            // Draw main brackets
            this.ctx.globalAlpha = opacity / 100;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = thickness;

            // Left bracket <
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - spacing, centerY - bracketHeight / 2);
            this.ctx.lineTo(centerX - spacing - bracketWidth, centerY);
            this.ctx.lineTo(centerX - spacing, centerY + bracketHeight / 2);
            this.ctx.stroke();

            // Right bracket >
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + spacing, centerY - bracketHeight / 2);
            this.ctx.lineTo(centerX + spacing + bracketWidth, centerY);
            this.ctx.lineTo(centerX + spacing, centerY + bracketHeight / 2);
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
        const { style, size, outlineThickness, color, opacity, outlineColor, outlineOpacity, customImage, pixelData, customOffsetX, customOffsetY, customScale, customScaleX, customScaleY } = this.settings.dot;

        if (style === 'custom' && customImage) {
            this.ctx.save();
            this.ctx.globalAlpha = opacity / 100;

            // Calculate final size with scale and aspect ratio adjustments
            const baseWidth = customScale * (customScaleX / 100);
            const baseHeight = customScale * (customScaleY / 100);

            // Apply position offset
            const x = centerX + customOffsetX - baseWidth / 2;
            const y = centerY + customOffsetY - baseHeight / 2;

            this.ctx.drawImage(customImage, x, y, baseWidth, baseHeight);
            this.ctx.restore();
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
        document.getElementById('crosshairRotation').value = this.settings.crosshair.rotation;
        document.getElementById('rotationValue').textContent = this.settings.crosshair.rotation;
        document.getElementById('crosshairOutlineThickness').value = this.settings.crosshair.outlineThickness;
        document.getElementById('outlineThicknessValue').textContent = this.settings.crosshair.outlineThickness;
        document.getElementById('crosshairColor').value = this.settings.crosshair.color;
        document.getElementById('crosshairOpacity').value = this.settings.crosshair.opacity;
        document.getElementById('opacityValue').textContent = this.settings.crosshair.opacity;
        document.getElementById('crosshairOutlineColor').value = this.settings.crosshair.outlineColor;
        document.getElementById('crosshairOutlineOpacity').value = this.settings.crosshair.outlineOpacity;
        document.getElementById('outlineOpacityValue').textContent = this.settings.crosshair.outlineOpacity;

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

        // Update background selection
        const backgroundRadio = document.querySelector(`input[name="background"][value="${this.settings.background}"]`);
        if (backgroundRadio) {
            backgroundRadio.checked = true;
        }
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
                outlineOpacity: 100,
                rotation: 0,
                customImage: null,
                pixelData: null,
                customOffsetX: 0,
                customOffsetY: 0,
                customScale: 50,
                customScaleX: 100,
                customScaleY: 100
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
                pixelData: null,
                customOffsetX: 0,
                customOffsetY: 0,
                customScale: 50,
                customScaleX: 100,
                customScaleY: 100
            },
            overlay: {
                enabled: false,
                image: null,
                size: 100,
                opacity: 50
            },
            showGrid: false,
            background: 'dark'
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

        // Generate a short 6-character hash from the encoded settings
        const shortHash = this.generateShortHash(encodedSettings);

        // Create clean URL with hash fragment: #abc123_encodedData
        const shareUrl = `${window.location.origin}${window.location.pathname}#${shortHash}_${encodedSettings}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share URL copied to clipboard!\n\nUnique ID: ' + shortHash);
        }).catch(() => {
            prompt('Copy this URL to share your crosshair:', shareUrl);
        });
    }

    generateShortHash(str) {
        // Simple hash function to create a 6-character ID
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Convert to base36 and take first 6 characters
        const hashStr = Math.abs(hash).toString(36).toUpperCase();
        return hashStr.substring(0, 6).padEnd(6, '0');
    }

    importCrosshair() {
        const input = document.getElementById('importInput').value.trim();

        if (!input) {
            alert('Please paste a crosshair ID or URL');
            return;
        }

        try {
            let hashData = input;

            // If it's a full URL, extract the hash fragment
            if (input.includes('http://') || input.includes('https://') || input.includes('#')) {
                const hashIndex = input.indexOf('#');
                if (hashIndex !== -1) {
                    hashData = input.substring(hashIndex + 1);
                }
            }

            // Format is: shortID_encodedData
            const underscoreIndex = hashData.indexOf('_');
            if (underscoreIndex === -1) {
                alert('Invalid crosshair ID format. Expected format: 7K9MX2_eyJjcm9...');
                return;
            }

            const shortId = hashData.substring(0, underscoreIndex);
            const encodedSettings = hashData.substring(underscoreIndex + 1);

            // Decode and load settings
            const settings = JSON.parse(atob(encodedSettings));
            this.settings = settings;
            this.updateUIFromSettings();
            this.draw();

            // Clear input and show success
            document.getElementById('importInput').value = '';
            alert(`Successfully imported crosshair with ID: ${shortId}`);

        } catch (e) {
            console.error('Failed to import crosshair:', e);
            alert('Failed to import crosshair. Please check the ID/URL and try again.');
        }
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

    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.draw();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new CrosshairCreator();

    // Load shared crosshair from URL hash fragment
    const hash = window.location.hash.substring(1); // Remove the # character
    if (hash) {
        try {
            // Format is: shortID_encodedData
            const underscoreIndex = hash.indexOf('_');
            if (underscoreIndex !== -1) {
                const shortId = hash.substring(0, underscoreIndex);
                const encodedSettings = hash.substring(underscoreIndex + 1);

                const settings = JSON.parse(atob(encodedSettings));
                app.settings = settings;
                app.updateUIFromSettings();
                app.draw();

                console.log(`Loaded crosshair with ID: ${shortId}`);
            }
        } catch (e) {
            console.error('Failed to load shared crosshair:', e);
        }
    }

    // Also support old query parameter format for backwards compatibility
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCrosshair = urlParams.get('crosshair');
    if (sharedCrosshair && !hash) {
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
