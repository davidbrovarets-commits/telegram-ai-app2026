import React from 'react';
import { SwipeableNewsCard } from '../views/SwipeableNewsCard';
import { NewsCardContentL6 } from './NewsCardContentL6';
import type { News } from '../../types';

interface NewsCardProps {
    item: News;
    onPress: () => void;
    onDelete: () => void;
    onArchive?: () => void;
    deleteLabel?: string;
    variant?: 'feed' | 'archive';
}

/**
 * Universal News Card combining Swipe behavior + L6 Content.
 * Used by both NewsView and ArchiveView for Visual Parity (Requirement E).
 */
export const NewsCard: React.FC<NewsCardProps> = ({
    item,
    onPress,
    onDelete,
    onArchive,
    deleteLabel,
    variant = 'feed'
}) => {
    return (
        <SwipeableNewsCard
            onDelete={onDelete}
            onArchive={onArchive}
            deleteLabel={deleteLabel || (variant === 'archive' ? 'Видалити' : 'Видалити')}
            archiveLabel="В архів"
            mode={variant}
            onPress={onPress}
        >
            <NewsCardContentL6 item={item} onPress={onPress} />
        </SwipeableNewsCard>
    );
};
