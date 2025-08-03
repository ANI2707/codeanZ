'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ComplexityGraphProps {
  type: 'time' | 'space';
  complexity: string;
  title: string;
}

export function ComplexityGraph({ type, complexity, title }: ComplexityGraphProps) {
  // Generate sample data based on complexity
  const generateData = (complexityNotation: string) => {
    const sizes = [1, 10, 100, 1000, 10000];
    
    const calculateComplexity = (n: number, notation: string): number => {
      switch (notation.toLowerCase()) {
        case 'o(1)': return 1;
        case 'o(log n)': case 'o(log(n))': return Math.log2(n);
        case 'o(n)': return n;
        case 'o(n log n)': case 'o(n log(n))': return n * Math.log2(n);
        case 'o(n²)': case 'o(n^2)': return n * n;
        case 'o(n³)': case 'o(n^3)': return n * n * n;
        case 'o(2^n)': return Math.pow(2, Math.min(n, 20)); // Cap for visualization
        default: return n;
      }
    };

    return sizes.map(size => ({
      input: size,
      operations: calculateComplexity(size, complexity)
    }));
  };

  const data = generateData(complexity);

  const getComplexityColor = (notation: string) => {
    switch (notation.toLowerCase()) {
      case 'o(1)': return '#10b981'; // green
      case 'o(log n)': case 'o(log(n))': return '#3b82f6'; // blue
      case 'o(n)': return '#f59e0b'; // yellow
      case 'o(n log n)': case 'o(n log(n))': return '#f97316'; // orange
      case 'o(n²)': case 'o(n^2)': return '#ef4444'; // red
      case 'o(n³)': case 'o(n^3)': return '#dc2626'; // dark red
      case 'o(2^n)': return '#7c2d12'; // very dark red
      default: return '#6b7280'; // gray
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <span 
            className="px-2 py-1 rounded text-sm font-mono"
            style={{ 
              backgroundColor: getComplexityColor(complexity) + '20',
              color: getComplexityColor(complexity)
            }}
          >
            {complexity}
          </span>
        </CardTitle>
        <CardDescription>
          Growth pattern visualization for {type} complexity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="input" 
              label={{ value: 'Input Size (n)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Operations', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              labelFormatter={(value) => `Input Size: ${value}`}
              formatter={(value) => [Math.round(Number(value)), 'Operations']}
            />
            <Line 
              type="monotone" 
              dataKey="operations" 
              stroke={getComplexityColor(complexity)}
              strokeWidth={2}
              dot={{ fill: getComplexityColor(complexity), strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
