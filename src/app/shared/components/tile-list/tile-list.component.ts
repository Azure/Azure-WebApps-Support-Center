import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'tile-list',
  templateUrl: './tile-list.component.html',
  styleUrls: ['./tile-list.component.css']
})
export class TileListComponent implements OnInit {

  @Input() tiles: Tile[];

  constructor() { }

  ngOnInit() {
  }

}

export class Tile {
  title: string;
  backgroundColor: string;
  action: Function;
}
