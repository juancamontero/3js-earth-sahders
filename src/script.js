import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import earthVertexShader from './shaders/earth/vertex.glsl'
import earthFragmentShader from './shaders/earth/fragment.glsl'
import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl'
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Earth
 */

// Textures

//* anisotropy : propiedad de textures para mejorar el acabado  / sharpness
const earthDayTexture = textureLoader.load('./earth/day.jpg')
earthDayTexture.colorSpace = THREE.SRGBColorSpace
earthDayTexture.anisotropy = 8

const earthNightTexture = textureLoader.load('./earth/night.jpg')
earthNightTexture.colorSpace = THREE.SRGBColorSpace
earthNightTexture.anisotropy = 8

// * Brillo y nubes
//? specular texture para reflexión (red channel), nudes green channel
//? las nubes se pueden hacer usando una esfera mas grande y rotarla incluso independientemente
//? pero puede haber z-fighting y no se ve bien, se van a adicionar las nubes directamente en el
//?shader, sin animarlas, se envía la textura usando uSpecularCloudsTexture
const earthSpecularCloudsTexture = textureLoader.load(
  './earth/specularClouds.jpg'
)
earthSpecularCloudsTexture.anisotropy = 8

// * ATMÓSFERA
const earthParameters = {}
earthParameters.atmosphereDayColor = '#00aaff'
earthParameters.atmosphereTwilightColor = '#ff6600'

// Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64)
const earthMaterial = new THREE.ShaderMaterial({
  vertexShader: earthVertexShader,
  fragmentShader: earthFragmentShader,
  uniforms: {
    uDayTexture: new THREE.Uniform(earthDayTexture),
    uNightTexture: new THREE.Uniform(earthNightTexture),
    uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereTwilightColor)
    ),
  },
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earth)

// * ATMOSPHERE | Volumen
//? crear un nuevo mesh, para generar el glow
//? solo visible el backside
const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  uniforms: {
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereTwilightColor)
    ),
  },
  side: THREE.BackSide,
  transparent: true,
})
const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial)
atmosphere.scale.setScalar(1.04)
scene.add(atmosphere)

//tweaks
gui.addColor(earthParameters, 'atmosphereDayColor').onChange(() => {
  earthMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParameters.atmosphereDayColor
  )
  atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParameters.atmosphereDayColor
  )
})

gui.addColor(earthParameters, 'atmosphereTwilightColor').onChange(() => {
  earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParameters.atmosphereTwilightColor
  )
  atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParameters.atmosphereTwilightColor
  )
})

// * SUN
//? para manejar coords https://threejs.org/docs/#api/en/math/Spherical
// Coordinates
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5) //! radio=1 me aseguro que esta normalizado
const sunDirection = new THREE.Vector3()

// Debug Sun
const debugSun = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.1, 2),
  new THREE.MeshBasicMaterial()
)

scene.add(debugSun)
// Update
const updateSun = () => {
  // sun direction
  sunDirection.setFromSpherical(sunSpherical)
  debugSun.position.copy(sunDirection).multiplyScalar(5)
  // Uniforms
  earthMaterial.uniforms.uSunDirection.value.copy(sunDirection)
  atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection)
}

// Tweaks
gui.add(sunSpherical, 'phi').min(0).max(Math.PI).onChange(updateSun)

gui.add(sunSpherical, 'theta').min(-Math.PI).max(Math.PI).onChange(updateSun)

updateSun()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.x = 12
camera.position.y = 5
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.setClearColor('#000011')

// * ANISOTROPY
// console.log(renderer.capabilities.getMaxAnisotropy()) //!check before
/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  earth.rotation.y = elapsedTime * 0.1

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
