"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { ExtrudeGeometry, Object3D, Shape, type InstancedMesh, type Material } from "three";
import type { CoreMaterials } from "@/lib/materials/library";

export function BeveledPlate({
  width,
  height,
  depth,
  material,
  z = 0,
}: {
  width: number;
  height: number;
  depth: number;
  material: Material;
  z?: number;
}) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    const bevel = Math.min(depth * 0.16, 0.025);
    const x = width / 2 - bevel;
    const y = height / 2 - bevel;
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x, y);
    shape.lineTo(-x, y);
    shape.closePath();
    const plate = new ExtrudeGeometry(shape, {
      depth: depth - bevel * 2,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
    });
    plate.translate(0, 0, -depth / 2 + bevel);
    return plate;
  }, [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={[0, 0, z]} geometry={geometry} material={material} dispose={null} />;
}

export function PCBContacts({ materials }: { materials: CoreMaterials }) {
  const pads = useRef<InstancedMesh>(null);
  const vias = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let side = 0; side < 4; side++) {
      const angle = (side * Math.PI) / 2;
      for (let index = 0; index < 8; index++) {
        const x = -0.77 + index * 0.22;
        dummy.position.set(
          x * Math.cos(angle) - 0.92 * Math.sin(angle),
          x * Math.sin(angle) + 0.92 * Math.cos(angle),
          0.335,
        );
        dummy.rotation.set(0, 0, angle);
        dummy.updateMatrix();
        pads.current?.setMatrixAt(side * 8 + index, dummy.matrix);
        dummy.position.set(
          x * Math.cos(angle) - 0.79 * Math.sin(angle),
          x * Math.sin(angle) + 0.79 * Math.cos(angle),
          0.342,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        vias.current?.setMatrixAt(side * 8 + index, dummy.matrix);
      }
    }
    for (const mesh of [pads.current, vias.current])
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh ref={pads} args={[undefined, undefined, 32]}>
        <boxGeometry args={[0.065, 0.055, 0.009]} />
        <primitive object={materials.contacts} attach="material" dispose={null} />
      </instancedMesh>
      <instancedMesh ref={vias} args={[undefined, undefined, 32]}>
        <ringGeometry args={[0.007, 0.014, 8]} />
        <primitive object={materials.contacts} attach="material" dispose={null} />
      </instancedMesh>
    </>
  );
}

export function AcrylicSupports({ materials }: { materials: CoreMaterials }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let side = 0; side < 4; side++) {
      const angle = (side * Math.PI) / 2;
      dummy.position.set(-Math.sin(angle), Math.cos(angle), 0.38);
      dummy.rotation.set(0, 0, angle);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(side, dummy.matrix);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 4]}>
      <boxGeometry args={[1.72, 0.08, 0.18]} />
      <primitive object={materials.acrylic} attach="material" dispose={null} />
    </instancedMesh>
  );
}
