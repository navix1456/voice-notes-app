import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.css']
})
export class TaskItemComponent {
  @Input() task: any; // Input for the task object { description: string, completed: boolean }
  @Output() taskChanged = new EventEmitter<any>(); // Emits when task is changed

  isEditing: boolean = false;
  editedDescription: string = '';

  constructor() { }

  ngOnInit(): void {
    this.editedDescription = this.task.description; // Initialize with current task description
  }

  toggleCompleted(): void {
    this.task.completed = !this.task.completed;
    this.taskChanged.emit(this.task); // Emit the updated task
  }

  startEditing(): void {
    this.isEditing = true;
    this.editedDescription = this.task.description; // Ensure it's current
  }

  saveEditing(): void {
    if (this.editedDescription.trim()) {
      this.task.description = this.editedDescription.trim();
      this.isEditing = false;
      this.taskChanged.emit(this.task); // Emit the updated task
    } else {
      // Optionally, handle empty description (e.g., alert user or revert)
      this.editedDescription = this.task.description; // Revert if empty
      this.isEditing = false; // Exit editing mode
    }
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editedDescription = this.task.description; // Revert to original
  }
} 