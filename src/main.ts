import type { Flower } from "./Flower";
import type { Leaf } from "./Leaf";
import { Plant } from "./Plant";
import { Random } from "./Random";
import { Vec2 } from "./Vec2";
import { World } from "./World";


const offset = new Vec2(0, -10);

function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const deadX = document.getElementById('dead-x') as HTMLDivElement;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    const ghostCanvas = document.getElementById('ghost-canvas') as HTMLCanvasElement;
    const ghostContext = ghostCanvas.getContext('2d') as CanvasRenderingContext2D;

    const random = new Random();
    const world = new World(random, canvas.width, canvas.height);

    let update = false;
    // @ts-ignore
    window.gr = 0.75;

    let ghostRendered = false;
    let lastTimestamp: DOMHighResTimeStamp | undefined = undefined;
    function gameLoop(timestamp: DOMHighResTimeStamp) {
        if (lastTimestamp === undefined) {
            lastTimestamp = timestamp;
        }
        const deltaTime = timestamp - lastTimestamp;

        try {
            if (update === true) {
                world.update(deltaTime);
            }

            render(context, world);
            if (world.plant.state === 'dead') {
                if (ghostRendered === false) {
                    renderGhostPlant(ghostContext, world, world.plant);
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
    });

    // Hook up the restart button
    const resetButton = document.getElementById('btn-reset') as HTMLButtonElement;
    resetButton.addEventListener('click', function () {
        update = false;

        deadX.style.display = 'none';
        ghostCanvas.style.display = 'none';
        ghostContext.clearRect(0, 0, ghostContext.canvas.width, ghostContext.canvas.height);
        ghostRendered = false;

        world.reset();
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
    });

    // Hook up the sun-hour slider
    const sunHourSlider = document.getElementById('sld-sun-hours') as HTMLInputElement;
    sunHourSlider.value = (world.environment.lightHours).toString(10);
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

        world.setSunHours(value);
    });

    // Hook up the temerature slider
    const temperatureSlider = document.getElementById('sld-temperature') as HTMLInputElement;
    temperatureSlider.value = (world.environment.temperature).toString(10);
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

        world.setTemperature(value);
    });

    // Hook up the carbon dioxide slider
    const carbonDioxideSlider = document.getElementById('sld-carbon-dioxide') as HTMLInputElement;
    carbonDioxideSlider.value = (world.resources.carbonDioxide).toString(10);
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

        world.setCarbonDioxide(value);
    });

    // Hook up the water slider
    const waterSlider = document.getElementById('sld-water') as HTMLInputElement;
    waterSlider.value = (world.resources.water).toString(10);
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

        world.setWater(value);
    });

    // Hook up the nutrients slider
    const nutrientsSlider = document.getElementById('sld-nutrients') as HTMLInputElement;
    nutrientsSlider.value = (world.resources.nutrients).toString(10);
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

    renderPlant(context, world, world.plant);
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

function renderPlant(context: CanvasRenderingContext2D, world: World, plant: Plant) {
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
        color: "#008000",
        borderWidth: 2,
        borderColor: "#000000"
    });

    renderLeafs(context, world, plant.leafs, {
        positionOffset: offset,

        color: "#008000",
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

function renderGhostPlant(context: CanvasRenderingContext2D, world: World, plant: Plant) {
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
        color: ghostColor,
        borderWidth: 0,
        borderColor: "#00000000"
    });

    renderLeafs(context, world, plant.leafs, {
        positionOffset: offset,

        color: ghostColor,
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

function renderLeafs(context: CanvasRenderingContext2D, world: World, leafs: Leaf[], options: LeafRenderingOptions) {
    for (const leaf of leafs) {
        if (leaf.area <= 0) {
            continue;
        }

        const position = leaf.stemSegment.endPosition;
        const isLeftLeaf = position.x <= world.middleX;

        const offsetPosition = Vec2.add(position, options.positionOffset);
        if (isLeftLeaf) {
            renderLeftLeaf(context, offsetPosition, leaf.area, {
                color: options.color,
                borderColor: options.borderColor,
                borderWidth: options.borderWidth,
            });
        } else {
            renderRightLeaf(context, offsetPosition, leaf.area, {
                color: options.color,
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
    color: string;
    borderColor: string;
};

function renderStem(context: CanvasRenderingContext2D, plant: Plant, options: StemRenderingOptions) {
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
        color: options.color,
    });
}

function _renderStem(context: CanvasRenderingContext2D, plant: Plant, options: Pick<StemRenderingOptions, 'positionOffset' | 'thickness' | 'color'>) {
    if (plant.stemGSegments.length === 0 && plant.leafs.length === 0) {
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
    if (plant.stemGSegments.length > 0) {
        const startPosition = Vec2.add(plant.stemGSegments[0].startPosition, options.positionOffset);
        context.beginPath();
        context.moveTo(startPosition.x, context.canvas.height - startPosition.y);
        for (let i = 1; i < plant.stemGSegments.length; i += 1) {
            const endPosition = Vec2.add(plant.stemGSegments[i].endPosition, options.positionOffset);
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
    if (plant.rootGSegments.length === 0) {
        return;
    }

    // save the context
    const oldFillStyle = context.fillStyle;
    const oldLineWidth = context.lineWidth;
    const oldStrokeStyle = context.strokeStyle;
    const oldLineCap = context.lineCap;

    context.lineCap = 'round';
    for (const rootSegments of plant.rootGSegments) {
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
    color: string;
    borderWidth: number;
    borderColor: string;
}
function renderLeftLeaf(context: CanvasRenderingContext2D, position: Vec2, scale: number, options: Pick<LeafRenderingOptions, 'color' | 'borderColor' | 'borderWidth'>) {
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

function renderRightLeaf(context: CanvasRenderingContext2D, position: Vec2, scale: number, options: Pick<LeafRenderingOptions, 'color' | 'borderColor' | 'borderWidth'>) {
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