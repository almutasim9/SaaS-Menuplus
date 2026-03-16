"use client";

import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface ChartProps {
    data: any[];
}

export function RevenueChart({ data }: ChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#888888' }}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        tick={{ fill: '#888888' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#141414",
                            borderColor: "#ffffff10",
                            borderRadius: "12px",
                            fontSize: "12px",
                        }}
                        itemStyle={{ color: "#10b981" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#141414" }}
                        activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function GrowthChart({ data }: ChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#888888' }}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#888888' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#141414",
                            borderColor: "#ffffff10",
                            borderRadius: "12px",
                            fontSize: "12px",
                        }}
                        itemStyle={{ color: "#a78bfa" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="restaurants"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#growthGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
