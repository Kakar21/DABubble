import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BottomsheetAddMemberNewChannelComponent } from "./bottomsheet-add-member-new-channel.component";

describe("BottomsheetAddMemberNewChannelComponent", () => {
    let component: BottomsheetAddMemberNewChannelComponent;
    let fixture: ComponentFixture<BottomsheetAddMemberNewChannelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BottomsheetAddMemberNewChannelComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(
            BottomsheetAddMemberNewChannelComponent,
        );
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
