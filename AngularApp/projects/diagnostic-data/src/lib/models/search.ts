export class SearchConfiguration{
    public DetectorSearchEnabled: boolean;
    public WebSearchEnabled: boolean;
    public CustomQueryString: string;
    public DetectorSearchConfiguration: DetectorSearchConfiguration;
    public WebSearchConfiguration: WebSearchConfiguration;
    
    public DocumentSearchEnabled : boolean ;
    public DocumentSearchConfiguration : DocumentSearchConfiguration;
    public constructor(table: any) {
        this.DetectorSearchEnabled = true;
        this.WebSearchEnabled = true;
        this.DocumentSearchEnabled = true;

        this.CustomQueryString = null;
        this.DetectorSearchConfiguration = new DetectorSearchConfiguration();
        this.WebSearchConfiguration = new WebSearchConfiguration();
        if (table && table.columns && table.rows && table.rows.length>0){
            this.DetectorSearchEnabled = table.rows[0][table.columns.findIndex(x => x.columnName=="DetectorSearchEnabled")];
            this.WebSearchEnabled = table.rows[0][table.columns.findIndex(x => x.columnName=="WebSearchEnabled")];
            this.CustomQueryString = table.rows[0][table.columns.findIndex(x => x.columnName=="CustomQueryString")];
            var detectorSearchConfig = table.rows[0][table.columns.findIndex(x => x.columnName=="DetectorSearchConfiguration")];
            this.DetectorSearchConfiguration = detectorSearchConfig? JSON.parse(detectorSearchConfig): this.DetectorSearchConfiguration;
            var webSearchConfig = table.rows[0][table.columns.findIndex(x => x.columnName=="WebSearchConfiguration")]
            this.WebSearchConfiguration = webSearchConfig? JSON.parse(webSearchConfig): this.WebSearchConfiguration;
        }
    }
}

export class DetectorSearchConfiguration {
    public MinScoreThreshold: number;
    public MaxResults: number;
    public constructor() {
        this.MinScoreThreshold = 0.3;
        this.MaxResults = 10;
    }
}

export class WebSearchConfiguration {
    public MaxResults: number;
    public UseStack: boolean;
    public PreferredSites: string[];
    public constructor(){
        this.MaxResults = 5;
        this.UseStack = true;
        this.PreferredSites = [];
    }
}

export class DocumentSearchConfiguration {
    public MaxResults : number;
    
    public constructor(){
        this.MaxResults = 5;
    }
}

