export const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

export const timeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 60)
        return `${minutes}min ago`;

    const hours = Math.floor(minutes / 60);

    return `${hours}hr${hours > 1 ? 's' : ''} ago`;
};