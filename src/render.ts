import { SignRenderer } from "../packages/skyltrendering/src/browser.js";
import { SignProperties, SignPropertyType } from "./properties.js";
import { BASETYPE, SignElementAnchor, SignElementNode, SignElementOptions, SignElementType, SignElementUserProperties } from "../packages/skyltrendering/src/typedefs.js";
import CONFIG from "./config.js"

type Hexadec = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "a" | "b" | "c" | "d" | "e" | "f";

const COLOR_SCHEME: `#${Hexadec}${Hexadec}${Hexadec}`[] = ["#222", "#f33", "#6af", "#8f7", "#fb7", "#c8f", "#fe8", "#aaa", "#8db"];
const ANCHORS_X: (NonNullable<SignElementAnchor['x']>)[] = ["left", "center", "right", "center-first", "center-last"];
const ANCHORS_Y: (NonNullable<SignElementAnchor['y']>)[] = ["top", "middle", "bottom", "middle-first", "middle-last"];

let getJSON = (url: string) => {
    return new Promise((resolve, _) => {
        let req = new XMLHttpRequest();
        req.addEventListener("load", () => {
            resolve(JSON.parse(req.responseText));
        });
        req.open("GET", url);
        req.send();
    });
};

function createHTMLEl(type: string, innerText: string | null, classNames: string[] = []): HTMLElement{
    let el = document.createElement(type);
    if(innerText !== null) el.innerText = innerText;
    if(classNames.length > 0) el.classList.add(...classNames);
    return el;
}

function createSelect<T extends string>(options: readonly T[], onchange?: (newValue: T) => void): HTMLSelectElement{
    let el = document.createElement("select");
    options.forEach(x => el.appendChild(createHTMLEl("option", x)));
    if(onchange !== undefined) el.addEventListener("change", () => onchange(el.value as T));
    return el;
}

function createPropInput(n: keyof SignElementUserProperties, startValue?: any, onchange?: (newValue: any) => void): HTMLInputElement | HTMLSelectElement{
    let propKind = SignProperties[n];
    let propValueInput: HTMLSelectElement | HTMLInputElement;
    if(propKind.options !== null){
        propValueInput = createSelect(propKind.options);
    }else{
        propValueInput = document.createElement("input");

        if(propKind.type === SignPropertyType.NUMBER){
            propValueInput.setAttribute("type", "number");
        }
    }

    if(startValue !== undefined){
        switch(propKind.type){
            case SignPropertyType.NUMBER:
            case SignPropertyType.STRING:
            case SignPropertyType.BOOL:
                propValueInput.value = String(startValue);
                break;
            case SignPropertyType.ANY:
                propValueInput.value = JSON.stringify(startValue);
                break;
        }
    }

    if(onchange !== undefined){
        let f = (propKind.type === SignPropertyType.STRING) ? (() => onchange(propValueInput.value)) : (() => onchange(JSON.parse(propValueInput.value)));
        propValueInput.addEventListener("change", f);
    }
    return propValueInput;
}

class SignElement{
    private type: SignElementType;
    private parentType: SignElementType | null;
    private properties?: SignElementUserProperties;
    private children: SignElement[];
    private params?: any[];

    private allowFlytt: boolean;

    private nodeName?: string;
    private anchor?: SignElementAnchor;

    private expanded: boolean = true;

    constructor(data: SignElementOptions, parentType: SignElementType | null, allowFlytt: boolean, nodeName?: string, nodeAnchor?: SignElementAnchor,){
        this.type = data.type;
        this.parentType = parentType;
        this.properties = data.properties;
        this.children = [];
        this.params = data.params;

        this.allowFlytt = allowFlytt;

        this.nodeName = nodeName;
        this.anchor = nodeAnchor;

        data.elements?.forEach(el => this.children.push(new SignElement(el, data.type, true)));
        Object.entries(data.nodes ?? {}).forEach(entry => {
            this.children.push(new SignElement(entry[1].data, data.type, false, entry[0], entry[1].anchor));
        });
    }

    getBaseType(): BASETYPE{
        switch(this.type){
            case "group":
                return BASETYPE.GROUP;
            case "newline":
                return BASETYPE.NEWLINE;
            case "skylt":
                return BASETYPE.SKYLT;
            case "symbol":
                return BASETYPE.SYMBOL;
            case "text":
                return BASETYPE.TEXT;
            case "vagnr":
                return BASETYPE.VAGNR;
        };

        if(this.type.charCodeAt(0) === 0x2E){
            // `.${string}`
            return BASETYPE.MALL;
        }else{
            // `#${string}`
            return BASETYPE.MAKRO;
        }
    }

