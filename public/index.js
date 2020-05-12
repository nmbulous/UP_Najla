/*
The following is all related to readings and parsing the input building JSON file
and creating atlas files
TODO: Move into processBuildingsJSON.py
*/

var buildingsJSONPath = "data/100x100/raleigh_buildings_with_tsne_100x100.json"
var imagesPath = "data/100x100/buildings_thumbs_256/"
var buildingsArr; 

function loadBase(jsonPath, imgPath, size) {
    var loader = new THREE.FileLoader(); 
    loader.load(jsonPath, function(data) {
        buildingsArr = JSON.parse(data); 
        buildingsArr.sort(compare);
        changeFormat(buildingsArr, imgPath)
    })
}

// I used this to log image paths based on their atlases and moved 
// the information into new files
// TODO: Move into processBuildingsJSON.py 
function layoutGrid() {
    // Atlases are 50 x 50 images 
    var atlasLength = 50;
    var gridLength = 100; 

    // For the 100x100 grid, we need to generate 4 atlases of the images
    // Four 50 x 50 arrays 
    var topLeftArr = []; 
    var topRightArr = [];
    var bottomLeftArr = []; 
    var bottomRightArr = []; 

    // Top left quadrant 
    for (y = 0; y < 50; y++) {
        for (x = 0; x < 50; x++) {
            var buildingsArrIndex = x + (gridLength * y); 
            topLeftArr.push(buildingsArr[buildingsArrIndex]);
        }
    }

    // Top right quadrant 
    for (y = 0; y < 50; y++) {
        for (x = 50; x < 100; x++) {
            var buildingsArrIndex = x + (gridLength * y); 
            topRightArr.push(buildingsArr[buildingsArrIndex]);
        }
    }

    // Bottom left quadrant 
    for (y = 50; y < 100; y++) {
        for (x = 0; x < 50; x++) {
            var buildingsArrIndex = x + (gridLength * y); 
            bottomLeftArr.push(buildingsArr[buildingsArrIndex]);
        }
    }

    // Bottom right quadrant 
    for (y = 50; y < 100; y++) {
        for (x = 50; x < 100; x++) {
            var buildingsArrIndex = x + (gridLength * y); 
            bottomRightArr.push(buildingsArr[buildingsArrIndex]);
        }
    }

    var hundredArr = [];
    // Top left quadrant 10 x 10
    for (y = 0; y < 20; y++) {
        for (x = 0; x < 20; x++) {
            var buildingsArrIndex = x + (gridLength * y); 
            hundredArr.push(buildingsArr[buildingsArrIndex]);
        }
    }

    for (i=0; i < hundredArr.length; i++) {
        console.log(hundredArr[i].image);
    }
}

/*
JSON Manipulation
TODO: Move these into the processBuildingsJSON.py script
*/

// Initial setup and parsing conversion, splits grid coordinates and lat/long into separate fields, adds image path, selection bool, initial count, sorts by grid coords
function changeFormat(arr, imgPath) {
  for (var i = 0; i < arr.length; i++) {
    //formatting for leaflet map
    arr[i].lat = arr[i].latlong[0];
    arr[i].lng = arr[i].latlong[1];
    arr[i].count = 1;

    //formatting for display
    arr[i].image = imgPath + arr[i].image;
    arr[i].selected = false;

    //formatting for grid
    arr[i].x = parseInt(arr[i].grid[0]);
    arr[i].y = parseInt(arr[i].grid[1]);
    arr[i].id = parseInt(i);
  }
}

// Sorts objects by (x, y) values, ascending order from (0,0) from unsorted array
// Changed this so that it ascends via x value i.e. (0,0) (1,0) (2,0)
function compare(a, b){

  const x1 = a.grid[0];
  const x2 = b.grid[0];
  const y1 = a.grid[1];
  const y2 = b.grid[1];

  let comparison = 0;
  if (y1 > y2) {
    comparison = 1;
  } else if (y1 < y2) {
    comparison = -1;
  } else if (y1 === y2) {
    if (x1 > x2) {
      comparison = 1;
    } else if (x1 < x2) {
      comparison = -1;
    }
  }
  return comparison;
}

/*
The majority of this is from https://douglasduhaime.com/posts/visualizing-tsne-maps-with-three-js.html
*/ 

var topLeftAtlasPath = 'data/100x100/atlases/topLeftAtlas_1280x1280.jpg';
var topRightAtlasPath = 'data/100x100/atlases/topRightAtlas_1280x1280.jpg';
var bottomLeftAtlasPath = 'data/100x100/atlases/bottomLeftAtlas_1280x1280.jpg';
var bottomRightAtlasPath = 'data/100x100/atlases/bottomRightAtlas_1280x1280.jpg';

