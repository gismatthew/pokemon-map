# from osgeo import ogr
# import os
import ogr, os, glob

import sys, json
from pprint import pprint

outFolder = 'routes_shp2/'
if not os.path.exists(outFolder):
    os.makedirs(outFolder)

shpDriver = ogr.GetDriverByName("ESRI Shapefile")

outSHPfn = outFolder + 'stops.shp'
outSHPfn2 = outFolder + 'routes.shp'

if os.path.exists(outSHPfn):
    shpDriver.DeleteDataSource(outSHPfn)
if os.path.exists(outSHPfn2):
    shpDriver.DeleteDataSource(outSHPfn2)

outDataSource = shpDriver.CreateDataSource(outSHPfn)
outLayer = outDataSource.CreateLayer(outSHPfn, geom_type=ogr.wkbPoint)
outDataSource2 = shpDriver.CreateDataSource(outSHPfn2)
outLayer2 = outDataSource2.CreateLayer(outSHPfn2, geom_type=ogr.wkbLineString)

# create fields
idFieldName2 = 'route_id'
idField2 = ogr.FieldDefn(idFieldName2, ogr.OFTInteger)
outLayer2.CreateField(idField2)

idFieldName = 'stop_id'
nameFieldName = 'name'
routeFieldName = 'route_id'
idField = ogr.FieldDefn(idFieldName, ogr.OFTInteger)
nameField = ogr.FieldDefn(nameFieldName, ogr.OFTString)
routeField = ogr.FieldDefn(routeFieldName, ogr.OFTString)
outLayer.CreateField(idField)
outLayer.CreateField(nameField)
outLayer.CreateField(routeField)

for routeText in glob.glob("routes/*"):
    with open(routeText) as routeFile:
        routeJson = json.load(routeFile)
        _stops = routeJson['result']['stops']
        _routeId = _stops[0]['lineDirs'][0]['lineDirId']

        line = ogr.Geometry(type=ogr.wkbLineString)

        _c = 0
        for _stop in _stops:
            _latLon = _stop['point']
            _name = str(_stop['name'])
            _id = _stop['stopId']

            line.AddPoint_2D(_latLon['lon'],_latLon['lat'])

            #create point geometry
            point = ogr.Geometry(ogr.wkbPoint)
            point.AddPoint(_latLon['lon'],_latLon['lat'])

            # Create the feature and set values
            featureDefn = outLayer.GetLayerDefn()
            outFeature = ogr.Feature(featureDefn)
            outFeature.SetGeometry(point)
            outFeature.SetField(idFieldName, _id)
            outFeature.SetField(nameFieldName, _name)
            outFeature.SetField(routeFieldName, _routeId)

            outLayer.CreateFeature(outFeature)
            _c = _c + 1

        featureDefn2 = outLayer2.GetLayerDefn()
        outFeature2 = ogr.Feature(featureDefn2)
        outFeature2.SetGeometry(line)
        outFeature2.SetField(idFieldName2, _routeId)
        outLayer2.CreateFeature(outFeature2)

        print "created shapefile for route %s with %s stops." % (_routeId, _c)

        # loop thru stops
        #     point shapefile
        #     line shapefile
        # save 2 shapefiles
        #

# with open('routes/1a') as data_file:
#     data = json.load(data_file)
#
# pprint(data['result']['stops'][1])

sys.exit(0)
