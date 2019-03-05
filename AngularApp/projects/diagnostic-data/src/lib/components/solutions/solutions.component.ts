import { Component, OnInit, Input } from '@angular/core';
import { Solution } from '../solution/solution.component';

@Component({
  selector: 'solutions',
  templateUrl: './solutions.component.html',
  styleUrls: ['./solutions.component.scss']
})
export class SolutionsComponent implements OnInit {

  @Input() solutions: Solution[];
  selected: Solution;

  constructor() { }

  ngOnInit() {
    this.selected = this.solutions[0];
  }

}
