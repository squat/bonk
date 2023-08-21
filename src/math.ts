export interface Point {
    x: number;
    y: number;
}

export interface Rect {
    height: number;
    width: number;
    x: number;
    y: number;
}

export interface Mapping {
    scale: Point;
    offset: Point;
}

export const pointInRect = (p: Point, r: Rect): boolean => {
    if (p.x < r.x) return false;
    if (p.y < r.y) return false;
    if (p.x > r.x + r.width) return false;
    if (p.y > r.y + r.height) return false;
    return true
};

export const mappingFromRectToRect = (r1: Rect, r2: Rect, fill: Boolean = true): Mapping => {
    let r = r2.width / r1.width;
    if ((r1.height / r1.width < r2.height / r2.width) !== !fill) {
        r = r2.height / r1.height
    }
    const scale = {
        x: r,
        y: r,
    };

    return {
        scale,
        offset: {
            x: (r2.width - r1.width * scale.x) / 2,
            y: (r2.height - r1.height * scale.y) / 2,
        },
    };
};

export const translatePoint = (p: Point, m: Mapping): Point => {
    return {
        x: p.x * m.scale.x + m.offset.x,
        y: p.y * m.scale.y + m.offset.y,
    };
};

export const translateRect = (r: Rect, m: Mapping): Rect => {
    return {
        x: r.x * m.scale.x + m.offset.x,
        y: r.y * m.scale.y + m.offset.y,
        width: r.width * m.scale.x,
        height: r.height * m.scale.y,
    };
};
