import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DialogAddMemberToChnlComponent } from "./dialog-add-member-to-chnl.component";

describe("DialogAddMemberToChnlComponent", () => {
    let component: DialogAddMemberToChnlComponent;
    let fixture: ComponentFixture<DialogAddMemberToChnlComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DialogAddMemberToChnlComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogAddMemberToChnlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
