import { DoubleSide, HemisphereLight, LinearFilter, LinearMipMapLinearFilter, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, Texture, TextureLoader, Vector2, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import './style.css';
import { SVTTerrainMesh } from './SVTTerrainMesh';

type InitializationResult = {
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  controls: OrbitControls,
  terrainMesh: SVTTerrainMesh
}

type TTexturesResult = {
  colorMap: Texture,
  normalMap: Texture,
  roughnessMap: Texture,
  metallicMap: Texture,
  material: MeshStandardMaterial
}

function getMaterialAndTextures(): TTexturesResult{

  const colorLoader: TextureLoader = new TextureLoader();

  const colorTexture: Texture = colorLoader.load(
    // 'mipmapped/rocks_ground_02_8k.blend/rocks_ground_02_col_8k.png',
    'mipmapped/rocks_ground_02_8k.blend/rocks_ground_02_col_8k.jpg',
    (_: Texture) => {
      initializeView();
    },
    undefined,
    ()=>{
      console.log('error loading texture ');
    }
  );
  const normalTexture: Texture = new TextureLoader().load('');
  const roughnessTexture: Texture = new TextureLoader().load('');
  const metallicTexture: Texture = new TextureLoader().load('');


  colorTexture.generateMipmaps = normalTexture.generateMipmaps = roughnessTexture.generateMipmaps = metallicTexture.generateMipmaps = true;
  colorTexture.minFilter = normalTexture.minFilter = roughnessTexture.minFilter = metallicTexture.minFilter = LinearMipMapLinearFilter;
  colorTexture.magFilter = normalTexture.magFilter = roughnessTexture.magFilter = metallicTexture.magFilter = LinearFilter;
  

  return {
    colorMap: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    metallicMap: metallicTexture,
    material: new MeshStandardMaterial({
      side: DoubleSide,
      wireframe: false,
      map: colorTexture,
      // normalMap: normalTexture,
      // metalnessMap: metallicTexture,
      // roughnessMap: roughnessTexture,
    })
  }
}

function getWindowSize(): Vector2 {
  let width: number = window.innerWidth;
  let height: number = window.innerHeight;
  return new Vector2(width, height);
}

function resizeWindow(): void {
  let renderer: WebGLRenderer = threeResult.renderer;
  let camera: PerspectiveCamera = threeResult.camera;
  let size: Vector2 = getWindowSize();
  let aspectRatio: number = size.x / size.y;

  renderer.setSize(size.x, size.y);
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  render();
}

function createThreeScene(): InitializationResult {
  let size: Vector2 = getWindowSize();
  // let materialsAndTextures:TTexturesResult = getMaterialAndTextures();
  let terrainGeometry: PlaneGeometry = new PlaneGeometry(300, 300, 100, 100);
  let aspectRatio: number = size.x / size.y;
  let scene: Scene = new Scene();
  let camera: PerspectiveCamera = new PerspectiveCamera(45, aspectRatio, 1, 1000);
  let renderer: WebGLRenderer = new WebGLRenderer({ antialias: true });
  let controls: OrbitControls = new OrbitControls(camera, renderer.domElement);
  let terrainMesh:SVTTerrainMesh = new SVTTerrainMesh(terrainGeometry, materialsAndTextures.material, camera, materialsAndTextures.colorMap);

  terrainMesh.geometry.rotateX(Math.PI * 0.5);
  if((terrainMesh.material as MeshStandardMaterial).map){
    (terrainMesh.material as MeshStandardMaterial).map!.needsUpdate = true;
  }
  (terrainMesh.material as MeshStandardMaterial).needsUpdate = true;

  renderer.autoClear = true;
  renderer.setClearColor(0x444444);
  renderer.setSize(size.x, size.y);
  renderer.setPixelRatio(window.devicePixelRatio);

  return { scene: scene, camera: camera, renderer: renderer, controls: controls, terrainMesh: terrainMesh };

}

function initializeView() {
  console.log('initialize view');
  threeResult = createThreeScene();

  threeResult.camera.position.set(0, 50, 0);
  threeResult.controls.target.set(0, 0, 0);

  threeResult.controls.enableRotate = false;
  threeResult.controls.enablePan = false;
  

  threeResult.scene.add(threeResult.terrainMesh);
  threeResult.scene.add(light);

  threeResult.renderer.setAnimationLoop(render);

  threeBox.appendChild(threeResult.renderer.domElement);
  window.addEventListener('resize', resizeWindow);
  resizeWindow();
  render();
}

function render(): void {
  threeResult.terrainMesh.render();
  threeResult.renderer.render(threeResult.scene, threeResult.camera);
  threeResult.controls.update();
}


let threeResult: InitializationResult;
const light: HemisphereLight = new HemisphereLight(0xFFFFFF, 0x000000, 1);
const threeBox: HTMLDivElement = document.getElementById('three-box') as HTMLDivElement || document.createElement('DIV');
const materialsAndTextures:TTexturesResult = getMaterialAndTextures();


// initializeView();