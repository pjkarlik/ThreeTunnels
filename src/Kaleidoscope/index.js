import dat from "dat.gui";
import THREE from "../Three";

import fragmentShader from "../shader/simplex/fragmentShaderAlt";
import vertexShader from "../shader/simplex/vertexShader";

// Skybox image imports //
import xpos from "../../resources/images/yokohama/posx.jpg";
import xneg from "../../resources/images/yokohama/negx.jpg";
import ypos from "../../resources/images/yokohama/posy.jpg";
import yneg from "../../resources/images/yokohama/negy.jpg";
import zpos from "../../resources/images/yokohama/posz.jpg";
import zneg from "../../resources/images/yokohama/negz.jpg";

// Render Class Object //
export default class Render {
  constructor() {
    this.start = Date.now();
    this.angle = 255.0;
    this.dec = 90.0;
    this.frames = 0;
    this.stopFrame = 0;
    this.speed = 0.04;
    this.sides = 2;
    this.tubes = [];
    this.isRnd = true;
    this.allowChange = false;
    this.timeout = 6000;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.devicePixelRatio = window.devicePixelRatio;
    // Configurations //
    this.cameraConfig = {
      position: [0, 0, 0],
      lookAt: [0, 0, 0],
      aspect: this.width / this.height,
      viewAngle: 75,
      near: 0.1,
      far: 10000
    };
    this.controlConfig = {
      max: 1500,
      min: 0
    };

    window.addEventListener("resize", this.resize, true);
    this.createGUI();
    this.init();
  }

  createGUI = () => {
    this.options = {
      sides: this.sides,
      speed: this.speed,
      hueShift: this.hueShift,
      dec: this.dec
    };
    this.gui = new dat.GUI();

    const folderRender = this.gui.addFolder("Render Options");
    folderRender
      .add(this.options, "sides", 2, 32)
      .step(1)
      .onFinishChange(value => {
        this.sides = value;
        this.effect.uniforms.sides.value = this.sides;
      });
    folderRender
      .add(this.options, "speed", 0, 1)
      .step(0.01)
      .onFinishChange(value => {
        this.speed = value;
      });
    folderRender
      .add(this.options, "dec", 0, 500)
      .step(1)
      .onFinishChange(value => {
        this.dec = value;
        this.meshMaterial.uniforms.dec.value = this.dec;
        this.meshMaterial.uniforms.needsUpdate = true;
      });

    folderRender.open();
  };

  init = () => {
    // Set Render and Scene //
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.devicePixelRatio);

    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.bufferScene = new THREE.Scene();
    // this.scene.fog = new THREE.FogExp2(0x000000, 0.0275);
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
    // this.camlight = new THREE.PointLight(0xAAAAAA, 5, 80);
    // this.scene.add(this.camlight);
    this.lightA = new THREE.PointLight(0xffffff, 1, 250);
    this.scene.add(this.lightA);
    this.lightB = new THREE.PointLight(0xffffff, 1, 350);
    this.scene.add(this.lightB);

    // Skybox //
    const urls = [xpos, xneg, ypos, yneg, zpos, zneg];
    const skybox = new THREE.CubeTextureLoader().load(urls);
    skybox.format = THREE.RGBFormat;
    skybox.mapping = THREE.CubeRefractionMapping;
    // this.scene.background = skybox;

