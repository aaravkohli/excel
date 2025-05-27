import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import styled from 'styled-components';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf'; // Import jsPDF
import ThreeDChart from './ThreeDChart';
import './App.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DropzoneContainer = styled.div`
  border: 2px dashed #cccccc;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  margin: 20px 0;
  cursor: pointer;
  &:hover {
    border-color: #0066cc;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const SelectContainer = styled.div`
  margin: 20px 0;
  display: flex;
  gap: 20px;
`;

const Select = styled.select`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const Button = styled.button`
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  margin-right: 10px;
  &:hover {
    background-color: #0055aa;
  }
`;

const ChartContainer = styled.div`
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: white;
`;

const ChartTypeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
`;

const ChartTypeButton = styled.button`
  background-color: ${props => props.active ? '#0066cc' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : 'black'};
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  &:hover {
    background-color: ${props => props.active ? '#0055aa' : '#e0e0e0'};
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  background-color: ${props => props.active ? '#0066cc' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : 'black'};
  border: 1px solid #ddd;
  border-radius: 4px 4px 0 0;
  padding: 10px 20px;
  cursor: pointer;
  margin-right: 5px;
  &:hover {
    background-color: ${props => props.active ? '#0055aa' : '#e0e0e0'};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

function App() {
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [zAxis, setZAxis] = useState(''); // New state for Z-axis (for 3D charts)
  const [visibleRows, setVisibleRows] = useState(5);
  const [selectedChartType, setSelectedChartType] = useState('bar'); // Selected chart type
  const [activeTab, setActiveTab] = useState('2d'); // Active tab (2D or 3D)
  const [showChart, setShowChart] = useState(false); // Whether to show the chart
  const chartRef = useRef(null);
  const threeDRef = useRef(null);
  
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(worksheet);
      
      setData(parsedData);
      
      // Extract column headers
      if (parsedData.length > 0) {
        setColumns(Object.keys(parsedData[0]));
      }
      
      // Reset chart display when new file is uploaded
      setShowChart(false);
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });
  
  const getChartData = () => {
    if (!data || !xAxis || !yAxis) return null;
    
    const labels = data.map(item => item[xAxis]);
    const values = data.map(item => item[yAxis]);
    
    return {
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  const getChartOptions = () => {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${yAxis} vs ${xAxis}`,
        },
      },
    };
  };
  
  const renderChart = () => {
    if (!showChart) return null;
    
    const chartData = getChartData();
    if (!chartData) return null;
    
    if (activeTab === '2d') {
      switch (selectedChartType) {
        case 'bar':
          return <Bar ref={chartRef} data={chartData} options={getChartOptions()} />;
        case 'line':
          return <Line ref={chartRef} data={chartData} options={getChartOptions()} />;
        case 'pie':
          return <Pie ref={chartRef} data={chartData} options={getChartOptions()} />;
        case 'scatter':
          return <Scatter ref={chartRef} data={chartData} options={getChartOptions()} />;
        default:
          return <Bar ref={chartRef} data={chartData} options={getChartOptions()} />;
      }
    } else {
      // 3D chart rendering
      return (
        <ThreeDChart 
          ref={threeDRef} 
          data={chartData} 
          xAxis={xAxis} 
          yAxis={yAxis} 
          zAxis={zAxis} 
          chartType={selectedChartType} 
        />
      );
    }
  };
  
  const downloadChartAsPNG = () => {
    if (activeTab === '3d') {
      alert('PNG download is not supported for 3D charts. Please use a screenshot instead.');
      return;
    }
    
    if (chartRef.current) {
      const chartContainer = chartRef.current.canvas;
      
      toPng(chartContainer)
        .then(dataUrl => {
          saveAs(dataUrl, `${selectedChartType}-chart.png`);
        })
        .catch(err => {
          console.error('Error downloading chart as PNG:', err);
        });
    }
  };
  
  const downloadChartAsPDF = () => {
    if (activeTab === '3d') {
      alert('PDF download is not supported for 3D charts. Please use a screenshot instead.');
      return;
    }
    
    if (chartRef.current) {
      const chartContainer = chartRef.current.canvas;
      
      toPng(chartContainer)
        .then(dataUrl => {
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
          });
          
          // Calculate aspect ratio to maintain proportions
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // margins
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          // Add chart title
          pdf.setFontSize(16);
          pdf.text(`${yAxis} vs ${xAxis}`, 10, 10);
          
          // Add chart image
          pdf.addImage(dataUrl, 'PNG', 10, 20, pdfWidth, pdfHeight);
          
          // Add metadata
          pdf.setFontSize(10);
          pdf.text(`Generated on: ${new Date().toLocaleString()}`, 10, pdf.internal.pageSize.getHeight() - 10);
          
          pdf.save(`${selectedChartType}-chart.pdf`);
        })
        .catch(err => {
          console.error('Error downloading chart as PDF:', err);
        });
    }
  };
  
  const handleGenerateChart = () => {
    if ((activeTab === '2d' && xAxis && yAxis) || 
        (activeTab === '3d' && xAxis && yAxis && zAxis)) {
      setShowChart(true);
    } else {
      alert(activeTab === '2d' 
        ? 'Please select both X and Y axes before generating the chart.' 
        : 'Please select X, Y, and Z axes before generating the 3D chart.');
    }
  };
  
  return (
    <Container>
      <h1>Excel Data Visualization</h1>
      
      <DropzoneContainer {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the Excel file here...</p>
        ) : (
          <p>Drag and drop an Excel file here, or click to select a file</p>
        )}
      </DropzoneContainer>
      
      {columns.length > 0 && (
        <>
          <TabContainer>
            <Tab 
              active={activeTab === '2d'} 
              onClick={() => {
                setActiveTab('2d');
                setShowChart(false);
              }}
            >
              2D Charts
            </Tab>
            <Tab 
              active={activeTab === '3d'} 
              onClick={() => {
                setActiveTab('3d');
                setShowChart(false);
              }}
            >
              3D Charts
            </Tab>
          </TabContainer>
          
          <SelectContainer>
            <div>
              <label htmlFor="x-axis">X-Axis: </label>
              <Select 
                id="x-axis"
                value={xAxis} 
                onChange={(e) => setXAxis(e.target.value)}
              >
                <option value="">Select X-Axis</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </Select>
            </div>
            
            <div>
              <label htmlFor="y-axis">Y-Axis: </label>
              <Select 
                id="y-axis"
                value={yAxis} 
                onChange={(e) => setYAxis(e.target.value)}
              >
                <option value="">Select Y-Axis</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </Select>
            </div>
            
            {activeTab === '3d' && (
              <div>
                <label htmlFor="z-axis">Z-Axis: </label>
                <Select 
                  id="z-axis"
                  value={zAxis} 
                  onChange={(e) => setZAxis(e.target.value)}
                >
                  <option value="">Select Z-Axis</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </Select>
              </div>
            )}
          </SelectContainer>
          
          <ChartTypeContainer>
            {activeTab === '2d' ? (
              // 2D Chart Types
              <>
                <ChartTypeButton 
                  active={selectedChartType === 'bar'} 
                  onClick={() => setSelectedChartType('bar')}
                >
                  Bar Chart
                </ChartTypeButton>
                <ChartTypeButton 
                  active={selectedChartType === 'line'} 
                  onClick={() => setSelectedChartType('line')}
                >
                  Line Chart
                </ChartTypeButton>
                <ChartTypeButton 
                  active={selectedChartType === 'pie'} 
                  onClick={() => setSelectedChartType('pie')}
                >
                  Pie Chart
                </ChartTypeButton>
                <ChartTypeButton 
                  active={selectedChartType === 'scatter'} 
                  onClick={() => setSelectedChartType('scatter')}
                >
                  Scatter Plot
                </ChartTypeButton>
              </>
            ) : (
              // 3D Chart Types
              <>
                <ChartTypeButton 
                  active={selectedChartType === 'column3d'} 
                  onClick={() => setSelectedChartType('column3d')}
                >
                  3D Column
                </ChartTypeButton>
                <ChartTypeButton 
                  active={selectedChartType === 'bar3d'} 
                  onClick={() => setSelectedChartType('bar3d')}
                >
                  3D Bar
                </ChartTypeButton>
                <ChartTypeButton 
                  active={selectedChartType === 'scatter3d'} 
                  onClick={() => setSelectedChartType('scatter3d')}
                >
                  3D Scatter
                </ChartTypeButton>
                <ChartTypeButton 
                  active={selectedChartType === 'surface3d'} 
                  onClick={() => setSelectedChartType('surface3d')}
                >
                  3D Surface
                </ChartTypeButton>
              </>
            )}
          </ChartTypeContainer>
          
          <Button onClick={handleGenerateChart}>Generate Chart</Button>
          
          {showChart && (
            <ChartContainer>
              <h2>Chart Visualization</h2>
              
              <div style={{ marginBottom: '20px' }}>
                {renderChart()}
              </div>
              
              {activeTab === '2d' && (
                <ButtonContainer>
                  <Button onClick={downloadChartAsPNG}>Download as PNG</Button>
                  <Button onClick={downloadChartAsPDF}>Download as PDF</Button>
                </ButtonContainer>
              )}
            </ChartContainer>
          )}
        </>
      )}
      
      {data && (
        <div>
          <ControlsContainer>
            <h2>Uploaded Data Preview</h2>
            <div>
              <label htmlFor="visible-rows">Rows to display: </label>
              <Select
                id="visible-rows"
                value={visibleRows}
                onChange={(e) => setVisibleRows(Number(e.target.value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value={data.length}>All ({data.length})</option>
              </Select>
            </div>
          </ControlsContainer>
          
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, visibleRows).map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column} style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > visibleRows && <p>Showing {visibleRows} of {data.length} rows</p>}
        </div>
      )}
    </Container>
  );
}

export default App;