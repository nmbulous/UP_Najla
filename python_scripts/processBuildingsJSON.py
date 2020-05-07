# Currently we have two JSON files, one containing image information
# and grid position and another containing TSNE postion information
# that need to be combined into one file
# In the future, we should expect one file as input with all of the
# information 

import json
from collections import OrderedDict

with open('/Users/najlabulous/Documents/UrbanPanorama/Grid_Express/data/100x100/raleigh-tsne-grid-buildings-10000.json') as f1:
    buildingsDict = json.load(f1)
with open('/Users/najlabulous/Documents/UrbanPanorama/Grid_Express/data/100x100/image_tsne_projections_100x100.json') as f2:
    tsneCoordsDict = json.load(f2)

for building in buildingsDict: 
    imageName = building['image'][0:8]
    tsneMatch = [x for x in tsneCoordsDict if x['imageName'] == imageName]

    # There's a mismatch in the number of images with current data json, so there might not be a match
    # Will be fixed in the future and this conditional can be removed 
    if tsneMatch != []:
        building.update({'tsne_x': tsneMatch[0]['x'], 'tsne_y': tsneMatch[0]['y'], 'tsne_idx' : tsneMatch[0]['idx']})

with open('/Users/najlabulous/Documents/UrbanPanorama/Grid_Express/data/100x100/raleigh_buildings_with_tsne_100x100.json', 'w') as json_file:
    json.dump(buildingsDict, json_file)



    