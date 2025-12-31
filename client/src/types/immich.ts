export interface ImmichAsset {
    id: string;
    type: 'IMAGE' | 'VIDEO';
    fileCreatedAt: string;
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
