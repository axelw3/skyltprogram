import { SignRenderer } from "../packages/skyltrendering/src/browser.js";
import CONFIG from "./config.js"

const tratex = new FontFace(
    "Tratex",
    "url(font/TratexSvart-Regular.otf)",
);

const tratexVersal = new FontFace(
    "TratexVersal",
    "url(font/TRATEXPOSVERSAL-POSVERSAL.otf)",
);

document.fonts.add(tratex);
document.fonts.add(tratexVersal);

Promise.all([tratex.load(), tratexVersal.load()]).then(() => {
    let url = new URL(window.location.href);
    if(!url.searchParams.has("data")) return;

    let data = JSON.parse(url.searchParams.get("data") || "");

    new SignRenderer(CONFIG).render(data).then((canv: HTMLCanvasElement) => {
        document.body.appendChild(canv);
    });
});