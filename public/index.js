var buildingsJSONPath = "data/100x100/raleigh_buildings_with_tsne_100x100.json"
var imagesPath = "data/100x100/buildings_thumbs_256.json"
var buildingsArray; 

function loadBase(jsonPath) {
    var loader = new THREE.FileLoader(); 
    loader.load(jsonPath, function(data) {
        buildingsArray = JSON.parse(data); 
        console.log(buildingsArray);
    })
}

loadBase(buildingsJSONPath);