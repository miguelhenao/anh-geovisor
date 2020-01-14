import { loadModules } from 'esri-loader';
const latFieldStrings = ['lat', 'latitude', 'y', 'ycenter'];
const longFieldStrings = ['lon', 'long', 'longitude', 'x', 'xcenter'];
export class ImportCSV {
  agsUrlBase: string;
  map;
  makingWork;
  view;
  filename: string;
  coorGeoPlanas: string;

  public uploadFileCsv(files: Array<any>, coor: string, url: string, map: any, view: any,  makingWork: any): void {
    this.agsUrlBase = url;
    this.coorGeoPlanas = coor;
    this.map = map;
    this.view = view;
    makingWork = true;
    this.makingWork = makingWork;
    if (files && files.length === 1) {
      this.filename = files[0].name.split('.')[0];
      this.handleCsv(files[0]);
    }
  }
  private handleCsv(file: any): void {
    if (file.data) {
      // var decoded = bytesToString(dojox.encoding.base64.decode(file.data));
      // processCsvData(decoded);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        this.processCsvData(reader.result);
      };
      reader.readAsText(file);
    }
  }

  private processCsvData(data: any): void {
    loadModules(['dojox/data/CsvStore', 'dojo/_base/lang', 'esri/geometry/SpatialReference',
      'esri/geometry/Point', 'esri/tasks/GeometryService', 'esri/tasks/support/ProjectParameters', 'esri/layers/FeatureLayer',
      'esri/renderers/SimpleRenderer', 'esri/Graphic', 'esri/layers/support/Field']).then((
        [CsvStore, lang, SpatialReference, Point, GeometryService, ProjectParameters, FeatureLayer, SimpleRenderer,
          Graphic, Field]) => {
        this.makingWork = true;
        const newLineIdx = data.indexOf('\n');
        const firtsLine = lang.trim(data.substr(0, newLineIdx));
        const separator = this.getSeparator(firtsLine);
        const csvStore = new CsvStore({
          data,
          separator
        });
        csvStore.fetch({
          onComplete: (items) => {
            let objectId = 0;
            const featureCollection = this.generateFeatureCollectionTemplateCsv(csvStore, items);
            let latField;
            let longField;
            const fieldNames = csvStore.getAttributes(items[0]);
            fieldNames.forEach((fieldName) => {
              let matchId;
              matchId = latFieldStrings.indexOf(fieldName.toLowerCase());
              if (matchId !== -1) {
                latField = fieldName;
              }
              matchId = longFieldStrings.indexOf(fieldName.toLowerCase());
              if (matchId !== -1) {
                longField = fieldName;
              }
            });
            let wkid;
            const arrAttrib = [];
            const arrGeom = [];
            if (this.coorGeoPlanas === 'P') {
              wkid = 3116; // MAGNA-SIRGAS / Colombia Bogota zone
            } else {
              wkid = 4326; // WGS84
            }
            const sisRef = new SpatialReference({
              wkid
            });
            items.forEach((item) => {
              const attrs = csvStore.getAttributes(item);
              const attributes = {};
              attrs.forEach((attr) => {
                const value = Number(csvStore.getValue(item, attr));
                if (isNaN(value)) {
                  attributes[attr] = csvStore.getValue(item, attr);
                } else {
                  attributes[attr] = value;
                }
              });
              attributes['__OBJECTID'] = objectId;
              objectId++;
              const latitude = parseFloat(attributes[latField]);
              const longitude = parseFloat(attributes[longField]);
              if (isNaN(latitude) || isNaN(longitude)) {
                return;
              }
              const geom = new Point(longitude, latitude, sisRef);
              arrAttrib.push(attributes);
              arrGeom.push(geom);
            });
            const outSR = new SpatialReference({ wkid: 102100 }); // ESRI Web Mercator
            const geomSvc = new GeometryService({
              url: this.agsUrlBase + 'rest/services/Utilities/Geometry/GeometryServer'
            });
            const params = new ProjectParameters({
              geometries: arrGeom,
              outSpatialReference: outSR
            });
            let error = false;
            let sourceGraphics = [];
            geomSvc.project(params).then((arrGeomProj) => {
              arrGeomProj.forEach((geomProj, index) => {
                const geometry = new Point(geomProj.x, geomProj.y, outSR);
                if (isNaN(geometry.x) || isNaN(geometry.y)) {
                  error = true;
                  return;
                }
                const feature = {
                  geometry: geometry.toJSON(),
                  attributes: arrAttrib[index]
                };
                featureCollection.featureSet.features.push(feature);
              });
              const graphics = featureCollection.featureSet.features.map((feature) => {
                return Graphic.fromJSON(feature);
              });
              sourceGraphics = sourceGraphics.concat(graphics);
              const featureLayer = new FeatureLayer({
                title: this.filename,
                objectIdField: '__OBJECTID',
                source: graphics,
                renderer: SimpleRenderer.fromJSON(featureCollection.layerDefinition.drawingInfo.renderer),
                fields: featureCollection.layerDefinition.fields.map((field) => {
                  return Field.fromJSON(field);
                })
              });
              featureLayer.load().then(() => {
                 if (featureLayer.loadStatus === 'loaded') {
                  this.map.add(featureLayer);
                  this.view.goTo(sourceGraphics);
                }
              });
            });
          }
        });
      });
  }
  generateDefaultPopupInfo(featureCollection: any): any {
    const fields = featureCollection.layerDefinition.fields;
    const decimal = {
      esriFieldTypeDouble: 1,
      esriFieldTypeSingle: 1
    };
    const integer = {
      esriFieldTypeInteger: 1,
      esriFieldTypeSmallInteger: 1
    };
    const dt = {
      esriFieldTypeDate: 1
    };
    let displayField = null;
    const fieldInfos = fields.map((item) => {
      if (item.name.toUpperCase() === 'NAME' || item.name.toUpperCase() === 'NOMBRE') {
        displayField = item.name;
      }
      let visible = (item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeGeometry');
      let format = null;
      if (visible) {
        const f = item.name.toLowerCase();
        const hideFieldsStr = ',stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,subclass,subclass_,rings_ok,rings_nok,';
        if (hideFieldsStr.indexOf(',' + f + ',') > -1 || f.indexOf('area') > -1 || f.indexOf('length') > -1 || f.indexOf('shape') > -1 ||
          f.indexOf('perimeter') > -1 || f.indexOf('objectid') > -1 || f.indexOf('_') === f.length - 1 ||
          f.indexOf('_i') === f.length - 2) {
          visible = false;
        }
        if (item.type in integer) {
          format = {
            places: 0,
            digitSeparator: true
          };
        } else if (item.type in decimal) {
          format = {
            places: 2,
            digitSeparator: true
          };
        } else if (item.type in dt) {
          format = {
            dateFormat: 'shortDateShortTime'
          };
        }
      }
      return {
        fieldName: item.name,
        label: item.alias,
        isEditable: false,
        tooltip: '',
        visible,
        format,
        stringFieldOption: 'textbox'
      };
    });
    const popupInfo = {
      title: displayField ? '{' + displayField + '}' : '',
      fieldInfos,
      description: null,
      showAttachments: false,
      mediaInfos: []
    };
    return popupInfo;
  }
  generateFeatureCollectionTemplateCsv(store: any, items: any): any {
    const featureCollection = {
      layerDefinition: null,
      featureSet: {
        features: [],
        geometryType: 'esriGeometryPoint'
      }
    };
    featureCollection.layerDefinition = {
      geometryType: 'esriGeometryPoint',
      objectIdField: '__OBJECTID',
      type: 'Feature Layer',
      typeIdField: '',
      drawingInfo: {
        renderer: {
          type: 'simple',
          symbol: {
            type: 'esriPMS',
            url: 'images\CSV',
            // tslint:disable-next-line:max-line-length
            imageData: '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',
            contentType: 'image/png',
            width: 15,
            height: 15
          }
        }
      },
      fields: [
        {
          name: '__OBJECTID',
          alias: '__OBJECTID',
          type: 'esriFieldTypeOID',
          editable: false,
          domain: null
        }
      ],
      types: [],
      capabilities: 'Query'
    };

    const fields = store.getAttributes(items[0]);
    fields.forEach((field) => {
      const value = store.getValue(items[0], field);
      const parsedValue = Number(value);
      if (isNaN(parsedValue)) { // check first value and see if it is a number
        featureCollection.layerDefinition.fields.push({
          name: field,
          alias: field,
          type: 'esriFieldTypeString',
          editable: true,
          domain: null
        });
      } else {
        featureCollection.layerDefinition.fields.push({
          name: field,
          alias: field,
          type: 'esriFieldTypeDouble',
          editable: true,
          domain: null
        });
      }
    });
    return featureCollection;
  }

  private getSeparator(str: any): any {
    const separators = [',', '      ', ';', '|'];
    let maxSeparatorLength = 0;
    let maxSeparatorValue = '';
    separators.forEach((separator) => {
      const length = str.split(separator).length;
      if (length > maxSeparatorLength) {
        maxSeparatorLength = length;
        maxSeparatorValue = separator;
      }
    });
    return maxSeparatorValue;
  }
}
