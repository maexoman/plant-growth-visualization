import type { Flower } from "./Flower";
import { Plant } from "./Plant";
import { Random } from "./Random";
import { Vec2 } from "./Vec2";
import { parameterToName, parameterToNumber, World } from "./World";


const offset = new Vec2(0, -10);

function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const deadX = document.getElementById('dead-x') as HTMLDivElement;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    const ghostCanvas = document.getElementById('ghost-canvas') as HTMLCanvasElement;
    const ghostContext = ghostCanvas.getContext('2d') as CanvasRenderingContext2D;

    const dayCounterElement = (document.getElementById('day-counter') as HTMLSpanElement);

    const random = new Random();
    const world = new World(random, canvas.width, canvas.height);

    let done = false;
    let update = false;
    // @ts-ignore
    window.gr = 0.75;

    let dayTicks = 0;
    let dayCounter = 0;

    let ghostRendered = false;
    let lastTimestamp: DOMHighResTimeStamp | undefined = undefined;
    function gameLoop(timestamp: DOMHighResTimeStamp) {
        if (lastTimestamp === undefined) {
            lastTimestamp = timestamp;
        }
        const deltaTime = timestamp - lastTimestamp;

        try {
            if (update === true) {
                if (done === false && world.isDone()) {
                    done = true;
                    update = false;

                    (document.getElementById('btn-pause') as HTMLButtonElement)
                        .style.display = 'none';
                    (document.getElementById('btn-start') as HTMLButtonElement)
                        .style.display = 'none';
                }
            }
            if (update === true) {
                dayTicks += 1;
                if (dayTicks >= 11) {

                    dayCounter += 1;
                    dayCounterElement.innerText = dayCounter.toString(10);
                    dayTicks = 0;
                }

                world.update(deltaTime);
            }

            render(context, world);
            if (world.plant.state === 'dead') {
                if (ghostRendered === false) {
                    renderGhostPlant(ghostContext, world.plant);
                    ghostCanvas.style.display = 'block';
                    deadX.style.display = 'flex';
                    ghostRendered = true;
                }
            }
        } catch (error) {
            update = false;
            console.error(error);
        }

        requestAnimationFrame(gameLoop);
        lastTimestamp = timestamp;
    }

    // render:
    requestAnimationFrame(gameLoop);

    // Hook up the start button
    const startButton = document.getElementById('btn-start') as HTMLButtonElement;
    startButton.addEventListener('click', function () {
        update = true;

        (document.getElementById('btn-pause') as HTMLButtonElement)
            .style.display = 'block';
    });

    // Hook up the start button
    const pauseButton = document.getElementById('btn-pause') as HTMLButtonElement;
    pauseButton.addEventListener('click', function () {
        update = false;

        (document.getElementById('btn-pause') as HTMLButtonElement)
            .style.display = 'none';
    });

    // Hook up the restart button
    const resetButton = document.getElementById('btn-reset') as HTMLButtonElement;
    resetButton.addEventListener('click', function () {
        update = false;

        deadX.style.display = 'none';
        ghostCanvas.style.display = 'none';
        ghostContext.clearRect(0, 0, ghostContext.canvas.width, ghostContext.canvas.height);
        ghostRendered = false;
        dayTicks = 0;
        dayCounter = 0;
        dayCounterElement.innerText = dayCounter.toString(10);
        done = false;

        (document.getElementById('btn-pause') as HTMLButtonElement)
            .style.display = 'none';

        (document.getElementById('btn-start') as HTMLButtonElement)
            .style.display = 'block';

        world.reset();
        syncWithWorld();
    });

    // Hook up the sun slider
    const sunSlider = document.getElementById('sld-sun') as HTMLInputElement;
    sunSlider.addEventListener('input', function () {
        let offset = 0;
        try {
            offset = parseInt(sunSlider.value, 10);
            if (Number.isNaN(offset)) {
                return;
            }
        } catch (error) {
            return;
        }


        world.moveSun(offset);
    });

    // Hook up the gravity slider
    const gravitySlider = document.getElementById('sld-gravity') as HTMLInputElement;
    gravitySlider.value = (-world.gravity.y).toString(10);
    gravitySlider.addEventListener('input', function () {
        let value = 0;
        try {
            value = parseInt(gravitySlider.value, 10);
            if (Number.isNaN(value)) {
                return;
            }
        } catch (error) {
            return;
        }

        world.setGravity(value);
        (document.getElementById('gravitation') as HTMLTableCellElement).innerHTML = `(${-world.gravity.y} m/s<sup>2</sup>)`;
    });

    const zeroGButton = document.getElementById('btn-zerog') as HTMLButtonElement;
    zeroGButton.addEventListener('click', function () {
        (document.getElementById('sld-gravity') as HTMLInputElement).value = '0';
        world.setGravity(0);
        (document.getElementById('gravitation') as HTMLTableCellElement).innerHTML = `(${-world.gravity.y} m/s<sup>2</sup>)`;
    });

    const marsButton = document.getElementById('btn-mars') as HTMLButtonElement;
    marsButton.addEventListener('click', function () {
        (document.getElementById('sld-gravity') as HTMLInputElement).value = '4';
        world.setGravity(4);
        (document.getElementById('gravitation') as HTMLTableCellElement).innerHTML = `(${-world.gravity.y} m/s<sup>2</sup>)`;
    });

    const earthButton = document.getElementById('btn-earth') as HTMLButtonElement;
    earthButton.addEventListener('click', function () {
        (document.getElementById('sld-gravity') as HTMLInputElement).value = '10';
        world.setGravity(10);
        (document.getElementById('gravitation') as HTMLTableCellElement).innerHTML = `(${-world.gravity.y} m/s<sup>2</sup>)`;
    });

    const nutrientsSlider = document.getElementById('sld-nutrients') as HTMLInputElement;
    const sunHourSlider = document.getElementById('sld-sun-hours') as HTMLInputElement;
    const temperatureSlider = document.getElementById('sld-temperature') as HTMLInputElement;
    const carbonDioxideSlider = document.getElementById('sld-carbon-dioxide') as HTMLInputElement;
    const waterSlider = document.getElementById('sld-water') as HTMLInputElement;
    function syncWithWorld() {
        (document.getElementById('gravitation') as HTMLTableCellElement).innerHTML = `(${-world.gravity.y} m/s<sup>2</sup>)`;

        (document.getElementById('light') as HTMLTableCellElement).innerHTML = `(${parameterToName(world.environment.lightHours)})`;
        (document.getElementById('temperature') as HTMLTableCellElement).innerHTML = `(${(() => {
            switch (world.environment.temperature) {
                case "very_low": return "sehr niedrig 0-15&deg;C";
                case "low": return "niedrig 15-20&deg;C";
                case "optimal": return "optimal 20-25&deg;C";
                case "high": return "hoch 25-35&deg;C";
                case "very_high": return "sehr hoch 35&deg;C+"
            }
        })()})`;
        (document.getElementById('carbon-dioxide') as HTMLTableCellElement).innerHTML = `(${parameterToName(world.resources.carbonDioxide)})`;
        (document.getElementById('water') as HTMLTableCellElement).innerHTML = `(${parameterToName(world.resources.water)})`;
        (document.getElementById('nutrients') as HTMLTableCellElement).innerHTML = `(${parameterToName(world.resources.nutrients)})`;
        sunHourSlider.value = parameterToNumber(world.environment.lightHours).toString(10);
        temperatureSlider.value = parameterToNumber(world.environment.temperature).toString(10);
        carbonDioxideSlider.value = parameterToNumber(world.resources.carbonDioxide).toString(10);
        waterSlider.value = parameterToNumber(world.resources.water).toString(10);
        nutrientsSlider.value = parameterToNumber(world.resources.nutrients).toString(10);
    }

    syncWithWorld();

    // Hook up the sun-hour slider
    sunHourSlider.addEventListener('input', function () {
        let value = 0;
        try {
            value = parseInt(sunHourSlider.value, 10);
            if (Number.isNaN(value)) {
                return;
            }
        } catch (error) {
            return;
        }

        syncWithWorld();
        world.setSunHours(value);
    });

    // Hook up the temerature slider
    temperatureSlider.addEventListener('input', function () {
        let value = 0;
        try {
            value = parseInt(temperatureSlider.value, 10);
            if (Number.isNaN(value)) {
                return;
            }
        } catch (error) {
            return;
        }

        syncWithWorld();
        world.setTemperature(value);
    });

    // Hook up the carbon dioxide slider
    carbonDioxideSlider.addEventListener('input', function () {
        let value = 0;
        try {
            value = parseInt(carbonDioxideSlider.value, 10);
            if (Number.isNaN(value)) {
                return;
            }
        } catch (error) {
            return;
        }

        syncWithWorld();
        world.setCarbonDioxide(value);
    });

    // Hook up the water slider
    waterSlider.addEventListener('input', function () {
        let value = 0;
        try {
            value = parseInt(waterSlider.value, 10);
            if (Number.isNaN(value)) {
                return;
            }
        } catch (error) {
            return;
        }

        syncWithWorld();
        world.setWater(value);
    });

    // Hook up the nutrients slider
    nutrientsSlider.addEventListener('input', function () {
        let value = 0;
        try {
            value = parseInt(nutrientsSlider.value, 10);
            if (Number.isNaN(value)) {
                return;
            }
        } catch (error) {
            return;
        }

        syncWithWorld();
        world.setNutrients(value);
    });
}

