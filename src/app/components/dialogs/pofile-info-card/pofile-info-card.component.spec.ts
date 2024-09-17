import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PofileInfoCardComponent } from "./pofile-info-card.component";

describe("PofileInfoCardComponent", () => {
    let component: PofileInfoCardComponent;
    let fixture: ComponentFixture<PofileInfoCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PofileInfoCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PofileInfoCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
