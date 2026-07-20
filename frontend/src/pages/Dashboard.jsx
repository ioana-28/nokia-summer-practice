import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import DevicesIcon from "@mui/icons-material/Devices";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";

const RANGE_OPTIONS = [
    { label: "3 Days", days: 3 },
    { label: "7 Days", days: 7 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
];

function Dashboard() {
    const [deviceCount, setDeviceCount] = useState(0);
    const [scheduleCount, setScheduleCount] = useState(0);
    const [savingsData, setSavingsData] = useState([]);
    const [rangeDays, setRangeDays] = useState(7);

    useEffect(() => {
        fetch("/api/devices")
            .then((r) => r.json())
            .then((data) => setDeviceCount(data.length))
            .catch((e) => console.error("Failed to fetch devices:", e));

        fetch("/api/schedules")
            .then((r) => r.json())
            .then((data) => setScheduleCount(data.length))
            .catch((e) => console.error("Failed to fetch schedules:", e));
    }, []);

    useEffect(() => {
        fetch(`/api/savings/summary?days=${rangeDays}`)
            .then((r) => r.json())
            .then((data) => {
                console.log("Savings data received:", data);
                setSavingsData(data);
            })
            .catch((e) => console.error("Failed to fetch savings:", e));
    }, [rangeDays]);

    const stats = [
        {
            label: "Total Devices",
            value: deviceCount,
            unit: "devices",
            icon: <DevicesIcon sx={{ fontSize: 40 }} />,
            color: "primary.main",
        },
        {
            label: "Active Schedules",
            value: scheduleCount,
            unit: "schedules",
            icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />,
            color: "success.main",
        },
    ];

    return (
        <Container maxWidth={false} disableGutters>
            <PageHeader title="Dashboard" breadcrumbItems={["Home", "Dashboard"]} />

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {stats.map(({ label, value, unit, icon, color }) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
                        <Card elevation={2} sx={{ height: "100%" }}>
                            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Box sx={{ color }}>{icon}</Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {label}
                                    </Typography>
                                    <Typography variant="h4" component="p">
                                        {value}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {unit}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Card elevation={2} sx={{ mt: 3 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="h6">
                            Savings Performance (Last {rangeDays} Days)
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            {RANGE_OPTIONS.map(({ label, days }) => (
                                <Button
                                    key={days}
                                    size="small"
                                    variant={rangeDays === days ? "contained" : "outlined"}
                                    onClick={() => setRangeDays(days)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Daily energy savings (kWh) across all registered devices
                    </Typography>
                    <Box sx={{ width: "100%", height: 320 }}>
                        <ResponsiveContainer>
                            <AreaChart data={savingsData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{ value: "kWh", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
                                />
                                <Tooltip formatter={(value) => [`${value} kWh`, "Saved"]} />
                                <Area
                                    type="monotone"
                                    dataKey="totalSaved"
                                    name="totalSaved"
                                    stroke="#2e7d32"
                                    fill="url(#savingsGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default Dashboard;