function render(context: CanvasRenderingContext2D, world: World) {
    let oldFillStyle: string | CanvasGradient | CanvasPattern = context.fillStyle;

    let oldLineWidth: number = context.lineWidth;
    let oldStrokeStyle: string | CanvasGradient | CanvasPattern = context.strokeStyle;

    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height);

    // male den Himmel
    oldFillStyle = context.fillStyle;
    context.fillStyle = 'lightblue';
    context.fillRect(0, 0, width, height - world.groundY);
    context.fillStyle = oldFillStyle;

    // male den Boden
    oldFillStyle = context.fillStyle;
    context.fillStyle = '#987654';
    context.fillRect(0, height - world.groundY, width, height);
    context.fillStyle = oldFillStyle;

    // Übergang zwischen Boden und Himmel nochmal nachziehen
    oldLineWidth = context.lineWidth;
    oldStrokeStyle = context.strokeStyle;
    context.lineWidth = 4;
    context.strokeStyle = '#4c3228';
    context.beginPath();
    context.moveTo(0, height - world.groundY);
    context.lineTo(width, height - world.groundY);
    context.stroke();
    context.closePath();
    context.lineWidth = oldLineWidth;
    context.strokeStyle = oldStrokeStyle;

    // male Sonnenstrahlen
    oldLineWidth = context.lineWidth;
    oldStrokeStyle = context.strokeStyle;
    context.lineWidth = 8;
    context.strokeStyle = '#ffde21';

    const scaledSunRay = world.sunRay.scale(200);

    const perpendiculatSunRayL = new Vec2(scaledSunRay.y, -scaledSunRay.x).normalized().scale(55);
    const perpendiculatSunRayR = perpendiculatSunRayL.scale(-1);

    const sunRayEndPosition = Vec2.add(world.sunPosition, scaledSunRay);

    context.beginPath();
    context.moveTo(world.sunPosition.x, height - world.sunPosition.y);
    context.lineTo(sunRayEndPosition.x, height - sunRayEndPosition.y);

    const lSP = Vec2.add(world.sunPosition, perpendiculatSunRayL);
    const lEP = Vec2.add(sunRayEndPosition, perpendiculatSunRayL);
    context.moveTo(lSP.x, height - lSP.y);
    context.lineTo(lEP.x, height - lEP.y);

    const rSP = Vec2.add(world.sunPosition, perpendiculatSunRayR);
    const rEP = Vec2.add(sunRayEndPosition, perpendiculatSunRayR);
    context.moveTo(rSP.x, height - rSP.y);
    context.lineTo(rEP.x, height - rEP.y);

    context.stroke();
    context.closePath();
    context.lineWidth = oldLineWidth;
    context.strokeStyle = oldStrokeStyle;

    // male die Sonne (Hintergrund)
    oldFillStyle = context.fillStyle;
    context.fillStyle = 'lightblue';
    context.beginPath();
    context.arc(world.sunPosition.x, height - world.sunPosition.y, 125, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
    context.fillStyle = oldFillStyle;

    // male die Sonne
    oldFillStyle = context.fillStyle;
    context.fillStyle = '#ffde21';
    context.beginPath();
    context.arc(world.sunPosition.x, height - world.sunPosition.y, 100, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
    context.fillStyle = oldFillStyle;

    oldFillStyle = context.fillStyle;
    context.fillStyle = '#654321';
    drawEllipseByCenter(context, world.middleX, height - (world.groundY - 15), 15, 20);
    context.fillStyle = oldFillStyle;

    renderPlant(context, world.plant);
}

function drawEllipseByCenter(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
    drawEllipse(ctx, cx - w / 2.0, cy - h / 2.0, w, h);
}

function drawEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    var kappa = .5522848,
        ox = (w / 2) * kappa, // control point offset horizontal
        oy = (h / 2) * kappa, // control point offset vertical
        xe = x + w,           // x-end
        ye = y + h,           // y-end
        xm = x + w / 2,       // x-middle
        ym = y + h / 2;       // y-middle

    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(x, ym);
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    ctx.fill();
}

