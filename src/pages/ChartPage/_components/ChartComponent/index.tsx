import React, { useEffect, useRef, useState } from 'react';
import { AreaSeries, createChart, ColorType, ISeriesApi, UTCTimestamp, LineType } from 'lightweight-charts';

import ButBetSite from '../../../../components/ButBetSite';
import BtnZoom from '../../../../components/ButZoom';
import { formatTime, timeAgo } from '../../../../utils/times';
import { FormattedData } from '../..';

interface ChartComponentProps {
    fanDuelValues: FormattedData[];
    draftKingsValues: FormattedData[];
    espnBetValues: FormattedData[];
    betOnlineAgValues: FormattedData[];
    mgmValues: FormattedData[];
    bovadaValues: FormattedData[];
    uniBetValues: FormattedData[];
    caesarsValues: FormattedData[];
    ps3838Values: FormattedData[];
    pointsBetValues: FormattedData[];
}

type LineAttribute = {
    imageSrc: string;
    color: string;
    name: string;
    visible: boolean;
    splitCnt: number;
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
    fanDuelValues,
    draftKingsValues,
    espnBetValues,
    betOnlineAgValues,
    mgmValues,
    bovadaValues,
    uniBetValues,
    caesarsValues,
    ps3838Values,
    pointsBetValues
}) => {
    const chartContainerRef = useRef<any>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const seriesMapRef = useRef<Record<string, ISeriesApi<any>>>({});
    const seriesDataRef = useRef<Record<string, { time: number; value: number }[]>>({});

    const [visibleType, setVisibleType] = useState("all");
    const dataSeries: Record<string, FormattedData[]> = {
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
    const [seriesAttr, setSeriesAttr] = useState<Record<string, LineAttribute>>({
        fanDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Ffanduel.webp&w=640&q=75',
            color: '#1E90FF',
            name: 'FanDuel',
            visible: true,
            splitCnt: 0,
        },
        draftKingsDuel: {
            imageSrc: '	https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fdraftkings.webp&w=640&q=75',
            color: '#32CD32',
            name: 'DraftKings',
            visible: true,
            splitCnt: 0,
        },
        espnBetDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fespnbet.webp&w=640&q=75',
            color: '#40E0D0',
            name: 'ESPNBet',
            visible: true,
            splitCnt: 0,
        },
        betOnlineAgDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fbetonline.webp&w=640&q=75',
            color: '#FF6347',
            name: 'BetOnline',
            visible: true,
            splitCnt: 0,
        },
        mgmDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fmgm.webp&w=640&q=75',
            color: '#D2B48C',
            name: 'MGM',
            visible: true,
            splitCnt: 0,
        },
        bovadaDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fbovada.webp&w=640&q=75',
            color: '#DC143C',
            name: 'Bovada',
            visible: true,
            splitCnt: 0,
        },
        uniBetDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Funibet.webp&w=640&q=75',
            color: '#2E8B57',
            name: 'UniBet',
            visible: true,
            splitCnt: 0,
        },
        caesarsDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fcaesars.webp&w=640&q=75',
            color: '#20B2AA',
            name: 'Caesars',
            visible: true,
            splitCnt: 0,
        },
        ps3838Duel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fpinnacle.webp&w=640&q=75',
            color: '#8A2BE2',
            name: 'Pinnacle',
            visible: true,
            splitCnt: 0,
        },
        pointsBetDuel: {
            imageSrc: 'https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2Fpointsbet.webp&w=640&q=75',
            color: '#FF4500',
            name: 'PointsBet (CA)',
            visible: true,
            splitCnt: 0,
        },
    });

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
                    textColor: 'white',
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

                setSeriesAttr(prev => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        splitCnt: cnt,
                    },
                }));

                for (let i = 0; i < cnt; i++) {
                    const series = chart.addSeries(AreaSeries, {
                        lineColor: seriesAttr[key].color,
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
                    if (!seriesAttr[key.split("___")[0]].visible) continue;
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
            pointsBetValues
        ]
    );

    useEffect(() => {
        for (const [key, attr] of Object.entries(seriesAttr)) {
            for (let i = 0; i < seriesAttr[key].splitCnt; i++) {
                const series = seriesMapRef.current[key + "___" + i];
                if (series) {
                    series.applyOptions({ visible: attr.visible });
                }
            }
        }
    }, [seriesAttr]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000); // current time in seconds

            Object.entries(seriesAttr).forEach(([key, attr]) => {
                const isVisible = attr.visible;
                if (!isVisible) return;

                if (getRandomInt(7) === 6) return;

                const seriesKey = key + "___" + (seriesAttr[key].splitCnt - 1);
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

                        const newSeriesKey = key + "___" + (seriesAttr[key].splitCnt);
                        const newValue = currentData[currentDataCnt - 1].value;
                        const newPoint = { time: now, value: newValue };

                        const updated: any = [newPoint];

                        const newSeries = chart.addSeries(AreaSeries, {
                            lineColor: seriesAttr[key].color,
                            lineType: LineType.Simple,
                            topColor: 'rgba(0, 0, 0, 0)',
                            bottomColor: 'rgba(0, 0, 0, 0)'
                        });
                        newSeries.setData(updated);
                        newSeries.applyOptions({ visible: true })

                        seriesMapRef.current[newSeriesKey] = newSeries;
                        seriesDataRef.current[newSeriesKey] = updated;

                        dataSeries[key].push(newPoint);

                        setSeriesAttr(prev => ({
                            ...prev,
                            [key]: {
                                ...prev[key],
                                splitCnt: (seriesAttr[key].splitCnt + 1),
                            },
                        }));
                    }
                }
            });
        }, 1000 * 60);

        return () => clearInterval(interval);
    }, [seriesAttr]);

    const splitByUndefined = (data: any) => {
        const result = [];
        let currentSegment = [];

        for (const item of data) {
            if (item.value === undefined) {
                if (currentSegment.length > 0) {
                    result.push(currentSegment);
                    currentSegment = [];
                }
            } else
                currentSegment.push(item);
        }

        if (currentSegment.length > 0)
            result.push(currentSegment);

        return result;
    }

    const toggleSeries = (key: string) => {
        setSeriesAttr(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                visible: !prev[key].visible,
            },
        }));
    };

    const zoomTo = (minutesAgo: number | 'all') => {
        const chart = chartRef.current;
        if (!chart) return;

        const timeScale = chart.timeScale();

        // Flatten all timestamps from all visible series
        const allData = Object.entries(dataSeries)
            .filter(([key]) => seriesAttr[key].visible)
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
            <div className="flex justify-center gap-2 mb-2 pt-2 flex-wrap">
                {Object.entries(seriesAttr).map(([key, attr]) => (
                    <ButBetSite
                        key={key}
                        onHandleClick={() => toggleSeries(key)}
                        color={attr.color}
                        label={attr.name}
                        imageSrc={attr.imageSrc}
                        visible={attr.visible}
                    />
                ))}
            </div>

            <div className="flex justify-center gap-2">
                {[15, 60, 1440].map((m) => (
                    <BtnZoom
                        key={m}
                        onHandleClick={() => zoomTo(m)}
                        label={`Last ${m >= 60 ? `${m / 60}h` : `${m}m`}`}
                        visibleType={visibleType}
                        zoomValue={`${m}min`}
                    />
                ))}
                <BtnZoom
                    onHandleClick={() => zoomTo('all')}
                    label="All Time"
                    visibleType={visibleType}
                    zoomValue="all"
                />
            </div>

            <div className="relative">
                <div ref={chartContainerRef} className="w-full h-[300px]" />
                <div
                    ref={tooltipRef}
                    className="absolute z-[1000] bg-[#2a2a2a] text-[#f0f0f0] border border-[#444] rounded-lg px-3 py-2 text-sm leading-[1.5] pointer-events-none shadow-lg hidden whitespace-nowrap"
                />
            </div>
        </div>
    </>;
};