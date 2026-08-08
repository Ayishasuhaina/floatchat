import React, { useEffect, useRef } from 'react';

const PlotlyChart = ({ data, layout, config }) => {
  const chartRef = useRef(null);
  const chartId = useRef(`plotly-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const renderChart = () => {
      if (window.Plotly && chartRef.current) {
        // Apply responsive styling defaults
        const responsiveLayout = {
          ...layout,
          autosize: true,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: {
            color: '#94a3b8',
            family: 'Inter, sans-serif',
            ...layout.font,
          },
          margin: {
            t: 40,
            r: 20,
            l: 50,
            b: 40,
            ...layout.margin,
          }
        };

        const defaultConfig = {
          responsive: true,
          displayModeBar: 'hover',
          displaylogo: false,
          ...config,
        };

        window.Plotly.newPlot(chartRef.current, data, responsiveLayout, defaultConfig);
      }
    };

    // If Plotly isn't loaded globally yet, poll for it
    if (!window.Plotly) {
      const interval = setInterval(() => {
        if (window.Plotly) {
          clearInterval(interval);
          renderChart();
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      renderChart();
    }

    // Cleanup plot on unmount
    return () => {
      if (window.Plotly && chartRef.current) {
        window.Plotly.purge(chartRef.current);
      }
    };
  }, [data, layout, config]);

  return (
    <div 
      id={chartId.current} 
      ref={chartRef} 
      className="w-full h-full min-h-[300px]"
    />
  );
};

export default PlotlyChart;
