import { Component, Inject } from "@angular/core";
import { DialogAddChannelAddMemberComponent } from "../dialog-add-channel-add-member/dialog-add-channel-add-member.component";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";

@Component({
    selector: "app-bottomsheet-add-member-new-channel",
    standalone: true,
    templateUrl: "./bottomsheet-add-member-new-channel.component.html",
    styleUrl: "./bottomsheet-add-member-new-channel.component.scss",
    imports: [DialogAddChannelAddMemberComponent],
})
export class BottomsheetAddMemberNewChannelComponent {
    constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA)
        public data: { channelName: string; channelDescription: string; },
        private bottomSheetRef: MatBottomSheetRef<BottomsheetAddMemberNewChannelComponent>,
    ) { }


    closeSheet(): void {
        this.bottomSheetRef.dismiss();
    }
}
