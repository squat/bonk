import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { FilesetResolver, ImageSegmenter, ImageSegmenterResult } from "@mediapipe/tasks-vision";
import "./App.css";
import Text, { texts } from "./Text";
import { mappingFromRectToRect, pointInRect, translatePoint, translateRect } from "./math";
import Onboard, { pages as onboardPages } from "./Onboard";

const createSegmenter = async (): Promise<ImageSegmenter> => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    return ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
            //"https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
            delegate: "GPU",
            //"https://storage.googleapis.com/mediapipe-tasks/interactive_segmenter/ptm_512_hdt_ptm_woid.tflite"
        },
        outputCategoryMask: false,
        outputConfidenceMasks: true,
        runningMode: "VIDEO",
    });
}

let lastWebcamTime = -1;
let frames = 0;
const threshold = 0.15;
let count = 0;
const debug = false;
let lastPoints: number[] = [];
const windowSize = 10;
let lastTransition = 0;
let bonkElement: Element | null = null;

const renderLoop = (segmenter: ImageSegmenter, video: HTMLVideoElement, cb: ((result: ImageSegmenterResult) => void) | null): void => {
    if (video.currentTime === lastWebcamTime) {
        window.requestAnimationFrame(() => { renderLoop(segmenter, video, cb) });
        return;
    }
    lastWebcamTime = video.currentTime;
    let startTimeMs = performance.now();

    // Start segmenting the stream.
    segmenter.segmentForVideo(video, startTimeMs, (result: ImageSegmenterResult) => {
        cb && cb(result);
        frames = frames + 1;
        window.requestAnimationFrame(() => { renderLoop(segmenter, video, cb) });
    });
}

const newResultSetterFromCanvasContext = (video: HTMLVideoElement, ctx: CanvasRenderingContext2D | null, cb: ((transitions: boolean) => void) | null) => {
    return (result: ImageSegmenterResult): void => {
        if (!bonkElement) {
            let b = document.getElementsByClassName("bonk");
            if (b.length !== 1) {
                return;
            }
            bonkElement = b[0];
        }

        if (!ctx || !ctx.canvas.width || !ctx.canvas.height || !video.videoWidth || !video.videoHeight) {
            return;
        }
        if (!result.confidenceMasks) {
            return;
        }
        let imageData: Uint8ClampedArray = new Uint8ClampedArray();
        let frame: ImageData = new ImageData(1, 1);
        if (debug) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -(ctx.canvas.width - video.videoWidth) / 2, (ctx.canvas.height - video.videoHeight), -video.videoWidth, video.videoHeight);
            ctx.restore()
            frame = ctx.getImageData((ctx.canvas.width - video.videoWidth) / 2, ctx.canvas.height - video.videoHeight, video.videoWidth, video.videoHeight);
            imageData = frame.data;
        }

        const m = mappingFromRectToRect({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }, { x: 0, y: 0, width: video.videoWidth, height: video.videoHeight }, false);
        const r = translateRect(bonkElement.getBoundingClientRect(), m);
        const mask = result.confidenceMasks[0].getAsUint8Array();
        let j = 0;
        let points = 0.0;
        for (let i = 0; i < mask.length; i++) {
            if ((j / 4) % video.videoWidth === 0) {
                j = (i + video.videoWidth) * 4;
            }
            j -= 4;
            if (pointInRect({ x: j / 4 % video.videoWidth, y: Math.floor(j / 4 / video.videoWidth) }, r)) {
                if (debug) imageData[j] = 255;
                points += mask[i] / 255;
            }
            if (debug) imageData[j + 3] = mask[i];
        }
        if (debug) ctx.putImageData(frame, (ctx.canvas.width - frame.width) / 2, ctx.canvas.height - frame.height);
        if (lastPoints.length !== windowSize) {
            lastPoints = Array(windowSize).fill(points);
        }
        lastPoints.push(points)
        lastPoints = lastPoints.slice(1, windowSize + 1)
        let transition = trend(lastPoints, r.width * r.height * threshold);
        if (lastTransition === -1 && transition === 1) {
            console.log("BONK");
            count = count + 1;
            cb && cb(true);
        }
        if (transition !== 0) {
            lastTransition = transition;
        }
    };
};

