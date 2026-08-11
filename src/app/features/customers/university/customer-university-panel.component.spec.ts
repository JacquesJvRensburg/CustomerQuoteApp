import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { CustomerActions } from '../store/customer.actions';
import {
  selectCountries,
  selectCountriesError,
  selectCountriesLoading,
  selectDraftNationalityCode,
  selectDraftUniversity,
  selectUniversitySearchError,
  selectUniversitySearchLoading,
  selectUniversitySearchResults,
} from '../store/customer.selectors';
import { CustomerUniversityPanelComponent } from './customer-university-panel.component';

describe('CustomerUniversityPanelComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerUniversityPanelComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectDraftNationalityCode, value: 'ZA' },
            { selector: selectDraftUniversity, value: null },
            { selector: selectUniversitySearchResults, value: [] },
            { selector: selectUniversitySearchLoading, value: false },
            { selector: selectUniversitySearchError, value: null },
            { selector: selectCountriesLoading, value: false },
            { selector: selectCountriesError, value: null },
            {
              selector: selectCountries,
              value: [
                {
                  name: 'South Africa',
                  flag: '',
                  flags: { png: '', svg: '' },
                  alpha2Code: 'ZA',
                },
              ],
            },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
  });

  it('should show the panel when nationality is selected', () => {
    const fixture = TestBed.createComponent(CustomerUniversityPanelComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.showPanel()).toBeTrue();
    expect(fixture.componentInstance.countryName()).toBe('South Africa');
  });

  it('should dispatch university selection', () => {
    const fixture = TestBed.createComponent(CustomerUniversityPanelComponent);
    fixture.detectChanges();
    (store.dispatch as jasmine.Spy).calls.reset();

    const university = { name: 'UCT', website: 'https://uct.ac.za' };
    fixture.componentInstance.selectUniversity(university);

    expect(store.dispatch).toHaveBeenCalledWith(
      CustomerActions.setDraftUniversity({ university }),
    );
  });
});
