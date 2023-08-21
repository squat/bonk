import { animated } from '@react-spring/web'
import { useBubbleTransition } from "./Bubble";

export interface TextItem {
    text: string;
    x: number;
    y: number;
    width: number;
}

export const texts: TextItem[] = [
    {
        text: "All the relationships in my life with anyone I've trusted or have felt safe around",
        x: 40,
        y: 10,
        width: 60,
    },
    {
        text: "be it with my twin, my parents, my friends, or even my co-workers",
        x: 45,
        y: 20,
        width: 45,
    },
    {
        text: "have been marked by some sort of playful, physical affection",
        x: 60,
        y: 10,
        width: 40,
    },
    {
        text: "My twin and I began bonking each other over a decade ago",
        x: 40,
        y: 20,
        width: 60,
    },
    {
        text: "delivering a gentle smush somewhere on the other's body",
        x: 40,
        y: 20,
        width: 50,
    },
    {
        text: "a nuzzle using one's forehead",
        x: 70,
        y: 25,
        width: 40,
    },
    {
        text: "or even one's face really",
        x: 30,
        y: 20,
        width: 40,
    },
    {
        text: "It wasn't long before my twin and I began bonking our parents",
        x: 60,
        y: 30,
        width: 50,
    },
    {
        text: "which wasn't long before they started bonking us back",
        x: 50,
        y: 10,
        width: 60,
    },
    {
        text: "which wasn't long before my dad bonked one of his colleagues at work",
        x: 35,
        y: 20,
        width: 50,
    },
    {
        text: "accidentally transgressing all kinds of social norms in the heat of the moment",
        x: 40,
        y: 15,
        width: 50,
    },
    {
        text: "which was a long time before my friends and I bonked at dinner today",
        x: 30,
        y: 20,
        width: 50,
    },
    {
        text: "Bonking someone is playing: it's an act of openness, vulnerability, trust, simultaneity, curiosity, and just dang 'ol silliness",
        x: 60,
        y: 15,
        width: 55,
    },
    {
        text: "Platonic physical play is transgressive and queer in the way it challenges ideas about what platonic relationships are allowed to encompass",
        x: 30,
        y: 20,
        width: 60,
    },
    {
        text: "and in the way it challenges the ideas about which kinds of relationships have exclusive rights to physical play and what that play is supposed to look like",
        x: 60,
        y: 20,
        width: 60,
    },
    {
        text: "It turns out that the physical connection of bonking someone is holy and enough",
        x: 50,
        y: 25,
        width: 50,
    },
    {
        text: "the end",
        x: 50,
        y: 45,
        width: 40,
    },
    {
        text: "again?",
        x: 75,
        y: 5,
        width: 20,
    },
];

export default function Text(props: { index: number }) {
    const { index } = props;
    const transitions = useBubbleTransition(index);
    return <div className="flex fill transition">
        {transitions((style, i) => {
            const t = texts[i]
            return <animated.div style={{
                ...style, ...{
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    width: `${t.width}%`,
                    position: "absolute",
                    justifyContent: "flex-start",
                }
            }}>
                <p className="bonk bubble" style={{
                    transform: "translate(-50%, 0)",
                }}>{t.text}</p>
            </animated.div>
        })}
    </div>;
};

