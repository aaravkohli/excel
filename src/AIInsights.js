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
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const InsightsList = styled.ul`
  list-style-type: none;
  padding: 0;
  animation: fadeIn 0.5s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const InsightItem = styled.li`
  padding: 15px;
  margin-bottom: 15px;
  border-left: 4px solid #0066cc;
  background-color: #f8f9fa;
  border-radius: 0 8px 8px 0;
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &:hover {
    transform: translateX(5px);
    background-color: #f0f4f8;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  p {
    margin: 0;
    line-height: 1.6;
  }
  
  strong {
    color: #0066cc;
    font-weight: 600;
  }
`;

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background-color: #0055aa;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #0066cc;
  margin-left: 10px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  padding: 15px;
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  margin-top: 15px;
  animation: shake 0.5s ease-in-out;
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const Title = styled.h2`
  color: #2c3e50;
  margin-bottom: 15px;
  font-weight: 600;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 50px;
    height: 3px;
    background-color: #0066cc;
    border-radius: 2px;
  }
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
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
      <Title>AI-Powered Insights</Title>
      <Description>Generate AI-powered insights from your data visualization to help you understand patterns and trends.</Description>
      
      <Button 
        onClick={generateInsights} 
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Generating Insights...' : 'Generate Insights'}
        {loading && <LoadingSpinner />}
      </Button>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {insights.length > 0 && (
        <InsightsList>
          {insights.map((insight, index) => (
            <InsightItem key={index}>
              <ReactMarkdown>{insight}</ReactMarkdown>
            </InsightItem>
          ))}
        </InsightsList>
      )}
    </InsightsContainer>
  );
};

export default AIInsights;