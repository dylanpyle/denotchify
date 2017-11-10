"use strict";
function ensureEl(el) {
    if (!el) {
        throw new Error('Missing element');
    }
    return el;
}
var CANVAS_WIDTH = 1125;
var CANVAS_HEIGHT = 2436;
var UploadTool = /** @class */ (function () {
    function UploadTool(el) {
        var _this = this;
        this.onFileChange = function () {
            var file = _this.fileInput.files && _this.fileInput.files[0];
            if (!file) {
                return;
            }
            _this.fileCallbacks.forEach(function (callback) {
                callback(file);
            });
        };
        this.el = el;
        this.fileCallbacks = [];
        this.fileInput = ensureEl(el.querySelector('.denotch-file'));
        this.fileInput.addEventListener('change', this.onFileChange);
    }
    UploadTool.prototype.addFileChosenListener = function (fn) {
        this.fileCallbacks.push(fn);
    };
    return UploadTool;
}());
var CropTool = /** @class */ (function () {
    function CropTool(el) {
        var _this = this;
        this.onOriginalLoad = function () {
            _this.renderImage();
        };
        this.renderImage = function () {
            var _a = _this.originalImage, height = _a.height, width = _a.width;
            _this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            var dragOffset = _this.getDragOffset();
            var offsetX = _this.isMouseDown ? dragOffset.x : _this.offsetX;
            var offsetY = _this.isMouseDown ? dragOffset.y : _this.offsetY;
            _this.context.drawImage(_this.originalImage, offsetX, offsetY, width * _this.zoomFactor, height * _this.zoomFactor);
            _this.context.drawImage(_this.templateImage, 0, 0);
        };
        this.onZoomChange = function () {
            _this.zoomFactor = parseFloat(_this.zoomControl.value);
            _this.renderImage();
        };
        this.onCanvasMouseDown = function (event) {
            _this.isMouseDown = true;
            _this.mouseDownPosition = { x: event.offsetX, y: event.offsetY };
        };
        this.onCanvasMouseUp = function () {
            _this.isMouseDown = false;
            var _a = _this.getDragOffset(), x = _a.x, y = _a.y;
            _this.offsetX = x;
            _this.offsetY = y;
            _this.mouseDownPosition = { x: 0, y: 0 };
            _this.mouseMovePosition = { x: 0, y: 0 };
            _this.renderImage();
        };
        this.onCanvasMouseMove = function (event) {
            _this.mouseMovePosition = { x: event.offsetX, y: event.offsetY };
            _this.renderImage();
        };
        this.el = el;
        this.canvas = ensureEl(el.querySelector('.denotch-canvas'));
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.canvas.addEventListener('mousedown', this.onCanvasMouseDown);
        this.canvas.addEventListener('mousemove', this.onCanvasMouseMove);
        this.canvas.addEventListener('mouseup', this.onCanvasMouseUp);
        var context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not obtain 2D context');
        }
        this.context = context;
        this.zoomControl = ensureEl(el.querySelector('.denotch-zoom'));
        this.zoomControl.addEventListener('change', this.onZoomChange);
        this.zoomFactor = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.templateImage = new Image();
        this.templateImage.src = '/template.png';
        this.isMouseDown = false;
        this.mouseDownPosition = { x: 0, y: 0 };
        this.mouseMovePosition = { x: 0, y: 0 };
    }
    CropTool.prototype.show = function () {
        this.el.classList.remove('hidden');
    };
    CropTool.prototype.setFile = function (file) {
        this.originalImage = new Image();
        this.originalImage.addEventListener('load', this.onOriginalLoad);
        this.originalImage.src = URL.createObjectURL(file);
    };
    CropTool.prototype.getFinalImage = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.canvas.toBlob(function (blob) { return resolve(blob); }, 'image/png');
        });
    };
    CropTool.prototype.getDragOffset = function () {
        return {
            x: this.offsetX + (this.mouseMovePosition.x - this.mouseDownPosition.x),
            y: this.offsetY + (this.mouseMovePosition.y - this.mouseDownPosition.y)
        };
    };
    return CropTool;
}());
var DownloadTool = /** @class */ (function () {
    function DownloadTool(el) {
        var _this = this;
        this.onDownloadClick = function () {
            _this.clickCallbacks.forEach(function (callback) { return callback(); });
        };
        this.el = el;
        this.buttonEl = ensureEl(el.querySelector('.denotch-download-button'));
        this.buttonEl.addEventListener('click', this.onDownloadClick);
        this.clickCallbacks = [];
    }
    DownloadTool.prototype.addClickListener = function (fn) {
        this.clickCallbacks.push(fn);
    };
    DownloadTool.prototype.show = function () {
        this.el.classList.remove('hidden');
    };
    return DownloadTool;
}());
var Page = /** @class */ (function () {
    function Page(el) {
        var _this = this;
        this.onFileChosen = function (file) {
            _this.cropTool.setFile(file);
            _this.cropTool.show();
            _this.downloadTool.show();
        };
        this.onDownloadClick = function () {
            _this.cropTool.getFinalImage()
                .then(function (image) {
                var url = URL.createObjectURL(image);
                window.location.href = url;
            });
        };
        this.uploadTool = new UploadTool(ensureEl(el.querySelector('.denotch-upload-tool')));
        this.cropTool = new CropTool(ensureEl(el.querySelector('.denotch-crop-tool')));
        this.downloadTool = new DownloadTool(ensureEl(el.querySelector('.denotch-download-tool')));
        this.uploadTool.addFileChosenListener(this.onFileChosen);
        this.downloadTool.addClickListener(this.onDownloadClick);
    }
    return Page;
}());
var page = new Page(document);
//# sourceMappingURL=index.js.map