import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  const data: ConfirmDialogData = {
    title: 'Delete item',
    message: 'Are you sure?',
    confirmLabel: 'Remove',
  };

  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, NoopAnimationsModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: data }],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render title, message, and confirm label', () => {
    const title = fixture.debugElement.query(By.css('h2')).nativeElement as HTMLElement;
    const message = fixture.debugElement.query(By.css('p')).nativeElement as HTMLElement;
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(title.textContent).toContain('Delete item');
    expect(message.textContent).toContain('Are you sure?');
    expect(buttons[1].nativeElement.textContent).toContain('Remove');
  });

  it('should default confirm label to Delete when omitted', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Confirm', message: 'Proceed?' } satisfies ConfirmDialogData,
        },
      ],
    }).compileComponents();

    const localFixture = TestBed.createComponent(ConfirmDialogComponent);
    localFixture.detectChanges();

    const buttons = localFixture.debugElement.queryAll(By.css('button'));
    expect(buttons[1].nativeElement.textContent).toContain('Delete');
  });
});
