import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditMessageChannelComponent } from './dialog-edit-message-channel.component';

describe('DialogEditMessageChannelComponent', () => {
  let component: DialogEditMessageChannelComponent;
  let fixture: ComponentFixture<DialogEditMessageChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogEditMessageChannelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogEditMessageChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
