import useColours from '../hooks/useColours';
import { useEffect, useRef, useState } from 'react';

/**
 * React component for the canvas element
 * @param {version: number} props 1 indicates the old version; 2 indicates the new version
 * @returns Completed canvas DOM element
 */
const CanvasImage = (props) => {
    // Deconstruct the props
    let {version} = props;
    // Size of the canvas
    const canvasWidth = 256, canvasHeight = 128;
    // Center coordinates of the seven circle in version 2 drawing, origin is the top-left point
    let centers = [
        {x: 79.5,y: 63.5},
        {x: 127.5,y: 63.5},
        {x: 175.5,y: 63.5},
        {x: 103.5,y: 111.5},
        {x: 151.5,y: 111.5},
        {x: 151.5,y: 15.5},
        {x: 103.5,y: 15.5},
    ];
    // Retrieve a mutable ref object of the canvas
    const canvasRef = useRef(null);
    // Retrieve the colour array, which is already sorted based on Hue value
    const colourArray = useColours();
    // Used to display rendering duration
    const [duration, setDuration] = useState(0);
    // Used to store current canvas image download url
    const [canvasUrl, setCanvasUrl] = useState('');

    // Initialization of the canvas, executed only once whenever the version number changes
    useEffect(()=>{
        const context = canvasRef.current.getContext('2d');
        const imageData = context.createImageData(canvasWidth, canvasHeight);
        // The array object stores pixel data of our drawing, every consecutive 4 elements represent RGBA values
        const dataArray = imageData.data;
        const start = new Date();
        switch(version){
            /**
             * Version 1: draw the colours in a spiral shape, start from the center of the canvas.
             */
            case 1:
                // Current point when travelling, start from middle point
                let point = [128, 63];
                // Length travelled in each direciton per iteration
                let step = 1;
                // Each iteration contains one single horizontal move and one single vertical move, use this offset to determine up/down and left/right
                let offset = 1
                // Index of current using colour
                let colourIndex = 0;
                // Indicate the travel direction
                const HORIZONTAL = true, VERTICAL = false;
                // Should we enter vertical only mode, to prune all outside travels
                let verticalOnly = false;
                /**
                 * The normal action funtion when we travel in spiral shape, haven't reach outside of the canvas yet;
                 * Each iteration contains two action, one horizontal and one vertical, after each iteration, step will
                 * increase by 1 and offset multiply -1 to change both horizontal and vertical travel direction in the
                 * next iteration. This mechanism will ensure we pass every pixel in the canvas.
                 * @param {boolean} moveHorizontal true means we are travelling horizontally
                 */
                const action = (moveHorizontal) => {
                    for(let s = 1; s <= step; s++){
                        // Paint
                        let colour = colourArray[colourIndex++];
                        // Calculate the index regarding canvas' dataArray based on coordinate
                        let j = canvasWidth * point[1] + point[0];
                        // Insert colour values into a pixel
                        dataArray[j*4] = colour.r;
                        dataArray[j*4+1] = colour.g;
                        dataArray[j*4+2] = colour.b;
                        dataArray[j*4+3] = 255; // 255 stands for Alpha value, required by canvas data array format
                        // Decide moving direction (up/down, left/right) based on offset
                        moveHorizontal ? point[0] -= offset : point[1] += offset
                        // Check whether we have reached outside of canvas, if so, enter vertical only mode
                        if(point[1] < 0){
                            verticalOnly = true;
                        }
                    }

                };
                /**
                 * Similar to the basic action funciton, but it will only travel along the vertical dimension, each itreation
                 * has a fixed number of visits which is the height of canvas. After finish one iteration, the point will jump
                 * to the symmetry along the middle vertical axis and start travelling with a reverse direction.
                 */
                const verticalOnlyAction = () => {
                    // reset current point to perform vertical only travels
                    point[0] -= step * offset;
                    point[1] = offset === 1 ? 0 : 127;

                    for(let i = 1; i < canvasHeight; i++){
                        // Paint
                        let colour = colourArray[colourIndex++];
                        // Calculate the index regarding canvas' dataArray based on coordinate
                        let j = canvasWidth * point[1] + point[0];
                        // Insert colour values into a pixel
                        dataArray[j*4] = colour.r;
                        dataArray[j*4+1] = colour.g;
                        dataArray[j*4+2] = colour.b;
                        dataArray[j*4+3] = 255; // 255 stands for Alpha value, required by canvas data array format
                        point[1] += offset;
                    }
                }
                // Stop drawing when used up every colour
                while(colourIndex < 32768){
                    if(!verticalOnly){
                        action(HORIZONTAL);
                        action(VERTICAL);
                    }else{
                        verticalOnlyAction();
                    }
                    step++;
                    offset *= -1;
                };
                break;

            /**
             * Version 2: Draw 7 circles to imitate React's atom logo, each circle is filled by
             * diffrent colour family (i.e. red, green, orange, blue...). Use remaining colours to
             * fill the blank areas in the canvas. The design sets all circles are same with a diameter
             * equal to 16px, and distance between two centers of circle is 48px
             */
            case 2:
                // First divide the entire colour array into 8 chunks, roughly matches to 8 colors like rainbow (red occurs both head and tail)
                // Then, based on calculation, each circle contains exact 812 pixels, therefore we extract first 812 pixels from each family;
                // Except the last red family because its redundant and we only have 7 circles.
                // All remaining colours go to restColours array
                let colourFamilies = [], restColours = [];
                for(let i = 0; i < 7; i++){
                    colourFamilies.push(colourArray.slice(i * 4096, i * 4096 + 812));
                    restColours.push(colourArray.slice(i * 4096 + 812, (i + 1) * 4096));
                }
                // Add last chunk of colours to the restColours and flat it
                restColours.push(colourArray.slice(7 * 4096));
                restColours = restColours.flat()
                /**
                 * Calculate the Euclidean distance between a point in the canvas and one of the circles' centers
                 * @param {number} x horizontal coordinate
                 * @param {number} y vertical coordinate
                 * @param {number} center One of the circles' centers
                 * @returns Euclidean distance between (x, y) and the center point
                 */
                const euclideanDistance = (x, y, center) => Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
                /**
                 * Get the index of circle which contains the current point, this is useful to customize which colour family
                 * will be used in this circle
                 * @param {number} x 
                 * @param {number} y 
                 * @returns the index of the circle which contains the current point, -1 if outside of any circles.
                 */
                const circleIndex = (x,y) => {
                    return centers.findIndex((c)=>{
                        return euclideanDistance(x,y,c)<=16
                    })
                }
        
                // From the top left, sequentially paint each pixels from left to right, from top to down
                for(let i = 0; i < 32768; i++){
                    // Calculate the coordinate for current indexed pixel based on the same coordinate system used in version 1
                    let x = i % 256, y  = parseInt(i / 256);
                    // Current pixel is contained by circle with index j, if j == -1 then the pixel is outside of any circles
                    let j = circleIndex(x, y);
                    if(j >= 0){
                        // Select the colour family based on circle index, it doesn't have to be this sequence, can be customized
                        let color = colourFamilies[j].shift();
                        dataArray[i*4] = color.r;
                        dataArray[i*4+1] = color.g;
                        dataArray[i*4+2] = color.b;
                        dataArray[i*4+3] = 255;
                    }else{
                        // Any other pixel will sequentially select one colour from the rest
                        let color = restColours.shift();
                        dataArray[i*4] = color.r;
                        dataArray[i*4+1] = color.g;
                        dataArray[i*4+2] = color.b;
                        dataArray[i*4+3] = 255;
                    }
                };
                break;
            default:
                break;
        };
        
        // Pour the drawing data to the canvas
        context.putImageData(imageData, 0, 0);
        // Update rendering time
        setDuration(new Date() - start);
        // Update download url
        setCanvasUrl(canvasRef.current.toDataURL('image/png'));
    },[version, centers, colourArray]);

    return <>
        <a
            href={canvasUrl}
            download={'version'+version}
        >
            <button>download</button>
        </a>
        <h3>Rendering time: {duration}ms</h3>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight}/>
    </>;
};

export default CanvasImage;
