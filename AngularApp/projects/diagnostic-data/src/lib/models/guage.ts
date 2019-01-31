export class GuageControl{
	public guages: GuageElement[];
	public renderDirection =  GuageRenderDirection.Vertical;
	public guageSize = GuageSize.Medium;
	
	constructor() {
	}
}

export enum GuageSize {
    Small,
    Medium,
    Large,
    Inherit
}


export enum GuageRenderDirection {
    Horizontal,
    Vertical
}


export class GuageElement{
	public guageGraphicElement : GuageGraphic;
	public guageDescription : string;
	
	constructor(guageGraphic: GuageGraphic, guageDescription: string)
	{
		this.guageGraphicElement = guageGraphic;
		this.guageDescription = guageDescription;
	}
}





export class GuageGraphic{
	public fillColor:string;
	public percentFilled : number;
	public numberDisplay:string;	
	public label:string;
	public size:GuageSize;
	width : number;
	height : number;
	turnValue:number;
	turnMultiplicationFactor:number;
	transformString : string;	
	
	setGuageParameters(fillColor : string, percentFilled : number, numberDisplay:string, label:string, size : GuageSize ):void{
		
		if(fillColor.trim() == "")
			this.fillColor = "#5664F9";
		else
			this.fillColor = fillColor;
	
		if(percentFilled>100)
		{
			this.percentFilled = 100;
			this.turnValue = Math.round(this.turnMultiplicationFactor * this.percentFilled * 1000)/1000; //This will round off the number to 3 decimal places
		}
		else
		{
			if(percentFilled<1)
			{
				this.percentFilled = 0;
				this.turnValue = 0.003; /*Ideally the turn should be 0 however to make sure that the needle is visible, turn it just a little*/
			}
			else
			{
				this.percentFilled = Math.round(percentFilled);
				this.turnValue = Math.round(this.turnMultiplicationFactor * this.percentFilled * 1000)/1000; //This will round off the number to 3 decimal places
			}
		}
		
		
		this.transformString = "rotate(" + this.turnValue.toString()  + "turn)";
		
		this.numberDisplay = numberDisplay;
		this.label = label;
		this.size = size;
		//if(size == "SMALL")
		if(size == GuageSize.Small)
		{
			this.width = 120;
			this.height = 75;
		}
		else
		{
			//if(size == "LARGE")
			if(size == GuageSize.Large)
			{
				this.width = 300;
				this.height = 188;
			}
			else
			{
                //if(size == "MEDIUM" || (size == "INHERIT")) i.e.. Default to medium size.
				this.width = 200;
				this.height = 125;
			}
		}
	}
	
	constructor(fillColor : string, percentFilled : number, numberDisplay:string, label:string, size : GuageSize ) 
	{
		this.turnMultiplicationFactor = 0.005;
		
		if(fillColor.trim() == "")
			this.fillColor = "#3a9bc7";
		else
			this.fillColor = fillColor;
		
	
		if(percentFilled>100)
		{
			this.percentFilled = 100;
			this.turnValue = Math.round(this.turnMultiplicationFactor * this.percentFilled * 1000)/1000; //This will round off the number to 3 decimal places		
		}
		else
		{
			if(percentFilled<1)
			{
				this.percentFilled = 0;
				this.turnValue = 0.003; /*Ideally the turn should be 0 however to make sure that the needle is visible, turn it just a little*/
			}
			else
			{
				this.percentFilled = Math.round(percentFilled);
				this.turnValue = Math.round(this.turnMultiplicationFactor * this.percentFilled * 1000)/1000; //This will round off the number to 3 decimal places
			}
		}
				
		
		this.transformString = "rotate(" + this.turnValue.toString() + "turn)";
		
		this.numberDisplay = numberDisplay;
		this.label = label;
		this.size = size;
		//if(size == "SMALL")
		if(size == GuageSize.Small)
		{
			this.width = 120;
			this.height = 75;
		}
		else
		{
			//if(size == "LARGE")
			if(size == GuageSize.Large)
			{
				this.width = 300;
				this.height = 188;
			}
			else
			{
                //Default to Medium size
				this.width = 200;
				this.height = 125;
			}
		}
	}
}