function renderPlant(context: CanvasRenderingContext2D, plant: Plant) {
    renderRoots(context, plant, {
        positionOffset: offset,

        thickness: 6,
        color: "#d1bc8a",
        borderWidth: 2,
        borderColor: "#000000"
    });

    renderStem(context, plant, {
        positionOffset: offset,

        thickness: 8,
        colors: [
            "#00C600",
            "#00BC00",
            "#00B200",
            "#00A800",
            "#009E00",
            "#009400",
            "#008A00",
            "#008000",
        ],
        borderWidth: 2,
        borderColor: "#000000"
    });

    renderLeafs(context, plant, {
        positionOffset: offset,

        stemColors: [
            "#00C600",
            "#00BC00",
            "#00B200",
            "#00A800",
            "#009E00",
            "#009400",
            "#008A00",
            "#008000",
        ],

        colors: [
            "#C48000",
            "#A88000",
            "#8C8000",
            "#708000",
            "#548000",
            "#388000",
            "#1C8000",
            "#008000"
        ],
        borderWidth: 2,
        borderColor: "#000000"
    });

    renderFlower(context, plant.flower, {
        positionOffset: offset,

        carpelSizeFraction: 2 / 3,
        carpelBorderWidth: 2,
        carpelColor: "#654321",
        carpelBorderColor: "#000000",

        petalWidth: 10,
        petalBorderWidth: 2,
        oddPetalColor: "#FFDA03",
        oddPetalBorderColor: "#000000",
        evenPetalColor: "#EDC001",
        evenPetalBorderColor: "#000000"
    });
}

