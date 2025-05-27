import { useEffect, useState } from "react";

import { ChartComponent } from "./_components/ChartComponent";
import { getGraphQLBetHistories, getGraphQLToken } from "../../services/chartService";

export type RawData = {
    americanOdds: number;
    timeStamp: number; // Unix timestamp in seconds
};

export type FormattedData = {
    time: number;
    value?: number;
};

const ChartPage = () => {
    const [token, setToken] = useState("");
    const [betMarHs, setBetMarHs] = useState<any[]>([]);
    const [formattedDataMap, setFormattedDataMap] = useState<Record<string, FormattedData[]>>({});

    useEffect(() => {
        getGraphQLToken()
            .then((data: any) => {
                setToken(data?.data?.user?.token?.accessToken);
            })
            .catch(err => console.error("Token fetch error:", err));
    }, []);

    useEffect(() => {
        if (token) {
            getGraphQLBetHistories(token)
                .then((data: any) => {
                    setBetMarHs(data[0]?.data?.betMarketListingHistory);
                })
                .catch(err => console.error("Bet histories fetch error:", err));
        }
    }, [token]);

    useEffect(() => {
        if (betMarHs.length > 0) {
            const sites = [
                "fanDuelSite", "draftKingsSite", "espnBetSite", "betOnlineSite", "mgmSite",
                "bovadaSite", "uniBetSite", "caesarsSite", "ps3838Site", "pointsBetSite"
            ];
            const newDataMap: Record<string, FormattedData[]> = {};

            sites.forEach((site, index) => {
                if (betMarHs[index]?.odds) {
                    const sorted = ensureAscendingTimestamps(betMarHs[index].odds);
                    newDataMap[site] = formatData(sorted);
                }
            });

            setFormattedDataMap(newDataMap);
        }
    }, [betMarHs]);

    const ensureAscendingTimestamps = (data: RawData[]): RawData[] => {
        const sorted = [...data].sort((a, b) => a.timeStamp - b.timeStamp);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].timeStamp <= sorted[i - 1].timeStamp) {
                sorted[i].timeStamp = sorted[i - 1].timeStamp + 1;
            }
        }
        return sorted;
    };

    const formatData = (data: RawData[]): FormattedData[] => {
        const formatted = data.map(item => ({
            time: item.timeStamp,
            value: item.americanOdds ?? undefined,
        }));
        return normalizeToFiveMinuteSteps(formatted);
    };

    const normalizeToFiveMinuteSteps = (data: FormattedData[]) => {
        if (!data.length) return [];

        data.sort((a, b) => a.time - b.time);

        const FIVE_MIN = 60 * 1;
        const normalized: FormattedData[] = [];
        let currentTime = Math.floor(data[0].time / FIVE_MIN) * FIVE_MIN;
        const endTime = data[data.length - 1].time;

        let dataIndex = 0;
        let lastValue = data[0].value;

        while (currentTime <= endTime) {
            while (dataIndex < data.length && data[dataIndex].time <= currentTime) {
                lastValue = data[dataIndex].value;
                dataIndex++;
            }
            normalized.push({ time: currentTime, value: lastValue });
            currentTime += FIVE_MIN;
        }

        return normalized;
    };

    return (
        <ChartComponent dataSeries={formattedDataMap} />
    );
};

export default ChartPage;