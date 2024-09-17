import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DialogShowChannelMemberComponent } from "./dialog-show-channel-member.component";

describe("DialogShowChannelMemberComponent", () => {
    let component: DialogShowChannelMemberComponent;
    let fixture: ComponentFixture<DialogShowChannelMemberComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DialogShowChannelMemberComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DialogShowChannelMemberComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