function renderGhostPlant(context: CanvasRenderingContext2D, plant: Plant) {
    const ghostColor = '#ffffff';
    renderRoots(context, plant, {
        positionOffset: offset,

        thickness: 8,
        color: ghostColor,
        borderWidth: 0,
        borderColor: "#00000000"
    });

    renderStem(context, plant, {
        positionOffset: offset,

        thickness: 10,
        colors: [ghostColor],
        borderWidth: 0,
        borderColor: "#00000000"
    });

    renderLeafs(context, plant, {
        positionOffset: offset,

        stemColors: [ghostColor],
        colors: [ghostColor],
        borderWidth: 2,
        borderColor: ghostColor
    });

    renderFlower(context, plant.flower, {
        positionOffset: offset,

        carpelSizeFraction: 2 / 3,
        carpelBorderWidth: 0,
        carpelColor: ghostColor,
        carpelBorderColor: "#00000000",

        petalWidth: 12,
        petalBorderWidth: 0,
        oddPetalColor: ghostColor,
        oddPetalBorderColor: "#00000000",
        evenPetalColor: ghostColor,
        evenPetalBorderColor: "#00000000"
    });
}

const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;
const invlerp = (x: number, y: number, a: number) => clamp((a - x) / (y - x));
const clamp = (a: number, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const range = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    a: number
) => lerp(x2, y2, invlerp(x1, y1, a));

