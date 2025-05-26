import { BASETYPE as BT, SignElementUserProperties } from "../packages/skyltrendering/src/typedefs";

export const enum SignPropertyType{
    STRING,
    BOOL,
    ANY,
    NUMBER
};

export const SignProperties: Record<keyof SignElementUserProperties, {help: string, type: SignPropertyType, options: readonly string[] | null, disableFor: readonly BT[]}> = {
    "alignContents": {"help": "Horisontell justering av innehåll.", "type": SignPropertyType.STRING, "options": ["left", "center", "right"], "disableFor": [BT.NEWLINE]},
    "alignContentsV": {"help": "Justering av innehåll i höjdled.", "type": SignPropertyType.STRING, "options": ["top", "middle", "bottom"], "disableFor": [BT.NEWLINE]},
    "background": {"help": "Bakgrundsfärg i CSS-format.", "type": SignPropertyType.STRING, "options": null, "disableFor": [BT.NEWLINE]},
    "blockDisplay": {"help": "Block-läge (varje element fyller en hel rad).", "type": SignPropertyType.BOOL, "options": ["true", "false"], "disableFor": [BT.MALL, BT.NEWLINE, BT.SYMBOL, BT.TEXT, BT.VAGNR]},
    "borderFeatures": {"help": "Kantdekorationer.", "type": SignPropertyType.ANY, "options": null, "disableFor": [BT.NEWLINE]},
    "borderRadius": {"help": "Hörnradie.", "type": SignPropertyType.ANY, "options": null, "disableFor": [BT.NEWLINE]},
    "borderWidth": {"help": "Kantbredd.", "type": SignPropertyType.ANY, "options": null, "disableFor": [BT.NEWLINE]},
    "color": {"help": "Färg på symboler och TEXT.", "type": SignPropertyType.STRING, "options": null, "disableFor": [BT.NEWLINE]},
    "columns": {"help": "Justering i kolumner.", "type": SignPropertyType.ANY, "options": null, "disableFor": [BT.MALL, BT.NEWLINE, BT.SYMBOL, BT.TEXT, BT.VAGNR]},
    "cover": {"help": "Skala om för att passa in i höjdled.", "type": SignPropertyType.BOOL, "options": ["true", "false"], "disableFor": [BT.NEWLINE]},
    "dashedInset": {"help": "Lägg till en streckad bård.", "type": SignPropertyType.BOOL, "options": ["true", "false"], "disableFor": [BT.NEWLINE]},
    "fillCorners": {"help": "Bakgrundsfyllning utanför rundade hörn.", "type": SignPropertyType.BOOL, "options": ["true", "false"], "disableFor": [BT.NEWLINE]},
    "fontSize": {"help": "Teckenstorlek, i pixlar.", "type": SignPropertyType.NUMBER, "options": null, "disableFor": [BT.NEWLINE, BT.SYMBOL]},
    "font": {"help": "Typsnitt.", "type": SignPropertyType.STRING, "options": null, "disableFor": [BT.NEWLINE, BT.SYMBOL]},
    "grow": {"help": "Tillåt symbolen att växa i höjdled.", "type": SignPropertyType.BOOL, "options": ["true", "false"], "disableFor": [BT.GROUP, BT.MALL, BT.NEWLINE, BT.SKYLT, BT.TEXT, BT.VAGNR]},
    "lineHeight": {"help": "Radhöjd.", "type": SignPropertyType.NUMBER, "options": null, "disableFor": [BT.NEWLINE, BT.SYMBOL]},
    "lineSpacing": {"help": "Marginal mellan rader.", "type": SignPropertyType.NUMBER, "options": null, "disableFor": [BT.SYMBOL, BT.TEXT, BT.VAGNR]},
    "maxHeight": {"help": "Maximal höjd för symbolen.", "type": SignPropertyType.NUMBER, "options": null, "disableFor": [BT.GROUP, BT.MALL, BT.NEWLINE, BT.SKYLT, BT.TEXT, BT.VAGNR]},
    "padding": {"help": "Yttermarginaler.", "type": SignPropertyType.ANY, "options": null, "disableFor": [BT.NEWLINE]},
    "passAnchor": {"help": "TODO", "type": SignPropertyType.BOOL, "options": ["true", "false"], "disableFor": [BT.NEWLINE, BT.SYMBOL, BT.TEXT, BT.VAGNR]},
    "scale": {"help": "Förstoringsfaktor för symbol.", "type": SignPropertyType.NUMBER, "options": null, "disableFor": [BT.GROUP, BT.MALL, BT.NEWLINE, BT.SKYLT, BT.TEXT, BT.VAGNR]},
    "type": {"help": "Symbol-id.", "type": SignPropertyType.STRING, "options": null, "disableFor": [BT.GROUP, BT.MALL, BT.NEWLINE, BT.SKYLT, BT.TEXT, BT.VAGNR]},
    "value": {"help": "Textinnehåll.", "type": SignPropertyType.STRING, "options": null, "disableFor": [BT.GROUP, BT.MALL, BT.NEWLINE, BT.SKYLT, BT.SYMBOL]},
    "variant": {"help": "Symbol-undertyp.", "type": SignPropertyType.STRING, "options": null, "disableFor": [BT.GROUP, BT.MALL, BT.NEWLINE, BT.SKYLT, BT.TEXT, BT.VAGNR]},
    "xSpacing": {"help": "Horisontellt avstånd mellan element.", "type": SignPropertyType.NUMBER, "options": null, "disableFor": [BT.NEWLINE]}
} as const;