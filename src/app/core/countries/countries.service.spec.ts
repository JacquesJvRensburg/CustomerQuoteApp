import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Country } from '../../models/country.model';
import { CountriesService } from './countries.service';

describe('CountriesService', () => {
  let service: CountriesService;
  let httpMock: HttpTestingController;

  const unsortedCountries: Country[] = [
    {
      name: 'South Africa',
      flag: '🇿🇦',
      flags: { png: 'https://example.com/za.png', svg: 'https://example.com/za.svg' },
      alpha2Code: 'ZA',
    },
    {
      name: 'Germany',
      flag: '🇩🇪',
      flags: { png: 'https://example.com/de.png', svg: 'https://example.com/de.svg' },
      alpha2Code: 'DE',
    },
    {
      name: 'Botswana',
      flag: '🇧🇼',
      flags: { png: 'https://example.com/bw.png', svg: 'https://example.com/bw.svg' },
      alpha2Code: 'BW',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CountriesService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CountriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return countries sorted alphabetically by name', () => {
    service.getCountries().subscribe((countries) => {
      expect(countries.map((country) => country.name)).toEqual([
        'Botswana',
        'Germany',
        'South Africa',
      ]);
    });

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'https://countries.dev/countries' &&
        req.params.get('fields') === 'name,flag,flags,alpha2Code',
    );
    expect(request.request.method).toBe('GET');
    request.flush(unsortedCountries);
  });

  it('should cache the country list and not re-request on subsequent subscriptions', () => {
    const firstResults: Country[][] = [];
    const secondResults: Country[][] = [];

    service.getCountries().subscribe((countries) => firstResults.push(countries));
    service.getCountries().subscribe((countries) => secondResults.push(countries));

    const request = httpMock.expectOne('https://countries.dev/countries?fields=name,flag,flags,alpha2Code');
    request.flush(unsortedCountries);

    expect(firstResults[0]).toEqual(secondResults[0]);
    httpMock.expectNone('https://countries.dev/countries?fields=name,flag,flags,alpha2Code');
  });

  it('should map a connection failure to a reachability message', () => {
    let errorMessage = '';

    service.getCountries().subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpMock.expectOne('https://countries.dev/countries?fields=name,flag,flags,alpha2Code');
    request.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(errorMessage).toBe('Unable to reach the countries service. Check your connection.');
  });

  it('should map HTTP failures to an error message', () => {
    let errorMessage = '';

    service.getCountries().subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpMock.expectOne('https://countries.dev/countries?fields=name,flag,flags,alpha2Code');
    request.flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(errorMessage).toBe(
      'Http failure response for https://countries.dev/countries?fields=name,flag,flags,alpha2Code: 503 Service Unavailable',
    );
  });

  it('should cache successful responses and allow retry after failure', () => {
    let errorMessage = '';

    service.getCountries().subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const failed = httpMock.expectOne('https://countries.dev/countries?fields=name,flag,flags,alpha2Code');
    failed.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    expect(errorMessage).toBe('Unable to reach the countries service. Check your connection.');

    const retryResults: Country[][] = [];
    service.getCountries().subscribe((countries) => retryResults.push(countries));

    const retry = httpMock.expectOne('https://countries.dev/countries?fields=name,flag,flags,alpha2Code');
    retry.flush(unsortedCountries);

    expect(retryResults[0].map((country) => country.name)).toEqual([
      'Botswana',
      'Germany',
      'South Africa',
    ]);
  });
});
