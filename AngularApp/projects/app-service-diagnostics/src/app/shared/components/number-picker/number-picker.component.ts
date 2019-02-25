import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'number-picker',
  templateUrl: './number-picker.component.html',
  styleUrls: ['./number-picker.component.scss']
})
export class NumberPickerComponent implements OnInit {

  constructor() { }
  
  @Input() value: number = 0;
  @Input() step: number = 1;
  @Input() min: number = 1;
  @Input() max: number = 100;
  @Input() additionalText: string = "";
  @Output() valueChange = new EventEmitter<number>();
  ngOnInit() {
  }

  increment() {
    if (this.value < this.max) {
      this.value = this.value + this.step;
      this.valueChange.emit(this.value);
    }

  }
  decrement() {
    if (this.value > this.min) {
      this.value = this.value - this.step;
      this.valueChange.emit(this.value);
    }

  }

}