function renderLeafs(context: CanvasRenderingContext2D, plant: Plant, options: LeafRenderingOptions) {
    const stemColorIndex = Math.round(range(1, 10, 0, options.stemColors.length - 1, plant.stemHealth));
    const stemColor = options.stemColors[stemColorIndex];

    const leafs = plant.leafs;
    for (const leaf of leafs) {
        if (leaf.area <= 0) {
            continue;
        }

        const position = leaf.stemSegment.endPosition;
        const isLeftLeaf = leaf.leafDirection === 'left';

        const leafColorIndex = Math.round(range(1, 10, 0, options.colors.length - 1, leaf.health));
        const leafColor = options.colors[leafColorIndex];

        // #123456
        const r = leafColor.substring(1, 3);
        const g = stemColor.substring(3, 5);

        const color = `#${r}${g}00`;

        const offsetPosition = Vec2.add(position, options.positionOffset);
        if (isLeftLeaf) {
            renderLeftLeaf(context, offsetPosition, leaf.area, {
                color: color,
                borderColor: options.borderColor,
                borderWidth: options.borderWidth,
            });
        } else {
            renderRightLeaf(context, offsetPosition, leaf.area, {
                color: color,
                borderColor: options.borderColor,
                borderWidth: options.borderWidth,
            });
        }
    }
}


type StemRenderingOptions = {
    positionOffset: Vec2;

    thickness: number;
    borderWidth: number;
    colors: string[];
    borderColor: string;
};

function renderStem(context: CanvasRenderingContext2D, plant: Plant, options: StemRenderingOptions) {
    const colorIndex = Math.round(range(1, 10, 0, options.colors.length - 1, plant.stemHealth));
    const color = options.colors[colorIndex];

    if (options.borderWidth > 0) {
        _renderStem(context, plant, {
            positionOffset: options.positionOffset,
            thickness: options.thickness + options.borderWidth,
            color: options.borderColor,
        });
    }
    _renderStem(context, plant, {
        positionOffset: options.positionOffset,
        thickness: options.thickness,
        color: color,
    });
}

function _renderStem(context: CanvasRenderingContext2D, plant: Plant, options: Pick<StemRenderingOptions, 'positionOffset' | 'thickness'> & Record<'color', string>) {
    if (plant.stemSegments.length === 0 && plant.leafs.length === 0) {
        return;
    }

    // save the context
    const oldFillStyle = context.fillStyle;
    const oldLineWidth = context.lineWidth;
    const oldStrokeStyle = context.strokeStyle;
    const oldLineCap = context.lineCap;

    context.lineWidth = options.thickness;
    context.strokeStyle = options.color;
    context.lineCap = 'round';

    // render root stem
    if (plant.stemSegments.length > 0) {
        const startPosition = Vec2.add(plant.stemSegments[0].startPosition, options.positionOffset);
        context.beginPath();
        context.moveTo(startPosition.x, context.canvas.height - startPosition.y);
        for (let i = 1; i < plant.stemSegments.length; i += 1) {
            const endPosition = Vec2.add(plant.stemSegments[i].endPosition, options.positionOffset);
            context.lineTo(endPosition.x, context.canvas.height - endPosition.y);
        }
        context.stroke();
    }

    // draw leaf stems
    for (const leaf of plant.leafs) {
        const startPosition = Vec2.add(leaf.stemSegment.startPosition, options.positionOffset);
        const endPosition = Vec2.add(leaf.stemSegment.endPosition, options.positionOffset);
        context.beginPath();
        context.moveTo(startPosition.x, context.canvas.height - startPosition.y);
        context.lineTo(endPosition.x, context.canvas.height - endPosition.y);
        context.stroke();
    }

    // restore the context
    context.lineWidth = oldLineWidth;
    context.lineCap = oldLineCap;
    context.strokeStyle = oldStrokeStyle;
    context.fillStyle = oldFillStyle;
}