    swapChildren(a: number, b: number){
        [this.children[a], this.children[b]] = [this.children[b], this.children[a]];
    }

    propertyEditor(): HTMLElement{
        let el = document.createElement("table");

        // Befintliga egenskaper:

        Object.entries(this.properties ?? {}).forEach((entry: [string, any]) => {
            let n = entry[0] as keyof SignElementUserProperties;

            let propName = createHTMLEl("td", n);

            let propHelp = createHTMLEl("span", "[?]", ["hjalp"]);
            propHelp.addEventListener("click", () => alert(SignProperties[n].help));
            propName.append(document.createTextNode("\xa0"), propHelp);

            let propValue = document.createElement("td");

            propValue.appendChild(createPropInput(n, entry[1], newVal => {
                if(this.properties === undefined) throw new Error("An unexpected error occured.");
                this.properties[n] = newVal;
                updatePreview(false);
            }));

            propValue.appendChild(createHTMLEl("button", "\ud83d\uddd1")).addEventListener("click", () => {
                if(this.properties !== undefined){
                    delete this.properties[n];
                    el.replaceWith(this.propertyEditor());
                    updatePreview(false);
                }
            });

            el.appendChild(document.createElement("tr")).append(propName, propValue);
        });

        // Lägg till egenskaper:

        let props = Object.entries(SignProperties).filter(pr => (this.properties === undefined || !(pr[0] in this.properties))  && !pr[1].disableFor.includes(this.getBaseType()) );
        if(props.length > 0){
            let propValue = document.createElement("td");
            let typVal: HTMLSelectElement = createSelect(props.map(p => p[0]) as (keyof SignElementUserProperties)[], v => {
                let pro = SignProperties[v];

                let propValueInput: HTMLSelectElement | HTMLInputElement = createPropInput(v);
                propValue.replaceChildren(propValueInput);

                let f: () => void = () => {
                    let newVal: any;

                    if(pro.type === SignPropertyType.STRING) newVal = propValueInput.value;
                    else if(pro.type === SignPropertyType.NUMBER) newVal = Number(propValueInput.value);
                    else newVal = JSON.parse(propValueInput.value);

                    if(this.properties === undefined) this.properties = {};

                    this.properties[v] = newVal;
                    updatePreview(false);
                    el.replaceWith(this.propertyEditor());
                };

                propValueInput.addEventListener("keydown", e => {if((e as KeyboardEvent).key === "Enter") f()});

                propValue.appendChild(createHTMLEl("button", "+")).addEventListener("click", f);
            });

            let propName = document.createElement("td");

            typVal.dispatchEvent(new Event("change"));
            propName.appendChild(typVal);

            el.appendChild(document.createElement("tr")).append(propName, propValue);
        }

        return el;
    }

