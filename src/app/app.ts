import { Component, } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { CameraDistanceCoverageService } from './camera-distance-coverage-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(public service: CameraDistanceCoverageService) {

    this.service.setRequirements(
      { min: 0, max: 10 },
      { min: 0, max: 10 }
    );

    this.service.setCameras([
      { distance: { min: 0, max: 6 }, light: { min: 0, max: 5 } },
      { distance: { min: 0, max: 6 }, light: { min: 5, max: 10 } }
    ]);
    
    setTimeout(() => {
      this.service.addCamera({
        distance: { min: 6, max: 10 },
        light: { min: 0, max: 10 }
      });
    }, 2000);
  }

}
