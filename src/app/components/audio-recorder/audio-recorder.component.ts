import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItemComponent } from '../task-item/task-item.component';

@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  imports: [CommonModule, TaskItemComponent],
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

  tasks: any[] = [];
  isConvertingToTasks: boolean = false;

  constructor(private ngZone: NgZone) { }

  ngOnInit(): void {
    this.loadTasksFromLocalStorage(); // Load tasks when component initializes
  }

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

  async convertToTasks() {
    if (!this.transcription) {
      this.error = 'No transcription available to convert to tasks.';
      return;
    }

    this.isConvertingToTasks = true;
    this.error = '';

    try {
      const response = await fetch('http://localhost:5000/convert-to-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: this.transcription }),
      });

      const data = await response.json();

      if (response.ok) {
        this.tasks = [...this.tasks, ...data.tasks];
        this.saveTasksToLocalStorage();
      } else {
        this.error = data.error || 'Failed to convert to tasks.';
      }
    } catch (err) {
      this.error = 'Error connecting to backend for task conversion.';
      console.error('Error converting to tasks:', err);
    } finally {
      this.isConvertingToTasks = false;
    }
  }

  onTaskChanged(index: number, updatedTask: any): void {
    if (index >= 0 && index < this.tasks.length) {
      this.tasks[index] = updatedTask;
      this.saveTasksToLocalStorage(); // Save tasks after individual task change
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

  clearAllTasks(): void {
    this.tasks = [];
    localStorage.removeItem('voiceNotesTasks');
  }

  private loadTasksFromLocalStorage(): void {
    try {
      const storedTasks = localStorage.getItem('voiceNotesTasks');
      if (storedTasks) {
        this.tasks = JSON.parse(storedTasks);
      }
    } catch (e) {
      console.error('Error loading tasks from local storage:', e);
      // Optionally, clear invalid data if parsing fails
      localStorage.removeItem('voiceNotesTasks');
      this.tasks = [];
    }
  }

  private saveTasksToLocalStorage(): void {
    try {
      localStorage.setItem('voiceNotesTasks', JSON.stringify(this.tasks));
    } catch (e) {
      console.error('Error saving tasks to local storage:', e);
    }
  }
}
