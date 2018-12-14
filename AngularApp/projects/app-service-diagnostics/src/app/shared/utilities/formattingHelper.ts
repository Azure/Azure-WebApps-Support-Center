export class FormatHelper {

    static timespanToSeconds(timeInterval: string): number {
        if (timeInterval.indexOf(':') < 0) {
            return 0;
        }
        const a = timeInterval.split(':'); // split it at the colons
        // minutes are worth 60 seconds. Hours are worth 60 minutes.
        const seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
        return seconds;
    }

    static secondsToTimespan(seconds: number): string {
        if (seconds <= 0) {
            return '';
        }
        const date = new Date(null);
        date.setSeconds(seconds); // specify value for SECONDS here
        const timeString = date.toISOString().substr(11, 8);
        return timeString;
    }

    static formatBytes(bytes, decimals) {
        if (bytes === 0) { return '0 Bytes'; }
        const k = 1024,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}
