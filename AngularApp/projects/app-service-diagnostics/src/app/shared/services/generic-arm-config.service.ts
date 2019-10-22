import { Injectable } from '@angular/core';
import { ArmResourceConfig, ResourceDescriptor, ResourceDescriptorGroups } from '../models/arm/armResourceConfig'
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Category } from "../../shared-v2/models/category";
import { Observable, of, forkJoin } from 'rxjs';

@Injectable()
export class GenericArmConfigService {
  public resourceMap: Array<ArmResourceConfig> = [];
  public resourceConfig: ArmResourceConfig;
  public overrideConfig: ArmResourceConfig;

  public parseResourceUri(resourceUri: string): ResourceDescriptor {
    let resourceDesc: ResourceDescriptor = new ResourceDescriptor();

    if (resourceUri) {
      if (!resourceUri.startsWith('/')) {
        resourceUri = '/' + resourceUri;
      }

      var result = resourceUri.match(resourceDesc.resourceUriRegExp);
      if (result && result.length > 0) {

        if (result[ResourceDescriptorGroups.subscription]) {
          resourceDesc.subscription = result[ResourceDescriptorGroups.subscription];
        }
        else {
          resourceDesc.subscription = '';
        }

        if (result[ResourceDescriptorGroups.resourceGroup]) {
          resourceDesc.resourceGroup = result[ResourceDescriptorGroups.resourceGroup];
        }
        else {
          resourceDesc.resourceGroup = '';
        }

        if (result[ResourceDescriptorGroups.provider]) {
          resourceDesc.provider = result[ResourceDescriptorGroups.provider];
        }
        else {
          resourceDesc.provider = '';
        }

        if (result[ResourceDescriptorGroups.resource]) {
          const resourceParts = result[ResourceDescriptorGroups.resource].split('/');
          if (resourceParts.length % 2 != 0) {
            //ARM URI is incorrect. The resource section contains an uneven number of parts
            resourceDesc.resource = '';
          }
          else {
            for (var i = 0; i < resourceParts.length; i += 2) {
              resourceDesc.type = resourceParts[i];
              resourceDesc.resource = resourceParts[i + 1];

              resourceDesc.types.push(resourceDesc.type);
              resourceDesc.resources.push(resourceDesc.resource);
            }
          }
        }
        else {
          resourceDesc.resource = '';
        }

      }
    }
    return resourceDesc;
  }

  getValue(source: any, override: any): any {

    if (typeof source != 'undefined' && typeof override == 'undefined') {
      return source;
    }

    if (typeof source == 'undefined' && typeof override != 'undefined') {
      return override;
    }


    if (
      ((source instanceof Array) && !(override instanceof Array))
      || (!(source instanceof Array) && (override instanceof Array))
      || ((typeof source != typeof override))
    ) {
      return override;
    }

    if (source instanceof Array) {
      //Assumes string array so the action is to merge the two string arrays.
      //The override value will always be present along with what the user entered.
      if (override.length > 0) {
        var tempVal = (source.join(',') + ',' + override.join(',')).split(',');
        var value = [];
        tempVal.forEach(element => {
          if (value.indexOf(element) < 0) {
            value.push(element);
          }
        });
        return value;
      }
      else {
        return source;
      }
    }

    if ((typeof source == 'string')) {
      if (override !== '') {
        return override;
      }
      else {
        return source;
      }
    }
    else {
      if ((typeof source == 'boolean') || (typeof source == 'number')) {
        return override;
      }
    }
    return null;
  }


  constructor(private _http: HttpClient) { }

