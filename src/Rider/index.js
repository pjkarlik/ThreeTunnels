import THREE from './../Three';

// Render Class Object //
export default class Render {
  constructor() {
    this.frames = 0;
    this.stopFrame = 0;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.devicePixelRatio = window.devicePixelRatio;
    this.keypressed = 0;
    this.keyspeed = 0;
    this.tempSpeed = 0;
    // Configurations //
    this.cameraConfig = {
      position: [0, 0, 0],
      lookAt: [0, 0, 0],
      aspect: this.width / this.height,
      viewAngle: 45,
      near: 0.1,
      far: 10000
    };

    this.tubeCongif = {
      segments: 300,
      detail: 30,
      radius: 5
    };
    this.geometry = null;

    window.addEventListener('resize', this.resize, false);
    document.addEventListener('keypress', this.setKeyPress, false);
    document.addEventListener('keyup', this.setKeyPress, false);
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

    const points = initialPoints.map((point) => {
      const x = point[0];
      const y = 0;
      const z = point[1];
      return new THREE.Vector3(x, y, z);
    });

    this.path = new THREE.CatmullRomCurve3(points);

    const frames = this.path.computeFrenetFrames(this.tubeCongif.segments, true);
    this.geometry = new THREE.Geometry();

    for (let i = 0; i < this.tubeCongif.segments; i++) {
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];

      const index = i / this.tubeCongif.segments;
      const p = this.path.getPointAt(index);

      for (let j = 0; j < this.tubeCongif.detail; j++) {
        const position = p.clone();

        const angle = (j / this.tubeCongif.detail) *
          Math.PI * 2 + (index * Math.PI * 5);
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
        const color = new THREE.Color(`hsl(${(index * 360 * 4)}, 100%, 50%)`);
        this.geometry.colors.push(color);
        this.geometry.vertices.push(position);
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

  setKeyPress = (e) => {
    this.keypressed = window.event ? e.keyCode : e.which;
    if (this.keypressed === 119){
      this.keyspeed = 0.001;
    } else if (this.keypressed == 115) {
      this.keyspeed = -0.001;
    } else {
      this.keyspeed = 0;
    }
    //console.log(this.keypressed);
  };

  renderScene = () => {
    this.tempSpeed = this.tempSpeed - (this.tempSpeed - this.keyspeed) * 0.01;
    this.stopFrame += this.tempSpeed;

    const p1 = this.path.getPointAt(Math.abs((this.stopFrame) % 1));
    const p2 = this.path.getPointAt(Math.abs((this.stopFrame + 0.01) % 1));

    const phase = this.frames * Math.PI / 180;
    const tempX = 2 * Math.sin(phase) * 0.45;
    const tempY = 2 * Math.cos(phase) * 0.45;
    // Camera
    this.camera.position.set(p1.x + tempX, p1.y + tempY, p1.z + tempY);
    this.camera.lookAt(p2);

    // Core three Render call //
    this.renderer.render(this.scene, this.camera);
  };

  renderLoop = () => {
    window.requestAnimationFrame(this.renderLoop.bind(this));
    this.frames ++;
    this.renderScene();
  };
}