// Create the scene and a camera to view it
var scene = new THREE.Scene();

/**
* Camera
**/

// Specify the portion of the scene visiable at any time (in degrees)
var fieldOfView = 75;

// Specify the camera's aspect ratio
var aspectRatio = window.innerWidth / window.innerHeight;

// Specify the near and far clipping planes. Only objects
// between those planes will be rendered in the scene
// (these values help control the number of items rendered
// at any given time)
var nearPlane = 100;
var farPlane = 50000;

// Use the values specified above to create a camera
var camera = new THREE.PerspectiveCamera(
  fieldOfView, aspectRatio, nearPlane, farPlane
);

// Finally, set the camera's position in the z-dimension
camera.position.z = 5500;
camera.position.y = -100;

/**
* Renderer
**/

// Create the canvas with a renderer
var renderer = new THREE.WebGLRenderer({antialias: true});

// Add support for retina displays
renderer.setPixelRatio(window.devicePixelRatio);

// Specify the size of the canvas
renderer.setSize( window.innerWidth, window.innerHeight );

// Add the canvas to the DOM
document.body.appendChild( renderer.domElement );



/**
* Images
**/

// Identify the total number of cols & rows in the image atlas
var atlas = {width: 1280, height: 1280, cols: 50, rows: 50};

// Identify the subimage size in px
var image = {width: atlas.width/atlas.cols, height: atlas.height/atlas.rows};

var scale = 5.0; 

/*
Now we need to push some vertices into that geometry to identify the coordinates the geometry should cover
*/

function buildGridGeometry(startX, startY, geometry) {
  for (var y = 0; y < atlas.rows; y++) {
    // For each of the 100 subimages in the montage, add four 
    // vertices (one for each corner), in the following order:
    // lower left, lower right, upper right, upper left
    for (var x = 0; x < atlas.cols; x++) {
      
      // Create x, y, z coords for this subimage
      var coords = {
        x: startX + x * image.width/scale,
        y: startY + y * image.height/scale,
        z: -400
      };

      console.log("x: " + coords.x + " y: " + coords.y);
      
      geometry.vertices.push(
        new THREE.Vector3(
          coords.x,
          coords.y,
          coords.z
        ),
        new THREE.Vector3(
          coords.x + image.width/scale,
          coords.y,
          coords.z
        ),
        new THREE.Vector3(
          coords.x + image.width/scale,
          coords.y + image.height/scale,
          coords.z
        ),
        new THREE.Vector3(
          coords.x,
          coords.y + image.height/scale,
          coords.z
        )
      );
  
      // Add the first face (the lower-right triangle)
      var faceOne = new THREE.Face3(
        geometry.vertices.length-4,
        geometry.vertices.length-3,
        geometry.vertices.length-2
      )
  
      // Add the second face (the upper-left triangle)
      var faceTwo = new THREE.Face3(
        geometry.vertices.length-4,
        geometry.vertices.length-2,
        geometry.vertices.length-1
      )
  
      // Add those faces to the geometry
      geometry.faces.push(faceOne, faceTwo);
      
      // Identify this subimage's offset in the x dimension
      // An xOffset of 0 means the subimage starts flush with
      // the left-hand edge of the atlas
      var xOffset = x * image.width/atlas.width; 
      
      // Identify this subimage's offset in the y dimension
      // A yOffset of 0 means the subimage starts flush with
      // the bottom edge of the atlas
      var yOffset = y * image.height/atlas.height; 
      
      // Use the xOffset and yOffset (and the knowledge that
      // each row and column contains only 10 images) to specify
      // the regions of the current image
      geometry.faceVertexUvs[0].push([
        new THREE.Vector2(xOffset, yOffset),
        new THREE.Vector2(xOffset+(1/atlas.cols), yOffset),
        new THREE.Vector2(xOffset+(1/atlas.cols), yOffset+(1/atlas.rows))
      ]);
  
      // Map the region of the image described by the lower-left, 
      // upper-right, and upper-left vertices to `faceTwo`
      geometry.faceVertexUvs[0].push([
        new THREE.Vector2(xOffset, yOffset),
        new THREE.Vector2(xOffset+(1/atlas.cols), yOffset+(1/atlas.rows)),
        new THREE.Vector2(xOffset, yOffset+(1/atlas.rows))
      ]);
    }
  }
}

