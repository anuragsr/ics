import $ from 'jquery'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { IFCLoader } from 'web-ifc-three/IFCLoader'
import NProgress from 'nprogress'
import { IFCLoader } from 'three/examples/jsm/loaders/IFCLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import gsap from 'gsap'
import Stats from 'stats.js'

import GUI from './utils/gui'
import { l, cl } from './utils/helpers'

export default class THREEStarter {
  constructor(opts){
    this.ctn = opts.ctn
    this.w = this.ctn.width()
    this.h = this.ctn.height()
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 10000)

    this.origin = new THREE.Vector3(0, 0, 0)
    this.cameraStartPos = new THREE.Vector3(0, 150, 250)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    
    this.axesHelper = new THREE.AxesHelper(500)
    this.axesHelper.material.opacity = .5
    this.axesHelper.material.transparent = true

    this.gridHelper = new THREE.GridHelper( 1000, 50 )
    this.gridHelper.material.opacity = .3
    this.gridHelper.material.transparent = true
    this.gridHelper.name = "Grid Helper"

    this.spotLightMesh1 = this.createMesh(
      new THREE.SphereGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )
    this.spotLight1 = new THREE.DirectionalLight(0xffffff, 1)
    this.lightPos1 = new THREE.Vector3(500, 350, 500)
    this.spotLightMesh2 = this.createMesh(
      new THREE.SphereGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )
    this.spotLight2 = new THREE.DirectionalLight(0xffffff, 1)
    this.lightPos2 = new THREE.Vector3(-500, 350, -500)

