// candy-svg-custom.js

// 定义一个变量来存储加载的 SVG 数据
let customSvgPathData = "";
let actualSvgBBoxX = 0;
let actualSvgBBoxY = 0;
let actualSvgBBoxWidth = 0;
let actualSvgBBoxHeight = 0;

// 异步加载 SVG 文件
async function loadSvgData() {
    try {
        // 假设 star.svg 文件在你的根目录或与JS文件相同的目录
        const response = await fetch('https://raw.githubusercontent.com/ttuuhcsj545/txt/refs/heads/main/1314467.svg');
        const svgText = await response.text();

        // 创建一个临时的DOM元素来解析SVG字符串
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgElement = svgDoc.documentElement; // 获取 <svg> 元素
        const pathElement = svgElement.querySelector('path'); // 获取 <path> 元素

        if (pathElement) {
            customSvgPathData = pathElement.getAttribute('d');

            // 从 viewBox 属性解析边界信息
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(' ').map(Number);
                if (parts.length === 4) {
                    actualSvgBBoxX = parts[0];
                    actualSvgBBoxY = parts[1];
                    actualSvgBBoxWidth = parts[2];
                    actualSvgBBoxHeight = parts[3];
                }
            } else {
                // 如果没有 viewBox，需要像之前一样动态计算
                // 这在加载外部SVG时不太常见，因为好的SVG通常有viewBox
                // 为了健壮性，这里保留，但在实际应用中更依赖viewBox
                const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                tempSvg.style.position = "absolute";
                tempSvg.style.visibility = "hidden";
                document.body.appendChild(tempSvg);

                const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                tempPath.setAttribute("d", customSvgPathData);
                tempSvg.appendChild(tempPath);

                const bbox = tempPath.getBBox();
                actualSvgBBoxX = bbox.x;
                actualSvgBBoxY = bbox.y;
                actualSvgBBoxWidth = bbox.width;
                actualSvgBBoxHeight = bbox.height;

                document.body.removeChild(tempSvg);
            }

            console.log("SVG数据加载成功！");
            console.log("pathData:", customSvgPathData);
            console.log("bbox:", { x: actualSvgBBoxX, y: actualSvgBBoxY, width: actualSvgBBoxWidth, height: actualSvgBBoxHeight });

            // SVG 数据加载完成后，再初始化 CursorSpecialEffects
            const cursorSpecialEffects = new CursorSpecialEffects();
            cursorSpecialEffects.init();

        } else {
            console.error("SVG文件中未找到 <path> 元素！");
        }
    } catch (error) {
        console.error("加载 SVG 文件失败:", error);
    }
}

// 在脚本开始时调用加载函数
loadSvgData();

// 以下是您的 Circle, Boom, CursorSpecialEffects 类，
// 它们需要访问上面加载的 customSvgPathData 和 bbox 变量。
// 所以这些类应该在 loadSvgData 成功后才被实例化。
// 理想情况下，您可以在loadSvgData的then/catch块中实例化它们。

class Circle {
    constructor({ origin: t, speed: i, color: e, angle: s, svgContainer: n, maxRenderCount: m }) {
        this.origin = t;
        this.position = { ...this.origin };
        this.color = e;
        this.speed = i;
        this.angle = s;
        this.svgContainer = n;
        this.renderCount = 0;
        this.maxRenderCount = m;

        // 粒子的最终显示大小
        const desiredParticleSize = 5;

        // **从全局变量中获取加载的真实 SVG 尺寸**
        const originalSvgLongestSide = Math.max(actualSvgBBoxWidth, actualSvgBBoxHeight);
        const initialScale = desiredParticleSize / originalSvgLongestSide;

        // 计算 SVG 路径中心相对于其局部坐标系原点的偏移
        const centerOffsetX = actualSvgBBoxWidth / 2 + actualSvgBBoxX;
        const centerOffsetY = actualSvgBBoxHeight / 2 + actualSvgBBoxY;

        this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.svgElement.setAttribute("d", customSvgPathData); // 使用加载的路径数据
        this.svgElement.setAttribute("fill", this.color);

        this.svgElement.style.willChange = "transform, opacity";
        this.svgElement.style.transition = "opacity 0.5s ease-out";

        this.svgContainer.appendChild(this.svgElement);

        this.draw();
    }

    draw() {
        const desiredParticleSize = 10;
        const originalSvgLongestSide = Math.max(actualSvgBBoxWidth, actualSvgBBoxHeight);
        const initialScale = desiredParticleSize / originalSvgLongestSide;
        const centerOffsetX = actualSvgBBoxWidth / 2 + actualSvgBBoxX;
        const centerOffsetY = actualSvgBBoxHeight / 2 + actualSvgBBoxY;

        this.svgElement.style.transform = `
            translate(${this.position.x}px, ${this.position.y}px)
            scale(${initialScale})
            translate(${-centerOffsetX}px, ${-centerOffsetY}px)
        `;

        this.svgElement.style.opacity = Math.max(0, 1 - this.renderCount / this.maxRenderCount);
    }