// quadrant is a string: "topLeft", "topRight", "bottomLeft", "bottomRight"
// It's used to determine the building index in buildingsArr 
function buildTSNEGeometry(quadrant, geometry) {

  // We need to find the corresponding building 'id' in buildingArr
  // so that we can grab the TSNE coordinates
  var offsetX; 
  var offsetY; 
  
  switch (quadrant) {
    case "topLeft":
      offsetX = 0; 
      offsetY = 0; 
      break; 
    case "topRight":
      offsetX = 50; 
      offsetY = 0; 
      break; 
    case "bottomLeft":
      offsetX = 0; 
      offsetY = 50; 
      break;
    case "bottomRight": 
      offsetX = 50; 
      offsetY = 50; 
      break; 
    default:
      console.log("Incorrect quadrant type"); //TODO: Replace with an error and break out of function
      break; 
  }

  // TODO: Use callback with loadBase()
  var loader = new THREE.FileLoader(); 
  loader.load(buildingsJSONPath, function(data) {
    buildingsArr = JSON.parse(data); 
    buildingsArr.sort(compare);
    changeFormat(buildingsArr, imagesPath)

    for (var y = 0; y < atlas.rows; y++) {
      for (var x = 0; x < atlas.cols; x++) {
        
        // buildingsArr is organized in ascending x order [0,0] [1, 0] [2,0]...
        var buildingID = (offsetY + y) * 100 + (offsetX + x); 
        var building = buildingsArr[buildingID];
  
        // Create x, y, z coords for this subimage
        var coords = {
          x: building.tsne_x,
          y: building.tsne_y,
          z: -400 // TODO: Replace with tsne_z when values are available 
        };

        console.log("x is " + coords.x + " y is " + coords.y);
        
        geometry.vertices.push(
          new THREE.Vector3(
            coords.x,
            coords.y,
            coords.z
          ),
          new THREE.Vector3(
            coords.x + image.width/scale,
            coords.y,
            coords.z
          ),
          new THREE.Vector3(
            coords.x + image.width/scale,
            coords.y + image.height/scale,
            coords.z
          ),
          new THREE.Vector3(
            coords.x,
            coords.y + image.height/scale,
            coords.z
          )
        );
    
        // Add the first face (the lower-right triangle)
        var faceOne = new THREE.Face3(
          geometry.vertices.length-4,
          geometry.vertices.length-3,
          geometry.vertices.length-2
        )
    
        // Add the second face (the upper-left triangle)
        var faceTwo = new THREE.Face3(
          geometry.vertices.length-4,
          geometry.vertices.length-2,
          geometry.vertices.length-1
        )
    
        // Add those faces to the geometry
        geometry.faces.push(faceOne, faceTwo);
        
        // Identify this subimage's offset in the x dimension
        // An xOffset of 0 means the subimage starts flush with
        // the left-hand edge of the atlas
        var xOffset = x * image.width/atlas.width; 
        
        // Identify this subimage's offset in the y dimension
        // A yOffset of 0 means the subimage starts flush with
        // the bottom edge of the atlas
        var yOffset = y * image.height/atlas.height; 
        
        // Use the xOffset and yOffset (and the knowledge that
        // each row and column contains only 10 images) to specify
        // the regions of the current image
        geometry.faceVertexUvs[0].push([
          new THREE.Vector2(xOffset, yOffset),
          new THREE.Vector2(xOffset+(1/atlas.cols), yOffset),
          new THREE.Vector2(xOffset+(1/atlas.cols), yOffset+(1/atlas.rows))
        ]);
    
        // Map the region of the image described by the lower-left, 
        // upper-right, and upper-left vertices to `faceTwo`
        geometry.faceVertexUvs[0].push([
          new THREE.Vector2(xOffset, yOffset),
          new THREE.Vector2(xOffset+(1/atlas.cols), yOffset+(1/atlas.rows)),
          new THREE.Vector2(xOffset, yOffset+(1/atlas.rows))
        ]);
      }
    }
  })
}

