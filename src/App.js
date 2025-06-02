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
import { jsPDF } from 'jspdf';
import ThreeDChart from './ThreeDChart';
import AIInsights from './AIInsights';

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
  border: 2px dashed #94a3b8;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin: 20px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
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

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }
`;

const ChartContainer = styled.div`
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ChartTypeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
`;

const ChartTypeButton = styled.button`
  background-color: ${props => props.$active === "true" ? '#3b82f6' : '#f1f5f9'};
  color: ${props => props.$active === "true" ? 'white' : '#475569'};
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active === "true" ? '#2563eb' : '#e2e8f0'};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Tab = styled.button`
  background-color: ${props => props.$active === "true" ? '#3b82f6' : '#f1f5f9'};
  color: ${props => props.$active === "true" ? 'white' : '#475569'};
  border: 1px solid #e2e8f0;
  border-radius: 4px 4px 0 0;
  padding: 10px 20px;
  cursor: pointer;
  margin-right: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active === "true" ? '#2563eb' : '#e2e8f0'};
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const TableContainer = styled.div`
  margin: 30px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th {
    background-color: #f8fafc;
    color: #1e293b;
    font-weight: 600;
    padding: 12px 16px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  td {
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    color: #475569;
  }
  
  tr:hover {
    background-color: #f8fafc;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  
  h2 {
    color: #1e293b;
    margin: 0;
    font-weight: 600;
  }
`;

const TableControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  label {
    color: #64748b;
    font-weight: 500;
  }
  
  select {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background-color: white;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #3b82f6;
    }
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
`;

const TableFooter = styled.p`
  padding: 15px 20px;
  margin: 0;
  color: #64748b;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9em;
`;

const generateColors = (count) => {
  const colorArray = [];
  for (let i = 0; i < count; i++) {
    const opacity = 0.7 + (i % 3) * 0.1;
    colorArray.push(`rgba(59, 130, 246, ${opacity})`);
  }
  return colorArray;
};

function App() {
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [zAxis, setZAxis] = useState(''); 
  const [visibleRows, setVisibleRows] = useState(5);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [activeTab, setActiveTab] = useState('2d');
  const [showChart, setShowChart] = useState(false); 
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
      
      if (parsedData.length > 0) {
        setColumns(Object.keys(parsedData[0]));
      }
      
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
    
    const chartColors = generateColors(values.length);
    
    return {
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color.replace('0.7', '1')),
          borderWidth: 2,
          hoverBackgroundColor: chartColors.map(color => color.replace('0.7', '0.9')),
          hoverBorderColor: chartColors.map(color => color.replace('0.7', '1')),
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
          
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // margins
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.setFontSize(16);
          pdf.text(`${yAxis} vs ${xAxis}`, 10, 10);
          
          pdf.addImage(dataUrl, 'PNG', 10, 20, pdfWidth, pdfHeight);
          
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
              $active={(activeTab === '2d').toString()} 
              onClick={() => {
                setActiveTab('2d');
                setShowChart(false);
              }}
            >
              2D Charts
            </Tab>
            <Tab 
              $active={(activeTab === '3d').toString()} 
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
              <>
                <ChartTypeButton 
                  $active={(selectedChartType === 'bar').toString()} 
                  onClick={() => setSelectedChartType('bar')}
                >
                  Bar Chart
                </ChartTypeButton>
                <ChartTypeButton 
                  $active={(selectedChartType === 'line').toString()} 
                  onClick={() => setSelectedChartType('line')}
                >
                  Line Chart
                </ChartTypeButton>
                <ChartTypeButton 
                  $active={(selectedChartType === 'pie').toString()} 
                  onClick={() => setSelectedChartType('pie')}
                >
                  Pie Chart
                </ChartTypeButton>
                <ChartTypeButton 
                  $active={(selectedChartType === 'scatter').toString()} 
                  onClick={() => setSelectedChartType('scatter')}
                >
                  Scatter Plot
                </ChartTypeButton>
              </>
            ) : (
              <>
                <ChartTypeButton 
                  $active={(selectedChartType === 'column3d').toString()} 
                  onClick={() => setSelectedChartType('column3d')}
                >
                  3D Column
                </ChartTypeButton>
                <ChartTypeButton 
                  $active={(selectedChartType === 'bar3d').toString()} 
                  onClick={() => setSelectedChartType('bar3d')}
                >
                  3D Bar
                </ChartTypeButton>
                <ChartTypeButton 
                  $active={(selectedChartType === 'scatter3d').toString()} 
                  onClick={() => setSelectedChartType('scatter3d')}
                >
                  3D Scatter
                </ChartTypeButton>
                <ChartTypeButton 
                  $active={(selectedChartType === 'surface3d').toString()} 
                  onClick={() => setSelectedChartType('surface3d')}
                >
                  3D Surface
                </ChartTypeButton>
              </>
            )}
          </ChartTypeContainer>
          
          <Button onClick={handleGenerateChart}>Generate Chart</Button>
          
          {showChart && (
            <>
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
              
              <AIInsights 
                data={data} 
                xAxis={xAxis} 
                yAxis={yAxis} 
                zAxis={zAxis}
                chartType={activeTab === '3d' ? '3D' : selectedChartType}
              />
            </>
          )}
        </>
      )}
      
      {data && (
        <TableContainer>
          <TableHeader>
            <h2>Uploaded Data Preview</h2>
            <TableControls>
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
            </TableControls>
          </TableHeader>
          
          <StyledTable>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, visibleRows).map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column}>{row[column]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </StyledTable>
          
          {data.length > visibleRows && (
            <TableFooter>
              Showing {visibleRows} of {data.length} rows
            </TableFooter>
          )}
        </TableContainer>
      )}
    </Container>
  );
}

export default App;