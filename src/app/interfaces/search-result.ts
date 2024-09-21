export interface SearchResult {
    type: "user" | "channel";
    id: string;
    name: string;
    avatar: string;
    message: string;
    padNumber: string;
    userID?: string;
    channelName?: string;
    channelID?: string;
}
