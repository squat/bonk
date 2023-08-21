import { useEffect } from 'react'
import { useTransition, useSpringRef, config } from '@react-spring/web'

export function useBubbleTransition(index: number) {
    const transRef = useSpringRef();
    const transitions = useTransition(index, {
        ref: transRef,
        keys: null,
        from: { opacity: 0, transform: 'translate3d(30%,0,0)' },
        enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
        leave: { opacity: 0, transform: 'translate3d(-30%,0,0)' },
        config: config.stiff,
    });
    useEffect(() => {
        transRef.start()
    }, [transRef, index]);
    return transitions;
};
