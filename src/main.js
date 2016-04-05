var camera;
var scene;
var renderer;
var clock;
var timescale;
var stats;
var particles = {};

var maxParticleCount = 5000;
var ALIVE = 1;
var DEAD = 1;
var particleGeometry;
var internet_traffic_source = document.querySelector('.internet-traffic-source');

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

    // camera

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 1000;

    // clock

    clock = new THREE.Clock();

    // stats

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild( stats.domElement );

    // scene and renderer

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
    uniforms = {
        color:     { type: "c", value: new THREE.Color( 0xffffff ) },
        texture:   { type: "t", value: new THREE.TextureLoader().load('./img/traffic-dot.png') }
    };
    var shaderMaterial = new THREE.ShaderMaterial( {
        uniforms:       uniforms,
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        transparent:    true
    });
    var radius = 800;
    particleGeometry = new THREE.BufferGeometry();
    var alive = new Float32Array( maxParticleCount );
    var positions = new Float32Array( maxParticleCount * 3 );
    var endPositions = new Float32Array( maxParticleCount * 3 );
    var colors = new Float32Array( maxParticleCount * 3 );
    var sizes = new Float32Array( maxParticleCount );
    var color = new THREE.Color();
    for ( var i = 0, i3 = 0; i < maxParticleCount; i ++, i3 += 3 ) {
        positions[ i3 + 0 ] = 0;
        positions[ i3 + 1 ] = 0;
        positions[ i3 + 2 ] = 1;
        endPositions[ i3 + 0 ] = 0;
        endPositions[ i3 + 1 ] = 0;
        endPositions[ i3 + 2 ] = 1;
        color.setHSL( i / maxParticleCount, 1.0, 0.5 );
        colors[ i3 + 0 ] = color.r;
        colors[ i3 + 1 ] = color.g;
        colors[ i3 + 2 ] = color.b;
        sizes[ i ] = 40;
        alive[i] = 0;
    }
    particleGeometry.addAttribute( 'alive', new THREE.BufferAttribute( alive, 1 ) );
    particleGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    particleGeometry.addAttribute( 'endPosition', new THREE.BufferAttribute( positions, 3 ) );
    particleGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    particleGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
    particleSystem = new THREE.Points( particleGeometry, shaderMaterial );
    scene.add( particleSystem );
}

function findAvailableParticle() {
    return particleGeometry.attributes.alive.array.indexOf(0);
}

function sendParticle(a, b) {

    var start_pos   = toWorldCoords(a);
    var end_pos     = toWorldCoords(b);
    var start_color = getBackgroundColor(a);
    var end_color   = getBackgroundColor(b);
    var i1          = findAvailableParticle();
    var i3          = i1 * 3;

    console.log(JSON.stringify({ start_pos, end_pos, start_color, end_color, i1 }, null, 4));

    // update particle attributes
    particleSystem.geometry.attributes.position.array[i3+0] = start_pos.x;
    particleSystem.geometry.attributes.position.array[i3+1] = start_pos.y;
    particleSystem.geometry.attributes.position.array[i3+2] = 1;

    particleSystem.geometry.attributes.endPosition.array[i3+0] = end_pos.x;
    particleSystem.geometry.attributes.endPosition.array[i3+1] = end_pos.y;
    particleSystem.geometry.attributes.endPosition.array[i3+2] = 1;

    particleSystem.geometry.attributes.alive.array[i1] = ALIVE;
}

function updateParticles() {
    particleGeometry.attributes.alive.needsUpdate = true;
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.endPosition.needsUpdate = true;
    particleGeometry.attributes.customColor.needsUpdate = true;
}

function eventPoint(evt) {
    return {
        x: evt.clientX,
        y: evt.clientY,
    };
}

function centerPoint(el) {
    var coords = el.getBoundingClientRect();
    return {
        x: ( coords.left + coords.right ) / 2,
        y: ( coords.top + coords.bottom ) / 2,
    };
}

function onClick(evt) {
    // var coords_fixed =  toWorldCoords(new THREE.Vector2( 0, 0 ));
    // var coords = toWorldCoords( new THREE.Vector2(evt.clientX, evt.clientY) );
    sendParticle( centerPoint(internet_traffic_source), eventPoint(evt) );
}

function getBackgroundColor(element) {
    var color = 'rgb(255, 0, 0)';
    if (element instanceof Element) {
        color = window.getComputedStyle( element ).backgroundColor;
    }
    return color;
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

    updateParticles();

    stats.update();
    requestAnimationFrame( animate );

    timescale = clock.getDelta();

    renderer.render( scene, camera );

}
