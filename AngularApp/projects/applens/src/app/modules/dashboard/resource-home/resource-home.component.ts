import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import { DiagnosticService } from 'diagnostic-data';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';

@Component({
  selector: 'resource-home',
  templateUrl: './resource-home.component.html',
  styleUrls: ['./resource-home.component.scss']
})
export class ResourceHomeComponent implements OnInit {

  resource: any;
  keys: string[];

  detectorsWithSupportTopics: DetectorMetaData[];

  supportTopicIdMapping: any[] = [];

  constructor(private _resourceService: ResourceService,private _diagnosticService:  DiagnosticService) { }

  ngOnInit() {
    this._resourceService.getCurrentResource().subscribe(resource => {
      if (resource) {
        this.resource = resource;
        this.keys = Object.keys(this.resource);
      }
    });

    this._diagnosticService.getDetectors().subscribe(detectors => {
      this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);

      this.detectorsWithSupportTopics.forEach(detector => {
        detector.supportTopicList.forEach(supportTopic => {
          this.supportTopicIdMapping.push({ supportTopic : supportTopic, detectorName: detector.name });
        });
      });
    });
  }

  getSupportTopicIdFormatted(supportTopicList: SupportTopic[]) {
    return supportTopicList.map(supportTopic => `${supportTopic.pesId} - ${supportTopic.id}`).join('/r/n');
  }
}
