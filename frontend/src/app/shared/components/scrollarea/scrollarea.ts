import { Component, Input } from '@angular/core';

@Component({
  selector: 'p-scrollarea-content',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ScrollAreaContent {}

@Component({
  selector: 'p-scrollarea-handle',
  standalone: true,
  template: ''
})
export class ScrollAreaHandle {}

@Component({
  selector: 'p-scrollarea-scrollbar',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ScrollAreaScrollbar {
  @Input() orientation: string = 'vertical';
}

@Component({
  selector: 'p-scrollarea',
  standalone: true,
  templateUrl: './scrollarea.html',
  styleUrl: './scrollarea.scss'
})
export class ScrollArea {
  @Input() style: string | Record<string, string> | null = null;
}
