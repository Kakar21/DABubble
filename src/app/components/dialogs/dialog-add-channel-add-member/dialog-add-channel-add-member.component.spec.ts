import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DialogAddChannelAddMemberComponent } from "./dialog-add-channel-add-member.component";

describe("DialogAddChannelAddMemberComponent", () => {
    let component: DialogAddChannelAddMemberComponent;
    let fixture: ComponentFixture<DialogAddChannelAddMemberComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DialogAddChannelAddMemberComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogAddChannelAddMemberComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
