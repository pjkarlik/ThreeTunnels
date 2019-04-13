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
      segments: 1000,
      detail: 7,
      radius: 3
    };
 
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
    this.scene.fog = new THREE.FogExp2(0x000000, 0.004);
    this.camera = new THREE.PerspectiveCamera(
      this.cameraConfig.viewAngle,
      this.cameraConfig.aspect,
      this.cameraConfig.near,
      this.cameraConfig.far
    );

    this.camera.position.set(...this.cameraConfig.position);
    this.camera.lookAt(new THREE.Vector3(...this.cameraConfig.lookAt));
    this.scene.add(this.camera);

    this.createScene();
  };

  getRandomVector = () => {
    const x = 0.0 + Math.random() * 255;
    const y = 0.0 + Math.random() * 255;
    const z = 0.0 + Math.random() * 255;
    return new THREE.Vector3(x, y, z);
  }

  createScene = () => {
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
      const y = Math.random() * 100;
      const z = point[1];
      return new THREE.Vector3(x, y, z);
    });

    this.path = new THREE.CatmullRomCurve3(points);
    this.path.closed = true;

    const frames = this.path.computeFrenetFrames(this.tubeCongif.segments, true);

    for (let i = 0; i < this.tubeCongif.segments; i++) {
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];

      const index = i / this.tubeCongif.segments;
      const p = this.path.getPointAt(index);

      let circle = new THREE.Geometry();
      for (let j = 0; j < this.tubeCongif.detail; j++) {
        const position = p.clone();

        let angle = (j / this.tubeCongif.detail) * Math.PI * 2;
        angle += this.generator.simplex2(index * 10, 0);

        const sin = Math.sin(angle);
        const cos = -Math.cos(angle);

        const normalPoint = new THREE.Vector3(0,0,0);
        normalPoint.x = (cos * normal.x + sin * binormal.x);
        normalPoint.y = (cos * normal.y + sin * binormal.y);
        normalPoint.z = (cos * normal.z + sin * binormal.z);
        normalPoint.multiplyScalar(this.tubeCongif.radius);

        position.add(normalPoint);
        circle.vertices.push(position);
      }

      circle.vertices.push(circle.vertices[0]);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(
          `hsl(${this.generator.simplex2(index * 20, 0) * 175 + 300},50%,50%)`
        )
      });
      const line = new THREE.Line(circle, material);
      this.scene.add(line);
    }

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
    this.stopFrame += 0.0006;
    // Get the point at the specific percentage
    const lvc = this.isRnd ? 0.06 : -(0.06);
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
    // Camera
    this.camera.position.set(p1.x + tempX, p1.y + 6.5, p1.z + tempY);
    this.camera.lookAt(p2);

    // Core three Render call //
    this.renderer.render(this.scene, this.camera);
    // this.effect.render(this.scene, this.camera);
  };

  renderLoop = () => {
    window.requestAnimationFrame(this.renderLoop.bind(this));
    this.renderScene();
  };
}