type RootRenderingOptions = {
    positionOffset: Vec2;

    thickness: number;
    borderWidth: number;
    color: string;
    borderColor: string;
};
function renderRoots(context: CanvasRenderingContext2D, plant: Plant, options: RootRenderingOptions) {
    if (plant.rootSegments.length === 0) {
        return;
    }

    // save the context
    const oldFillStyle = context.fillStyle;
    const oldLineWidth = context.lineWidth;
    const oldStrokeStyle = context.strokeStyle;
    const oldLineCap = context.lineCap;

    context.lineCap = 'round';
    for (const rootSegments of plant.rootSegments) {
        if (rootSegments.length === 0) {
            continue;
        }
        const startPosition = Vec2.add(rootSegments[0].startPosition, options.positionOffset);

        if (options.borderWidth) {
            context.lineWidth = options.thickness + options.borderWidth;
            context.strokeStyle = options.borderColor;
            context.beginPath();
            context.moveTo(startPosition.x, context.canvas.height - startPosition.y);
            for (let i = 1; i < rootSegments.length; i += 1) {
                const endPosition = Vec2.add(rootSegments[i].endPosition, options.positionOffset);
                context.lineTo(endPosition.x, context.canvas.height - endPosition.y);
            }
            context.stroke();
        }

        context.lineWidth = options.thickness;
        context.strokeStyle = options.color;
        context.beginPath();
        context.moveTo(startPosition.x, context.canvas.height - startPosition.y);
        for (let i = 1; i < rootSegments.length; i += 1) {
            const endPosition = Vec2.add(rootSegments[i].endPosition, options.positionOffset);
            context.lineTo(endPosition.x, context.canvas.height - endPosition.y);
        }
        context.stroke();
    }

    // restore the context
    context.lineWidth = oldLineWidth;
    context.lineCap = oldLineCap;
    context.strokeStyle = oldStrokeStyle;
    context.fillStyle = oldFillStyle;
}

type FlowerRenderingOptions = {
    positionOffset: Vec2;

    carpelSizeFraction: number;
    carpelBorderWidth: number;
    carpelColor: string;
    carpelBorderColor: string;

    petalWidth: number;
    petalBorderWidth: number;

    oddPetalColor: string;
    oddPetalBorderColor: string;

    evenPetalColor: string;
    evenPetalBorderColor: string;
};

function renderFlower(context: CanvasRenderingContext2D, flower: Flower | null, options: FlowerRenderingOptions) {
    if (flower === null) {
        return;
    }

    // save the context
    const oldFillStyle = context.fillStyle;
    const oldLineWidth = context.lineWidth;
    const oldStrokeStyle = context.strokeStyle;
    const oldLineCap = context.lineCap;

    const startPosition = Vec2.add(flower.position, options.positionOffset);

    context.lineCap = 'round';
    for (let i = 0; i < flower.petalCount; i += 1) {
        const angle = i * 360 / flower.petalCount;
        const direction = Vec2.atAngle(new Vec2(0, -1), angle * Math.PI / 180);
        const endPosition = Vec2.add(startPosition, direction.scale(flower.size));

        if (options.petalBorderWidth > 0) {
            context.lineWidth = options.petalWidth + options.petalBorderWidth;
            context.strokeStyle = i % 2 == 0 ? options.evenPetalBorderColor : options.oddPetalBorderColor;
            context.beginPath();
            context.moveTo(startPosition.x, context.canvas.height - startPosition.y);
            context.lineTo(endPosition.x, context.canvas.height - endPosition.y);
            context.stroke();
        }

        context.lineWidth = options.petalWidth;
        context.strokeStyle = i % 2 == 0 ? options.evenPetalColor : options.oddPetalColor;
        context.beginPath();
        context.moveTo(startPosition.x, context.canvas.height - startPosition.y);
        context.lineTo(endPosition.x, context.canvas.height - endPosition.y);
        context.stroke();
    }

    context.lineWidth = options.carpelBorderWidth;
    context.strokeStyle = options.carpelBorderColor;
    context.fillStyle = options.carpelColor;
    context.beginPath();
    context.arc(startPosition.x, context.canvas.height - startPosition.y, flower.size * options.carpelSizeFraction, 0, 2 * Math.PI);
    context.fill();
    if (options.carpelBorderWidth > 0) {
        context.stroke();
    }

    // restore the context
    context.lineWidth = oldLineWidth;
    context.lineCap = oldLineCap;
    context.strokeStyle = oldStrokeStyle;
    context.fillStyle = oldFillStyle;
}

