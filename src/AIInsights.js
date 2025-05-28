import React, { useState } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

console.log('Available environment variables:', 
  Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .map(key => `${key}: ${process.env[key] ? 'exists' : 'missing'}`)
);

const InsightsContainer = styled.div`
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: white;
`;

const InsightsList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const InsightItem = styled.li`
  padding: 10px;
  margin-bottom: 10px;
  border-left: 3px solid #0066cc;
  background-color: #f8f9fa;
  
  /* Style for markdown content */
  p {
    margin: 0;
  }
  
  strong {
    color: #0066cc;
  }
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

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #0066cc;
  animation: spin 1s ease-in-out infinite;
  margin-left: 10px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AIInsights = ({ data, xAxis, yAxis, chartType, zAxis }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const generateInsights = async () => {
    if (!data) {
      setError('Please provide data to generate insights.');
      return;
    }

    if (chartType === '3D') {
      if (!xAxis || !yAxis || !zAxis) {
        setError('For 3D visualization, please select X, Y, and Z axes to generate insights.');
        return;
      }
    } else {
      if (!xAxis || !yAxis) {
        setError('Please select both X and Y axes to generate insights.');
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const dataForAnalysis = {
        chartType,
        xAxis,
        yAxis,
        ...(chartType === '3D' && { zAxis }), 
        data: data.slice(0, 100), 
      };
      
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      console.log('Environment variables available:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
      if (!apiKey) {
        throw new Error('API key not found. Please check your .env file and make sure it starts with REACT_APP_GEMINI_API_KEY=');
      }
      if (apiKey.length < 10) {
        throw new Error('API key appears to be invalid. Please check your .env file.');
      }
      
      const prompt = `Analyze this data and provide 3-5 key insights. Format the insights using markdown with **bold** text for emphasis. The data represents a ${chartType} chart with ${xAxis} on the x-axis and ${yAxis} on the y-axis${chartType === '3D' ? ` and ${zAxis} on the z-axis` : ''}: ${JSON.stringify(dataForAnalysis)}`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error?.message || 'Failed to generate insights');
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Unexpected API response format');
      }
      
      const text = result.candidates[0].content.parts[0].text;
      
      const parsedInsights = text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim()); 
      
      setInsights(parsedInsights);
    } catch (err) {
      console.error('Error generating insights:', err);
      
      if (err.message?.includes('quota')) {
        setError('API quota exceeded. Please try again later or check your Gemini API quota.');
      } else if (err.message?.includes('API key')) {
        setError('Authentication failed: ' + err.message);
      } else {
        setError('Failed to generate insights: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <InsightsContainer>
      <h2>AI-Powered Insights</h2>
      <p>Generate AI-powered insights from your data visualization to help you understand patterns and trends.</p>
      
      <Button 
        onClick={generateInsights} 
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Generating Insights...' : 'Generate Insights'}
        {loading && <LoadingSpinner />}
      </Button>
      
      {error && (
        <p style={{ 
          color: 'red', 
          padding: '10px', 
          backgroundColor: '#fff3f3', 
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          {error}
        </p>
      )}
      
      {insights.length > 0 && (
        <>
          <h3>Key Insights:</h3>
          <InsightsList>
            {insights.map((insight, index) => (
              <InsightItem key={index}>
                <ReactMarkdown>{insight}</ReactMarkdown>
              </InsightItem>
            ))}
          </InsightsList>
        </>
      )}
    </InsightsContainer>
  );
};

export default AIInsights;