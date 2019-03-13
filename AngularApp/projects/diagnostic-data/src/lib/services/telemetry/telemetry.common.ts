export const TelemetryEventNames = {
    DetectorViewLoaded: 'DetectorViewLoaded',
    InsightTitleClicked: 'InsightTitleClicked',
    InsightRated: 'InsightRated',
    ChildDetectorClicked: 'ChildDetectorClicked',
    InsightsSummary: 'InsightsSummary',
    ChildDetectorsSummary: 'ChildDetectorsSummary',
    MarkdownClicked: 'MarkdownClicked',
    StarRatingSubmitted: 'StarRatingSubmitted',
    CardClicked: 'CardClicked'
};

export interface ITelemetryProvider {
    // Log a user action or other occurrence.
    logEvent(message?: string, properties?: any, measurements?: any);

    // Log an exception you have caught. (Exceptions caught by the browser are also logged.)
    logException(exception: Error, handledAt?: string, properties?: any, measurements?: any, severityLevel?: any);

    // Logs that a page displayed to the user.
    logPageView(name: string, url: string, properties?: any, measurements?: any, duration?: number);

    // Log a diagnostic event such as entering or leaving a method.
    logTrace(message: string, customProperties?: any, customMetrics?: any);

    // Log a positive numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
    logMetric(name: string, average: number, sampleCount: number, min: number, max: number, properties?: any);

    // Immediately send all queued telemetry. Synchronous.
    flush();
}
