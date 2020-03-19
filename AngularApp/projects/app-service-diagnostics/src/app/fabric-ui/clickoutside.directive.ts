import { Directive, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';


@Directive({
  selector: '[clickOutside]'
})
export class ClickOutsideDirective {

  constructor(private elementRef:ElementRef) { }

  @Output('clickOutside') clickOutside: EventEmitter<any> = new EventEmitter<any>();

  @HostListener('document:click',['$event.target']) onClick(ele:any) {
    const clickInside = this.elementRef.nativeElement.contains(ele);
    if (!clickInside) {
      this.clickOutside.emit(ele);
    }
  }
}
