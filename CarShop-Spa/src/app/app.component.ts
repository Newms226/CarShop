import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'CarSPA';
  selected = 'cars'

  update(selected: string) { this.selected = selected; }
}
