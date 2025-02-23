(async function(){

const CONFIG = JSON.parse(await getText("config.json"));

// Priority:
// 1. Specified value
// 2. Value from parent (if property is inherited) or DEFAULTS (if root)
// 3. Default value (from DEFAULT_PROPERTIES)
// 4. Global defaults (GLOBAL_DEFAULTS)

//const INHERITED = CONFIG.properties.inherit; // properties that can be inherited
const GLOBAL_DEFAULTS = CONFIG.properties.globalDefaults;
const DEFAULTS = CONFIG.properties.rootDefaults;
const DEFAULT_PROPERTIES = CONFIG.properties.defaults;

const SKYLTTYPER = CONFIG.signTypes;
const SYMBOLER = CONFIG.symbols;

// Samtliga designer sparas i "nedre kant"-form, dvs.
// i en orientering motsvarande klammern i skylt
// F9 (samlingsmärke för vägvisning).
const BORDER_FEATURES = CONFIG.borderFeatures;

const TEMPLATES = {
    "avfart": (no = "1") => ({
        "type": "skylt",
        "properties": {
            "padding": 0,
            "background": "#aaa",
            "color": "black"
        },
        "elements": [
            {
                "type": "skylt",
                "properties": {
                    "background": "#fd0",
                    "borderWidth": 4,
                    "borderRadius": 22,
                    "padding": [5, 0]
                },
                "elements": [
                    {
                        "type": "symbol",
                        "properties": { "type": "exit" }
                    },
                    {
                        "type": "text",
                        "properties": {
                            "value": no
                        }
                    }
                ]
            }
        ]
    }),
    "vagnr": (no = "000") => ({
        "type": "vagnr",
        "properties": {
            "value": no
        }
    }),
    "symgroup": (...s) => ({
        "type": "skylt",
        "properties": {"padding": 0, "xSpacing": 0, "borderWidth": [3, 0, 0, 0], "borderRadius": 0, "color": "black", "background": "white"},
        "elements": s.map(x => ({"type": "symbol", "properties": {"type": Array.isArray(x) ? x[0] : x, "variant": Array.isArray(x) ? x[1] : undefined , "borderWidth": [0, 3, 3, 3], "padding": 1}}))
    })
};

function to4EForm(data){
    if(!Array.isArray(data)) data = [ data, data ];
    if(data.length != 4) data = [ data[0], data[1], data[0], data[1] ];
    return data;
}

class BorderElement{
    constructor(featureName, bw, brA, brB, sideLength){
        let w0 = BORDER_FEATURES[featureName].w,
            h0 = BORDER_FEATURES[featureName].h,
            cvr = !!BORDER_FEATURES[featureName].cover;

        if(cvr) w0 = sideLength - bw;

        this.env = BorderElement.calculateEnv(featureName, bw, brA, brB, w0);

        if(cvr) h0 = mathEval(h0, this.env);

        this.env["h"] = h0;

        this.w = w0 + bw;
        this.h = h0 + bw;
        this.n = featureName;
    }

    static calculateEnv(featureName, bw, brA, brB, w0){
        let env = {bra: brA, brb: brB, bw: bw, w: w0};

        let feature = BORDER_FEATURES[featureName];
        if(!Array.isArray(feature.vars)) return env;

        for(let i = 0; i < feature.vars.length; i++){
            env[feature.vars[i][0]] = mathEval(feature.vars[i][1], env);
        }

        return env;
    }
}

class BorderDimensions{
    constructor(heights){
        this.h = [0, 0, 0, 0].map((_, i) => heights[i]);
        this.el = [null, null, null, null];
    }

    set(i, el){
        this.el[i] = el;
        this.h[i] = Math.floor(el.h);
    }
}

class SignElement{
    static borderSize(innerWidth, innerHeight, properties){
        let bs = new BorderDimensions(properties.borderWidth);

        if(properties.borderFeatures["left"] !== undefined)
            bs.set(0, new BorderElement(properties.borderFeatures["left"], properties.borderWidth[0], properties.borderRadius[0], properties.borderRadius[3], innerHeight + properties.borderWidth[1] + properties.borderWidth[3]));

        if(properties.borderFeatures["right"] !== undefined)
            bs.set(2, new BorderElement(properties.borderFeatures["right"], properties.borderWidth[2], properties.borderRadius[2], properties.borderRadius[1], innerHeight + properties.borderWidth[1] + properties.borderWidth[3]));

        if(properties.borderFeatures["top"] !== undefined)
            bs.set(1, new BorderElement(properties.borderFeatures["top"], properties.borderWidth[1], properties.borderRadius[1], properties.borderRadius[0], innerWidth + properties.borderWidth[0] + properties.borderWidth[2]));

        if(properties.borderFeatures["bottom"] !== undefined)
            bs.set(3, new BorderElement(properties.borderFeatures["bottom"], properties.borderWidth[3], properties.borderRadius[3], properties.borderRadius[2], innerWidth + properties.borderWidth[0] + properties.borderWidth[2]));

        return bs;
    }

    static calculateAlignmentOffset(alignMode, innerWidth, outerWidth){
        switch(alignMode){
            case "center":
                return Math.floor((outerWidth - innerWidth) / 2);
            case "right":
                return outerWidth - innerWidth;
            default:
                // "left" or unknown value (left-aligned is the default)
                return 0;
        }
    }

    static renderBorderFeature(ctx, x0, y0, featureName, side, properties, bs, borderBoxInnerW, innerHeight){
        let color = properties.color,
            background = properties.background;

        let lr = (side === "left" || side === "right");
        let bri = lr ? (side === "left" ? 0 : 2) : (side === "top" ? 1 : 3);

        let bw = properties.borderWidth[bri];
        let s = [bs.el[bri].w, bs.el[bri].h];

        let feature = BORDER_FEATURES[featureName];

        let w = lr ? s[1] : s[0],
            h = lr ? s[0] : s[1];

        switch(side){
            case "bottom":
                y0 += innerHeight + bs.h[1];
            case "top":
                x0 += bs.h[0] + Math.floor((borderBoxInnerW - w) / 2);
                break;
            case "right":
                x0 += borderBoxInnerW + bs.h[0];
            default:
                y0 += bs.h[1] + Math.floor((innerHeight - h) / 2);
                break;
        }

        // left:    cos 0   sin -1
        // top:     cos -1  sin 0
        // right:   cos 0   sin 1
        // bottom:  cos 1   sin 0

        let sr = lr ? (side === "left" ? 1 : (-1)) : 0, cr = lr ? 0 : (side === "top" ? (-1) : 1);
        let [a, b] = [(s[0] - bw) / 2, (s[1] - bw) / 2];

        let tm = new DOMMatrix().translateSelf(x0 + w / 2, y0 + h / 2).multiplySelf(new DOMMatrix([
            cr, sr, -sr, cr, -a*cr + b*sr, -a*sr - b*cr
        ]));

        //ctx.fillStyle="#000";
        //ctx.fillRect(x0, y0, w, h);

        ctx.fillStyle = background;
        ctx.fillRect(x0 + (side === "left" ? (s[1] - bw) : 0) + (lr ? 0 : (bw/2)), y0 + (side === "top" ? (s[1] - bw) : 0) + (lr ? (bw/2) : 0), lr ? bw : (s[0] - bw), lr ? (s[0] - bw) : bw);

        ctx.lineWidth = bw;

        feature.paths.forEach(path => {
            let p = new Path2D();
            p.addPath(new Path2D(parseVarStr(path.p, bs.el[bri].env)), tm);

            if(path.f !== undefined){
                ctx.fillStyle = [color, background][Math.abs(path.f)-1];
                if(path.f > 0 || properties.fillCorners) ctx.fill(p);
            }

            if(path.s !== undefined){
                ctx.strokeStyle = [color, background][Math.abs(path.s)-1];
                if(path.s > 0 || properties.fillCorners) ctx.stroke(p);
            }
        });
    }

    constructor(data, parentProperties){
        while(data.type.startsWith("#")){
            let templateName = data.type.slice(1);
            if(!TEMPLATES[templateName]){
                alert("ERROR: Unknown template \"" + templateName + "\".")
                break;
            }

            let template = TEMPLATES[templateName](...(data.params || []));
            Object.assign(template.properties, data.properties);
            data = template;
        }

        this.type = data.type;

        let prop = Object.assign(
            {},
            GLOBAL_DEFAULTS,
            DEFAULT_PROPERTIES[data.type.startsWith(".") ? "." : data.type],
            parentProperties === null ? DEFAULTS : parentProperties,
            data.properties
        );

        this.properties = Object.assign(prop, {
            padding: to4EForm(prop.padding),
            borderRadius: to4EForm(prop.borderRadius),
            borderWidth: to4EForm(prop.borderWidth)
        });

        let inh = this._getInhProperties();

        this.children = (data.elements || []).map(element => new SignElement(element, inh));

        this.nodes = (data.nodes || {});
        Object.keys(this.nodes).forEach(key => this.nodes[key].signelement = new SignElement(this.nodes[key].data, inh));
    }

    _getInhProperties(){
        const { background, borderRadius, color, font, lineHeight, lineSpacing } = this.properties;
        return { background, borderRadius, color, font, lineHeight, lineSpacing };
    }

    render(){
        let firstLastCenter = null; // [cx_first, cy_firstrow, cx_last, cy_lastrow]

        let padding = Array.from(this.properties.padding);

        let width = 0, height = 0, maxHeight = 0;
        let renderPromise = (ctx, x0, y0, _) => Promise.resolve();

        if(this.type == "skylt"){
            let w = [0], h = [0], j = 0;

            let totalLineSpacing = 0;

            let ch = this.children.map((c, i) => {
                let c2 = { isn: c.type == "newline" };

                if(c2.isn || (i > 0 && this.properties.blockDisplay)){
                    j++;
                    w.push(0);
                    h.push(0);
                    totalLineSpacing += (this.properties.blockDisplay ? this.properties.lineSpacing : c.properties.lineSpacing);
                }

                c2.r = c.render();
                c2.row = j;
                c2.bs = c2.r.bs;

                if(!c2.isn){
                    if(w[j] > 0){
                        w[j] += this.properties.xSpacing;
                    }

                    c2.x = w[j];
                    w[j] += c2.r.w + c2.bs[0] + c2.bs[2];

                    let h0 = c2.r.h + c2.bs[1] + c2.bs[3];
                    if(h0 > h[j]) h[j] = h0;
                }

                return c2;
            });

            width = Math.max(...w);
            height = h.reduce((a, b) => a + b, totalLineSpacing);

            ch = ch.map(c2 => {
                if(!c2.isn && !this.properties.blockDisplay){
                    c2.x += SignElement.calculateAlignmentOffset(this.properties.alignContents, w[c2.row], width);
                }

                return c2;
            });

            // mitt-x (element), se även if-sats nedan
            // mitt-y (rad), se även if-sats nedan
            firstLastCenter = [
                padding[0] + ch[0].x + ch[0].bs[0],
                padding[1],
                padding[0] + ch[ch.length - 1].x + ch[ch.length - 1].bs[0],
                height + padding[1]
            ];

            if(this.properties.passAnchor){
                firstLastCenter[0] += ch[0].r.flc[0];
                firstLastCenter[1] += ch[0].bs[1] + ch[0].r.flc[1];
                firstLastCenter[2] += ch[ch.length - 1].r.flc[2];
                firstLastCenter[3] += ch[ch.length - 1].bs[1] - h[h.length - 1] + ch[ch.length - 1].r.flc[3];
            }else{
                firstLastCenter[0] += Math.floor(ch[0].r.w / 2);
                firstLastCenter[1] += Math.floor(h[0] / 2);
                firstLastCenter[2] += Math.floor(ch[ch.length - 1].r.w / 2);
                firstLastCenter[3] += Math.floor(-h[h.length - 1] / 2);
            }

            let y = 0;

            renderPromise = (ctx, x0, y0, _) => Promise.all(ch.map((c2, i) => {
                if(c2.isn || (i > 0 && this.properties.blockDisplay)){
                    y += (this.properties.blockDisplay ? this.properties.lineSpacing : this.children[i].properties.lineSpacing);
                    y += h[c2.row - 1];
                }

                if(c2.isn) return;

                let dx = 0, iw = this.properties.blockDisplay ? (width - c2.bs[0] - c2.bs[2]) : c2.r.w;

                if(this.properties.blockDisplay){
                    dx += SignElement.calculateAlignmentOffset(this.children[i].properties.alignContents, w[c2.row], iw + c2.bs[0] + c2.bs[2]);
                }

                return c2.r.doRender(
                    ctx,
                    x0 + padding[0] + c2.x, y0 + padding[1] + y,
                    dx,
                    this.children[i].properties,
                    this.properties,
                    h[c2.row] - c2.bs[1] - c2.bs[3],
                    iw
                );
            }));
        }else if(this.type == "vagnr" || this.type == "text"){
            let ctx_temp = document.createElement("canvas").getContext("2d");
            ctx_temp.font = "32px " + this.properties.font;

            let box = ctx_temp.measureText(this.properties.value);

            width = Math.floor(box.width);
            height = this.properties.lineHeight;

            renderPromise = (ctx, x0, y0, _) => new Promise(res => {
                if(this.properties.dashedInset){
                    let bw = this.properties.borderWidth;

                    roundedFrame(
                        ctx,
                        x0 + 2*bw[0], y0 + 2*bw[1],
                        width + padding[0] + padding[2] - 2*bw[0] - 2*bw[2], height + padding[1] + padding[3] - 2*bw[1] - 2*bw[3],
                        bw,
                        this.properties.color,
                        this.properties.borderRadius,
                        [10, 10]
                    );
                }

                ctx.font = "32px " + this.properties.font;
                ctx.textBaseline = "middle";
                ctx.textAlign = "left";

                ctx.fillStyle = this.properties.color;
                ctx.fillText(this.properties.value, x0 + padding[0], y0 + firstLastCenter[1]);

                res();
            });
        }else if(this.type == "symbol"){
            let symbolType = SYMBOLER[this.properties.type];
            let img = document.createElement("img");

            width = img.width = symbolType.width;
            height = symbolType.height[0];
            img.height = maxHeight = symbolType.height[1];

            renderPromise = (ctx, x0, y0, maxInnerHeight) => new Promise((res, rej) => {
                img.addEventListener("load", () => {
                    ctx.drawImage(
                        img,
                        0, 0,
                        img.width, maxInnerHeight - padding[1] - padding[3],
                        x0 + padding[0], y0 + padding[1],
                        img.width, maxInnerHeight - padding[1] - padding[3]
                    );
                    res();
                });
                img.addEventListener("error", rej);

                let url = "svg/symbol/" + window.encodeURIComponent(this.properties.type) + ".svg";

                getText(url).then(xml => {
                    img.src = "data:image/svg+xml;utf8,"
                        + window.encodeURIComponent(String(xml).replace(/currentColor/g, this.properties.color))
                        + "#" + window.encodeURIComponent(this.properties.variant || symbolType.default);
                });
            });
        }else if(this.type == "newline"){
            width = 0;
            height = 0;
        }else if(this.type.startsWith(".")){
            let t = SKYLTTYPER[this.type.slice(1)];
            let keys = Object.keys(t.nodes).sort().filter(nodeName => !!this.nodes[nodeName]);

            let svg = document.createElement("img");
            svg.width = t.width;
            svg.height = t.height;

            let svgBox = Array.from(t.core);
            keys.forEach(nodeName => {
                svgBox[0] = Math.min(svgBox[0], t.nodes[nodeName].x[0]);
                svgBox[1] = Math.max(svgBox[1], t.nodes[nodeName].x[1]);
                svgBox[2] = Math.min(svgBox[2], t.nodes[nodeName].y[0]);
                svgBox[3] = Math.max(svgBox[3], t.nodes[nodeName].y[1]);
            });

            let boundingBox = [
                svgBox[0] * t.width,
                svgBox[1] * t.width,
                svgBox[2] * t.height,
                svgBox[3] * t.height
            ].map(Math.floor);

            // fonts and svg loaded successfully
            let r = keys.map(nodeName => {
                let n = this.nodes[nodeName];
                let s = n.signelement;

                let tn = t.nodes[nodeName];

                n.anchor = Object.assign({ "x": tn.ax, "y": tn.ay }, n.anchor);

                let result = s.render();
                let bs = result.bs;

                let rse = [ result.w + bs[0] + bs[2], result.h + bs[1] + bs[3] ];

                let leftX = tn.x.map(x => x * t.width).map(Math.floor), topY = tn.y.map(y => y * t.height).map(Math.floor);

                switch(n.anchor.x){
                    case "right":
                        leftX = leftX[1] - rse[0];
                        break;
                    case "center":
                        leftX = Math.floor((leftX[0] + leftX[1]) / 2 - Math.floor(rse[0] / 2));
                        break;
                    case "center-first":
                        leftX = Math.floor((leftX[0] + leftX[1]) / 2) - result.flc[0];
                        break;
                    case "center-last":
                        leftX = Math.floor((leftX[0] + leftX[1]) / 2) - result.flc[2];
                        break;
                    default:
                        leftX = leftX[0];
                }

                switch(n.anchor.y){
                    case "bottom":
                        topY = topY[1] - rse[1];
                        break;
                    case "middle":
                        topY = Math.floor((topY[0] + topY[1]) / 2) - Math.floor(rse[1] / 2);
                        break;
                    case "middle-first":
                        topY = Math.floor((topY[0] + topY[1]) / 2) - result.flc[1] - bs[1];
                        break;
                    case "middle-last":
                        topY = Math.floor((topY[0] + topY[1]) / 2) - result.flc[3] - bs[1];
                        break;
                    default:
                        topY = topY[0];
                }

                boundingBox = [
                    Math.min(boundingBox[0], leftX),
                    Math.max(boundingBox[1], leftX + rse[0]),
                    Math.min(boundingBox[2], topY),
                    Math.max(boundingBox[3], topY + rse[1])
                ];

                return { renderPromise: result, x: leftX, y: topY, p: s.properties };
            });

            width = boundingBox[1] - boundingBox[0];
            height = boundingBox[3] - boundingBox[2];

            renderPromise = (ctx, x0, y0, _) => Promise.all(r.map(res => {
                let x1 = res.x - boundingBox[0],
                    y1 = res.y - boundingBox[2];

                let dx = 0;

                return res.renderPromise.doRender(ctx, x0 + padding[0] + x1, y0 + padding[1] + y1, dx, res.p, this.properties, res.renderPromise.h);
            })).then(() => {
                if(t.width == 0 || t.height == 0) return;

                svgBox[0] = Math.min(1, Math.max(0, boundingBox[0] / t.width));
                svgBox[1] = Math.max(0, Math.min(1, boundingBox[1] / t.width));
                svgBox[2] = Math.min(1, Math.max(0, boundingBox[2] / t.height));
                svgBox[3] = Math.max(0, Math.min(1, boundingBox[3] / t.height));

                let crop = [
                    svgBox[0] * t.width,
                    svgBox[2] * t.height,
                    (svgBox[1] - svgBox[0]) * t.width,
                    (svgBox[3] - svgBox[2]) * t.height
                ]; // [x0, y0, w, h]

                return new Promise((resolve, reject) => {
                    svg.onload = resolve;
                    svg.onerror = reject;
                    svg.src = "svg/" + this.type.slice(1) + ".svg#" + keys.join("_");
                }).then(() => {
                    let svgRasterized = document.createElement("canvas");
                    Object.assign(svgRasterized, { width: t.width, height: t.height });
                    svgRasterized.getContext("2d").drawImage(svg, 0, 0, t.width, t.height);

                    ctx.drawImage(
                        svgRasterized,
                        crop[0], crop[1], // sx, sy
                        crop[2], crop[3], // sw, sh
                        x0 + this.properties.padding[0] - boundingBox[0] + crop[0], // dx
                        y0 + this.properties.padding[1] - boundingBox[2] + crop[1], // dy
                        crop[2], crop[3] // dw, dh
                    );

                    return;
                });
            });
        }else{
            alert("Fel!");
        }

        let bs = SignElement.borderSize(width + padding[0] + padding[2], height + padding[1] + padding[3], this.properties);

        if(firstLastCenter === null){
            firstLastCenter = [
                Math.floor((width + padding[0] + padding[2]) / 2),
                Math.floor((height + padding[1] + padding[3]) / 2)
            ];
            firstLastCenter.push(...firstLastCenter);
        }

        if(maxHeight < height) maxHeight = height;

        return {
            flc: firstLastCenter,
            w: width + padding[0] + padding[2],
            h: height + padding[1] + padding[3],
            bs: bs.h,
            doRender: async (ctx, x0, y0, dx, prop, parentProperties = {}, maxInnerHeight, iw = 0) => {
                const dy = 0;
                const innerWidth = iw === 0 ? (width + padding[0] + padding[2]) : iw;
                let innerHeight = height + padding[1] + padding[3];

                if(this.properties.grow && innerHeight < maxInnerHeight){
                    innerHeight = Math.min(maxInnerHeight, padding[1] + padding[3] + maxHeight);
                }

                switch (parentProperties.alignContentsV) {
                    case "middle":
                        y0 += Math.floor((maxInnerHeight - innerHeight) / 2);
                        break;
                    case "bottom":
                        y0 += maxInnerHeight - innerHeight;
                        break;
                }

                // tag bort rundade hörn på sidor med hela kantutsmyckningar
                let bfs = ["left", "top", "right", "bottom"].map(s => {
                    let bf = prop.borderFeatures[s];
                    return bf !== undefined && BORDER_FEATURES[bf].cover; // cover => hel, täcker hela kantens längd
                });

                let br = Array.from(prop.borderRadius);

                for(let i = 0; i < 4; i++){
                    if(bfs[i] || bfs[(i + 1) % 4]) br[i] = 0;
                }

                roundedFill(
                    ctx,
                    x0 + bs.h[0], y0 + bs.h[1],
                    innerWidth, innerHeight,
                    prop.borderWidth.map((x, i) => bfs[i] ? 0 : x),
                    br,
                    prop.background,
                    !!prop.fillCorners
                );

                await renderPromise(ctx, x0 + dx + bs.h[0], y0 + dy + bs.h[1], innerHeight);

                roundedFrame(
                    ctx,
                    x0 + bs.h[0], y0 + bs.h[1],
                    innerWidth, innerHeight,
                    prop.borderWidth.map((x, i) => bfs[i] ? 0 : x),
                    prop.color,
                    br
                );

                Object.entries(prop.borderFeatures).forEach(feature => {
                    SignElement.renderBorderFeature(ctx, x0, y0, feature[1], feature[0], prop, bs, innerWidth, innerHeight);
                });
            }
        };
    }
}

const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

const tratex = new FontFace(
    "Tratex",
    "url(TratexSvart-Regular.otf)",
);

const tratexVersal = new FontFace(
    "TratexVersal",
    "url(TRATEXPOSVERSAL-POSVERSAL.otf)",
);

document.fonts.add(tratex);
document.fonts.add(tratexVersal);

Promise.all([tratex.load(), tratexVersal.load()]).then(() => {
    let url = new URL(window.location.href);
    if(!url.searchParams.has("data")) return;

    let data = JSON.parse(url.searchParams.get("data"));

    let sign = new SignElement(data, null);
    let r = sign.render();

    let bs = r.bs;
    Object.assign(canvas, { width: r.w + bs[0] + bs[2], height: r.h + bs[1] + bs[3] });

    r.doRender(ctx, 0, 0, 0, sign.properties, {}, r.h);
});

})();