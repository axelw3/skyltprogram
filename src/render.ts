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
    if(!url.searchParams.has("data")) return;

    let data = JSON.parse(url.searchParams.get("data") || "");

    renderer.render(data).then((canv: HTMLCanvasElement) => {
        document.body.appendChild(canv);
    });
});