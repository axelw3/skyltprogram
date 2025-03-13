import { SignRenderer } from "../packages/skyltrendering/src/browser.js";
import CONFIG from "./config.js"

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
    let url = new URL(window.location.href);
    let sp = url.searchParams;
    if(!sp.has("data")) return;

    let w = sp.get("width"),
        h = sp.get("height");

    let data = JSON.parse(sp.get("data") || "");

    renderer.render(data, (w !== null && h !== null) ? [parseInt(w), parseInt(h)] : undefined).then((canv: HTMLCanvasElement) => {
        document.body.appendChild(canv);
    });
});