type LeafRenderingOptions = {
    positionOffset: Vec2;
    stemColors: string[];
    colors: string[];
    borderWidth: number;
    borderColor: string;
}
function renderLeftLeaf(context: CanvasRenderingContext2D, position: Vec2, scale: number, options: Pick<LeafRenderingOptions, 'borderColor' | 'borderWidth'> & Record<'color', string>) {
    const oldFillStyle = context.fillStyle;
    const oldLineWidth = context.lineWidth;
    const oldStrokeStyle = context.strokeStyle;

    const xScale = (1 / 28) * scale;
    const yScale = (1 / 30) * scale;

    const xOffset = position.x - (15 * xScale - xScale);
    const yOffset = context.canvas.height - position.y - (9 * yScale - yScale);

    context.lineWidth = options.borderWidth;
    context.strokeStyle = options.borderColor;
    context.fillStyle = options.color;
    context.beginPath();
    context.lineTo(17 * xScale + xOffset, yScale + yOffset);
    context.lineTo(6 * xScale + xOffset, 2 * yScale + yOffset);
    context.lineTo(3 * xScale + xOffset, 10 * yScale + yOffset);
    context.lineTo(xScale + xOffset, 30 * yScale + yOffset);
    context.lineTo(17 * xScale + xOffset, 19 * yScale + yOffset);
    context.lineTo(26 * xScale + xOffset, 13 * yScale + yOffset);
    context.lineTo(28 * xScale + xOffset, 7 * yScale + yOffset);
    context.lineTo(15 * xScale + xOffset, 9 * yScale + yOffset);
    context.closePath();
    context.stroke();
    context.fill();

    // reset styles
    context.lineWidth = oldLineWidth;
    context.strokeStyle = oldStrokeStyle;
    context.fillStyle = oldFillStyle;
}

function renderRightLeaf(context: CanvasRenderingContext2D, position: Vec2, scale: number, options: Pick<LeafRenderingOptions, 'borderColor' | 'borderWidth'> & Record<'color', string>) {
    const oldFillStyle = context.fillStyle;
    const oldLineWidth = context.lineWidth;
    const oldStrokeStyle = context.strokeStyle;

    const xScale = (1 / 30) * scale;
    const yScale = (1 / 48) * scale;

    const xOffset = position.x - (16 * xScale - xScale);
    const yOffset = context.canvas.height - position.y - (20 * yScale - yScale);

    context.lineWidth = options.borderWidth;
    context.strokeStyle = options.borderColor;
    context.fillStyle = options.color;

    context.beginPath();
    context.lineTo(xScale + xOffset, 10 * yScale + yOffset);
    context.lineTo(16 * xScale + xOffset, 20 * yScale + yOffset);
    context.lineTo(19 * xScale + xOffset, yScale + yOffset);
    context.lineTo(30 * xScale + xOffset, 15 * yScale + yOffset);
    context.lineTo(28 * xScale + xOffset, 48 * yScale + yOffset);
    context.lineTo(4 * xScale + xOffset, 29 * yScale + yOffset);
    context.closePath();
    context.stroke();
    context.fill();

    // reset styles
    context.lineWidth = oldLineWidth;
    context.strokeStyle = oldStrokeStyle;
    context.fillStyle = oldFillStyle;
}

main();