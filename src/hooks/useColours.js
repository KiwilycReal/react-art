import { useState } from "react";

/**
 * A custom hook to generate the complete colour array, the reason for
 * separating this part of logic from the CanvasImage component is to
 * increase this module's reusability and avoid redundant initialization
 * of this array
 */
const useColours = () => {
    /**
     * Helper function to convert a colour object from RGB format to HSL format;
     * Based on the StackOverflow answer posted by Oriol (https://stackoverflow.com/a/11923973)
     * @returns Same color object but with HSL format
     */
    const rgbToHsl = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /=255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if(max === min){
            h = s = 0;
        }else{
            let diff = max - min;
            let sum = max + min;
            s = l > 0.5 ? diff / (2 - sum) : diff / sum;
            switch(max){
                case r:
                    h = (g - b) / diff + (g < b ? 6 : 0); break;
                case g:
                    h = (b - r) / diff + 2; break;
                case b:
                    h = (r - g) / diff + 4; break;
                default: break;
            }
            h /= 6;
        }
        h *= 360;
        s *= 100;
        l *= 100;

        return {h, s, l};
    };

    /**
     * Compare funtion for sorting the colour array, ascending order by hue value
     */
    const ascendingHue = (a, b) => a.h - b.h;

    const [colourArray] = useState(() => {
        // Firstly, create an array stores every discrete colour, 32*32*32=32768 colours in total
        // Every element is a colour object with the format {r: red, g: green, b: blue, h: hue, s: saturation, l: lightness}
        let colours = [];
        for(let r = 8; r <= 256; r += 8){
            for(let g = 8; g <= 256; g += 8){
                for(let b = 8; b <= 256; b += 8){
                    let {h, s, l} = rgbToHsl(r, g, b);
                    colours.push({r, g, b, h, s, l});
                }
            }
        }
        // Sort the array based on each colour's Hue value, ascending order
        colours.sort(ascendingHue);
        return colours;
    });
    return colourArray;
};

export default useColours;