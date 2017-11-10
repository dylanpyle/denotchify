function ensureEl<ElementType extends Element>(
  el: Element | null
): ElementType {
  if (!el) { throw new Error('Missing element'); }
  return el as ElementType;
}

function triggerDownload(
  file: Blob,
  filename: string = 'wallpaper.png'
): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const CANVAS_WIDTH = 1125;
const CANVAS_HEIGHT = 2436;

type FileCallback = (file: File) => void;

class UploadTool {
  private el: Element;
  private fileCallbacks: FileCallback[];
  private fileInput: HTMLInputElement;

  constructor(el: Element) {
    this.el = el;
    this.fileCallbacks = [];

    this.fileInput = ensureEl(el.querySelector('.denotch-file'));
    this.fileInput.addEventListener('change', this.onFileChange);
  }

  public addFileChosenListener(fn: FileCallback): void {
    this.fileCallbacks.push(fn);
  }

  private onFileChange = (): void => {
    const file = this.fileInput.files && this.fileInput.files[0];
    if (!file) { return; }

    this.fileCallbacks.forEach((callback: FileCallback) => {
      callback(file);
    });
  }
}

interface MousePosition {
  x: number;
  y: number;
}

type ResolveFn = (value: Blob) => void;

class CropTool {
  private el: Element;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement;
  private templateImage: HTMLImageElement;
  private zoomControl: HTMLInputElement;

  private zoomFactor: number;
  private offsetX: number;
  private offsetY: number;

  private isMouseDown: boolean;
  private mouseDownPosition: MousePosition;
  private mouseMovePosition: MousePosition;

  constructor(el: Element) {
    this.el = el;

    this.canvas = ensureEl<HTMLCanvasElement>(el.querySelector('.denotch-canvas'));
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.canvas.addEventListener('mousedown', this.onCanvasMouseDown);
    this.canvas.addEventListener('mousemove', this.onCanvasMouseMove);
    this.canvas.addEventListener('mouseup', this.onCanvasMouseUp);

    const context = this.canvas.getContext('2d');
    if (!context) { throw new Error('Could not obtain 2D context'); }
    this.context = context;

    this.zoomControl = ensureEl(el.querySelector('.denotch-zoom'));
    this.zoomControl.addEventListener('change', this.onZoomChange);

    this.zoomFactor = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.templateImage = new Image();
    this.templateImage.src = 'template.png';

    this.isMouseDown = false;
    this.mouseDownPosition = { x: 0, y: 0 };
    this.mouseMovePosition = { x: 0, y: 0 };
  }

  public show(): void {
    this.el.classList.remove('hidden');
  }

  public setFile(file: File): void {
    this.originalImage = new Image();
    this.originalImage.addEventListener('load', this.onOriginalLoad);
    this.originalImage.src = URL.createObjectURL(file);
  }

  public getFinalImage(): Promise<Blob> {
    return new Promise((resolve: ResolveFn): void => {
      this.canvas.toBlob((blob: Blob) => resolve(blob), 'image/png');
    });
  }

  private onOriginalLoad = (): void => {
    this.renderImage();
  }

  private renderImage = (): void => {
    const { height, width } = this.originalImage;

    this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const dragOffset = this.getDragOffset();

    const offsetX = this.isMouseDown ? dragOffset.x : this.offsetX;
    const offsetY = this.isMouseDown ? dragOffset.y : this.offsetY;

    const initialWidth = (width / height) * CANVAS_HEIGHT;

    this.context.drawImage(
      this.originalImage,
      offsetX,
      offsetY,
      initialWidth * this.zoomFactor,
      CANVAS_HEIGHT * this.zoomFactor
    );

    this.context.drawImage(this.templateImage, 0, 0);
  }

  private getDragOffset(): MousePosition {
    const pxScale = CANVAS_WIDTH / this.canvas.getBoundingClientRect().width;

    return {
      x: this.offsetX + ((this.mouseMovePosition.x - this.mouseDownPosition.x) * pxScale),
      y: this.offsetY + ((this.mouseMovePosition.y - this.mouseDownPosition.y) * pxScale)
    };
  }

  private onZoomChange = (): void => {
    this.zoomFactor = parseFloat(this.zoomControl.value);
    this.renderImage();
  }

  private onCanvasMouseDown = (event: MouseEvent): void => {
    this.isMouseDown = true;
    this.mouseDownPosition = { x: event.offsetX, y: event.offsetY };
  }

  private onCanvasMouseUp = (): void => {
    this.isMouseDown = false;

    const { x, y } = this.getDragOffset();
    this.offsetX = x;
    this.offsetY = y;

    this.mouseDownPosition = { x: 0, y: 0 };
    this.mouseMovePosition = { x: 0, y: 0 };

    this.renderImage();
  }

  private onCanvasMouseMove = (event: MouseEvent): void => {
    this.mouseMovePosition = { x: event.offsetX, y: event.offsetY };
    this.renderImage();
  }
}

type Callback = () => void;

class DownloadTool {
  private el: Element;
  private clickCallbacks: Callback[];
  private buttonEl: HTMLButtonElement;

  constructor(el: Element) {
    this.el = el;
    this.buttonEl = ensureEl(el.querySelector('.denotch-download-button'));
    this.buttonEl.addEventListener('click', this.onDownloadClick);
    this.clickCallbacks = [];
  }

  public addClickListener(fn: Callback): void {
    this.clickCallbacks.push(fn);
  }

  public show(): void {
    this.el.classList.remove('hidden');
  }

  private onDownloadClick = (): void => {
    this.clickCallbacks.forEach((callback: Callback) => callback());
  }
}

class Page {
  private cropTool: CropTool;
  private uploadTool: UploadTool;
  private downloadTool: DownloadTool;

  constructor(el: Document) {
    this.uploadTool = new UploadTool(ensureEl(el.querySelector('.denotch-upload-tool')));
    this.cropTool = new CropTool(ensureEl(el.querySelector('.denotch-crop-tool')));
    this.downloadTool = new DownloadTool(ensureEl(el.querySelector('.denotch-download-tool')));

    this.uploadTool.addFileChosenListener(this.onFileChosen);
    this.downloadTool.addClickListener(this.onDownloadClick);
  }

  private onFileChosen = (file: File): void => {
    this.cropTool.setFile(file);
    this.cropTool.show();
    this.downloadTool.show();
  }

  private onDownloadClick = (): void => {
    this.cropTool.getFinalImage()
      .then((image: Blob) => {
        triggerDownload(image);
      });
  }
}

const page = new Page(document);
