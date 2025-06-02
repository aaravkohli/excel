import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const generateVibrantColor = (index, total) => {
  const opacity = 0.7 + (index % 3) * 0.1;
  return `rgba(59, 130, 246, ${opacity})`;
};

const useScaleAnimation = (initialScale = 0, targetScale = 1, speed = 0.05) => {
  const ref = useRef();
  
  useEffect(() => {
    if (ref.current) {
      ref.current.scale.set(initialScale, initialScale, initialScale);
      
      const animate = () => {
        if (ref.current.scale.x < targetScale) {
          const scale = ref.current.scale.x + speed;
          ref.current.scale.set(scale, scale, scale);
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  }, [initialScale, targetScale, speed]);
  
  return ref;
};

const BarMesh = ({ position, height, color }) => {
  const meshRef = useRef();
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = 0;
      meshRef.current.position.y = 0;
      
      const animate = () => {
        if (meshRef.current.scale.y < 1) {
          meshRef.current.scale.y += 0.05;
          meshRef.current.position.y = (height * meshRef.current.scale.y) / 2;
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  }, [height]);
  
  return (
    <mesh ref={meshRef} position={[position[0], 0, position[2]]}>
      <boxGeometry args={[0.5, height, 0.5]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.4}
        roughness={0.3}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const HorizontalBarMesh = ({ position, width, color }) => {
  const meshRef = useScaleAnimation();
  
  return (
    <mesh ref={meshRef} position={[0, position[1], position[2]]}>
      <boxGeometry args={[width, 0.5, 0.5]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.4}
        roughness={0.3}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const ScatterPointMesh = ({ position, size, color }) => {
  const meshRef = useScaleAnimation();
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.4}
        roughness={0.3}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const SurfaceMesh = ({ data, xAxis, yAxis, zAxis }) => {
  const meshRef = useRef();
  
  useEffect(() => {
    if (!meshRef.current || !data || !data.labels || !data.datasets) return;
    
    const geometry = new THREE.PlaneGeometry(10, 10, data.labels.length - 1, data.datasets[0].data.length - 1);
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.floor((i / 3) % data.labels.length);
      const z = Math.floor((i / 3) / data.labels.length);
      
      if (x < data.labels.length && z < data.datasets[0].data.length) {
        positions[i + 1] = data.datasets[0].data[z] / 10;
      }
    }
    
    geometry.computeVertexNormals();
    meshRef.current.geometry = geometry;
    
    meshRef.current.material.opacity = 0;
    const animate = () => {
      if (meshRef.current.material.opacity < 1) {
        meshRef.current.material.opacity += 0.02;
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [data, xAxis, yAxis, zAxis]);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10, 20, 20]} />
      <meshPhongMaterial 
        color="#3b82f6" 
        wireframe={false} 
        side={THREE.DoubleSide}
        transparent
        opacity={0}
        shininess={100}
        specular="#ffffff"
      />
    </mesh>
  );
};

const ThreeDScene = ({ data, xAxis, yAxis, zAxis, chartType }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  if (!data || !data.labels || !data.datasets) return null;
  
  const values = data.datasets[0].data;
  const maxValue = Math.max(...values);
  
  const renderChartType = () => {
    switch (chartType) {
      case 'column3d':
        return values.map((value, index) => {
          const normalizedHeight = (value / maxValue) * 5 || 0.1;
          const xPos = index - (values.length / 2) + 0.5;
          const color = generateVibrantColor(index, values.length);
          
          return (
            <BarMesh 
              key={index} 
              position={[xPos, normalizedHeight / 2, 0]} 
              height={normalizedHeight} 
              color={color}
            />
          );
        });
        
      case 'bar3d':
        return values.map((value, index) => {
          const normalizedWidth = (value / maxValue) * 5 || 0.1;
          const yPos = index - (values.length / 2) + 0.5;
          const color = generateVibrantColor(index, values.length);
          
          return (
            <HorizontalBarMesh 
              key={index} 
              position={[normalizedWidth / 2, yPos, 0]} 
              width={normalizedWidth} 
              color={color}
            />
          );
        });
        
      case 'scatter3d':
        return values.map((value, index) => {
          const normalizedSize = (value / maxValue) * 0.5 + 0.1;
          const xPos = index - (values.length / 2) + 0.5;
          const yPos = value / maxValue * 3;
          const zPos = (index % 3) - 1;
          const color = generateVibrantColor(index, values.length);
          
          return (
            <ScatterPointMesh 
              key={index} 
              position={[xPos, yPos, zPos]} 
              size={normalizedSize} 
              color={color}
            />
          );
        });
        
      case 'surface3d':
        return <SurfaceMesh data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />;
        
      default:
        return values.map((value, index) => {
          const normalizedHeight = (value / maxValue) * 5 || 0.1;
          const xPos = index - (values.length / 2) + 0.5;
          const color = generateVibrantColor(index, values.length);
          
          return (
            <BarMesh 
              key={index} 
              position={[xPos, normalizedHeight / 2, 0]} 
              height={normalizedHeight} 
              color={color}
            />
          );
        });
    }
  };
  
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} />
      <gridHelper args={[10, 10]} />
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        panSpeed={0.5}
        minDistance={3}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
      
      {renderChartType()}
      
      <group position={[0, -0.5, 0]}>
        {data.labels.map((label, index) => {
          const xPos = index - (data.labels.length / 2) + 0.5;
          return (
            <mesh key={index} position={[xPos, 0, 0]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="black" />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

const ThreeDChart = ({ data, xAxis, yAxis, zAxis, chartType }) => {
  const canvasRef = useRef();
  
  return (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <Canvas ref={canvasRef}>
        <ThreeDScene data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} chartType={chartType} />
      </Canvas>
      
      <div style={{ 
        position: 'absolute', 
        bottom: '10px', 
        left: '10px', 
        color: '#333', 
        background: 'rgba(255,255,255,0.9)', 
        padding: '8px 12px', 
        borderRadius: '4px',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ margin: '0' }}>Drag to rotate | Scroll to zoom</p>
      </div>
    </div>
  );
};

export default ThreeDChart;