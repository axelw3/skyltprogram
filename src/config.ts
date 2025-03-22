import {UserConfigData} from "../packages/skyltrendering/src/typedefs.js"

const CONFIG: UserConfigData = {
    "signTypes": {
        "junction": {
            "width": 120,
            "height": 240,
            "core": [0.4, 0.6, 0.15, 0.44],
            "nodes": {
                "fwd": { "x": [0.2, 0.8], "y": [0, 0], "ay": "bottom" },
                "right": { "x": [1, 1], "y": [0.27, 0.27], "ax": "left" },
                "left": { "x": [0, 0], "y": [0.27, 0.27], "ax": "right" },
                "lright": { "x": [1, 1], "y": [0.434, 0.434], "ax": "left" }
            }
        },
        "roundabout": {
            "width": 240,
            "height": 480,
            "core": [0.35, 0.75, 0.09, 0.35],
            "nodes": {
                "fwd": { "x": [0.5, 0.5], "y": [0.03, 0.03], "ay": "bottom" },
                "right": { "x": [0.9, 0.9], "y": [0.21, 0.21], "ax": "left" },
                "left": { "x": [0.1, 0.1], "y": [0.21, 0.21], "ax": "right" }
            }
        },
        "water": {
            "width": 209,
            "height": 19,
            "core": [0, 1, 0, 1],
            "nodes": {
                "name": { "x": [0.5, 0.5], "y": [-0.1, -0.1], "ax": "center", "ay": "bottom" }
            }
        },
        "spanish": {
            "width": 200,
            "height": 360,
            "core": [0.12, 0.78, 0, 0.65],
            "nodes": {
                "fwd": { "x": [0.08, 0.72], "y": [0, 0], "ay": "bottom" },
                "left": { "x": [0, 0], "y": [0.22, 0.22], "ax": "right" },
                "right": { "x": [1, 1], "y": [0.22, 0.22], "ax": "left" }
            }
        }
    },
    "symbols": {
        "arrow-small": { "width": 48, "height": [48, 192], "default": "left" },
        "exit": { "width": 46, "height": [26, 26] },
        "e1": { "width": 48, "height": [48, 48] },
        "e3": { "width": 48, "height": [48, 48] },
        "e19": { "width": 48, "height": [48, 48] },
        "e25": { "width": 48, "height": [48, 48] },
        "e26": { "width": 47, "height": [38, 38] },
        "f28": { "width": 48, "height": [48, 48] },
        "f29": { "width": 61, "height": [48, 48], "default": "metro" },
        "h1": { "width": 40, "height": [40, 40] },
        "h2": { "width": 40, "height": [40, 40] },
        "h3": { "width": 40, "height": [40, 40] },
        "h4": { "width": 40, "height": [40, 40], "default": "cng" },
        "h5": { "width": 40, "height": [40, 40] },
        "h6": { "width": 40, "height": [40, 40] },
        "h7": { "width": 40, "height": [40, 40] },
        "h8": { "width": 40, "height": [40, 40] },
        "h9": { "width": 40, "height": [40, 40] },
        "h10": { "width": 40, "height": [40, 40] },
        "h11": { "width": 40, "height": [40, 40] },
        "h12": { "width": 40, "height": [40, 40] },
        "h13": { "width": 40, "height": [40, 40] },
        "h14": { "width": 40, "height": [40, 40] },
        "h15": { "width": 40, "height": [40, 40] },
        "h16": { "width": 40, "height": [40, 40] },
        "h17": { "width": 40, "height": [40, 40] },
        "h18": { "width": 40, "height": [40, 40] },
        "h19": { "width": 40, "height": [40, 40] },
        "h20": { "width": 40, "height": [40, 40] },
        "h21": { "width": 40, "height": [40, 40] },
        "h22": { "width": 40, "height": [40, 40] },
        "h24": { "width": 40, "height": [40, 40] },
        "h25": { "width": 40, "height": [40, 40] },
        "h26": { "width": 40, "height": [40, 40] },
        "h27": { "width": 40, "height": [40, 40] },
        "h28": { "width": 40, "height": [40, 40] }
    },
    "borderFeatures": {
        "bracket": { "paths": [{ "p": "M-${bw/2},0H0L22,27L44,0H${bw/2+w}", "s": 1, "f": 2 }], "w": 44, "h": 27 },
        "arrow": { "paths": [{ "p": "M0,0V${h}H${w}V0z", "f": -2, "s": -2 }, { "p": "M0,0L${w/2},${h*17/27}L${w},0z", "f": 2 }, { "p": "M0,-${bw/2}V0L${w/2},${h*18/27}L${w},0V-${bw/2}V0L${w/2},${h*26/27}L0,0z", "s": 1, "f": 1 }], "h": 36 },
        "diag": {
            "vars": [["k", "35/60"], ["x1", "1-(k/sqrt((k*k+1)))*brb"], ["xr", "1-(k/sqrt((k*k+1)))*bra"], ["a", "-2*bra+w+xr-x1*k+sqrt((2*brb-x1*x1))-sqrt((2*bra-xr*xr))"], ["margin", "30"]],
            "paths": [
                { "p": "M0,0V${-k*x1+sqrt((2*brb-x1*x1))+margin}L${w},${-sqrt((k*k+1))-k+1*bw/2+h}V0z", "f": -2, "s": -2 },
                { "p": "M0,-${bw/2}V${margin}A${brb},${brb},0,0,0,${x1},${sqrt((2*brb-x1*x1))+margin}L${-2*bra+w+xr},${a+sqrt((2*bra-xr*xr))+margin}A${bra},${bra},0,0,0,${w},${a+margin}V-${bw/2}", "s": 1, "f": 2 },
                { "p": "M${w/2-43},0m5,0l-5,7l65,38l-8,14l29,-7l-10,-27l-8,12l-64,-36z", "f": 1 }
            ],
            "h": "w-x1*k+sqrt((2*brb-x1*x1))+(sqrt((k*k+1))+k-1*bw/2)+margin"
        },
        "slash": {
            "paths": [
                { "p": "M${w-60-brb},0L${brd},${h}M${w-40-brb},0L${brd+20},${h}M${w-20-brb},0L${brd+40},${h}M${w-brb},0L${brd+60},${h}", "s": 1}
            ],
            "clip": true
        },
        "x8": {
            "paths": [
                { "p": "M0,0L${w},${h}M${w},0L0,${h}", "s": "#d33" }
            ],
            "clip": true
        }
    },
    "templates": {
        "avfart": (no = "1") => ({
            "type": "skylt",
            "properties": {
                "padding": 0,
                "borderWidth": 0,
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
        "symgroup": (...s: (string | string[])[]) => ({
            "type": "skylt",
            "properties": {"padding": 0, "xSpacing": 0, "borderWidth": null, "borderRadius": 0, "color": "black"},
            "elements": s.map((x, i) => ({"type": "symbol", "properties": {"background": "white","cover": true, "type": Array.isArray(x) ? x[0] : x, "variant": Array.isArray(x) ? x[1] : undefined , "borderRadius": 0, "borderWidth": [i > 0 ? null : 0, 0, 0, 0], "padding": 1}}))
        })
    }
};

export default CONFIG;