import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Bar mesh for column charts
const BarMesh = ({ position, height, color }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.5, height, 0.5]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Horizontal bar mesh for bar charts
const HorizontalBarMesh = ({ position, width, color }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.5, 0.5]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Scatter point mesh
const ScatterPointMesh = ({ position, size, color }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Surface mesh for 3D surface plots
const SurfaceMesh = ({ data, xAxis, yAxis, zAxis }) => {
  const meshRef = useRef();
  
  useEffect(() => {
    if (!meshRef.current || !data || !data.labels || !data.datasets) return;
    
    const geometry = new THREE.PlaneGeometry(10, 10, data.labels.length - 1, data.datasets[0].data.length - 1);
    const positions = geometry.attributes.position.array;
    
    // Create a height map based on data values
    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.floor((i / 3) % data.labels.length);
      const z = Math.floor((i / 3) / data.labels.length);
      
      if (x < data.labels.length && z < data.datasets[0].data.length) {
        // Set height (y) based on data value
        positions[i + 1] = data.datasets[0].data[z] / 10;
      }
    }
    
    geometry.computeVertexNormals();
    meshRef.current.geometry = geometry;
  }, [data, xAxis, yAxis, zAxis]);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10, 20, 20]} />
      <meshPhongMaterial color="#6495ED" wireframe={false} side={THREE.DoubleSide} />
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
  
  // Render different chart types
  const renderChartType = () => {
    switch (chartType) {
      case 'column3d':
        return values.map((value, index) => {
          const normalizedHeight = (value / maxValue) * 5 || 0.1;
          const xPos = index - (values.length / 2) + 0.5;
          
          return (
            <BarMesh 
              key={index} 
              position={[xPos, normalizedHeight / 2, 0]} 
              height={normalizedHeight} 
              color={`hsl(${(index / values.length) * 360}, 70%, 60%)`} 
            />
          );
        });
        
      case 'bar3d':
        return values.map((value, index) => {
          const normalizedWidth = (value / maxValue) * 5 || 0.1;
          const yPos = index - (values.length / 2) + 0.5;
          
          return (
            <HorizontalBarMesh 
              key={index} 
              position={[normalizedWidth / 2, yPos, 0]} 
              width={normalizedWidth} 
              color={`hsl(${(index / values.length) * 360}, 70%, 60%)`} 
            />
          );
        });
        
      case 'scatter3d':
        return values.map((value, index) => {
          const normalizedSize = (value / maxValue) * 0.5 + 0.1;
          const xPos = index - (values.length / 2) + 0.5;
          const yPos = value / maxValue * 3;
          const zPos = (index % 3) - 1; // Add some variation in z-axis
          
          return (
            <ScatterPointMesh 
              key={index} 
              position={[xPos, yPos, zPos]} 
              size={normalizedSize} 
              color={`hsl(${(index / values.length) * 360}, 70%, 60%)`} 
            />
          );
        });
        
      case 'surface3d':
        return <SurfaceMesh data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />;
        
      default:
        return values.map((value, index) => {
          const normalizedHeight = (value / maxValue) * 5 || 0.1;
          const xPos = index - (values.length / 2) + 0.5;
          
          return (
            <BarMesh 
              key={index} 
              position={[xPos, normalizedHeight / 2, 0]} 
              height={normalizedHeight} 
              color={`hsl(${(index / values.length) * 360}, 70%, 60%)`} 
            />
          );
        });
    }
  };
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <gridHelper args={[10, 10]} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      
      {renderChartType()}
      
      {/* X-axis labels */}
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
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <Canvas ref={canvasRef}>
        <ThreeDScene data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} chartType={chartType} />
      </Canvas>
      
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#333', background: 'rgba(255,255,255,0.7)', padding: '5px', borderRadius: '3px' }}>
        <p style={{ margin: '0', fontSize: '12px' }}>Drag to rotate | Scroll to zoom</p>
      </div>
    </div>
  );
};

export default ThreeDChart;