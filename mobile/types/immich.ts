export interface ImmichAsset {
    id: string;
    type: 'IMAGE' | 'VIDEO';
    fileCreatedAt: string;
    localDateTime?: string;  // For timeline grouping
    originalFileName: string;
    isTrashed: boolean;
    isArchived: boolean;
    isFavorite: boolean;
    duration: string;
    deviceAssetId: string;
    deviceId: string;
    ownerId: string;
    exifInfo?: {
        exifImageWidth: number;
        exifImageHeight: number;
        fileSizeInByte: number;
    };
}

export interface SwipeAction {
    asset: ImmichAsset;
    action: 'KEEP' | 'DELETE';
    timestamp: number;
}

export interface ImmichAlbum {
    id: string;
    albumName: string;
    assetCount: number;
    albumThumbnailAssetId: string | null;
}

export interface Person {
    id: string;
    name: string;
    thumbnailPath: string; // url to thumbnail
}
