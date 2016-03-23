var camera;
var scene;
var renderer;
var mesh;
var clock;
var timescale;

var width = window.innerWidth;
var height = window.innerHeight;
var widthHalf = width / 2, heightHalf = height / 2;

var coordDisplay = document.querySelector('.coord-display');

/**
 * Given a screen position (THREE.Vector2), convert that screen-space
 * coordinate into 3D world coordinate space.
 */
function toWorldCoords(position) {
    var vector = new THREE.Vector3(position.x, position.y, 1);
    vector.x = ( vector.x - widthHalf ) / widthHalf;
    vector.y = ( vector.y - heightHalf ) / -heightHalf;
    vector.unproject( camera );

    return vector;
}

/**
 * Given a world-space coordinate (THREE.Vector3), conver it into 2D screen
 * coordinate space.
 */
function toScreenCoords(object) {
    var vector = new THREE.Vector3();
    var projector = new THREE.Projector();
    vector.setFromMatrixPosition( object.matrixWorld )
    vector.project( camera );

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return vector;
}

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 1000;

    clock = new THREE.Clock();

    scene = new THREE.Scene();

    var geometry = new THREE.TorusKnotGeometry( 100, 30, 200, 16 );
    var material = new THREE.MeshNormalMaterial();

    mesh = new THREE.Mesh( geometry, material );
    mesh.position.z = -1000;

    scene.add( mesh );

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: document.querySelector('canvas#traffic'),
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x000000, 0 );

    document.body.appendChild( renderer.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'click', onClick, false );

    // setInitialPosition(mesh);
    setTimeout(_=>setInitialPosition(mesh), 10);
}

function onClick(evt) {
    var coords = toWorldCoords( new THREE.Vector2(evt.clientX, evt.clientY) );
    pinToFrustum(mesh, coords);
}

function pinToFrustum(mesh, coords) {
    mesh.position.copy(coords);

    // pull towards camera to avoid clipping through frustum
    mesh.geometry.computeBoundingBox();
    mesh.position.z += mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z ;
}

function onMouseMove(evt) {
    var coords2d = new THREE.Vector2(evt.clientX, evt.clientY);
    var coords3d = toWorldCoords(coords2d);
    coordDisplay.innerHTML = '<b>COORDS</b><br>' +
        '<b>2D:</b> ' + coords2d.toArray().slice(0,2) + '<br>' +
        '<b>3D:</b> ' + coords3d.toArray().map(Math.floor);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    setInitialPosition(mesh);

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function setInitialPosition(mesh) {
    var coords2d =  new THREE.Vector2( width * 0.74, height * 0.5 );
    var coords3d = toWorldCoords(coords2d);
    pinToFrustum(mesh, coords3d);
}

function animate() {

    requestAnimationFrame( animate );

    timescale = clock.getDelta();

    mesh.rotation.x += 0.05 * timescale;
    mesh.rotation.y += 0.1 * timescale;

    renderer.render( scene, camera );

}
