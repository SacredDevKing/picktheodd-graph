import { useEffect, useRef, useState } from 'react';
import { AreaSeries, createChart, ColorType, ISeriesApi, UTCTimestamp, LineType } from 'lightweight-charts';
import ZoomButton from '../../../../components/ZoomButton';

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
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const seriesMapRef = useRef<Record<string, ISeriesApi<any>>>({});
    const seriesDataRef = useRef<Record<string, { time: number; value: number }[]>>({});

    const [visibleType, setVisibleType] = useState("all");
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
    const [seriesSplitCnt, setSeriesSplitCnt] = useState<Record<string, number>>({
        fanDuel: 0,
        draftKingsDuel: 0,
        espnBetDuel: 0,
        betOnlineAgDuel: 0,
        mgmDuel: 0,
        bovadaDuel: 0,
        uniBetDuel: 0,
        caesarsDuel: 0,
        ps3838Duel: 0,
        pointsBetDuel: 0
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
                        color: "#000000"
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
                    // borderVisible: false,
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
                height: 800,
            });
            chart.timeScale().fitContent();
            chartRef.current = chart;

            // Create and store all series
            Object.entries(dataSeries).forEach(([key, data]) => {
                const subArrays = splitByUndefined(data);
                const cnt = subArrays.length;

                setSeriesSplitCnt((prev) => ({ ...prev, [key]: cnt }));
                for (let i = 0; i < cnt; i++) {
                    const series = chart.addSeries(AreaSeries, {
                        lineColor: seriesColors[key],
                        lineType: LineType.Simple,
                        topColor: 'rgba(0, 0, 0, 0)',
                        bottomColor: 'rgba(0, 0, 0, 0)'
                    });
                    series.setData(subArrays[i]);
                    series.applyOptions({ visible: true })
                    seriesMapRef.current[key + "___" + i] = series;
                    seriesDataRef.current[key + "___" + i] = [...subArrays[i]];
                }
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
                let visible = false;
                for (const [key, series] of Object.entries(seriesMapRef.current)) {
                    if (!visibleSeries[key.split("___")[0]]) continue;
                    const value = param.seriesData.get(series)?.value;
                    if (value === undefined) continue;

                    if (y === null) {
                        y = series.priceToCoordinate(value) ?? param.point.y;
                    }

                    lines.push(
                        `<div style="color: ${series.options().color}; font-weight: 600;">${value < 0 ? value : `+${value}`} <span style="opacity: 0.7;">(${key.split("___")[0]})</span></div>`
                    );

                    visible = true;
                }

                const rawTime = typeof param.time === 'number' ? param.time : (param.time as any).timestamp;
                lines.push(`<div style="margin-top: 4px;">🕒 ${formatTime(rawTime)}</div>`);
                lines.push(`<div style="font-size: 12px; opacity: 0.6;">${timeAgo(rawTime)}</div>`);

                if (visible) {
                    tooltip.innerHTML = lines.join('');
                    tooltip.style.left = `${x + 15}px`;
                    tooltip.style.top = `${(y ?? param.point.y) + 15}px`;
                    tooltip.style.display = 'block';
                } else {
                    tooltip.style.display = 'none';
                }
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
            areaBottomColor,
            visibleSeries
        ]
    );

    useEffect(() => {
        for (const [key, visible] of Object.entries(visibleSeries)) {
            for (let i = 0; i < seriesSplitCnt[key]; i++) {
                const series = seriesMapRef.current[key + "___" + i];
                if (series) {
                    series.applyOptions({ visible });
                }
            }
        }
    }, [visibleSeries, seriesSplitCnt]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000); // current time in seconds

            Object.entries(visibleSeries).forEach(([key, isVisible]) => {
                if (!isVisible) return;

                if (getRandomInt(7) === 6) return;

                const seriesKey = key + "___" + (seriesSplitCnt[key] - 1);
                const series = seriesMapRef.current[seriesKey];
                if (series) {
                    const currentData = seriesDataRef.current[seriesKey] || [];
                    const currentDataCnt = currentData.length;

                    if (currentDataCnt <= 0)
                        return;

                    if ((now - currentData[currentDataCnt - 1].time) <= 60) {
                        const newValue = currentData[currentDataCnt - 1].value;
                        const newPoint = { time: now, value: newValue };

                        const updated = [...currentData, newPoint];

                        dataSeries[key].push(newPoint);
                        series.setData(updated);
                        seriesDataRef.current[seriesKey] = updated;
                    } else {
                        const chart = chartRef.current;
                        if (!chart) return;

                        const newSeriesKey = key + "___" + (seriesSplitCnt[key]);
                        const newValue = currentData[currentDataCnt - 1].value;
                        const newPoint = { time: now, value: newValue };

                        const updated: any = [newPoint];

                        const newSeries = chart.addSeries(AreaSeries, {
                            lineColor: seriesColors[key],
                            lineType: LineType.Simple,
                            topColor: 'rgba(0, 0, 0, 0)',
                            bottomColor: 'rgba(0, 0, 0, 0)'
                        });
                        newSeries.setData(updated);
                        newSeries.applyOptions({ visible: true })

                        seriesMapRef.current[newSeriesKey] = newSeries;
                        seriesDataRef.current[newSeriesKey] = updated;

                        dataSeries[key].push(newPoint);

                        setSeriesSplitCnt((prev) => ({ ...prev, [key]: (seriesSplitCnt[key] + 1) }));
                    }
                }
            });
        }, 1000 * 60);

        return () => clearInterval(interval);
    }, [visibleSeries, seriesSplitCnt]);

    const splitByUndefined = (data: any) => {
        const result = [];
        let currentSegment = [];

        for (const item of data) {
            if (item.value === undefined) {
                if (currentSegment.length > 0) {
                    result.push(currentSegment);
                    currentSegment = [];
                }
            } else {
                currentSegment.push(item);
            }
        }

        // Push the last segment if it exists
        if (currentSegment.length > 0) {
            result.push(currentSegment);
        }

        return result;
    }

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

    const zoomTo = (minutesAgo: number | 'all') => {
        const chart = chartRef.current;
        if (!chart) return;

        const timeScale = chart.timeScale();

        // Flatten all timestamps from all visible series
        const allData = Object.entries(dataSeries)
            .filter(([key]) => visibleSeries[key])
            .flatMap(([, data]) => data)
            .sort((a, b) => a.time - b.time);

        if (!allData.length) return;

        const latest = allData[allData.length - 1].time;

        if (minutesAgo === 'all') {
            setVisibleType('all');
            timeScale.fitContent();
            return;
        } else {
            setVisibleType(minutesAgo + "min");
        }

        const from = (latest - minutesAgo * 60) as UTCTimestamp;;
        const to = latest as UTCTimestamp;

        timeScale.setVisibleRange({ from, to });
    };

    const getRandomInt = (max: number) => {
        return Math.floor(Math.random() * max);
    }

    return <>

        <div>
            <div className="flex justify-center items-center gap-2 mb-2 pt-2">
                {Object.keys(dataSeries).map((key) => (
                    <button
                        key={key}
                        onClick={() => toggleSeries(key.split("___")[0])}
                        style={{
                            backgroundColor: visibleSeries[key.split("___")[0]] ? '#333' : '#555',
                            border: `1px solid ${seriesColors[key.split("___")[0]]}`,
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        {visibleSeries[key.split("___")[0]] ? 'Hide' : 'Show'} {key.split("___")[0]}
                    </button>
                ))}
            </div>

            <div className="flex justify-center items-center gap-2">
                <ZoomButton onHandleClick={() => zoomTo(15)}
                    label='Last 15m'
                    visibleType={visibleType}
                    zoomValue='15min' />
                <ZoomButton onHandleClick={() => zoomTo(60)}
                    label='Last 1h'
                    visibleType={visibleType}
                    zoomValue='60min' />
                <ZoomButton onHandleClick={() => zoomTo(60 * 24)}
                    label='All Time'
                    visibleType={visibleType}
                    zoomValue='1440min' />
                <ZoomButton onHandleClick={() => zoomTo('all')}
                    label='Last 24h'
                    visibleType={visibleType}
                    zoomValue='all' />
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