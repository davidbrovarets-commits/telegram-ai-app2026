import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from 'framer-motion';
import { Trash2, Archive, ArrowRight, ArrowLeft } from 'lucide-react';

interface SwipeableNewsCardProps {
    children: React.ReactNode;
    onDelete?: () => void;
    onArchive?: () => void; // Optional now, as archive mode might use onDelete for both
    onRestore?: () => void;
    deleteLabel?: string;
    archiveLabel?: string;
    mode?: 'feed' | 'archive';
    onPress?: () => void;
}

export const SwipeableNewsCard: React.FC<SwipeableNewsCardProps> = ({
    children,
    onDelete,
    onArchive,
    onRestore,
    deleteLabel = "Kustuta",
    archiveLabel = "Arhiveeri",
    mode = 'feed',
    onPress
}) => {
    const x = useMotionValue(0);
    const [isPresent, setIsPresent] = useState(true);
    const [isDragging, setIsDragging] = useState(false); // New explicit drag state

    // Transform background opacity based on drag distance
    const deleteOpacity = useTransform(x, [10, 50], [0, 1]); // Show even earlier
    const archiveOpacity = useTransform(x, [-10, -50], [0, 1]); // Show even earlier

    // Dynamic zIndex to ensure the correct background is on top
    const deleteZIndex = useTransform(x, (v) => v > 0 ? 1 : 0);
    const archiveZIndex = useTransform(x, (v) => v < 0 ? 1 : 0);

    // Transform background color containers
    // We'll use absolute positioned divs for backgrounds to avoid complex color interpolation issues

    const handleDragStart = () => {
        setIsDragging(false); // Reset initially, will detect move in onDrag if needed, but framer handles drag start
    };

    const handleDrag = (_: any, info: PanInfo) => {
        // If moved more than 10px, consider it a drag intent
        if (Math.abs(info.offset.x) > 5) {
            setIsDragging(true);
        }
    };

    const handleDragEnd = async (_: any, info: PanInfo) => {
        // Give a moment for any click handlers to realize we were dragging
        setTimeout(() => setIsDragging(false), 100);

        const threshold = 60; // Lower threshold slightly for easier swipe
        const velocity = info.velocity.x;

        // Check for sufficient distance OR high velocity
        if (info.offset.x > threshold || (info.offset.x > 30 && velocity > 200)) {
            // Swiped Right -> Delete/Restore
            setIsPresent(false);
            // Delay for animation
            setTimeout(() => {
                if (mode === 'archive' && onRestore) {
                    onRestore();
                } else {
                    onDelete();
                }
            }, 300);
        } else if (info.offset.x < -threshold || (info.offset.x < -30 && velocity < -200)) {
            // Swiped Left -> Archive/Delete
            setIsPresent(false);
            // Delay for animation
            setTimeout(() => {
                if (onArchive) {
                    onArchive();
                } else if (onDelete) {
                    onDelete();
                }
            }, 300);
        }
    };

    return (
        <AnimatePresence>
            {isPresent && (
                <motion.div
                    layout
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
                >
                    {/* Background Layer - DELETE (Red, Left side visible when swiping right) */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            background: '#FF3B30', // System Red
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            paddingLeft: '24px',
                            zIndex: deleteZIndex,
                            borderRadius: '18px',
                        }}
                    >
                        <motion.div style={{ opacity: deleteOpacity, display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                            <Trash2 size={24} />
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>{deleteLabel}</span>
                            <ArrowRight size={20} />
                        </motion.div>
                    </motion.div>

                    {/* Background Layer - ARCHIVE (Black/Gray, Right side visible when swiping left) */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            right: 0,
                            width: '100%',
                            background: mode === 'archive' ? '#FF3B30' : '#8E8E93', // Red if archive mode (delete), else Gray
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '24px',
                            zIndex: archiveZIndex,
                            borderRadius: '18px',
                        }}
                    >
                        <motion.div style={{ opacity: archiveOpacity, display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                            {mode === 'archive' ? <ArrowLeft size={20} /> : <ArrowLeft size={20} />}
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>{mode === 'archive' ? deleteLabel : archiveLabel}</span>
                            {mode === 'archive' ? <Trash2 size={24} /> : <Archive size={24} />}
                        </motion.div>
                    </motion.div>

                    {/* Foreground Card */}
                    <motion.div
                        style={{ x, cursor: 'grab', background: 'transparent', position: 'relative', zIndex: 1 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.7} // Rubber band effect
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        whileTap={{ cursor: 'grabbing' }}
                        onTap={() => {
                            if (!isDragging && onPress) onPress();
                        }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