    generateVis(z: number, i: number, parent: SignElement | null): HTMLElement{
        let el = createHTMLEl("div", null, ["skyltelement"]);
        if(this.expanded) el.classList.add("expanded");

        el.style.borderColor = COLOR_SCHEME[z];

        let elHeader = el.appendChild(createHTMLEl("div", null, ["headelement"]));

        let elName = elHeader.appendChild(createHTMLEl("h2", null, ["namnelement"]));

        let elMain = createHTMLEl("div", null, ["dataelement"]);

        let barn = createHTMLEl("div", null, ["skyltbarn"]);

        switch(this.type){
            case "symbol":
                elName.innerHTML = `Symbol: <span style="font-family: monospace">${this.properties?.type}</span>`;
                break;
            case "newline":
                elName.innerText = "(ny rad)";
                break;
            case "text":
            case "vagnr":
                elName.innerText = `${this.type === "text" ? "Text" : "Vägnummer"}: "${this.properties?.value}"`;
                break;
            default:
                elName.innerText = this.type;
                if(this.type.startsWith("#")){
                    // makro
                    let mp = elMain.appendChild(document.createElement("div"));
                    mp.appendChild(createHTMLEl("h3", "Parametrar:"));

                    let mi = mp.appendChild(createHTMLEl("textarea", null, ["paraminput"]) as HTMLTextAreaElement);
                    mi.addEventListener("input", () => {
                        mi.style.removeProperty("height");
                        mi.style.height = `${mi.scrollHeight}px`;
                    });

                    mi.value = JSON.stringify(this.params ?? []);
                    mi.addEventListener("change", () => {
                        this.params = JSON.parse(mi.value);
                        updatePreview(false);
                    });
                    break;
                }

                this.children.forEach((child, i) => barn.appendChild(child.generateVis(z + 1, i, this)));

                let laggTill = createHTMLEl("div", null, ["nyttelement"]);
                laggTill.appendChild(createHTMLEl("h2", "Lägg till..."));

                let laggTillTyp = laggTill.appendChild(createSelect(["skylt", "text", "vagnr", "symbol", "newline", "#makro", ".mall"]));

                let laggTillNod: HTMLSelectElement;

                if(this.type.startsWith(".")){
                    let st = (CONFIG.signTypes ?? {})[this.type.substring(1)];
                    laggTill.appendChild(laggTillNod = createSelect(Object.keys(st.nodes)));
                }

                laggTill.appendChild(createHTMLEl("button", "Lägg till")).addEventListener("click", () => {
                    let newEl: SignElementOptions | null = null;
                    switch(laggTillTyp.value){
                        case "skylt":
                        case "text":
                        case "vagnr":
                        case "symbol":
                        case "newline":
                            newEl = {"type": (laggTillTyp.value as SignElementType)};
                            break;
                        case "#makro":
                            newEl = {"type": `#${prompt("Namn på makro:", "")}`};
                            break;
                        case ".mall":
                            newEl = {"type": `.${prompt("Namn på mall:", "")}`};
                            break;
                        default:
                            throw new Error("Unexpected error.");
                    }
                    if(newEl !== null){
                        if(this.type.startsWith(".")){
                            this.children.push(new SignElement(newEl, this.type, false, laggTillNod.value, {}));
                        }else{
                            this.children.push(new SignElement(newEl, this.type, true));
                        }

                        el.replaceWith(this.generateVis(z, i, parent));
                        updatePreview(false);
                    }
                });

                barn.appendChild(laggTill);
                break;
        }

        if(this.nodeName !== undefined && this.parentType !== null){
            elName.append(createHTMLEl("div", this.nodeName, ["nodelement"]), createHTMLEl("h3", "Positionering"));

            let pt = elMain.appendChild(document.createElement("table"));
            let pt1 = pt.appendChild(document.createElement("tr")),
                pt2 = pt.appendChild(document.createElement("tr"));

            pt1.appendChild(createHTMLEl("td", "Nod:\xa0"));
            pt1.appendChild(createSelect(Object.keys((CONFIG.signTypes ?? {})[this.parentType.slice(1)]?.nodes), newValue => {
                this.nodeName = newValue;
                updatePreview(false);
                el.replaceWith(this.generateVis(z, i, parent));
            })).value = this.nodeName;

            pt2.appendChild(createHTMLEl("td", "Ankare:\xa0"));
            pt2.appendChild(createSelect(["(standard)", ...ANCHORS_X], newValue => {
                this.anchor ??= {};
                if(newValue === "(standard)") delete this.anchor.x;
                else this.anchor.x = newValue as SignElementAnchor['x'];
                updatePreview(false);
            })).value = (this.anchor?.x ?? "(standard)");

            pt2.appendChild(document.createTextNode("\xa0"));
            pt2.appendChild(createSelect(["(standard)", ...ANCHORS_Y], newValue => {
                this.anchor ??= {};
                if(newValue === "(standard)") delete this.anchor.y;
                else this.anchor.y = newValue as SignElementAnchor['y'];
                updatePreview(false);
            })).value = (this.anchor?.y ?? "(standard)");
        }

        elMain.append(createHTMLEl("h3", "Egenskaper"), this.propertyEditor(), barn);

        if(parent !== null){
            let elBtns = el.appendChild(createHTMLEl("div", null, ["elementknappar"]));

            if(!this.nodeName){
                let elUpp = createHTMLEl("div", "\u2191", ["uppelement"]),
                    elNed = createHTMLEl("div", "\u2193", ["nedelement"]);

                if(this.allowFlytt && i > 0){
                    elUpp.addEventListener("click", () => {
                        parent.swapChildren(i, i - 1);
                        updateVisualEditor();
                        updatePreview(false);
                    });
                }else{
                    elUpp.classList.add("disabled");
                }

                if(this.allowFlytt && i + 1 < parent.children.length){
                    elNed.addEventListener("click", () => {
                        parent.swapChildren(i, i + 1);
                        updateVisualEditor();
                        updatePreview(false);
                    });
                }else{
                    elNed.classList.add("disabled");
                }

                elBtns.append(elUpp, elNed);
            }

            elBtns.appendChild(createHTMLEl("div", "Ta bort", ["delelement"])).addEventListener("click", () => {
                parent.children.splice(i, 1);
                updateVisualEditor();
                updatePreview(false);
            });
        }

        el.appendChild(elMain);

        elHeader.addEventListener("click", () => {
            this.expanded = el.classList.toggle("expanded");
        });

        return el;
    }

