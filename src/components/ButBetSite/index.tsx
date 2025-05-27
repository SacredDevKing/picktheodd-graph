import React from "react";

interface ButBetSiteProps {
    label: string;
    onHandleClick: () => void;
    color: string;
    imageSrc: string;
    visible: boolean;
}

const ButBetSite: React.FC<ButBetSiteProps> = ({ label, onHandleClick, color, imageSrc, visible }) => {
    return <>
        <div className="relative group inline-flex items-center">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                {label}
            </div>

            <button
                onClick={onHandleClick}
                className={`flex items-center px-2 py-1 rounded-xl border hover:shadow-md transition ${!visible && `bg-white/10`}`}
                style={{
                    borderColor: color,
                }}
            >
                <span
                    className={`w-2 h-2 rounded-full mr-2`}
                    style={{
                        backgroundColor: color,
                    }}
                />
                <img
                    src={imageSrc}
                    alt="icon"
                    className="w-6 h-6 object-cover rounded-lg"
                />
            </button>
        </div>
    </>
}

export default ButBetSite;