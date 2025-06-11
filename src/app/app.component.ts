import { Component } from '@angular/core';
import { AudioRecorderComponent } from './components/audio-recorder/audio-recorder.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AudioRecorderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'voice-notes-app';
}
