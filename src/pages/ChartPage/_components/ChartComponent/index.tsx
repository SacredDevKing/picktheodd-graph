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

const getRandomInt = (max: number) => Math.floor(Math.random() * max);

export const ChartComponent: React.FC<ChartComponentProps> = ({ dataSeries }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const seriesMap = useRef<Record<string, ISeriesApi<any>>>({});
    const seriesData = useRef<Record<string, FormattedData[]>>({});

    const [seriesAttr, setSeriesAttr] = useState<Record<string, LineAttribute>>(() =>
        Object.fromEntries(
            Object.entries(BET_SITES).map(([key]) => [
                key,
                {
                    imageSrc: IMAGE_URL(key.replace('Site', '').toLowerCase()),
                    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                    name: BET_SITES[key],
                    visible: true,
                    splitCnt: 0,
                },
            ])
        )
    );

    const [visibleType, setVisibleType] = useState("all");

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#000' }, textColor: 'white',
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

        const priceFormatter = (price: number) => {
            const formatted = price < 0 ? `${price}` : `+${price}`;
            if (formatted === lastPriceLabel) return '';
            lastPriceLabel = formatted;
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

        chart.subscribeCrosshairMove((param) => {
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
                lines.push(`<div style="color:${series.options().color};font-weight:600;">${value < 0 ? value : `+${value}`} <span style="opacity:0.7;">(${baseKey})</span></div>`);
            }

            const rawTime = typeof param.time === 'number' ? param.time : (param.time as any).timestamp;

            lines.push(`<div style="margin-top:4px;">🕒 ${formatTime(rawTime)}</div>`);
            lines.push(`<div style="font-size:12px;opacity:0.6;">${timeAgo(rawTime)}</div>`);

            tooltip.innerHTML = lines.join('');
            tooltip.style.left = `${param.point.x + 15}px`;
            tooltip.style.top = `${(y ?? param.point.y) + 15}px`;
            tooltip.style.display = 'block';
        });

        const resizeObserver = new ResizeObserver(() => {
            chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [dataSeries]);

    const toggleSeries = (key: string) => {
        setSeriesAttr(prev => ({
            ...prev,
            [key]: { ...prev[key], visible: !prev[key].visible },
        }));
    };

    useEffect(() => {
        Object.entries(seriesAttr).forEach(([key, attr]) => {
            for (let i = 0; i < attr.splitCnt; i++) {
                const series = seriesMap.current[`${key}___${i}`];
                if (series) series.applyOptions({ visible: attr.visible });
            }
        });
    }, [seriesAttr]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);

            Object.entries(seriesAttr).forEach(([key, attr]) => {
                if (!attr.visible || getRandomInt(7) === 6) return;

                const seriesKey = `${key}___${attr.splitCnt - 1}`;
                const series = seriesMap.current[seriesKey];
                const currentData = seriesData.current[seriesKey] || [];

                if (!series || currentData.length === 0) return;

                const lastPoint = currentData[currentData.length - 1];

                if ((now - lastPoint.time) <= 60) {
                    const newPoint = { time: now, value: lastPoint.value };
                    const updated = [...currentData, newPoint];

                    dataSeries[key].push(newPoint);
                    series.setData(updated);
                    seriesData.current[seriesKey] = updated;
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
                            formatter: (p: number) => (p < 0 ? `${p}` : `+${p}`),
                        },
                    });

                    newSeries.applyOptions({ visible: true });

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
        }, 60000);

        return () => clearInterval(interval);
    }, [seriesAttr]);

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
        } else {
            chart.timeScale().setVisibleRange({
                from: (latest - minutesAgo * 60) as UTCTimestamp,
                to: latest as UTCTimestamp,
            });
            setVisibleType(`${minutesAgo}min`);
        }
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
                    />
                ))}
            </div>

            <div className="flex justify-center gap-2">
                {[15, 60, 1440].map(mins => (
                    <BtnZoom
                        key={mins}
                        onHandleClick={() => zoomTo(mins)}
                        label={`Last ${mins >= 60 ? `${mins / 60}h` : `${mins}mins`}`}
                        visibleType={visibleType}
                        zoomValue={`${mins}min`}
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
        </>
    );
};
