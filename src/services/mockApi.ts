export type FeedPost = {
    id: string;
    user: string;
    text: string;
    createdAt: string;
};

export function fetchFeed(): Promise<FeedPost[]> {
    return new Promise((res) =>
        setTimeout(
            () =>
                res([
                    {
                        id: '1',
                        user: 'Ayşe',
                        text: 'Bugün 5 km koştum 🏃‍♀️',
                        createdAt: new Date().toISOString(),
                    },
                    {
                        id: '2',
                        user: 'Mehmet',
                        text: 'Bench press rekorumu kırdım 💪',
                        createdAt: new Date().toISOString(),
                    },
                ]),
            800
        )
    );
}
