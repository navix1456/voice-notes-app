import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-recorder.html',
  styleUrls: ['./audio-recorder.css']
})
export class AudioRecorderComponent implements OnInit {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  isRecording = false;
  recordingTime = '00:00';
  private timerInterval: any;

  audioBlob: Blob | null = null;
  transcription: string = '';
  isTranscribing: boolean = false;
  error: string = '';

  constructor(private ngZone: NgZone) { }

  ngOnInit(): void { }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.audioBlob = null;
      this.transcription = '';
      this.error = '';
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.error = 'Microphone access denied or not available.';
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.stopTimer();

      this.mediaRecorder.onstop = () => {
        this.ngZone.run(() => {
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        });
      };
    }
  }

  async transcribeAudio() {
    if (!this.audioBlob) return;
    this.isTranscribing = true;
    this.transcription = '';
    this.error = '';

    const formData = new FormData();
    formData.append('audio', this.audioBlob, 'recording.wav');

    try {
      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text) {
        this.transcription = data.text;
      } else {
        this.error = data.error || 'Transcription failed';
      }
    } catch (err) {
      this.error = 'Error connecting to backend';
    } finally {
      this.isTranscribing = false;
    }
  }

  private startTimer() {
    let seconds = 0;
    this.timerInterval = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      this.recordingTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  private stopTimer() {
    clearInterval(this.timerInterval);
    this.recordingTime = '00:00';
  }
}