    toJSON(): SignElementOptions{
        let nodes: {[key: string]: SignElementNode} = {},
            ch: SignElementOptions[] = [];

        this.children.forEach(c => {
            if(c.nodeName === undefined)
                ch.push(c.toJSON());
            else
                nodes[c.nodeName] = {
                    anchor: c.anchor,
                    data: c.toJSON()
                };
        });

        let o: SignElementOptions = { type: this.type };
        if(this.properties !== undefined) o.properties = this.properties;

        switch(this.type){
            case "newline":
            case "symbol":
            case "text":
            case "vagnr":
                break;
            case "group":
            case "skylt":
                o.elements = ch;
                break;
            default:
                if(this.type.startsWith(".")) o.nodes = nodes;
                else if(this.params !== undefined) o.params = this.params;
                break;
        }

        return o;
    }
};

let data_input = document.getElementById("input") as HTMLTextAreaElement, fr = document.getElementById("render") as HTMLElement,
    visels = document.getElementById("els") as HTMLElement,
    modesBtn = document.getElementById("modes") as HTMLElement,
    jsonModeBtn = document.getElementById("jsonmode") as HTMLElement,
    visModeBtn = document.getElementById("vismode") as HTMLElement,
    saveBtn = document.querySelector("#savefile") as HTMLElement,
    openBtn = document.querySelector("#valjfil") as HTMLInputElement,
    svgBtn = document.querySelector("#svgexp") as HTMLElement,
    pngBtn = document.querySelector("#pngexp") as HTMLElement;

let root: SignElement;

openBtn.addEventListener("change", () => {
    if(!openBtn.files || openBtn.files.length !== 1) return;

    openBtn.files[0].text().then(data => {
        data_input.value = data;
        data_input.dispatchEvent(new Event("change"));
    });
});

let prevObjUrl: string | undefined = undefined;
const win: any = window.URL ?? window.webkitURL;

let lastNamn = "min-skylt";

function downloadFile(data: Blob, fileExt: string): void{
    if(!!prevObjUrl) win.revokeObjectURL(prevObjUrl);
    let namn = prompt("Filnamn (utan tillägg):", lastNamn);
    if(namn === null) return;
    lastNamn = namn;

    let linkElement = document.createElement("a");
    linkElement.setAttribute("href", prevObjUrl = win.createObjectURL(data));
    linkElement.setAttribute("download", `${namn.replace(/[\x00-\x1f"\<\>\|\b\0\t\*\?\:\x7f]/g, "")}.${fileExt}`);
    linkElement.click();
}

saveBtn.addEventListener("click", () => {
    let data = JSON.stringify(root.toJSON());
    downloadFile(new Blob([data], {type: "text/plain"}), "sk.json");
}, {capture: true});

svgBtn.addEventListener("click", () => {
    renderer.renderToSVG(root.toJSON()).then(svg => {
        let data = svg.genSVG(true);
        downloadFile(new Blob([data], {type: "image/svg+xml"}), "svg");
    });
}, {capture: true});

pngBtn.addEventListener("click", () => {
    renderer.render(root.toJSON()).then(img => {
        img.toBlob(blob => {
            if(blob != null) downloadFile(blob, "png")
        }, "image/png");
    });
});

modesBtn.addEventListener("click", () => {
    let visMode = visels.classList.toggle("visible");
    data_input.classList.toggle("visible", !visMode);

    jsonModeBtn.classList.toggle("active", !visMode);
    visModeBtn.classList.toggle("active", visMode);

    if(visMode){
        // visuell redigering
        updateVisualEditor();
    }else{
        // json-läge
        updatePreview(true);
    }
});

