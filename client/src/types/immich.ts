export interface ImmichAsset {
    id: string;
    type: 'IMAGE' | 'VIDEO';
    fileCreatedAt: string;
    localDateTime?: string;  // More accurate date for timeline grouping
    originalFileName: string;
    isTrashed: boolean;
    isArchived: boolean;
    isFavorite: boolean;
    duration: string;
    deviceAssetId: string;
    deviceId: string;
    ownerId: string;
    top: number | null;
    left: number | null;
    exifInfo?: {
        exifImageWidth: number;
        exifImageHeight: number;
        fileSizeInByte: number;
    };
    // Thumbnail url needs to be constructed
}

export interface SwipeAction {
    asset: ImmichAsset;
    action: 'KEEP' | 'DELETE';
    timestamp: number;
}

export interface SearchResponse {
    assets: { items: ImmichAsset[] } // Check actual API response structure
}

export interface Person {
    id: string;
    name: string;
    thumbnailPath?: string;
    isHidden: boolean;
}
