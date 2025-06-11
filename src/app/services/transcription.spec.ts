import { TestBed } from '@angular/core/testing';

import { Transcription } from './transcription';

describe('Transcription', () => {
  let service: Transcription;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Transcription);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
