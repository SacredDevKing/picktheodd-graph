import axios from "axios"

export const getGraphQLToken = () => {
    return new Promise((resolve, reject) => {
        axios.post(
            process.env.REACT_APP_CORS_HEADER + "https://api.picktheodds.app/graphql",
            {
                query:
                    "\n  mutation GetToken($userId: Guid, $refreshToken: String) {\n    user {\n      token(userId: $userId, refreshToken: $refreshToken) {\n        accessToken\n      }\n    }\n  }\n"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3NDc4MTAwMjAsImV4cCI6MTc0NzgxMDMyMCwiaWF0IjoxNzQ3ODEwMDIwLCJpc3MiOiJodHRwczovL3BpY2t0aGVvZGRzLmFwcCIsImF1ZCI6IlBpY2tUaGVPZGRzIn0.v6BHjDmJ2V2VB6LRrVBUK-uXeflhwbbWryIRkVddMC0'
                }
            }
        )
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                reject(error);
            });
    });
}

export const getGraphQLBetHistories = (token: string) => {
    const payload = [{
        operationName: "GetBetMarketListingHistory",
        query: "query GetBetMarketListingHistory($betMarketHashCode: Int!, $gameId: Guid!, $league: LeagueEnum!, $betSites: [BetMarketSiteEnumTypeTwo]) {\n  betMarketListingHistory(\n    betMarketHashCode: $betMarketHashCode\n    gameId: $gameId\n    league: $league\n    betSites: $betSites\n  ) {\n    siteId\n    odds {\n      timeStamp\n      americanOdds\n      __typename\n    }\n    __typename\n  }\n}",
        variables: {
            betMarketHashCode: 1556590557,
            betSites: [
                "FAN_DUEL",
                "MGM",
                "DRAFT_KINGS",
                "POINTS_BET",
                "BOVADA",
                "UNI_BET",
                "CAESARS",
                "ESPN_BET",
                "PS_3838",
                "BET_ONLINE_AG"
            ],
            gameId: "753565cc-cbfa-45af-8349-1280b704ad51",
            league: "NBA"
        }
    }]

    return new Promise((resolve, reject) => {
        axios.post(
            process.env.REACT_APP_CORS_HEADER + "https://api.picktheodds.app/graphql",
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        )
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                reject(error);
            });
    });
}