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