import { FC, useEffect, useRef, useState } from "react";
import "./Ruler.css";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
const Ruler:FC = () => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [units, setUnits] = useState<"in"|"cm">("in");
    const [width, setWidth] = useState(0);
    const widthState = useSelector((state: RootState) => state.project.currentDocumentSize.width);

    useEffect(() => {
        const width = rulerRef.current ? rulerRef.current.offsetWidth : 0;
        setWidth(width);
    }, []);

    const InchMarker:FC = () => {
        return (
            <div className="inch-container">
                <div className="half-inch">
                    <div className="eighth-inch"></div>
                    <div className="eighth-inch"></div>
                    <div className="eighth-inch"></div>
                    <div className="eighth-inch"></div>
                </div>
                <div className="half-inch">
                    <div className="eighth-inch"></div>
                    <div className="eighth-inch"></div>
                    <div className="eighth-inch"></div>
                    <div className="eighth-inch"></div>
                </div>
            </div>
        )
    }
    return (
        <div ref={rulerRef} className="ruler-container">{
            Array.from({ length: Math.ceil(widthState / 96) }, (_, i) => (
                <InchMarker key={i} />
            ))}
        </div>
    );
}

export default Ruler;