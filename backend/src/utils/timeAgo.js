export const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (let key in intervals) {
        const value = Math.floor(seconds / intervals[key]);
        if (value > 0) {
            return `${value}${key[0]} ago`;
        }
    }

    return "just now";
};