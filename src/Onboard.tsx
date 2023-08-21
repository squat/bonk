import React, { useState, CSSProperties } from 'react'
import { animated, AnimatedProps } from '@react-spring/web'
import { useBubbleTransition } from "./Bubble";
import newGif from "./new.gif";

function Title(props: { ready: boolean, next: () => void }) {
    const { ready, next } = props;
    const readyAndNext = () => ready && next();
    return <div className="bubble" onClick={readyAndNext}>
        <h1>On Bonking</h1>
        <img className="new" src={newGif} alt="new" />
        {!ready ? <p>this story requires access to your camera</p> : <p><a style={{ cursor: "pointer" }}>start</a><span style={{ display: "inline-block", fontSize: "1.5em", marginLeft: ".5em", lineHeight: 0 }} className="shake">&#8250;</span></p>}
    </div>;
};

type pageProps = AnimatedProps<{ style: CSSProperties, ready: boolean, next: () => void }>;

export const pages: ((props: pageProps) => React.ReactElement<pageProps>)[] = [
    ({ style, ready, next }) => <animated.div style={{ ...style }}><Title ready={ready as boolean} next={next} /></animated.div>,
    ({ style }) => <animated.div style={{ ...style }}><div className="bubble bonk">Use your head to progress through the text<br />try bonking this bubble now</div></animated.div>,
    ({ style }) => <animated.div style={{ ...style }}><div className="bubble bonk">yup! try one more time!</div></animated.div>,
    ({ style }) => <animated.div style={{ ...style }}><div className="bubble bonk">&#128526;&#128526;&#128526;</div></animated.div>,
];

export default function Onboard(props: { index: number, ready: boolean }) {
    const { index, ready } = props;
    const [i, set] = useState(0)
    const onClick = () => set(state => Math.min(state + 1, pages.length - 1));
    const transitions = useBubbleTransition(Math.min(pages.length - 1, i + index));
    return <div className="flex fill transition">
        {transitions((style, i) => {
            const Page = pages[i]
            return <Page style={style} next={onClick} ready={ready} />
        })}
    </div>;
};
