import React from "react";

interface ZoomButtonProps {
    onHandleClick: () => void;
    label: string;
    visibleType: string;
    zoomValue: string;
}

const ZoomButton: React.FC<ZoomButtonProps> = ({ onHandleClick, visibleType, label, zoomValue }) => {
    return <>
        <button
            onClick={onHandleClick}
            className={
                visibleType === zoomValue
                    ? "bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 border border-blue-700 rounded"
                    : "bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
            }
        >
            {label}
        </button>
    </>
}

export default ZoomButton;