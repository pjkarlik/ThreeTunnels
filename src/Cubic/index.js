import THREE from './../Three';
import { Generator } from '../utils/simplexNoise';

// Render Class Object //
export default class Render {
  constructor() {
    this.frames = 0;
    this.stopFrame = 0;
    this.allowChange = false;
    this.timeout = 6000;
    this.isRnd = true;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.devicePixelRatio = window.devicePixelRatio;
    this.generator = new Generator(10);
    // Configurations //
    this.cameraConfig = {
      position: [0, 0, 0],
      lookAt: [0, 0, 0],
      aspect: this.width / this.height,
      viewAngle: 45,
      near: 0.1,
      far: 10000
    };
    this.controlConfig = {
      max: 1500,
      min: 0
    };
    this.tubeCongif = {
      segments: 350,
      detail: 25,
      radius: 5
    };
    this.geometry = null;
    window.addEventListener('resize', this.resize, true);

    this.init();
  }

  init = () => {
    // Set Render and Scene //
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.bufferScene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.01);
    this.camera = new THREE.PerspectiveCamera(
      this.cameraConfig.viewAngle,
      this.cameraConfig.aspect,
      this.cameraConfig.near,
      this.cameraConfig.far
    );

    this.camera.position.set(...this.cameraConfig.position);
    this.camera.lookAt(new THREE.Vector3(...this.cameraConfig.lookAt));
    this.scene.add(this.camera);

    // Set Light //
    this.lightA = new THREE.PointLight(0x888888, 1, 550);
    this.lightA.castShadow = true;
    this.lightA.shadowDarkness = 0.5;
    this.scene.add(this.lightA);

    this.createScene();
  };

  getRandomVector = () => {
    const x = 0.0 + Math.random() * 255;
    const y = 0.0 + Math.random() * 255;
    const z = 0.0 + Math.random() * 255;
    return new THREE.Vector3(x, y, z);
  }

  createScene = () => {
    const cube = new THREE.BoxBufferGeometry(
      3, 3, 3
    );
    // const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    this.cubeMesh = new THREE.Mesh(cube, mat);
    this.container = new THREE.Object3D();
    this.container.receiveShadow = true;
    this.scene.add(this.container);

    /* eslint no-multi-assign: 0 */
    const initialPoints = [
      [68.5, 185.5],
      [1, 262.5],
      [270.9, 281.9],
      [345.5, 212.8],
      [178, 155.7],
      [240.3, 72.3],
      [153.4, 0.6],
      [52.6, 53.3],
      [68.5, 185.5]
    ];

    //Convert the array of points into vertices
    const points = initialPoints.map((point) => {
      const x = point[0];
      const y = 0;
      const z = point[1];
      return new THREE.Vector3(x, y, z);
    });

    this.path = new THREE.CatmullRomCurve3(points);

    const frames = this.path.computeFrenetFrames(this.tubeCongif.segments, true);
    this.geometry = new THREE.Geometry();

    // First loop through all the circles
    for (let i = 0; i < this.tubeCongif.segments; i++) {
      // Get the normal / binormal values for each circle
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];

      // Calculate the index of the circle (from 0 to 1)
      const index = i / this.tubeCongif.segments;
      const p = this.path.getPointAt(index);

      // Loop for the amount of particles we want along each circle
      for (let j = 0; j < this.tubeCongif.detail; j++) {
        // Clone the position of the point in the center
        const position = p.clone();

        // Calculate the angle for each particle along the circle (from 0 to Pi*2)
        const angle = (j / this.tubeCongif.detail) *
          Math.PI * 2 + (index * Math.PI * 5);
        // Calculate the sine of the angle
        // Calculate the cosine from the angle
        const sin = Math.sin(angle);
        const cos = -Math.cos(angle);

        // Calculate the normal of each point based on its angle
        const normalPoint = new THREE.Vector3(0,0,0);
        normalPoint.x = (cos * normal.x + sin * binormal.x);
        normalPoint.y = (cos * normal.y + sin * binormal.y);
        normalPoint.z = (cos * normal.z + sin * binormal.z);
        // Multiple the normal by the radius
        normalPoint.multiplyScalar(this.tubeCongif.radius);

        // We add the normal values for each point
        position.add(normalPoint);
        const noise = Math.abs(
          this.generator.simplex3(
            position.x * 0.001,
            position.y * 0.001,
            position.z * 0.001
          )
        );
        const color = new THREE.Color(
          `hsl(${(noise * 360 * 5)}, 100%, 50%)`
        );

        const mesh = this.cubeMesh.clone(false);
        mesh.position.set(position.x, position.y, position.z);
        mesh.material = this.cubeMesh.material.clone(false);
        mesh.material.color = color;
        mesh.rotation.x = Math.random() * Math.PI * 2;
        mesh.rotation.y = Math.random() * Math.PI * 2;
        mesh.rotation.z = Math.random() * Math.PI * 2;
        this.container.add(mesh);

        // this.geometry.colors.push(color);
        // this.geometry.vertices.push(position);
      }
    }

    this.material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: THREE.VertexColors
    });

    this.tube = new THREE.Points(this.geometry, this.material);
    // Add tube into the scene
    this.scene.add(this.tube);

    this.effect = new THREE.AnaglyphEffect(this.renderer);
    this.effect.setSize(this.width, this.height);
    setTimeout(() => {
      this.allowChange = true;
    }, this.timeout);
    this.renderLoop();
  };

  resize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  };

  renderScene = () => {
    // const realTime = this.frames * 0.005;
    this.stopFrame += 0.0001;
    // Get the point at the specific percentage
    const lvc = this.isRnd ? 0.01 : -(0.01);
    const p1 = this.path.getPointAt(Math.abs((this.stopFrame) % 1));
    const p2 = this.path.getPointAt(Math.abs((this.stopFrame + lvc) % 1));
    if (Math.random() * 255 > 254 && this.allowChange) {
      this.isRnd = !this.isRnd;
      this.allowChange = false;
      setTimeout(() => {
        this.allowChange = true;
      }, this.timeout);
    }

    const amps = 2; // + Math.sin(realTime * Math.PI / 180) * 45;
    const tempX = amps * Math.sin(this.frames * Math.PI / 180) * 0.45;
    const tempY = amps * Math.cos(this.frames * Math.PI / 180) * 0.45;
    this.lightA.position.set(p2.x, p2.y, p2.z);
    // Camera
    this.camera.position.set(p1.x + tempX, p1.y + tempY, p1.z + tempY);
    this.camera.lookAt(p2);

    // Core three Render call //
    this.renderer.render(this.scene, this.camera);
    // this.effect.render(this.scene, this.camera);
  };

  renderLoop = () => {
    window.requestAnimationFrame(this.renderLoop.bind(this));
    this.frames ++;
    this.renderScene();
  };
}
