import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { apiPlots } from '../../config/api.js';
import { Lsvg, HitechSvg, VatikaSvg } from '../indeximages';

const PDFviewer = ({ projectId }) => {
    const [hoveredPlot, setHoveredPlot] = useState(null);
    const [imageSize, setImageSize] = useState({ width: 1000, height: 1200 });
    const imageRef = useRef(null);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);

    let currentMap;
    if (projectId === '1' || projectId === 1) currentMap = Lsvg;
    else if (projectId === '2' || projectId === 2) currentMap = HitechSvg;
    else if (projectId === '3' || projectId === 3) currentMap = VatikaSvg;
    else currentMap = Lsvg; // Fallback

    const handleImageLoad = () => {
        if (imageRef.current) {
            const { width, height } = imageRef.current.getBoundingClientRect();
            setImageSize({ width, height });
        }
    };

    useEffect(() => {
        const fetchPlots = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${apiPlots}/${projectId}`);
                setPlots(response.data);
            } catch (err) {
                console.error("Failed to fetch plots", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlots();
    }, [projectId]);

    useEffect(() => {
        const handleResize = () => {
            if (imageRef.current) {
                const { width, height } = imageRef.current.getBoundingClientRect();
                setImageSize({ width, height });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleHover = (plot) => {
        setHoveredPlot(plot);
    };

    const handleMouseLeave = () => {
        setHoveredPlot(null);
    };

    const calculatePosition = (plot) => {
        const originalImageWidth = 1000;
        const originalImageHeight = 1200;

        const xRatio = imageSize.width / originalImageWidth;
        const yRatio = imageSize.height / originalImageHeight;

        return {
            top: `${plot.y * yRatio}px`,
            left: `${plot.x * xRatio}px`,
            width: `${plot.width * xRatio}px`,
            height: `${plot.height * yRatio}px`
        };
    };

    return (
        <div className="relative">
            {loading && <p className="text-center py-4">Loading map data...</p>}
            <img
                src={currentMap}
                alt={`CAD Plot Project ${projectId}`}
                ref={imageRef}
                onLoad={handleImageLoad}
                loading='lazy'
                className="w-full h-auto"
            />

            {imageSize.width && !loading && plots.map(plot => (
                <div
                    key={plot._id}
                    className="absolute bg-primary border-[0.2px] bg-opacity-10 hover:bg-opacity-75 transition-all cursor-pointer"
                    style={calculatePosition(plot)}
                    onMouseEnter={() => handleHover(plot)}
                    onMouseLeave={handleMouseLeave}
                ></div>
            ))}

            {hoveredPlot && (
                <div
                    className="absolute bg-white border p-2 rounded shadow-lg z-10"
                    style={{
                        top: `${hoveredPlot.y * (imageSize.height / 1200) + hoveredPlot.height * (imageSize.height / 1200) + 10}px`,
                        left: `${hoveredPlot.x * (imageSize.width / 1000)}px`,
                    }}
                >
                    <p className="text-xs text-gray-500">Plot: {hoveredPlot.plotId}</p>
                    <p className="text-sm font-medium">{hoveredPlot.customer || "Available"}</p>
                </div>
            )}
        </div>
    );
};

export default PDFviewer;