function generateTSNE() {
  // Create a texture loader so we can load our image file
  var gridLoader = new THREE.TextureLoader();

  // Load an image file into a custom material
  // TODO: Load all atlases into one material
  var material1 = new THREE.MeshBasicMaterial({
    map: gridLoader.load(topLeftAtlasPath)
  });

  // var material2 = new THREE.MeshBasicMaterial({
  //   map: gridLoader.load(topRightAtlasPath)
  // });

  // var material3 = new THREE.MeshBasicMaterial({
  //   map: gridLoader.load(bottomLeftAtlasPath)
  // });

  // var material4 = new THREE.MeshBasicMaterial({
  //   map: gridLoader.load(bottomRightAtlasPath)
  // });

  /*
  To build a custom geometry, we'll use the THREE.Geometry() class, which is the base class for most higher-order geometries
  */

  var tsneGeometry1 = new THREE.Geometry();
  // var tsneGeometry2 = new THREE.Geometry();
  // var tsneGeometry3 = new THREE.Geometry();
  // var tsneGeometry4 = new THREE.Geometry();

  buildTSNEGeometry("topLeft", tsneGeometry1)
  // buildTSNEGeometry("topRight", tsneGeometry2)
  // buildTSNEGeometry("bottomLeft", tsneGeometry3)
  // buildTSNEGeometry("bottomRight", tsneGeometry4)

  // Combine our image geometry and material into a mesh
  var mesh1 = new THREE.Mesh(tsneGeometry1, material1);
  // var mesh2 = new THREE.Mesh(tsneGeometry2, material2);
  // var mesh3 = new THREE.Mesh(tsneGeometry3, material3);
  // var mesh4 = new THREE.Mesh(tsneGeometry4, material4);

  // Set the position of the image mesh in the x,y,z dimensions
  mesh1.position.set(0,0,0)
  // mesh2.position.set(0,0,0)
  // mesh3.position.set(0,0,0)
  // mesh4.position.set(0,0,0)

  // Add the image to the scene
  scene.add(mesh1);
  // scene.add(mesh2);
  // scene.add(mesh3);
  // scene.add(mesh4);
}

function generateGrid() {
  // Create a texture loader so we can load our image file
  var gridLoader = new THREE.TextureLoader();

  // Load an image file into a custom material
  // TODO: Load all atlases into one material
  var material1 = new THREE.MeshBasicMaterial({
    map: gridLoader.load(topLeftAtlasPath)
  });

  var material2 = new THREE.MeshBasicMaterial({
    map: gridLoader.load(topRightAtlasPath)
  });

  var material3 = new THREE.MeshBasicMaterial({
    map: gridLoader.load(bottomLeftAtlasPath)
  });

  var material4 = new THREE.MeshBasicMaterial({
    map: gridLoader.load(bottomRightAtlasPath)
  });

  /*
  To build a custom geometry, we'll use the THREE.Geometry() class, which is the base class for most higher-order geometries
  */

  var gridGeometry1 = new THREE.Geometry();
  var gridGeometry2 = new THREE.Geometry();
  var gridGeometry3 = new THREE.Geometry();
  var gridGeometry4 = new THREE.Geometry();


  var atlasOffset = atlas.cols * image.width / scale; 
  var topLeftX = -200;
  var topLeftY = 0;

  buildGridGeometry(topLeftX, topLeftY, gridGeometry1); 
  buildGridGeometry(topLeftX + atlasOffset, topLeftY, gridGeometry2);
  buildGridGeometry(topLeftX, topLeftY - atlasOffset, gridGeometry3);
  buildGridGeometry(topLeftX + atlasOffset, topLeftY - atlasOffset, gridGeometry4);

  // Combine our image geometry and material into a mesh
  var mesh1 = new THREE.Mesh(gridGeometry1, material1);
  var mesh2 = new THREE.Mesh(gridGeometry2, material2);
  var mesh3 = new THREE.Mesh(gridGeometry3, material3);
  var mesh4 = new THREE.Mesh(gridGeometry4, material4);

  // Set the position of the image mesh in the x,y,z dimensions
  mesh1.position.set(0,0,0)
  mesh2.position.set(0,0,0)
  mesh3.position.set(0,0,0)
  mesh4.position.set(0,0,0)

  // Add the image to the scene
  scene.add(mesh1);
  scene.add(mesh2);
  scene.add(mesh3);
  scene.add(mesh4);
}

generateGrid(); 

/**
* Lights
**/

// Add a point light with #fff color, .7 intensity, and 0 distance
var light = new THREE.PointLight( 0xffffff, 1, 0 );

// Specify the light's position
light.position.set(1, 1, 100);

// Add the light to the scene
scene.add(light)

/**
* Add Controls
**/

var controls = new THREE.TrackballControls(camera, renderer.domElement);

/**
* Handle window resizes
**/

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  controls.handleResize();
});

/**
* Render!
**/

// The main animation function that re-renders the scene each animation frame
function animate() {
requestAnimationFrame( animate );
  renderer.render( scene, camera );
  controls.update();
}
animate();