    move() {
        this.position.x = Math.sin(this.angle) * this.speed + this.position.x;
        this.position.y = Math.cos(this.angle) * this.speed + this.position.y + 0.3 * this.renderCount;
        this.renderCount++;
        this.draw();
    }

    remove() {
        if (this.svgElement.parentNode) {
            this.svgElement.parentNode.removeChild(this.svgElement);
        }
    }
}

// Boom 类保持不变，因为它不直接处理 SVG 路径数据，而是实例化 Circle
class Boom {
    constructor({ origin: t, svgContainer: i, circleCount: e = 10, area: s, maxRenderCount: m }) {
        this.origin = t;
        this.svgContainer = i;
        this.circleCount = e;
        this.area = s;
        this.stop = false;
        this.circles = [];
        this.maxRenderCount = m;
    }

    randomArray(t) {
        const i = t.length;
        return t[Math.floor(i * Math.random())];
    }

    randomColor() {
        const t = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
        return "#" + this.randomArray(t) + this.randomArray(t) + this.randomArray(t) + this.randomArray(t) + this.randomArray(t) + this.randomArray(t);
    }

    randomRange(t, i) {
        return (i - t) * Math.random() + t;
    }

    init() {
        for (let t = 0; t < this.circleCount; t++) {
            const circle = new Circle({
                svgContainer: this.svgContainer,
                origin: this.origin,
                color: this.randomColor(),
                angle: this.randomRange(Math.PI - 1, Math.PI + 1),
                speed: this.randomRange(1, 6),
                maxRenderCount: this.maxRenderCount
            });
            this.circles.push(circle);
        }
    }

    move() {
        this.circles.forEach((t, i) => {
            if (t.position.x < -20 || t.position.x > this.area.width + 20 || t.position.y > this.area.height + 20 || t.svgElement.style.opacity <= 0) {
                t.remove();
                this.circles.splice(i, 1);
            } else {
                t.move();
            }
        });

        if (this.circles.length === 0) {
            this.stop = true;
        }
    }

    draw() {}
}

class CursorSpecialEffects {
    constructor() {
        this.svgContainer = null;
        this.globalWidth = window.innerWidth;
        this.globalHeight = window.innerHeight;
        this.booms = [];
        this.running = false;
        this.maxRenderCount = 100;
    }

    handleMouseDown(t) {
        // 确保 SVG 数据已经加载
        if (!customSvgPathData) {
            console.warn("SVG 数据尚未加载，请稍候...");
            return;
        }

        const i = new Boom({
            origin: {
                x: t.clientX,
                y: t.clientY
            },
            svgContainer: this.svgContainer,
            area: {
                width: this.globalWidth,
                height: this.globalHeight
            },
            maxRenderCount: this.maxRenderCount
        });
        i.init();
        this.booms.push(i);

        if (!this.running) {
            this.run();
        }
    }

    handlePageHide() {
        this.booms.forEach(boom => boom.circles.forEach(circle => circle.remove()));
        this.booms = [];
        this.running = false;
    }

    init() {
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const s = this.svgContainer.style;
        s.position = "fixed";
        s.top = s.left = "0";
        s.zIndex = "999999999999999999999999999999999999999999";
        s.pointerEvents = "none";
        s.width = this.globalWidth + "px";
        s.height = this.globalHeight + "px";

        this.svgContainer.setAttribute("viewBox", `0 0 ${this.globalWidth} ${this.globalHeight}`);
        this.svgContainer.setAttribute("preserveAspectRatio", "xMidYMid slice");

        document.body.append(this.svgContainer);

        window.addEventListener("mousedown", this.handleMouseDown.bind(this));
        window.addEventListener("pagehide", this.handlePageHide.bind(this));

        window.addEventListener("resize", () => {
            this.globalWidth = window.innerWidth;
            this.globalHeight = window.innerHeight;
            this.svgContainer.style.width = this.globalWidth + "px";
            this.svgContainer.style.height = this.globalHeight + "px";
            this.svgContainer.setAttribute("viewBox", `0 0 ${this.globalWidth} ${this.globalHeight}`);
            this.handlePageHide();
        });
    }

    run() {
        this.running = true;

        if (this.booms.length === 0) {
            this.running = false;
            return;
        }

        requestAnimationFrame(this.run.bind(this));

        this.booms.forEach((t, i) => {
            if (t.stop) {
                this.booms.splice(i, 1);
            } else {
                t.move();
            }
        });
    }
}

// 注意：CursorSpecialEffects 的实例化现在被移到 loadSvgData 成功后。
// 这是因为 CursorSpecialEffects 内部的 Circle 类依赖于 customSvgPathData。
// 如果你想在 DOMContentLoaded 后直接初始化 CursorSpecialEffects，
// 那么你需要确保 SVG 数据在 Circle 构造函数被调用时是可用的。
// 对于异步加载，最简单的办法就是将实例化放在加载成功的回调里。