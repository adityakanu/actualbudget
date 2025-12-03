import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

type ChartData = {
    type: 'bar' | 'pie' | 'line';
    data: any[];
    dataKey: string;
    nameKey?: string;
    title?: string;
};

type CanvasProps = {
    data: ChartData | null;
};

const COLORS = [theme.reportsBlue, theme.reportsRed, theme.reportsGreen, theme.reportsGray, theme.noticeText];

export function Canvas({ data }: CanvasProps) {
    if (!data) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.tableBackground,
                    borderRadius: 6,
                    margin: 10,
                    padding: 20,
                }}
            >
                <Text style={{ color: theme.pageTextSubdued }}>
                    Visualizations will appear here
                </Text>
            </View>
        );
    }

    const renderChart = () => {
        switch (data.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={data.nameKey || 'name'} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={data.dataKey} fill={theme.reportsBlue} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={data.nameKey || 'name'} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey={data.dataKey}
                                stroke={theme.reportsBlue}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey={data.dataKey}
                                nameKey={data.nameKey || 'name'}
                                label
                            >
                                {data.data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return <Text>Unknown chart type</Text>;
        }
    };

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: theme.tableBackground,
                borderRadius: 6,
                margin: 10,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {data.title && (
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 10,
                        textAlign: 'center',
                    }}
                >
                    {data.title}
                </Text>
            )}
            <View style={{ flex: 1, minHeight: 300 }}>{renderChart()}</View>
        </View>
    );
}
