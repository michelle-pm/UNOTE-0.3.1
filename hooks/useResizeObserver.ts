import { useState, useEffect, RefObject } from 'react';

interface Size {
    width: number;
    height: number;
}

function useResizeObserver<T extends HTMLElement>(ref: RefObject<T>): Size {
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setSize({ width, height });
            }
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [ref]);

    return size;
}

export default useResizeObserver;
