import * as THREE from '../three.js-master/build/three.module.js';
import { OrbitControls } from '../three.js-master/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from '../three.js-master/examples/jsm/geometries/DecalGeometry.js';


var renderer, scene, camera;
var mesh;
var raycaster;
var line;

var raycasterClick = new THREE.Raycaster();


document.getElementById("delete").onclick = removeDecals

let sizeX = document.getElementById('sizeX').value;
let sizeY = document.getElementById('sizeY').value;

var intersection = {
  intersects: false,
  point: new THREE.Vector3(),
  normal: new THREE.Vector3()
};
var mouse = new THREE.Vector2();
var intersects = [];
var textureLoader = new THREE.TextureLoader();
var decalDiffuse = textureLoader.load('decals/nike.png');


var decalMaterial = new THREE.MeshPhongMaterial({
  specular: 0x444444,
  map: decalDiffuse,
  normalScale: new THREE.Vector2(1, 1),
  shininess: 30,
  transparent: true,
  depthTest: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: - 4,
  wireframe: false
});

var decals = [];
var mouseHelper;
var position = new THREE.Vector3();


var size = new THREE.Vector3(10, 10, 10);

var params = {
  minScale: 10,
  maxScale: 20,
  rotate: true,
  clear: function () {

    removeDecals();

  }
};



window.addEventListener('load', init);

function init() {

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);


  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 120;
  camera.target = new THREE.Vector3();

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 200;

  scene.add(new THREE.AmbientLight(0x443333));

  var light = new THREE.DirectionalLight(0xffddcc, 1);
  light.position.set(1, 0.75, 0.5);
  scene.add(light);

  var light = new THREE.DirectionalLight(0xccccff, 1);
  light.position.set(- 1, 0.75, - 0.5);
  scene.add(light);

  var geometry = new THREE.BufferGeometry();
  geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

  line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
  scene.add(line);

  loadLeePerrySmith();

  raycaster = new THREE.Raycaster();

  mouseHelper = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
  mouseHelper.visible = false;
  scene.add(mouseHelper);

  window.addEventListener('resize', onWindowResize, false);

  var moved = false;

  controls.addEventListener('change', function () {

    moved = true;

  });

  window.addEventListener('pointerdown', function () {

    moved = false;

  }, false);

  window.addEventListener('click', function (event) {

    if (moved === false) {

      checkIntersection(event.clientX, event.clientY);

    
      if (intersection.intersects) shoot();

    }

  });


  window.addEventListener('pointermove', onPointerMove);

  function onPointerMove(event) {

    if (event.isPrimary) {

      checkIntersection(event.clientX, event.clientY);


  

    }
  }

  window.addEventListener('contextmenu', onMouseMove)



  function checkIntersection(x, y) {

    if (mesh === undefined) return;

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = - (y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.intersectObject(mesh, false, intersects);

    if (intersects.length > 0) {

      var p = intersects[0].point;
      mouseHelper.position.copy(p);
      intersection.point.copy(p);

      var n = intersects[0].face.normal.clone();
      n.transformDirection(mesh.matrixWorld);
      n.multiplyScalar(10);
      n.add(intersects[0].point);

      intersection.normal.copy(intersects[0].face.normal);
      mouseHelper.lookAt(n);

      var positions = line.geometry.attributes.position;
      positions.setXYZ(0, p.x, p.y, p.z);
      positions.setXYZ(1, n.x, n.y, n.z);
      positions.needsUpdate = true;

      intersection.intersects = true;

      intersects.length = 0;

    } else {

      intersection.intersects = false;

    }

  }



  onWindowResize();
  animate();

}

function loadLeePerrySmith() {

  var loader = new GLTFLoader();

  loader.load('models/tshirt.glb', function (gltf) {

   
    mesh = gltf.scene.children[0];
    mesh.material = new THREE.MeshPhongMaterial({
      specular: 0x111111,
      shininess: 25
    });

    scene.add(mesh);
    mesh.scale.set(0.5, 0.5, 0.5);
    mesh.position.set(1,-30,1)

  });


}

function shoot() {

  position.copy(intersection.point);

  getValueSize()
  
  var orientation = new THREE.Euler(0, 0,  getValueRotation(), 'XYZ')


  size.set(sizeX, sizeY, 10);




  var material = decalMaterial.clone();
  
  var m = new THREE.Mesh(new DecalGeometry(mesh, position, orientation, size), material);


  decals.push(m);
  scene.add(m);



}


function onMouseMove(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycasterClick.setFromCamera(mouse, camera);
  var intersects = raycasterClick.intersectObjects(scene.children, true);
  for (let i = 0; i < intersects.length; i++) {

    for (let d = 0; d < decals.length; d++) {
      if (decals[d].geometry.uuid === intersects[i].object.geometry.uuid) {
        removeSingleDecal(decals[d])

      }

    }

  }

}

function getValueRotation(){
  let rotationInput = document.getElementById('rotation').value;
  return rotationInput * 0.018 
}


function getValueSize(){
 
  sizeX = document.getElementById('sizeX').value;
    
  sizeY = document.getElementById('sizeY').value;
 

 

}

function removeSingleDecal(object) {

  scene.remove(object)

  let nd = decals.filter(d => d.geometry.uuid !== object.geometry.uuid)

}



function removeDecals() {

  decals.forEach(function (d) {

    scene.remove(d);

  });

  decals = [];
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

  requestAnimationFrame(animate);

  renderer.render(scene, camera);


}