# from osgeo import ogr
# import os
import ogr, os, glob

import sys, json
from pprint import pprint

outFolder = 'pokemon_stops/'
# if not os.path.exists(outFolder):
#     os.makedirs(outFolder)

stopText = glob.glob(outFolder + "*.js")[0];

print 'reading data from %s' % stopText

shpDriver = ogr.GetDriverByName("ESRI Shapefile")

outSHPfn = outFolder + 'poke_stops.shp'

if os.path.exists(outSHPfn):
    shpDriver.DeleteDataSource(outSHPfn)

outDataSource = shpDriver.CreateDataSource(outSHPfn)
outLayer = outDataSource.CreateLayer(outSHPfn, geom_type=ogr.wkbPoint)

# create fields

idFieldName = 'poke_id'
titleFieldName = 'poke_title'
typeFieldName = 'poke_type'
realrandFieldName = 'realrand'
enabledFieldName = 'enabled'
confirmFieldName = 'confirm'
cleantitleFieldName = 'cleantitle'

outLayer.CreateField(ogr.FieldDefn(idFieldName, ogr.OFTInteger))
outLayer.CreateField(ogr.FieldDefn(titleFieldName, ogr.OFTString))
outLayer.CreateField(ogr.FieldDefn(typeFieldName, ogr.OFTInteger))
outLayer.CreateField(ogr.FieldDefn(realrandFieldName, ogr.OFTInteger))
outLayer.CreateField(ogr.FieldDefn(enabledFieldName, ogr.OFTInteger))
outLayer.CreateField(ogr.FieldDefn(confirmFieldName, ogr.OFTInteger))
outLayer.CreateField(ogr.FieldDefn(cleantitleFieldName, ogr.OFTString))

featureDefn = outLayer.GetLayerDefn()

_c = 0
with open(stopText) as stopFile:
    stopJson = json.load(stopFile)
    for stop in stopJson:
        
        # print stop
        # sys.exit()

        outFeature = ogr.Feature(featureDefn)
        point = ogr.Geometry(ogr.wkbPoint)
        point.AddPoint(float(stop['poke_lng'])/1e6,float(stop['poke_lat'])/1e6)
        outFeature.SetGeometry(point)
        outFeature.SetField(idFieldName, int(stop['poke_id']))
        outFeature.SetField(titleFieldName, str(stop['poke_title']))
        outFeature.SetField(typeFieldName, int(stop['poke_type']))
        outFeature.SetField(realrandFieldName, int(stop['realrand']))
        outFeature.SetField(enabledFieldName, int(stop['poke_enabled']))
        outFeature.SetField(confirmFieldName, int(stop['confirm']))
        outFeature.SetField(cleantitleFieldName, str(stop['cleantitle']))

        outLayer.CreateFeature(outFeature)

        _c = _c + 1

    print "created shapefile with %s stops." % _c

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
