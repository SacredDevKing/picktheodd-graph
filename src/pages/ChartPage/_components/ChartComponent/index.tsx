
import { AreaSeries, createChart, ColorType, ISeriesApi, LineData } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

export const ChartComponent = (props: any) => {
    const {
        fanDuelValues,
        draftKingsValues,
        espnBetValues,
        betOnlineAgValues,
        mgmValues,
        bovadaValues,
        uniBetValues,
        caesarsValues,
        ps3838Values,
        pointsBetValues,
        colors: {
            backgroundColor = 'black',
            lineColor = '#2962FF',
            textColor = 'white',
            areaTopColor = '#2962FF',
            areaBottomColor = 'rgba(41, 98, 255, 0.28)',
        } = {},
    } = props;

    const chartContainerRef = useRef<any>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const seriesMapRef = useRef<Record<string, ISeriesApi<any>>>({});

    const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
        fanDuel: true,
        draftKingsDuel: true,
        espnBetDuel: true,
        betOnlineAgDuel: true,
        mgmDuel: true,
        bovadaDuel: true,
        uniBetDuel: true,
        caesarsDuel: true,
        ps3838Duel: true,
        pointsBetDuel: true
    });
    const dataSeries: Record<string, any[]> = {
        fanDuel: fanDuelValues,
        draftKingsDuel: draftKingsValues,
        espnBetDuel: espnBetValues,
        betOnlineAgDuel: betOnlineAgValues,
        mgmDuel: mgmValues,
        bovadaDuel: bovadaValues,
        uniBetDuel: uniBetValues,
        caesarsDuel: caesarsValues,
        ps3838Duel: ps3838Values,
        pointsBetDuel: pointsBetValues,
    };
    const seriesColors: Record<string, string> = {
        fanDuel: '#1E90FF',
        draftKingsDuel: '#32CD32',
        espnBetDuel: '#40E0D0',
        betOnlineAgDuel: '#2962FF',
        mgmDuel: '#D2B48C',
        bovadaDuel: '#DC143C',
        uniBetDuel: '#2E8B57',
        caesarsDuel: '#20B2AA',
        ps3838Duel: '#8A2BE2',
        pointsBetDuel: '#FF4500',
    };

    useEffect(
        () => {
            const handleResize = () => {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            };

            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: {
                        type: ColorType.Solid,
                        color: "#2E2E2E"
                    },
                    textColor,
                    attributionLogo: false,
                },
                grid: {
                    vertLines: { color: '#444', style: 2 },
                    horzLines: { color: '#444', style: 2 },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                    tickMarkFormatter: (time: number) => {
                        const date = new Date(time * 1000); // Convert UNIX timestamp
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${month}/${day} ${hours}:${minutes}`;
                    },
                },
                crosshair: { mode: 0 },
                width: chartContainerRef.current.clientWidth,
                height: 900,
            });
            chart.timeScale().fitContent();

            // Create and store all series
            Object.entries(dataSeries).forEach(([key, data]) => {
                const series = chart.addSeries(AreaSeries, {
                    lineColor: seriesColors[key],
                    topColor: 'rgba(0, 0, 0, 0)',
                    bottomColor: 'rgba(0, 0, 0, 0)'
                });
                series.setData(data);
                seriesMapRef.current[key] = series;
            });

            const tooltip = tooltipRef.current!;
            tooltip.style.display = 'none';

            chart.subscribeCrosshairMove((param: any) => {
                if (!param.point || !param.time || !param.seriesData.size) {
                    tooltip.style.display = 'none';
                    return;
                }

                const x = param.point.x;
                let y: number | null = null;

                const lines: string[] = [];

                for (const [key, series] of Object.entries(seriesMapRef.current)) {
                    if (!visibleSeries[key]) continue;
                    const value = param.seriesData.get(series)?.value;
                    if (value === undefined) continue;

                    if (y === null) {
                        y = series.priceToCoordinate(value) ?? param.point.y;
                    }

                    lines.push(
                        `<div style="color: ${series.options().color}; font-weight: 600;">+${value} <span style="opacity: 0.7;">(${key})</span></div>`
                    );
                }

                const rawTime = typeof param.time === 'number' ? param.time : (param.time as any).timestamp;
                lines.push(`<div style="margin-top: 4px;">🕒 ${formatTime(rawTime)}</div>`);
                lines.push(`<div style="font-size: 12px; opacity: 0.6;">${timeAgo(rawTime)}</div>`);

                tooltip.innerHTML = lines.join('');
                tooltip.style.left = `${x + 15}px`;
                tooltip.style.top = `${(y ?? param.point.y) + 15}px`;
                tooltip.style.display = 'block';
            });

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);

                chart.remove();
            };
        },
        [
            fanDuelValues,
            draftKingsValues,
            espnBetValues,
            betOnlineAgValues,
            mgmValues,
            bovadaValues,
            uniBetValues,
            caesarsValues,
            ps3838Values,
            pointsBetValues,
            backgroundColor,
            lineColor,
            textColor,
            areaTopColor,
            areaBottomColor
        ]
    );

    useEffect(() => {
        for (const [key, visible] of Object.entries(visibleSeries)) {
            const series = seriesMapRef.current[key];
            if (series) {
                series.applyOptions({ visible });
            }
        }
    }, [visibleSeries]);

    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const timeAgo = (timestamp: number): string => {
        const diff = Date.now() - timestamp * 1000;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}min ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}hr${hours > 1 ? 's' : ''} ago`;
    };

    const toggleSeries = (key: string) => {
        setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return <>

        <div>
            <div className="flex gap-2 mb-2">
                {Object.keys(dataSeries).map((key) => (
                    <button
                        key={key}
                        onClick={() => toggleSeries(key)}
                        style={{
                            backgroundColor: visibleSeries[key] ? '#333' : '#555',
                            border: `1px solid ${seriesColors[key]}`,
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        {visibleSeries[key] ? 'Hide' : 'Show'} {key}
                    </button>
                ))}
            </div>

            <div style={{ position: 'relative' }}>
                <div ref={chartContainerRef} style={{ width: '100%', height: 300 }} />
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'absolute',
                        zIndex: 1000,
                        background: '#2a2a2a',
                        color: '#f0f0f0',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        display: 'none',
                        whiteSpace: 'nowrap',
                    }}
                />
            </div>
        </div>
    </>;
};