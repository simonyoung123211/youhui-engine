import React, { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string;
  className?: string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  rowHeight,
  renderItem,
  getItemKey,
  className = '',
  overscan = 6,
  onEndReached,
  endReachedThreshold = 120,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ height: 0, scrollTop: 0 });
  const endReachedRef = useRef(false);

  const updateViewport = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewport({ height: el.clientHeight, scrollTop: el.scrollTop });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateViewport();
    const ro = new ResizeObserver(updateViewport);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateViewport]);

  useEffect(() => {
    endReachedRef.current = false;
  }, [items.length]);

  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewport.height / rowHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setViewport({ height: el.clientHeight, scrollTop: el.scrollTop });

    if (!onEndReached) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom <= endReachedThreshold) {
      if (!endReachedRef.current) {
        endReachedRef.current = true;
        onEndReached();
      }
    } else {
      endReachedRef.current = false;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto overflow-x-hidden ${className}`}
      onScroll={handleScroll}
    >
      <div className="relative w-full" style={{ height: totalHeight }}>
        {visibleItems.map((item, i) => {
          const index = startIndex + i;
          return (
            <div
              key={getItemKey(item, index)}
              className="absolute left-0 right-0"
              style={{ top: index * rowHeight, height: rowHeight }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
