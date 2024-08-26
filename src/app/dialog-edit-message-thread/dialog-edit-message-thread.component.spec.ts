import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditMessageThreadComponent } from './dialog-edit-message-thread.component';

describe('DialogEditMessageThreadComponent', () => {
  let component: DialogEditMessageThreadComponent;
  let fixture: ComponentFixture<DialogEditMessageThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogEditMessageThreadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogEditMessageThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