function updateVisualEditor(){
    // visuell redigering
    visels.replaceChildren(root.generateVis(0, 0, null));
}

function updatePreview(updateCodeBox: boolean){
    let data: SignElementOptions = root.toJSON();

    renderer.render(data).then((canv: HTMLCanvasElement) => {
        Object.assign(canv.style, {
            position: "absolute",
            top: `max(0px, calc(50% - ${canv.height / 2}px))`,
            left: `max(0px, calc(50% - ${canv.width / 2}px))`
        });
        fr.replaceChildren(canv);
    }, e => {
        fr.replaceChildren(createHTMLEl("span", String(e), ["felmeddelande"]));
    });

    if(updateCodeBox){
        data_input.value = JSON.stringify(data, null, 4);
    }
}

data_input.addEventListener("change", () => {
    try{
        let parsed: SignElementOptions = JSON.parse(data_input.value);
        root = new SignElement(parsed, null, false);
        let visMode = visels.classList.contains("visible");
        updatePreview(!visMode);

        if(visMode) updateVisualEditor();
    }catch(e){
        console.error(e);
    }
});

let mainEl = document.getElementById("main") as HTMLElement;

let sx = 0, sy = 0;
let dx = 0, dy = 0;

let onInteractStart = (clx: number, cly: number) => {
    [sx, sy] = [
        (100 * clx / mainEl.clientWidth) - dx,
        (100 * cly / mainEl.clientHeight) - dy
    ];
};

let onInteractMove = (clx: number, cly: number) => {
    [dx, dy] = [
        Math.max(-50, Math.min(50, (100 * clx / mainEl.clientWidth) - sx)),
        Math.max(-50, Math.min(50, (100 * cly / mainEl.clientHeight) - sy))
    ];

    mainEl.style.setProperty('--dragposx', `${dx}%`);
    mainEl.style.setProperty('--dragposy', `${dy}%`);
};

let onMouseMove = (e: MouseEvent) => onInteractMove(e.clientX, e.clientY);
let onTouchMove = (e: TouchEvent) => {if(e.touches.length === 1) onInteractMove(e.touches[0].clientX, e.touches[0].clientY)};

document.getElementById("resize")?.addEventListener("mousedown", e => {
    onInteractStart(e.clientX, e.clientY);
    window.addEventListener("mousemove", onMouseMove);
});

document.getElementById("resize")?.addEventListener("touchstart", e => {
    if(e.touches.length > 1){
        window.removeEventListener("touchmove", onTouchMove);
        return;
    }

    e.preventDefault();
    onInteractStart(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener("touchmove", onTouchMove);
});

window.addEventListener("mouseup", () => {
    window.removeEventListener("mousemove", onMouseMove);
});

window.addEventListener("touchend", () => {
    window.removeEventListener("touchmove", onTouchMove);
});

let renderer = new SignRenderer(CONFIG);

Promise.all([
    renderer.registerFont(
        "Tratex",
        "font/TratexSvart-Regular.otf"
    ),
    renderer.registerFont(
        "TratexVersal",
        "font/TRATEXPOSVERSAL-POSVERSAL.otf"
    )
]).then(() => {
    return getJSON("templates.json");
}).then((templateData: any) => {
    let templateSelect = document.getElementById("selectTemplate") as HTMLSelectElement;
    let group: HTMLOptGroupElement | undefined = undefined;
    let firstOption: number = 0;

    templateData.forEach((template: any, i: number) => {
        if(typeof template === "string"){
            group = templateSelect.appendChild(document.createElement("optgroup"));
            group.setAttribute("label", template);
            if(firstOption === i) firstOption++;
            return;
        }

        let option_el = document.createElement("option");
        option_el.appendChild(document.createTextNode(template.name));
        option_el.setAttribute("value", String(i));
        (group ?? templateSelect).appendChild(option_el);
    });

    templateSelect.value = data_input.value.length < 6 ? String(firstOption) : "-1";

    templateSelect.addEventListener("change", () => {
        let i = parseInt(templateSelect.value);

        if(i >= 0) data_input.value = JSON.stringify(templateData[i].json, null, 4);

        data_input.dispatchEvent(new Event("change"));
    });

    templateSelect.dispatchEvent(new Event("change"));
});