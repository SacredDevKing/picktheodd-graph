import { useEffect, useState } from "react";

import { ChartComponent } from "./_components/ChartComponent";
import { getGraphQLBetHistories, getGraphQLToken } from "../../services/chartService";

type RawData = {
    americanOdds: number;
    timeStamp: number; // Unix timestamp in seconds
};

export type FormattedData = {
    time: number; // "yyyy-mm-dd hh:mm"
    value?: number | undefined;
};

const ChartPage = () => {
    const [token, setToken] = useState("");
    const [betMarHs, setBetMarHs] = useState<any[]>([]);

    const [fanDuelValues, setFanDuelValues] = useState<FormattedData[]>([]);
    const [draftKingsValues, setDraftKingsValues] = useState<FormattedData[]>([]);
    const [espnBetValues, setEspnBetValues] = useState<FormattedData[]>([]);
    const [betOnlineAgValues, setBetOnlineAgValues] = useState<FormattedData[]>([]);
    const [mgmValues, setMgmValues] = useState<FormattedData[]>([]);
    const [bovadaValues, setBovadaValues] = useState<FormattedData[]>([]);
    const [uniBetValues, setUniBetValues] = useState<FormattedData[]>([]);
    const [caesarsValues, setCaesarsValues] = useState<FormattedData[]>([]);
    const [ps3838Values, setPs3838Values] = useState<FormattedData[]>([]);
    const [pointsBetValues, setPointsBetValues] = useState<FormattedData[]>([]);

    useEffect(() => {
        getGraphQLToken()
            .then((data: any) => {
                setToken(data?.data?.user?.token?.accessToken)
            })
            .catch(err => console.log("err", err))
    }, [])

    useEffect(() => {
        if (token !== "") {
            getGraphQLBetHistories(token)
                .then((data: any) => {
                    setBetMarHs(data[0]?.data?.betMarketListingHistory);
                })
                .catch(err => console.log("err", err));
        }
    }, [token])

    useEffect(() => {
        if (betMarHs.length > 0) {
            console.log("betMarHs", betMarHs)

            setFanDuelValues(formatData(ensureAscendingTimestamps(betMarHs[0].odds)));
            setDraftKingsValues(formatData(ensureAscendingTimestamps(betMarHs[1].odds)));
            setEspnBetValues(formatData(ensureAscendingTimestamps(betMarHs[2].odds)));
            setBetOnlineAgValues(formatData(ensureAscendingTimestamps(betMarHs[3].odds)));
            setMgmValues(formatData(ensureAscendingTimestamps(betMarHs[4].odds)));
            setBovadaValues(formatData(ensureAscendingTimestamps(betMarHs[5].odds)));
            setUniBetValues(formatData(ensureAscendingTimestamps(betMarHs[6].odds)));
            setCaesarsValues(formatData(ensureAscendingTimestamps(betMarHs[7].odds)));
            setPs3838Values(formatData(ensureAscendingTimestamps(betMarHs[8].odds)));
            setPointsBetValues(formatData(ensureAscendingTimestamps(betMarHs[9].odds)));
        }
    }, [betMarHs])

    const ensureAscendingTimestamps = (data: RawData[]): RawData[] => {
        const sorted = [...data].sort((a, b) => a.timeStamp - b.timeStamp);

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].timeStamp <= sorted[i - 1].timeStamp) {
                sorted[i].timeStamp = sorted[i - 1].timeStamp + 1;
            }
        }

        return sorted;
    }

    const formatData = (data: RawData[]): FormattedData[] => {
        const formatted = data
            .map((item) => {
                return {
                    time: parseInt(item.timeStamp + ""),
                    value: item.americanOdds === null ? undefined : item.americanOdds,
                };
            });

        const normalized = normalizeToFiveMinuteSteps(formatted);
        return normalized;
    }

    const normalizeToFiveMinuteSteps = (data: FormattedData[]) => {
        if (data.length === 0) return [];

        data.sort((a: any, b: any) => a.time - b.time);

        const normalized = [];
        const FIVE_MIN = 60 * 1; // seconds
        let currentTime = Math.floor(data[0].time / FIVE_MIN) * FIVE_MIN;
        const endTime = data[data.length - 1].time;

        let dataIndex = 0;
        let lastValue = data[0].value;

        while (currentTime <= endTime) {
            while (dataIndex < data.length && data[dataIndex].time <= currentTime) {
                lastValue = data[dataIndex].value;
                dataIndex++;
            }

            normalized.push({
                time: currentTime,
                value: lastValue
            });

            currentTime += FIVE_MIN;
        }

        return normalized;
    }

    return <>
        {
            <ChartComponent
                fanDuelValues={fanDuelValues}
                draftKingsValues={draftKingsValues}
                espnBetValues={espnBetValues}
                betOnlineAgValues={betOnlineAgValues}
                mgmValues={mgmValues}
                bovadaValues={bovadaValues}
                uniBetValues={uniBetValues}
                caesarsValues={caesarsValues}
                ps3838Values={ps3838Values}
                pointsBetValues={pointsBetValues}
            />
        }
    </>;
};

export default ChartPage;