    this.stats = new Stats()
    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(this.stats.dom)

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.hoveredObjects = {}
  }
  createMesh(geometry, material, materialOptions){
    if(materialOptions) {
      let { wrapping, repeat, minFilter } = materialOptions
      material.map.wrapS = material.map.wrapT = wrapping
      material.map.repeat = repeat
      material.map.minFilter = minFilter
    }

    return new THREE.Mesh(geometry, material)
  }
  init(){
    const { 
      ctn, w, h,
      camera, scene, renderer,
      cameraStartPos, origin, floor,
      spotLightMesh1, spotLight1, lightPos1,
      spotLightMesh2, spotLight2, lightPos2
    } = this

    // Renderer settings
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(w, h)
    $(renderer.domElement).css({
      position: "absolute",
      top: 0, left: 0
    })
    ctn.append(renderer.domElement)

    // Cameras and ambient light
    camera.position.copy(cameraStartPos)
    camera.lookAt(origin)
    scene.add(camera)    
    scene.add(new THREE.AmbientLight(0xffffff, .2))

    // Spotlight and representational mesh
    spotLightMesh1.position.copy(lightPos1)  
    spotLight1.position.copy(lightPos1)
    scene.add(spotLight1)

    spotLightMesh2.position.copy(lightPos2)
    spotLight2.position.copy(lightPos2)
    scene.add(spotLight2)
    
    // Initialize the scene
    // this.initGUI()
    this.toggleHelpers(0)
    this.addObjects()
    this.addListeners()

    NProgress.start()
  }
  initGUI() {
    const guiObj = new GUI({
      helpers: true,
      getState: () => { l(this) },
    })
    , gui = guiObj.gui
    , params = guiObj.getParams()

    const he = gui.add(params, 'helpers')
    he.onChange(value => this.toggleHelpers(value))

    gui.add(params, 'getState')
    this.guiObj = guiObj
  }
  toggleHelpers(val){
    const {
      scene, gridHelper, axesHelper, 
      spotLightMesh1, spotLightMesh2
    } = this
    if(val){
      scene.add(gridHelper)
      scene.add(axesHelper)
      scene.add(spotLightMesh1)
      scene.add(spotLightMesh2)
    } else{
      scene.remove(gridHelper)
      scene.remove(axesHelper)
      scene.remove(spotLightMesh1)
      scene.remove(spotLightMesh2)
    }
  }
  addObjects(){
    const { scene } = this
    const ifcLoader = new IFCLoader();
    ifcLoader.ifcManager.setWasmPath( '../assets/wasm/' );
    ifcLoader.load(
      "assets/models/FL_39.ifc",
      // "assets/models/SmallOffice_d_IFC2x3.ifc",
      (ifcModel) => {
        l(ifcModel)
        ifcModel.mesh.scale.multiplyScalar(5)
        ifcModel.mesh.position.z+=100
        // scene.add(ifcModel.mesh)

        // NProgress.done()
      });

    const gltfLoader = new GLTFLoader();
    // ifcLoader.ifcManager.setWasmPath( '../assets/wasm/' );
    gltfLoader.load(
      "assets/models/floorplan.glb",
      (gltf) => {
        // l(gltf)
        const floors = []
        const spaces = []
        const sc = gltf.scene
        sc.scale.multiplyScalar(5)
        // sc.position.z-=100
        scene.add(sc)

        sc.children.forEach(o => {

          // if(o.material) o.material.transparent = true

          if(o.name.includes("Space_")) {
            // l(o)
            o.material.color = new THREE.Color(.3, .4, .1)
            o.material.origColor = new THREE.Color(.3, .4, .1)
            o.material.opacity = .8
            // o.position.y+=10
            spaces.push(o)
          } else if(o.name.includes("Floor_")) {
            // l(o)
            o.material.color = new THREE.Color(.3, .6, 1)
            o.material.opacity = .8
            // o.position.y-=10
            floors.push(o)
          } else {
            // if(o.material) o.material.opacity = 0
          }
        })

        l(spaces, floors)
        NProgress.done()
      });
  }  
  render() {
    const { renderer, scene, camera, stats, raycaster, pointer, hoveredObjects } = this
    try{
      stats.begin()

      // update the picking ray with the camera and pointer position
      raycaster.setFromCamera( pointer, camera );
      raycaster.layers.set(0);
      // calculate objects intersecting the picking ray
      // const intersects = [raycaster.intersectObjects( scene.children, true )[0]];
      let intersects = raycaster.intersectObjects( scene.children, true );

      intersects = intersects.filter(int => {
       return int.object.name.includes("Space_")
      })

      if(intersects.length){
        intersects = [intersects[0]]
      }

      // collect array of uuids of currently hovered objects
      var hoveredObjectUuids = intersects.map(el => el.object.uuid);

      for (let i = 0; i < intersects.length; i++) {
        var hoveredObj = intersects[i].object;
        if (hoveredObjects[hoveredObj.uuid]) {
          continue; // this object was hovered and still hovered
        }

        if(intersects[ i ].object.material.color)
          intersects[ i ].object.material.color.set( 0xff0000 );

        // collect hovered object
        hoveredObjects[hoveredObj.uuid] = hoveredObj;
      }

      for (let uuid of Object.keys(hoveredObjects)) {
        let idx = hoveredObjectUuids.indexOf(uuid);
        if (idx === -1) {
          // object with given uuid was unhovered
          let unhoveredObj = hoveredObjects[uuid];
          delete hoveredObjects[uuid];

          if(unhoveredObj.material.color)
            // unhoveredObj.material.color.set( 0x00ff00 );
            unhoveredObj.material.color.set( unhoveredObj.material.origColor );
        }
      }

      renderer.render(scene, camera)
      stats.end()
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }
  resize() {
    let {
      w, h, ctn, camera, renderer
    } = this
    
    w = ctn.width()
    h = ctn.height()
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  
    renderer.setSize(w, h)
  }
  onPointerMove( event ){
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    this.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  }
  addListeners(){
    gsap.ticker.add(this.render.bind(this))
    window.addEventListener('resize', this.resize.bind(this), false)
    window.addEventListener('pointermove', this.onPointerMove.bind(this), false)
  }
}