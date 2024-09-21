import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DialogEditProfileEditProfileComponent } from "./dialog-edit-profile-edit-profile.component";

describe("DialogEditProfileEditProfileComponent", () => {
    let component: DialogEditProfileEditProfileComponent;
    let fixture: ComponentFixture<DialogEditProfileEditProfileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DialogEditProfileEditProfileComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(
            DialogEditProfileEditProfileComponent,
        );
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
