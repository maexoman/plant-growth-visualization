export class Random {
    readonly #seed: number;

    #generatorState: number;
    readonly #generator: () => number;

    constructor(seed?: number) {
        if (typeof seed === 'number' && Number.isFinite(seed)) {
            this.#seed = seed;
        } else {
            this.#seed = randomIntIncl(0, 0xFFFFFF);
        }

        this.#generatorState = this.#seed;
        this.#generator = () => {
            // Mulberry32 Algorithm
            let t = (this.#generatorState += 0x6D2B79F5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }

    get seed() {
        return this.#seed;
    }

    int(min: number, max: number) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(this.#generator() * (maxFloored - minCeiled + 1) + minCeiled);
    }

    number(min: number, max: number) {
        return Math.floor(this.#generator() * (max - min + 1) + min);
    }
}

function randomIntIncl(min: number, max: number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}