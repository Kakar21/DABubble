import { TestBed } from '@angular/core/testing';

import { CommonFnService } from './common-fn.service';

describe('CommonFnService', () => {
  let service: CommonFnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonFnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
