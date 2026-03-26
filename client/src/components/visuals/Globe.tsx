import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { useFrame, useThree } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';

interface VisitorPoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
}

export default function Globe() {
  const globeRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const { data: visits } = useQuery<any[]>({
    queryKey: ["/api/admin/visits/geo"],
    refetchInterval: 30000,
  });

  const globe = useMemo(() => {
    const g = new ThreeGlobe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .pointsData([])
      .pointAltitude(0.07)
      .pointColor('color')
      .pointRadius(0.5);

    // Styling the atmosphere
    const globeMaterial = g.globeMaterial() as THREE.MeshPhongMaterial;
    globeMaterial.color = new THREE.Color('#1a1a1a');
    globeMaterial.emissive = new THREE.Color('#00e5ff');
    globeMaterial.emissiveIntensity = 0.1;
    globeMaterial.shininess = 0.7;

    return g;
  }, []);

  useEffect(() => {
    if (!visits) return;

    // Filter points with valid lat/lng
    const pointsData = visits
      .filter(v => v.latitude && v.longitude)
      .map(v => ({
        lat: parseFloat(v.latitude),
        lng: parseFloat(v.longitude),
        size: 0.5,
        color: '#00e5ff'
      }));

    globe.pointsData(pointsData);
  }, [visits, globe]);

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={globeRef}>
      <primitive object={globe} scale={[0.1, 0.1, 0.1]} />
    </group>
  );
}
