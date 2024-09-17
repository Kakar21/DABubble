import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BottomsheetProfileMenuComponent } from "./bottomsheet-profile-menu.component";

describe("BottomsheetProfileMenuComponent", () => {
    let component: BottomsheetProfileMenuComponent;
    let fixture: ComponentFixture<BottomsheetProfileMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BottomsheetProfileMenuComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(BottomsheetProfileMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
