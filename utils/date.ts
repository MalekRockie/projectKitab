export const getformatDateUS = (
    date: Date | null | undefined

): string => { 
    if(!date) return "No input";

    return date.toLocaleDateString('en-US',{
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};


// e.g. "3:45 PM • 22 Oct 26"
export const formatPostTimestamp = (value: string | number | Date): string => {
    const date = new Date(value);
    const time = date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    const day = date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });
    return `${time} • ${day}`;
};

export const getformatDateWithH = (
    date: Date | null | undefined
): string => {
    if (!date) return "No input";
    //Gotta add 1 to the month because it's zero indexed, ape ahh design
    var month = date.getMonth() + 1
    if (month > 9) {
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
    }
    var res = date.getFullYear() + "-" + 0 + (date.getMonth() + 1) + "-" + date.getDate()
    return res
}