import React, { useEffect, useRef, useState } from 'react';
import { AreaSeries, createChart, ColorType, ISeriesApi, LineType, UTCTimestamp } from 'lightweight-charts';

import ButBetSite from '../../../../components/ButBetSite';
import BtnZoom from '../../../../components/ButZoom';
import { formatTime, timeAgo } from '../../../../utils/times';
import { FormattedData } from '../..';

interface ChartComponentProps {
    dataSeries: Record<string, FormattedData[]>;
}

type LineAttribute = {
    imageSrc: string;
    color: string;
    name: string;
    visible: boolean;
    splitCnt: number;
    disabled: boolean;
};

const BET_SITES: Record<string, string> = {
    fanDuelSite: 'FanDuel',
    draftKingsSite: 'DraftKings',
    espnBetSite: 'ESPNBet',
    betOnlineSite: 'BetOnline',
    mgmSite: 'MGM',
    bovadaSite: 'Bovada',
    uniBetSite: 'UniBet',
    caesarsSite: 'Caesars',
    ps3838Site: 'Pinnacle',
    pointsBetSite: 'PointsBet (CA)',
};

const IMAGE_URL = (site: string) =>
    `https://picktheodds.app/_next/image?url=https%3A%2F%2Fpicktheodds.app%2Fbetsites%2Ficons%2F${site}.webp&w=640&q=75`;
const RANDOM_DATA_GEN_SEC = 2;

const getRandomInt = (max: number) => Math.floor(Math.random() * max);

