import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { FeatureSwitcherComponent } from './feature-switcher.component';

describe('FeatureSwitcherComponent', () => {
  let fixture: ComponentFixture<FeatureSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureSwitcherComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureSwitcherComponent);
    fixture.componentRef.setInput('activeFeature', 'customers');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should mark customers as checked when active', () => {
    const radios = fixture.debugElement.queryAll(By.css('[role="radio"]'));

    expect(radios[0].attributes['aria-checked']).toBe('true');
    expect(radios[1].attributes['aria-checked']).toBe('false');
  });

  it('should mark quotes as checked when active', () => {
    fixture.componentRef.setInput('activeFeature', 'quotes');
    fixture.detectChanges();

    const radios = fixture.debugElement.queryAll(By.css('[role="radio"]'));

    expect(radios[0].attributes['aria-checked']).toBe('false');
    expect(radios[1].attributes['aria-checked']).toBe('true');
  });

  it('should link to customers and quotes routes', () => {
    const links = fixture.debugElement.queryAll(By.css('a'));

    expect(links[0].attributes['href'] ?? links[0].nativeElement.getAttribute('href')).toBe('/');
    expect(links[1].attributes['href'] ?? links[1].nativeElement.getAttribute('href')).toBe(
      '/quotes',
    );
  });
});
