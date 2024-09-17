import { TestBed } from "@angular/core/testing";

import { DirectmessageService } from "./directmessage.service";

describe("DirectmessageService", () => {
    let service: DirectmessageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DirectmessageService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
