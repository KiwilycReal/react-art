import styles from './App.module.css';
import CanvasImage from './components/CanvasImage';
import {useState} from 'react';

const App = () => {
    const [version, setVersion] = useState(1);
    const introText1 = `This is the first version of my design, which is simple to achieve. The main thought behind it is sequentially place the sorted color values from the center of the canvas, following a anti-clockwise spiral shape.
    \nThis image looks like a colourful stump, tunnel or vortex.`;
    const introText2 = `This is the second version of my design, which partially based on manually draft. The image was inspired by the React's Atom logo, the seven circles outlined the 'Atom' and each of these circles is filled with a distinct colour family.`;

    const changeVersion = () => {
        setVersion(version === 1 ? 2 : 1);
    }

    return (
        <div className={styles.container}>
            <CanvasImage version={version} />
            <div className={styles.introduction}>
                <h4>{version === 1 ? introText1 : introText2}</h4>
            </div>
            <button onClick={changeVersion}>Change to Version {version === 1 ? 2 : 1}</button>
        </div>
    );
};

export default App;