const trend = (numbers: number[], threshhold: number = 100): number => {
    const first = numbers.slice(0, numbers.length / 2).reduce((acc: number, points: number) => acc + points, 0) / (numbers.length / 2);
    const second = numbers.slice(numbers.length / 2, numbers.length).reduce((acc: number, points: number) => acc + points, 0) / (numbers.length / 2);
    if (second - first > threshhold) {
        return 1;
    }
    if (first - second > threshhold) {
        return -1;
    }

    return 0;
};

function useWindowSize() {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener("resize", updateSize);
        updateSize();
        return () => window.removeEventListener("resize", updateSize);
    }, []);
    return size;
}

function App() {
    let [windowWidth, windowHeight] = useWindowSize();
    const [videoDimensions, setVideoDimensions] = useState<[number, number]>([640, 480]);
    const [cameraReady, setCameraReady] = useState<boolean>(false);
    const [transitioning, setTransitioning] = useState<boolean>(false);
    const [onboarding, setOnboarding] = useState<boolean>(true);
    const [index, setIndex] = useState<number>(0);
    const canvasCtx = useRef<CanvasRenderingContext2D | null>(null);
    const canvas = useCallback((node: HTMLCanvasElement) => {
        if (node === null) {
            return;
        }
        canvasCtx.current = node.getContext("2d");
    }, []);
    const m = mappingFromRectToRect({ x: 0, y: 0, width: videoDimensions[0], height: videoDimensions[1] }, { x: 0, y: 0, width: windowWidth, height: windowHeight });
    const video2 = useCallback((node: HTMLVideoElement) => {
        if (node === null) {
            return;
        }
        const startSegmentation = async () => {
            const s = await createSegmenter();

            const constraints = {
                video: true
            };

            node.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
            setCameraReady(node.srcObject.active);
            node.addEventListener("loadeddata", () => {
                setVideoDimensions([node.videoWidth, node.videoHeight]);
                renderLoop(s, node, newResultSetterFromCanvasContext(node, canvasCtx.current, setTransitioning));
            });
        };

        console.log("STARTING SEGMENTATION");
        startSegmentation().catch(console.error);
    }, []);

    if (transitioning) {
        bonkElement = null;
        setTransitioning(false);
        if (onboarding && index === onboardPages.length - 2) {
            setIndex(-1);
            setOnboarding(false);
        }
        if (index === texts.length - 1) {
            setIndex(0);
        } else {
            setIndex((index) => index + 1);
        }
    }
    const p = translatePoint({ x: videoDimensions[0], y: videoDimensions[1] }, m);
    const vWidth = (p.x - m.offset.x) / windowWidth;
    const vHeight = (p.y - m.offset.y) / windowHeight;
    return (
        <div style={{
            position: "relative",
            overflow: "hidden",
            height: "100svh",
            width: "100svw",
            display: "flex",
            alignContent: "flex-start",
            flexWrap: "wrap",
            background: "fuchsia",
        }}>
            <video ref={video2} autoPlay style={{
                position: "absolute",
                width: `${vWidth * 100}svw`,
                height: `${vHeight * 100}svh`,
                left: `${(100 - vWidth * 100) / 2}svw`,
                top: `${(100 - vHeight * 100) / 2}svh`,
                transform: "scaleX(-1)",
            }}></video>
            <canvas width={videoDimensions[0]} height={videoDimensions[1]} ref={canvas} style={{
                position: "absolute",
                width: `${vWidth * 100}svw`,
                height: `${vHeight * 100}svh`,
                left: `${(100 - vWidth * 100) / 2}svw`,
                top: `${(100 - vHeight * 100) / 2}svh`,
                opacity: 0.5,
            }}></canvas>
            {onboarding ? <Onboard ready={cameraReady} index={index} /> : <Text index={index}/>}
        </div>
    );
}

export default App;
