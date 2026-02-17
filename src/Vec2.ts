
const PERCISION_SCALER = Math.pow(10, 8);
function toAppPercision(number: number) {
    return Math.trunc(number * PERCISION_SCALER) / PERCISION_SCALER;
}

export class Vec2 {
    static readonly zero = new Vec2(0, 0);

    readonly #x: number;
    readonly #y: number;

    constructor(x: number, y: number) {
        this.#x = x;
        this.#y = y;
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    magnitude() {
        return toAppPercision(this.#magnitude());
    }

    #magnitude() {
        const xSquared = this.#x * this.#x;
        const ySquared = this.#y * this.#y;
        const magnitute = Math.sqrt(xSquared + ySquared);
        return magnitute;
    }

    normalized() {
        const magnitude = this.#magnitude();
        if (magnitude === 0) {
            return new Vec2(0, 0);
        }
        const xNormalized = this.#x / magnitude;
        const yNormalized = this.#y / magnitude;
        return new Vec2(
            toAppPercision(xNormalized),
            toAppPercision(yNormalized)
        );
    }

    scale(scalar: number) {
        const x = this.#x * scalar;
        const y = this.#y * scalar;
        return new Vec2(
            toAppPercision(x),
            toAppPercision(y)
        );
    }

    static add(a: Vec2, ...bs: Vec2[]) {
        let x = a.#x;
        let y = a.#y;

        for (const b of bs) {
            x += b.#x;
            y += b.#y;
        }

        return new Vec2(
            toAppPercision(x),
            toAppPercision(y)
        );
    }

    static subtract(a: Vec2, b: Vec2) {
        const x = a.#x + b.#x;
        const y = a.#y + b.#y;
        return new Vec2(
            toAppPercision(x),
            toAppPercision(y)
        );
    }

    static #dotProduct(a: Vec2, b: Vec2) {
        return a.#x * b.#x + a.#y * b.#y;
    }

    static angle(a: Vec2, b: Vec2) {
        const abDtPr = this.#dotProduct(a, b);
        const abMags = a.#magnitude() * b.#magnitude();
        if (abMags === 0) {
            return 0;
        }
        return Math.acos(abDtPr / abMags);
    }

    static clampVectorAngle(
        reference: Vec2,
        target: Vec2,
        maxAngleRad: number
    ): Vec2 {
        // Handle degenerate cases
        const refMag = reference.magnitude();
        const tgtMag = target.magnitude();

        if (refMag === 0 || tgtMag === 0) {
            return target;
        }

        const refN = reference.normalized();
        const tgtN = target.normalized();

        // Dot product
        let dot = refN.x * tgtN.x + refN.y * tgtN.y;

        // Numerical safety
        dot = Math.max(-1, Math.min(1, dot));

        // Current angle between vectors (unsigned)
        const angle = Math.acos(dot);

        // Already within limit
        if (angle <= maxAngleRad) {
            return target;
        }

        // Determine rotation direction using 2D cross product (z-component)
        const cross = refN.x * tgtN.y - refN.y * tgtN.x;
        const sign = cross >= 0 ? 1 : -1;

        // Clamp angle
        const clampedAngle = sign * maxAngleRad;

        // Rotate reference vector by clamped angle
        const cos = Math.cos(clampedAngle);
        const sin = Math.sin(clampedAngle);

        const constrained = new Vec2(
            refN.x * cos - refN.y * sin,
            refN.x * sin + refN.y * cos
        );

        // Restore original magnitude
        return new Vec2(
            constrained.x * tgtMag,
            constrained.y * tgtMag
        );
    }

    static atAngle(origin: Vec2, angleRad: number) {
        const normalized = origin.normalized();
        const sin = Math.sin(angleRad);
        const cos = Math.cos(angleRad);
        const x = normalized.x * cos - normalized.y * sin;
        const y = normalized.x * sin + normalized.y * cos;
        return new Vec2(x, y).normalized();
    }

}