    this.effectsSetup();
    this.createScene();
  };

  effectsSetup = () => {
    // let effect;
    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.effect = new THREE.ShaderPass(THREE.KaleidoShader);
    this.effect.uniforms.sides.value = this.sides;
    this.effect.renderToScreen = true;
    this.composer.addPass(this.effect);
  };

  getRandomVector = () => {
    const x = 0.0 + Math.random() * 255;
    const y = 0.0 + Math.random() * 255;
    const z = 0.0 + Math.random() * 255;
    return new THREE.Vector3(x, y, z);
  };

  makeTube = points => {
    const size = 0.1 + Math.random();
    return new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(this.makeRandomPath(points)),
        600,
        size,
        16,
        false
      ),
      this.meshMaterial
    );
  };

  createScene = () => {
    /* eslint no-multi-assign: 0 */
    const uniforms = THREE.UniformsUtils.merge([
      {
        map: {
          type: "t",
          value: 1,
          texture: null
        },
        time: {
          type: "f",
          value: this.start
        },
        angle: {
          type: "f",
          value: this.angle
        },
        dec: {
          type: "f",
          value: this.dec
        },
        resolution: {
          type: "v2",
          value: new THREE.Vector3()
        }
      }
    ]);

    this.meshMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });

    const initialPoints = [
      [0.0, 0.0, 600.0],
      [0.0, 0.0, 0.0],
      [1200.0, 0.0, 0.0],
      [1200.0, 1200.0, 0.0],
      [1200.0, 1200.0, 600.0],
      [1200.0, 600.0, 1200.0],
      [1200.0, 0.0, 1200.0],
      [0.0, 0.0, 1200.0],
      [0.0, 0.0, 600.0]
    ];

    const points = initialPoints.map(point => {
      const v3Point = new THREE.Vector3(...point);
      return v3Point;
    });

    this.path1 = new THREE.CatmullRomCurve3(points);

    const tube1 = new THREE.Mesh(
      new THREE.TubeGeometry(this.path1, 300, 25, 24, true),
      this.meshMaterial
    );
    tube1.geometry.computeVertexNormals();
    tube1.castShadow = true;
    tube1.receiveShadow = true;
    this.scene.add(tube1);

    // for (let i = 0; i < 12; i++) {
    //   const tube = this.makeTube(initialPoints);
    //   this.scene.add(tube);
    //   this.tubes.push(tube);
    // }

    setTimeout(() => {
      this.allowChange = true;
    }, this.timeout);
    this.renderLoop();
  };

  makeRandomPath = pointList => {
    this.pointsIndex = [];
    // const totalItems = pointList.length;
    const randomPoints = pointList.map(point => {
      const check = true; // index > 0 && index < totalItems;
      const rx = 20 - Math.random() * 40;
      const ry = 20 - Math.random() * 40;

      const tx = check ? point[0] + rx : point[0];
      const ty = check ? point[1] + ry : point[1];
      const tz = point[2];
      const v3Point = new THREE.Vector3(tx, ty, tz);
      this.pointsIndex.push(v3Point);
      return v3Point;
    });
    return randomPoints;
  };

  resize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  };

  renderScene = () => {
    // Shader Code //
    const timeNow = (Date.now() - this.start) / 1000;
    this.meshMaterial.uniforms.time.value = timeNow;
    this.meshMaterial.uniforms.needsUpdate = true;
    // Get stopFrame
    this.stopFrame += this.speed * 0.001;
    const realTime = this.frames * 0.005;
    // Get the point at the specific percentage
    const lvc = this.isRnd ? 0.03 : -0.03;
    const p1 = this.path1.getPointAt(Math.abs(this.stopFrame % 1));
    const p2 = this.path1.getPointAt(Math.abs((this.stopFrame + lvc) % 1));
    const p3 = this.path1.getPointAt(Math.abs((this.stopFrame + 0.06) % 1));

    if (Math.random() * 255 > 254 && this.allowChange) {
      this.isRnd = !this.isRnd;
      this.allowChange = false;
      setTimeout(() => {
        this.allowChange = true;
      }, this.timeout);
    }

    const amps = 15 * Math.sin(realTime + (1 * Math.PI) / 180);
    const tempX = amps * Math.cos(realTime + (1 * Math.PI) / 180) * 0.45;
    const tempY = 3 * Math.sin(realTime + (1 * Math.PI) / 180) * 0.25;
    // Camera
    this.camera.position.set(p1.x + tempX, p1.y + tempY, p1.z - tempY);
    this.camera.lookAt(p2);
    // Lights
    this.lightA.position.set(p2.x, p2.y, p2.z);
    this.lightB.position.set(p3.x, p3.y, p3.z);
    // Core three Render call //
    this.composer.render();
    // this.renderer.render(this.scene, this.camera);
    // this.effect.render(this.scene, this.camera);
  };

  renderLoop = () => {
    window.requestAnimationFrame(this.renderLoop.bind(this));
    this.frames++;
    this.renderScene();
  };
}
