import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'version-message',
  templateUrl: './version-message.component.html',
  styleUrls: ['./version-message.component.css']
})
export class VersionMessageComponent {

  @Input() newVersionEnabled: boolean;

  @Output() newVersionEnabledChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  closed: boolean = false;

  constructor() { }

  toggleVersion() {
    this.newVersionEnabledChange.emit(!this.newVersionEnabled);
    this.close();
  }

  close() {
    this.closed = true;
  }

}
