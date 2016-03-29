var camera;
var scene;
var renderer;
var clock;
var timescale;
var stats;
var particles = {};

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
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.right = '0px';
    document.body.appendChild( stats.domElement );

    scene = new THREE.Scene();

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

    initParticles(particles);

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'click', onClick, false );

}

function initParticles(particles) {
    particleGroup = new SPE.Group({
        maxParticleCount: 1000,
        valueOverLifetimeLength: 4,
        transparent: true,
        texture: {
            value: THREE.ImageUtils.loadTexture('./img/traffic-dot.png')
        },
    });

    emitter = new SPE.Emitter({
        direction: -1,
        maxAge: {
            value: 1
        },
        position: {
            value: new THREE.Vector3(0, 0, 0),
            // spread: new THREE.Vector3( 0, 0, 0 ),
            randomise: true,
        },

        // acceleration: {
        //     value: new THREE.Vector3(0, -100, 0),
        //     spread: new THREE.Vector3( 100, 0, 10 )
        // },

        opacity: {
            value: [1, 1, 1, 1]
        },

        velocity: {
            value: new THREE.Vector3(0, 20, 0),
            // spread: new THREE.Vector3(0, 0, 0),
            randomise: true,
        },

        color: {
            value: [  new THREE.Color(0xf0ab00), new THREE.Color(0x92d400) ],
            randomise: true,
        },

        size: {
            value: [65,65,65,65],
        },

        particleCount: 80,
    });

    setInterval( function() { particleGroup.mesh.position.copy( getInitialPosition() ); particleGroup.mesh.position.z = 1; }, 10);

    particleGroup.addEmitter( emitter );
    scene.add( particleGroup.mesh );
}

function centerPoint(el) {
    var coords = el.getBoundingClientRect();
    return {
        x: ( coords.left + coords.right ) / 2,
        y: ( coords.top + coords.bottom ) / 2,
    };
}

function onClick(evt) {
    var coords_fixed =  toWorldCoords(new THREE.Vector2( width, 0, 1 ));
    var coords = toWorldCoords( new THREE.Vector2(evt.clientX, evt.clientY) );
    emitter.velocity.value.copy( coords_fixed );
    emitter.position.value.copy(coords.sub(particleGroup.mesh.position));

    emitter.color.value[0] = new THREE.Color( getBackgroundColor( evt.target ) );
    // pinToFrustum(coords.sub(particleGroup.mesh.position), coords);
}

function getBackgroundColor(element) {
    return window.getComputedStyle( element ).backgroundColor;
}

function getInitialPosition() {
    var blueCenter = centerPoint(document.querySelector('.commit-blue'));
    var coords2d =  new THREE.Vector2( blueCenter.x, blueCenter.y );
    // var coords2d =  new THREE.Vector2( width * 0.77, height * 0.08 );
    var coords3d = toWorldCoords(coords2d);
    return coords3d;
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

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    stats.update();
    requestAnimationFrame( animate );

    timescale = clock.getDelta();

    particleGroup.tick(timescale);

    renderer.render( scene, camera );

}
