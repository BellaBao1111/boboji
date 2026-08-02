import * as THREE from 'three';
import { CHILI_FOOD, FOOD_TYPES, FoodType, GOLDEN_FOOD } from './foods';
import { mulberry32 } from './textures';

/**
 * 食材 3D 缩略图：把游戏里真正的程序化模型离屏渲染成小图（零素材传统——图鉴也不放一张贴图）。
 * 渲染一次缓存 dataURL；共享几何体/材质只摘引用、绝不 dispose。
 */

const SIZE = 128;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let cam: THREE.PerspectiveCamera | null = null;
const cache = new Map<string, string>();

function ensure(): boolean {
  if (renderer) return true;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff2e2', '#7a4326', 1.15));
    const key = new THREE.DirectionalLight('#fff0d8', 2.6);
    key.position.set(2.2, 3.2, 2.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#ffb46a', 1.2);
    rim.position.set(-2.4, 1.6, -2.2);
    scene.add(rim);
    cam = new THREE.PerspectiveCamera(34, 1, 0.01, 20);
    return true;
  } catch {
    renderer = null;
    return false;
  }
}

function typeFor(id: string): FoodType | null {
  if (id === 'golden') return GOLDEN_FOOD;
  if (id === 'chilifood') return CHILI_FOOD;
  return FOOD_TYPES.find((f) => f.id === id) ?? null;
}

/** 返回该食材的缩略图 dataURL；无 WebGL/未知食材返回 null（调用方回退 emoji） */
export function foodThumb(id: string): string | null {
  const hit = cache.get(id);
  if (hit !== undefined) return hit || null;
  const type = typeFor(id);
  if (!type || !ensure()) {
    cache.set(id, '');
    return null;
  }
  try {
    const rnd = mulberry32(id.charCodeAt(0) * 131 + id.length * 17 + 7);
    const piece = type.make(rnd);
    const grp = new THREE.Group();
    grp.add(piece.object);
    // 微微侧转，藕片的孔、豆皮的卷痕都能看见
    grp.rotation.set(0.14, 0.7, 0.08);
    scene!.add(grp);
    const sphere = new THREE.Box3().setFromObject(grp).getBoundingSphere(new THREE.Sphere());
    const d = (sphere.radius / Math.tan((cam!.fov * Math.PI) / 360)) * 1.22;
    cam!.position.set(sphere.center.x + d * 0.5, sphere.center.y + d * 0.48, sphere.center.z + d * 0.74);
    cam!.lookAt(sphere.center);
    renderer!.render(scene!, cam!);
    const url = renderer!.domElement.toDataURL('image/png');
    scene!.remove(grp);
    cache.set(id, url);
    return url;
  } catch {
    cache.set(id, '');
    return null;
  }
}
