import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NationalizeResponse } from '../../models/nationalize.model';
import { NationalizeService } from './nationalize.service';

describe('NationalizeService', () => {
  let service: NationalizeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NationalizeService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(NationalizeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return country predictions for a valid surname', () => {
    const response: NationalizeResponse = {
      count: 2,
      name: 'Molefe',
      country: [
        { country_id: 'ZA', probability: 0.82 },
        { country_id: 'BW', probability: 0.11 },
      ],
    };

    service.predictNationality('Molefe').subscribe((predictions) => {
      expect(predictions).toEqual(response.country);
    });

    const request = httpMock.expectOne(
      (req) => req.url === 'https://api.nationalize.io' && req.params.get('name') === 'Molefe',
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('should trim whitespace from the surname before requesting', () => {
    service.predictNationality('  Molefe  ').subscribe((predictions) => {
      expect(predictions).toEqual([]);
    });

    const request = httpMock.expectOne(
      (req) => req.url === 'https://api.nationalize.io' && req.params.get('name') === 'Molefe',
    );
    request.flush({ count: 0, name: 'Molefe', country: [] });
  });

  it('should return an empty array when the API omits country', () => {
    service.predictNationality('Unknown').subscribe((predictions) => {
      expect(predictions).toEqual([]);
    });

    const request = httpMock.expectOne(
      (req) => req.url === 'https://api.nationalize.io' && req.params.get('name') === 'Unknown',
    );
    request.flush({ count: 0, name: 'Unknown', country: undefined });
  });

  it('should error when the surname is empty', () => {
    let errorMessage = '';

    service.predictNationality('   ').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    httpMock.expectNone('https://api.nationalize.io');
    expect(errorMessage).toBe('A name is required to predict nationality.');
  });

  it('should map a 429 response to a rate-limit message', () => {
    let errorMessage = '';

    service.predictNationality('Molefe').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpMock.expectOne('https://api.nationalize.io?name=Molefe');
    request.flush(null, { status: 429, statusText: 'Too Many Requests' });

    expect(errorMessage).toBe(
      'Nationality lookup is rate limited. Please wait a moment and try again.',
    );
  });

  it('should map a connection failure to a reachability message', () => {
    let errorMessage = '';

    service.predictNationality('Molefe').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpMock.expectOne('https://api.nationalize.io?name=Molefe');
    request.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(errorMessage).toBe('Unable to reach the nationality service. Check your connection.');
  });

  it('should use the API error message when available', () => {
    let errorMessage = '';

    service.predictNationality('Molefe').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpMock.expectOne('https://api.nationalize.io?name=Molefe');
    request.flush({ error: 'Invalid name parameter' }, { status: 400, statusText: 'Bad Request' });

    expect(errorMessage).toBe('Invalid name parameter');
  });

  it('should fall back to a generic message for unknown HTTP failures', () => {
    let errorMessage = '';

    service.predictNationality('Molefe').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpMock.expectOne('https://api.nationalize.io?name=Molefe');
    request.flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(errorMessage).toBe('Http failure response for https://api.nationalize.io?name=Molefe: 500 Internal Server Error');
  });
});
