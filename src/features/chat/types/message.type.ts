export interface IMessage {
    id: string;
    content: string;
    sender: string;
    timestamp?: Date;
    isEdited?: boolean;
    isDeleted?: boolean;
}