export const ChartComponent: React.FC<ChartComponentProps> = ({ dataSeries }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const seriesMap = useRef<Record<string, ISeriesApi<any>>>({});
    const seriesData = useRef<Record<string, FormattedData[]>>({});
    const userZoomed = useRef(false);

    const [seriesAttr, setSeriesAttr] = useState<Record<string, LineAttribute>>(() =>
        Object.fromEntries(
            Object.entries(BET_SITES).map(([key]) => [
                key,
                {
                    imageSrc: IMAGE_URL(key.replace('Site', '').toLowerCase()),
                    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                    name: BET_SITES[key],
                    visible: true,
                    disabled: false,
                    splitCnt: 0,
                },
            ])
        )
    );

    const [visibleType, setVisibleType] = useState('all');
    const [visibleChange, setVisibleChange] = useState(false);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#000' },
                textColor: 'white',
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: '#444', style: 2 },
                horzLines: { color: '#444', style: 2 },
            },
            timeScale: {
                timeVisible: true,
                tickMarkFormatter: (t: number) => {
                    const d = new Date(t * 1000);
                    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                },
            },
            crosshair: { mode: 0 },
            width: chartContainerRef.current.clientWidth,
            height: 800,
        });

        chartRef.current = chart;
        chart.timeScale().fitContent();

        var lastPriceLabel: string | null = null;
        var lastPriceLabelCnt: number = 0;

        const priceFormatter = (price: number) => {
            const formatted = price < 0 ? `${price}` : `+${price}`;
            if (formatted === lastPriceLabel && lastPriceLabelCnt > 1) return '';
            lastPriceLabel = formatted;
            lastPriceLabelCnt ++;
            return formatted;
        };

        const splitByUndefined = (data: FormattedData[]) => {
            const segments: FormattedData[][] = [];
            let current: FormattedData[] = [];
            for (const point of data) {
                if (point.value === undefined) {
                    if (current.length) segments.push(current);
                    current = [];
                } else {
                    current.push(point);
                }
            }
            if (current.length) segments.push(current);
            return segments;
        };

        Object.entries(dataSeries).forEach(([key, data]) => {
            const segments = splitByUndefined(data);

            if (segments.length === 0) {
                setSeriesAttr(prev => ({
                    ...prev,
                    [key]: { ...prev[key], disabled: true },
                }));
            }

            segments.forEach((segment: any, i) => {
                const id = `${key}___${i}`;
                const series = chart.addSeries(AreaSeries, {
                    lineColor: seriesAttr[key].color,
                    lineType: LineType.Simple,
                    topColor: 'rgba(0,0,0,0)',
                    bottomColor: 'rgba(0,0,0,0)',
                    priceLineVisible: i === 0,
                    priceScaleId: 'right',
                });
                series.setData(segment);
                series.applyOptions({
                    priceFormat: {
                        type: 'custom',
                        minMove: 1,
                        formatter: priceFormatter,
                    },
                });
                seriesMap.current[id] = series;
                seriesData.current[id] = segment;
            });

            setSeriesAttr(prev => ({
                ...prev,
                [key]: { ...prev[key], splitCnt: segments.length },
            }));
        });

        addTooltip(chart);
        addZoomEvent(chart);

        const resizeObserver = new ResizeObserver(() => {
            chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [dataSeries]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        addTooltip(chart);
    }, [visibleChange]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        addZoomEvent(chart);
        setSeriesVisibility();
    }, [seriesAttr]);

    useEffect(() => {
        let cancelled = false;
        // const MAX_SERIES = 400;

        const update = () => {
            if (cancelled) return;

            const now = Math.floor(Date.now() / 1000);

            Object.entries(seriesAttr).forEach(([key, attr]) => {
                if (!attr.visible || getRandomInt(7) === 6) return;

                const seriesKey = `${key}___${attr.splitCnt - 1}`;
                const series = seriesMap.current[seriesKey];
                const currentData = seriesData.current[seriesKey] || [];

                if (!series || currentData.length === 0) return;

                const lastPoint = currentData[currentData.length - 1];

                if (now - lastPoint.time <= RANDOM_DATA_GEN_SEC) {
                    const newPoint = { time: now, value: lastPoint.value };

                    dataSeries[key].push(newPoint);
                    series.update(newPoint);
                    seriesData.current[seriesKey].push(newPoint);
                } else {
                    const chart = chartRef.current;
                    if (!chart) return;

                    const newValue = lastPoint.value;
                    const newPoint = { time: now, value: newValue };
                    const newSeriesKey = `${key}___${attr.splitCnt}`;
                    const updated: any = [newPoint];

                    const newSeries = chart.addSeries(AreaSeries, {
                        lineColor: attr.color,
                        lineType: LineType.Simple,
                        topColor: 'rgba(0, 0, 0, 0)',
                        bottomColor: 'rgba(0, 0, 0, 0)',
                        priceLineVisible: false,
                        priceScaleId: 'right',
                    });

                    newSeries.setData(updated);
                    newSeries.applyOptions({
                        priceFormat: {
                            type: 'custom',
                            minMove: 1,
                            formatter: (p: number) => (p < 0 ? `${p}` : `+${p}`),
                        },
                        visible: true,
                    });

                    seriesMap.current[newSeriesKey] = newSeries;
                    seriesData.current[newSeriesKey] = updated;
                    dataSeries[key].push(newPoint);

                    setSeriesAttr(prev => ({
                        ...prev,
                        [key]: {
                            ...prev[key],
                            splitCnt: attr.splitCnt + 1,
                        },
                    }));
                }
            });

            // **PRUNE OLDEST SERIES IF EXCEEDING MAX_SERIES**
            // const keys = Object.keys(seriesMap.current);
            // if (keys.length > MAX_SERIES) {
            //     const oldestKey = keys[0]; // oldest inserted key
            //     const oldestSeries = seriesMap.current[oldestKey];
            //     if (oldestSeries && chartRef.current) {
            //         chartRef.current.removeSeries(oldestSeries);
            //     }
            //     delete seriesMap.current[oldestKey];
            //     delete seriesData.current[oldestKey];
            // }

            if (!userZoomed.current) {
                chartRef.current?.timeScale().scrollToRealTime();
            }

            setTimeout(update, RANDOM_DATA_GEN_SEC * 1000);
        };

        update();

        return () => {
            cancelled = true;
        };
    }, [seriesAttr]);

    const isToday = (timestamp: number) => {
        const d = new Date(timestamp * 1000);
        const today = new Date();
        return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
        );
    };

    // Fixed zoomTo to set visibleType and userZoomed correctly
    const zoomTo = (minutesAgo: number | 'all') => {
        const chart = chartRef.current;
        if (!chart) return;

        const allPoints = Object.entries(dataSeries)
            .filter(([key]) => seriesAttr[key].visible)
            .flatMap(([, d]) => d)
            .sort((a, b) => a.time - b.time);

        if (!allPoints.length) return;
        const latest = allPoints[allPoints.length - 1].time;

        if (minutesAgo === 'all') {
            chart.timeScale().fitContent();
            setVisibleType('all');
            userZoomed.current = false; // Reset to allow auto-scroll
        } else {
            chart.timeScale().setVisibleRange({
                from: (latest - minutesAgo * 60) as UTCTimestamp,
                to: latest as UTCTimestamp,
            });
            setVisibleType(`${minutesAgo}min`);
            userZoomed.current = true; // User actively zoomed
        }
    };

    const toggleSeries = (key: string) => {
        setSeriesAttr(prev => ({
            ...prev,
            [key]: { ...prev[key], visible: !prev[key].visible },
        }));
        setVisibleChange(!visibleChange);
    };

    const addTooltip = (chart: any) => {
        chart.subscribeCrosshairMove((param: any) => {
            const tooltip = tooltipRef.current;
            if (!tooltip || !param.point || !param.seriesData.size) {
                if (tooltip) tooltip.style.display = 'none';
                return;
            }

            const lines: string[] = [];
            let y: number | null = null;

            for (const [id, series] of Object.entries(seriesMap.current)) {
                const baseKey = id.split('___')[0];
                if (!seriesAttr[baseKey].visible) continue;

                const seriesData = param.seriesData.get(series) as any;
                const value = seriesData?.value;
                if (value === undefined) continue;

                y ??= series.priceToCoordinate(value) ?? param.point.y;
                lines.push(
                    `<div style="color:${series.options().color};font-weight:600;">${value < 0 ? value : `+${value}`} <span style="opacity:0.7;">(${baseKey.replace(
                        'Site',
                        ''
                    )})</span></div>`
                );
            }

            const rawTime = typeof param.time === 'number' ? param.time : (param.time as any).timestamp;

            lines.push(`<div style="margin-top:4px;">🕒 ${formatTime(rawTime)}</div>`);
            lines.push(`<div style="font-size:12px;opacity:0.6;">${timeAgo(rawTime)}</div>`);

            tooltip.innerHTML = lines.join('');
            tooltip.style.left = `${param.point.x + 15}px`;
            tooltip.style.top = `${(y ?? param.point.y) + 15}px`;
            tooltip.style.display = 'block';
        });
    };

    // FIXED: Improved addZoomEvent handler
    const addZoomEvent = (chart: any) => {
        const predefinedZooms = [
            { mins: 15, label: '15min', tolerance: 3 },
            { mins: 60, label: '60min', tolerance: 5 },
            { mins: 1440, label: '1440min', tolerance: 20 },
        ];

        const handleTimeRangeChange = (range: { from: number; to: number } | null) => {
            if (!range) return;

            userZoomed.current = true;

            const rangeDuration = Math.round((range.to - range.from) / 60);

            let matchedLabel = 'all';

            for (const zoom of predefinedZooms) {
                // if (Math.abs(zoom.mins - rangeDuration) <= zoom.tolerance) {
                //     matchedLabel = zoom.label;
                //     break;
                // }
                if (rangeDuration < zoom.mins + zoom.tolerance) {
                    matchedLabel = zoom.label;
                    break;
                }
            }

            setVisibleType(matchedLabel);

            // Calculate if all visible points are today (for tick formatter)
            const allVisibleTimes: number[] = [];

            for (const [key, attr] of Object.entries(seriesAttr)) {
                if (!attr.visible) continue;
                for (let i = 0; i < attr.splitCnt; i++) {
                    const segment = seriesData.current[`${key}___${i}`];
                    if (!segment) continue;
                    const visible = segment.filter(p => p.time >= range.from && p.time <= range.to);
                    allVisibleTimes.push(...visible.map(p => p.time));
                }
            }

            const allToday = allVisibleTimes.length > 0 && allVisibleTimes.every(isToday);

            chart.applyOptions({
                timeScale: {
                    tickMarkFormatter: (t: number) => {
                        const d = new Date(t * 1000);
                        if (allToday) {
                            return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                        }
                        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                    },
                },
            });
        };

        chart.timeScale().subscribeVisibleTimeRangeChange(handleTimeRangeChange);
    };

    const setSeriesVisibility = () => {
        Object.entries(seriesAttr).forEach(([key, attr]) => {
            for (let i = 0; i < attr.splitCnt; i++) {
                const series = seriesMap.current[`${key}___${i}`];
                if (series) series.applyOptions({ visible: attr.visible });
            }
        });
    };

    return (
        <>
            <div className="flex justify-center gap-2 mb-2 pt-2 flex-wrap">
                {Object.entries(seriesAttr).map(([key, attr]) => (
                    <ButBetSite
                        key={key}
                        onHandleClick={() => toggleSeries(key)}
                        color={attr.color}
                        label={attr.name}
                        imageSrc={attr.imageSrc}
                        visible={attr.visible}
                        disabled={attr.disabled}
                    />
                ))}
            </div>

            <div className="flex justify-center gap-2 mb-2">
                {[15, 60, 1440].map(mins => (
                    <BtnZoom
                        key={mins}
                        onHandleClick={() => zoomTo(mins)}
                        label={`Last ${mins >= 60 ? `${mins / 60}h` : `${mins}mins`}`}
                        visibleType={visibleType}
                        zoomValue={`${mins}min`}
                    />
                ))}
                <BtnZoom onHandleClick={() => zoomTo('all')} label="All Time" visibleType={visibleType} zoomValue="all" />
            </div>

            <div className="relative">
                <div ref={chartContainerRef} className="w-full h-[300px]" />
                <div
                    ref={tooltipRef}
                    className="absolute z-[1000] bg-[#2a2a2a] text-[#f0f0f0] border border-[#444] rounded-lg px-3 py-2 text-sm leading-[1.5] pointer-events-none shadow-lg hidden whitespace-nowrap"
                />
            </div>
        </>
    );
};
