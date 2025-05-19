import { SignRenderer } from "../packages/skyltrendering/src/browser.js";
import { SignElementOptions } from "../packages/skyltrendering/src/typedefs.js";
import CONFIG from "./config.js"

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

let data_input: any = document.getElementById("input"), fr: any = document.getElementById("render"),
    width_input: any = document.querySelector("input#width"), height_input: any = document.querySelector("input#height");

function updateDisplay(data: SignElementOptions){
    let w = parseInt(width_input.value),
        h = parseInt(height_input.value);

    fr.replaceChildren();
    renderer.render(data, (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) ? [w, h] : undefined).then((canv: HTMLCanvasElement) => {
        fr.appendChild(canv);
    });
}

data_input.addEventListener("change", () => {
    try{
        let parsed: SignElementOptions = JSON.parse(data_input.value);
        data_input.value = JSON.stringify(parsed, null, 4);
        updateDisplay(parsed);
    }catch(e){
        console.error(e);
    }
});

width_input.addEventListener("change", () => {
    updateDisplay(JSON.parse(data_input.value));
});

height_input.addEventListener("change", () => {
    updateDisplay(JSON.parse(data_input.value));
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
    console.log("OK");
});

getJSON("templates.json").then((templateData: any) => {
    let templateSelect: any = document.getElementById("selectTemplate");

    templateData.forEach((template: any, i: number) => {
        let option_el = document.createElement("option");
        option_el.appendChild(document.createTextNode(template.name));
        option_el.setAttribute("value", i.toString(10));
        templateSelect.appendChild(option_el);
    });

    templateSelect.value = data_input.value.length < 6 ? 0 : (-1);

    templateSelect.addEventListener("change", () => {
        let i = parseInt(templateSelect.value);

        if(i >= 0) data_input.value = JSON.stringify(templateData[i].json, null, 4);

        data_input.dispatchEvent(new Event("change"));
    });

    templateSelect.dispatchEvent(new Event("change"));
});