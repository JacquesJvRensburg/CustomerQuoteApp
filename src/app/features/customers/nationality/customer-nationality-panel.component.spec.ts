import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { CustomerActions } from '../store/customer.actions';
import {
  selectCountries,
  selectCountriesError,
  selectDraftNationalityCode,
  selectPredictions,
  selectPredictionsError,
  selectPredictionsLoading,
} from '../store/customer.selectors';
import { CustomerNationalityPanelComponent } from './customer-nationality-panel.component';

describe('CustomerNationalityPanelComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerNationalityPanelComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectDraftNationalityCode, value: null },
            { selector: selectPredictions, value: [] },
            { selector: selectPredictionsLoading, value: false },
            { selector: selectPredictionsError, value: null },
            { selector: selectCountriesError, value: null },
            { selector: selectCountries, value: [] },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('should create and request countries on init', () => {
    const fixture = TestBed.createComponent(CustomerNationalityPanelComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(CustomerActions.loadCountries());
  });

  it('should dispatch nationality selection', () => {
    const fixture = TestBed.createComponent(CustomerNationalityPanelComponent);
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    fixture.componentInstance.selectPrediction('za');

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.setDraftNationality({ nationalityCode: 'ZA' }),
    );
  });

  it('should re-predict nationality when clearing a selection with a surname', () => {
    const fixture = TestBed.createComponent(CustomerNationalityPanelComponent);
    fixture.componentRef.setInput('surname', 'Molefe');
    fixture.componentRef.setInput('preserveSavedDraft', true);
    store.overrideSelector(selectDraftNationalityCode, 'ZA');
    store.refreshState();
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    fixture.componentInstance.clearSelection();

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.setDraftNationality({ nationalityCode: null }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.predictNationality({ surname: 'Molefe' }),
    );
    expect(fixture.componentInstance.hasQueried()).toBeTrue();
  });

  it('should clear predictions when clearing a selection without a surname', () => {
    const fixture = TestBed.createComponent(CustomerNationalityPanelComponent);
    fixture.componentRef.setInput('surname', '   ');
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    fixture.componentInstance.clearSelection();

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.setDraftNationality({ nationalityCode: null }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(CustomerActions.clearNationalityPredictions());
    expect(fixture.componentInstance.hasQueried()).toBeFalse();
  });
});
