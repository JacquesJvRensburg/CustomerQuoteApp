import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HipolabsUniversity } from '../../models/university.model';
import { UniversitiesService } from './universities.service';

describe('UniversitiesService', () => {
  let service: UniversitiesService;
  let httpMock: HttpTestingController;

  const apiResults: HipolabsUniversity[] = [
    {
      name: 'University of Cape Town',
      web_pages: ['http://www.uct.ac.za/'],
      country: 'South Africa',
    },
    {
      name: 'Cape Peninsula University of Technology',
      web_pages: ['http://www.cput.ac.za/'],
      country: 'South Africa',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UniversitiesService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UniversitiesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should search universities by country name and query', () => {
    service.searchUniversities('South Africa', 'cape').subscribe((results) => {
      expect(results).toEqual([
        { name: 'University of Cape Town', website: 'http://www.uct.ac.za/' },
        { name: 'Cape Peninsula University of Technology', website: 'http://www.cput.ac.za/' },
      ]);
    });

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'http://universities.hipolabs.com/search' &&
        req.params.get('country') === 'South Africa' &&
        req.params.get('name') === 'cape',
    );
    expect(request.request.method).toBe('GET');
    request.flush(apiResults);
  });

  it('should map countries.dev US name to the hipolabs country filter', () => {
    service.searchUniversities('United States of America', 'harvard').subscribe((results) => {
      expect(results).toEqual([]);
    });

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'http://universities.hipolabs.com/search' &&
        req.params.get('country') === 'United States' &&
        req.params.get('name') === 'harvard',
    );
    expect(request.request.params.get('country')).toBe('United States');
    request.flush([]);
  });

  it('should return an empty array when the API returns no matches', () => {
    service.searchUniversities('South Africa', 'xyz').subscribe((results) => {
      expect(results).toEqual([]);
    });

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'http://universities.hipolabs.com/search' &&
        req.params.get('country') === 'South Africa' &&
        req.params.get('name') === 'xyz',
    );
    request.flush([]);
  });

  it('should error when the country name is empty', () => {
    let errorMessage = '';

    service.searchUniversities('  ', 'cape').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    httpMock.expectNone('http://universities.hipolabs.com/search');
    expect(errorMessage).toBe('A country name is required to search universities.');
  });

  it('should error when the search query is empty', () => {
    let errorMessage = '';

    service.searchUniversities('South Africa', '  ').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    httpMock.expectNone('http://universities.hipolabs.com/search');
    expect(errorMessage).toBe('Enter part of a university name to search.');
  });

  it('should map a connection failure to a reachability message', () => {
    let errorMessage = '';

    service.searchUniversities('South Africa', 'cape').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    const request = httpMock.expectOne('http://universities.hipolabs.com/search?country=South%20Africa&name=cape');
    request.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(errorMessage).toBe(
      'Unable to reach the university search service. Check your connection.',
    );
  });
});
