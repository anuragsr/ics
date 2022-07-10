import '@/styles/index.scss'
import { IfcViewerAPI } from 'web-ifc-viewer';
import {
  IFCSPACE, IFCOPENINGELEMENT, IFCFURNISHINGELEMENT, IFCWALL, IFCWINDOW, IFCCURTAINWALL, IFCMEMBER, IFCPLATE
} from 'web-ifc';

import $ from 'jquery'
import * as THREE from 'three'
// import THREEStarter from '@/js/THREEStarter'
import { l, cl, t, te } from '@/js/utils/helpers'

$(() => {
	// setTimeout(() => {
	// 	t('[Scene init]')
	// 	const scene = new THREEStarter({ ctn: $("#three-ctn") })
	// 	scene.init()
	// 	te('[Scene init]')
	// }, 50)

  const container = document.getElementById('three-ctn');
  const viewer = new IfcViewerAPI({ container });
  l(viewer)
  viewer.axes.setAxes();
  viewer.grid.setGrid();

  viewer.IFC.setWasmPath('../assets/wasm/');
  viewer.IFC.loader.ifcManager.applyWebIfcConfig({
    USE_FAST_BOOLS: true,
    COORDINATE_TO_ORIGIN: true
  });
  viewer.IFC.loader.ifcManager.parser.setupOptionalCategories({
    [IFCSPACE]: false,
    [IFCOPENINGELEMENT]: false
  });

  // viewer.context.renderer.postProduction.active = true;

  const input = document.getElementById("file-input");

  input.addEventListener("change",

    async (changed) => {

      const file = changed.target.files[0];
      const model = await viewer.IFC.loadIfc(file, false);
      l(model)

      // Center the model
      const centerOffset = new THREE.Box3().setFromObject( model ).getCenter( model.position ).multiplyScalar( - 1 )
      l(centerOffset)

      // await viewer.shadowDropper.renderShadow(model.modelID);
    },

    false
  );

  // window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
})