  public initArmConfig(resourceUri: string): Observable<ArmResourceConfig> {
    if (!resourceUri.startsWith('/')) {
      resourceUri = '/' + resourceUri;
    }
    let resourceDesc = this.parseResourceUri(resourceUri);
    const baseUri: string = 'armResourceConfig/' + resourceDesc.provider + '/' + resourceDesc.type + '/';

    let override = this._http.get<ArmResourceConfig>(baseUri + 'override.json')
    let config = this._http.get<ArmResourceConfig>(baseUri + 'config.json')

    return forkJoin(override, config).pipe(catchError(err => of(err)),
      map(configs => {
        if (!(configs instanceof Array)) {
          console.log(`Error occurred while reading arm resource config. Details...`);
          console.log(configs);
        }
        this.overrideConfig = configs[0];
        this.resourceConfig = configs[1];

        //Marging the two configs.
        var currConfig: ArmResourceConfig = {
          homePageText: {
            title: '',
            description: '',
            searchBarPlaceHolder: ''
          },
          categories: [{
            id: '',
            name: '',
            description: '',
            keywords: [],
            color: '',
            createFlowForCategory: true,
            chatEnabled: false
          }]
        }

        //currConfig.homePageText.title
        if (
          (this.overrideConfig.homePageText && this.overrideConfig.homePageText.title) ||
          (this.resourceConfig.homePageText && this.resourceConfig.homePageText.title)
        ) {
          currConfig.homePageText.title = this.getValue(this.resourceConfig.homePageText.title, this.overrideConfig.homePageText.title);
        }

        //currConfig.homePageText.description
        if (
          (this.overrideConfig.homePageText && this.overrideConfig.homePageText.description) ||
          (this.resourceConfig.homePageText && this.resourceConfig.homePageText.description)
        ) {
          currConfig.homePageText.description = this.getValue(this.resourceConfig.homePageText.description, this.overrideConfig.homePageText.description);
        }

        //currConfig.homePageText.searchBarPlaceHolder
        if (
          (this.overrideConfig.homePageText && this.overrideConfig.homePageText.searchBarPlaceHolder) ||
          (this.resourceConfig.homePageText && this.resourceConfig.homePageText.searchBarPlaceHolder)
        ) {
          currConfig.homePageText.searchBarPlaceHolder = this.getValue(this.resourceConfig.homePageText.searchBarPlaceHolder, this.overrideConfig.homePageText.searchBarPlaceHolder);
        }

        //currConfig.matchRegEx
        if (this.getValue(this.resourceConfig.matchRegEx, this.overrideConfig.matchRegEx) != null) {
          currConfig.matchRegEx = this.getValue(this.resourceConfig.matchRegEx, this.overrideConfig.matchRegEx);
        }

        //currConfig.searchSuffix
        if (this.getValue(this.resourceConfig.searchSuffix, this.overrideConfig.searchSuffix) != null) {
          currConfig.searchSuffix = this.getValue(this.resourceConfig.searchSuffix, this.overrideConfig.searchSuffix);
        }

        //currConfig.azureServiceName
        if (this.getValue(this.resourceConfig.azureServiceName, this.overrideConfig.azureServiceName) != null) {
          currConfig.azureServiceName = this.getValue(this.resourceConfig.azureServiceName, this.overrideConfig.azureServiceName);
        }

        //currConfig.armApiVersion
        if (this.getValue(this.resourceConfig.armApiVersion, this.overrideConfig.armApiVersion) != null) {
          currConfig.armApiVersion = this.getValue(this.resourceConfig.armApiVersion, this.overrideConfig.armApiVersion);
        }

        //currConfig.isSearchEnabled
        if (this.getValue(this.resourceConfig.isSearchEnabled, this.overrideConfig.isSearchEnabled) != null) {
          currConfig.isSearchEnabled = this.getValue(this.resourceConfig.isSearchEnabled, this.overrideConfig.isSearchEnabled);
        }

        //currConfig.pesId
        if (this.getValue(this.resourceConfig.pesId, this.overrideConfig.pesId) != null) {
          currConfig.pesId = this.getValue(this.resourceConfig.pesId, this.overrideConfig.pesId);
        }

        //currConfig.isApplicableForLiveChat
        if (this.getValue(this.resourceConfig.isApplicableForLiveChat, this.overrideConfig.isApplicableForLiveChat) != null) {
          currConfig.isApplicableForLiveChat = this.getValue(this.resourceConfig.isApplicableForLiveChat, this.overrideConfig.isApplicableForLiveChat);
        }

        //currConfig.categories
        if (this.overrideConfig.categories && !this.resourceConfig.categories) {
          currConfig.categories = this.overrideConfig.categories.filter(cat => { return cat.id !== '' });
        }
        else {
          if (!this.overrideConfig.categories && this.resourceConfig.categories) {
            currConfig.categories = this.resourceConfig.categories.filter(cat => { return cat.id !== '' });
          }
          else {

            var processedCategories: string[] = [];
            let mergedCategories: Category[] = [];
            let currMergedCategory: Category = {
              id: '',
              name: '',
              description: '',
              keywords: [],
              color: '',
              createFlowForCategory: true,
              chatEnabled: false
            };

            this.resourceConfig.categories.forEach(currCat => {

              var categoryToCompare: Category = null;
              this.overrideConfig.categories.some(overrideCat => {
                if (overrideCat.id === currCat.id) {
                  categoryToCompare = overrideCat;
                  return true;
                }
              })

              if (categoryToCompare) {
                //currConfig.categories[x].id
                currMergedCategory.id = categoryToCompare.id;

                //currConfig.categories[x].name
                if (categoryToCompare.name || currCat.name) {
                  currMergedCategory.name = this.getValue(currCat.name, categoryToCompare.name);
                }

                //currConfig.categories[x].description
                if (categoryToCompare.description || currCat.description) {
                  currMergedCategory.description = this.getValue(currCat.description, categoryToCompare.description);
                }

                //currConfig.categories[x].keywords
                if (categoryToCompare.keywords || currCat.keywords) {
                  currMergedCategory.keywords = this.getValue(currCat.keywords, categoryToCompare.keywords);
                }

                //currConfig.categories[x].color
                if (categoryToCompare.color || currCat.color) {
                  currMergedCategory.color = this.getValue(currCat.color, categoryToCompare.color);
                }

                //currConfig.categories[x].createFlowForCategory
                if (this.getValue(currCat.createFlowForCategory, categoryToCompare.createFlowForCategory) != null) {
                  currMergedCategory.createFlowForCategory = this.getValue(currCat.createFlowForCategory, categoryToCompare.createFlowForCategory);
                }

                //currConfig.categories[x].chatEnabled
                if (this.getValue(currCat.chatEnabled, categoryToCompare.chatEnabled) != null) {
                  currMergedCategory.chatEnabled = this.getValue(currCat.chatEnabled, categoryToCompare.chatEnabled);
                }

                mergedCategories.push(currMergedCategory);
                processedCategories.push(currMergedCategory.id);
              }
              else {
                mergedCategories.push(currCat);
                processedCategories.push(currCat.id);
              }
            });

            //Check to see if there was a config placed in the override that we haven't alrady processed

            this.overrideConfig.categories.forEach(currCat => {
              if (currCat.id != '') {
                if (processedCategories.indexOf(currCat.id) < 0) {
                  mergedCategories.push(currCat);
                  processedCategories.push(currCat.id);
                }
              }
            });

            //Override the default for all categories. Look for a category with empty id in override and then use it to override every category value in merged categories

            this.overrideConfig.categories.some(currCat => {
              if (currCat.id == '') {
                mergedCategories.forEach(mergedCat => {

                  //Check to see if this overriding was already processed.
                  //If an element with the same id is found, then it was already processed. No need to apply the global rules here.
                  var tempCat: Category;
                  tempCat = this.overrideConfig.categories.find((element) => {
                    return element.id === mergedCat.id;
                  });
                  if (!tempCat) {
                    //Override keywords
                    if (currCat.keywords && currCat.keywords.length > 0) {
                      var mergedArray: string[];
                      mergedArray = (mergedCat.keywords.join(',') + ',' + currCat.keywords.join(',')).split(',');
                      mergedArray.forEach(strElement => {
                        if (mergedCat.keywords.indexOf(strElement) < 0) {
                          mergedCat.keywords.push(strElement);
                        }
                      });
                    }

                    //Override color
                    if (!mergedCat.color) {
                      mergedCat.color = this.getValue(mergedCat.color, currCat.color);
                    }

                    //Override createFlowForCategory
                    if (this.getValue(mergedCat.createFlowForCategory, currCat.createFlowForCategory) != null) {
                      mergedCat.createFlowForCategory = this.getValue(mergedCat.createFlowForCategory, currCat.createFlowForCategory);
                    }

                    //Override chatEnabled
                    if (this.getValue(mergedCat.chatEnabled, currCat.chatEnabled) != null) {
                      mergedCat.chatEnabled = this.getValue(mergedCat.chatEnabled, currCat.chatEnabled);
                    }
                  }
                });

                return true;
              }
            });
            if (mergedCategories.length > 0) {
              currConfig.categories = mergedCategories;
            }
          }
        }
        this.resourceMap.push(currConfig);
        return currConfig;
      })
    );
  }


  getArmResourceConfig(resourceUri: string, recurse?: boolean): ArmResourceConfig {
    let returlValue: ArmResourceConfig = new ArmResourceConfig();
    if (this.resourceMap.length > 0) {
      this.resourceMap.some((resource: ArmResourceConfig) => {
        const matchPattern: RegExp = new RegExp(`${resource.matchRegEx.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, "i");
        var result = resourceUri.match(matchPattern);
        if (result && result.length > 0) {
          returlValue = resource;
          return true;
        }
      });
    }
    return returlValue;
  }

  getApiVersion(resourceUri: string): string {
    let apiVersion = '';
    if (this.getArmResourceConfig(resourceUri)) {
      apiVersion = this.getArmResourceConfig(resourceUri).armApiVersion;
    }
    return apiVersion;
  }

}
