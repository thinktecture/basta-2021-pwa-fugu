import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { PaintService } from './paint.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  // EX #1
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  context: CanvasRenderingContext2D;

  // EX #11
  private fileOptions = {
    types: [{
      description: 'PNG files',
      accept: { 'image/png': ['.png'] },
    }, {
      description: 'JPG files',
      accept: { 'image/jpeg': ['.jpg'] },
    }],
  }


  previousPoint: { x: number, y: number } | null = null;

  // EX #17
  isOpenDisabled = !('showOpenFilePicker' in window);
  isCopyDisabled = !('clipboard' in navigator && 'write' in navigator.clipboard);
  isPasteDisabled = !('clipboard' in navigator && 'read' in navigator.clipboard);
  isShareDisabled = !('canShare' in navigator);

  constructor(private paintService: PaintService, @Inject(DOCUMENT) private document: Document) {
  }

  async ngAfterViewInit(): Promise<any> {
    // EX #2
    const canvas = this.canvas.nativeElement;
    const ctx = this.context = canvas.getContext('2d', {
      desynchronized: true,
    });

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';

    // EX #16
    if('launchQueue' in window){
      (window as any).launchQueue.setConsumer(async params => {
        const [handle] = params.files;
        if(handle) {
          const file = await handle.getFile();
          const image = await this.paintService.getImage(file);
          ctx.drawImage(image, 0, 0);
        }
      });
    }
  }

  onPointerDown(event: PointerEvent): void {
    this.previousPoint = { x: ~~event.offsetX, y: ~~event.offsetY };
  }

  onPointerMove(event: PointerEvent): void {
    if (this.previousPoint) {
      const currentPoint = { x: ~~event.offsetX, y: ~~event.offsetY };
      const points = this.paintService.bresenhamLine(this.previousPoint.x,
        this.previousPoint.y, currentPoint.x, currentPoint.y);

      for (const { x, y } of points) {
        this.context.fillRect(x, y, 2, 2);
      }

      this.previousPoint = currentPoint;
    }
  }

  onPointerUp(): void {
    this.previousPoint = null;
  }

  colorChange($event) {
    // EX #6
    this.context.fillStyle = $event.target.value;
  }

  async open(): Promise<void> {
    // EX #12
    const [handle] = await window.showOpenFilePicker(this.fileOptions);
    const file = await handle.getFile();
    const image = await this.paintService.getImage(file);
    this.context.drawImage(image, 0,0 );
  }

  async save(): Promise<void> {
    const blob = await this.paintService.toBlob(this.canvas.nativeElement);
    // EX #11
    if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker(this.fileOptions);
      const writeable = await handle.createWritable();
      await writeable.write(blob);
      await writeable.close();
    } else {
      // EX #18
      const url = URL.createObjectURL(blob);
      const aElm = document.createElement('a');
      aElm.href = url;
      aElm.download = 'paint.png';
      aElm.click();
      URL.revokeObjectURL(url);
    }
  }

  async copy(): Promise<void> {
    // EX #13
    const blob = await this.paintService.toBlob(this.canvas.nativeElement);
    await navigator.clipboard.write([
      new ClipboardItem({[blob.type]: blob})
    ]);
  }

  async paste(): Promise<void> {
    // EX #14
    const clipboardItems = await navigator.clipboard.read();
    for(let clipboardItem of clipboardItems) {
      for(let itemType of clipboardItem.types){
        if(itemType === 'image/png') {
          const blob = await clipboardItem.getType(itemType);
          const image = await this.paintService.getImage(blob);
          this.context.drawImage(image, 0, 0);
        }
      }
    }

  }

  async share(): Promise<any> {
    // EX #15
    const blob = await this.paintService.toBlob(this.canvas.nativeElement);
    const file = new File([blob], 'paint.png', { type: 'image/png'});
    const items = { files: [file], title: 'paint.png'}
    if(navigator.canShare(items)) {
      await navigator.share(items);
    }
  }
}
