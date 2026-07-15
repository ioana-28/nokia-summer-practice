import { useState, useEffect, useMemo } from "react";
import {
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Container,
    Typography,
    Divider,
    Box,
    TextField,
    Select,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import AddDeviceForm from "../components/AddDeviceForm";
import PageHeader from "../components/PageHeader";

const DeviceTable = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(null);
    const [deviceToEdit, setDeviceToEdit] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [scheduleData, setScheduleData] = useState({
        powerOnTime: "",
        powerOffTime: "",
        recurrence: "everyday",
        startDate: ""
    });
    const [existingSchedules, setExistingSchedules] = useState([]);

    const fetchDevices = async () => {
        try {
            const response = await fetch("/api/devices");
            if (!response.ok) {
                throw new Error(`Failed to fetch devices: ${response.status}`);
            }
            const data = await response.json();
            setDevices(data);
        } catch (error) {
            console.error("Error fetching devices:", error);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleScheduleOpen = async (device) => {
        setSelectedDevice(device);
        setSelectedAction("schedule");
        setIsScheduleDialogOpen(true);
        setExistingSchedules([]);
    
        try {
            const id = device._id.$oid || device._id;
            const response = await fetch(`/api/schedules/${id}`);
        
            if (response.ok) {
                const data = await response.json();
                console.log("Fetched schedules:", data);
                setExistingSchedules(data);
            } else {
                console.error("Failed to fetch schedules, status:", response.status);
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
        }
    };

    const handleScheduleClose = () => {
        setIsScheduleDialogOpen(false);
        setSelectedAction(null);
        setSelectedDevice(null);
        setScheduleData({
            powerOnTime: "",
            powerOffTime: "",
            recurrence: "everyday",
            startDate: ""
        });
    };

    const getScheduleDisplay = (dayIndex, type) => {
        const { recurrence, powerOnTime, powerOffTime } = scheduleData;
        let isScheduled = false;

        if (recurrence === "everyday") isScheduled = true;
        else if (recurrence === "workdays") isScheduled = dayIndex >= 0 && dayIndex <= 4; // Mon-Fri
        else if (recurrence === "weekends") isScheduled = dayIndex === 5 || dayIndex === 6; // Sat-Sun

        if (!isScheduled) return "--:--";
        return type === 'on' ? (powerOnTime || "--:--") : (powerOffTime || "--:--");
    };

    const handleDeleteDevice = async (deviceId) => {
        try {
            const response = await fetch(`/api/device/${deviceId}`, {
                method: "DELETE",
            });
            if (response.ok) 
                fetchDevices();
        }
        catch (error) {
            console.error("Error deleting device:", error);
        }
    }

    const handleAction = async (action, device) => {
        setSelectedDevice(device);
        switch (action) {
            case "schedule":
                await handleScheduleOpen(device);
                break;
            case "edit":
                setDeviceToEdit(device);
                setIsAddDialogOpen(true);
                break;
            case "remove":
                setDeviceToDelete(device);
                setIsDeleteDialogOpen(true);
                break;
            default:
                break;
        }
    };


    const columns = useMemo(
        () => [
            { accessorKey: "deviceName", header: "Device Name" },
            { accessorKey: "deviceSlNo", header: "Serial Number" },
            { accessorKey: "deviceType", header: "Device Type" },
            { accessorKey: "hwType", header: "Hardware Type" },
            { accessorKey: "site", header: "Site" },
            { accessorKey: "group", header: "Group" },
            { accessorKey: "owner", header: "Owner" },
            {
                id: "connection",
                header: "Connection",
                accessorFn: (row) => {
                    const type = row.connectivityType || "-";
                    const ip = row.ip || "-";
                    const port = row.port || "-";
                    return `${type} | ${ip}:${port}`;
                },
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: devices,
        enableRowActions: true,
        positionActionsColumn: "last",
        muiTableContainerProps: {
        },
        muiTablePaperProps: {
            elevation: 0,
        },
        renderTopToolbarCustomActions: () => (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDialogOpen}>
                Add Device
            </Button>
        ),
        renderRowActionMenuItems: ({ row, closeMenu }) => [
            <MenuItem
                key="schedule"
                onClick={() => {
                    handleAction("schedule", row.original);
                    closeMenu();
                }}
            >
                Schedule
            </MenuItem>,
            <MenuItem
                key="edit"
                onClick={() => {
                    handleAction("edit", row.original);
                    closeMenu();
                }}
            >
                Edit
            </MenuItem>,
            <MenuItem
                key="remove"
                onClick={() => {
                    handleAction("remove", row.original);
                    closeMenu();
                }}
            >
                Remove
            </MenuItem>,
        ],
    });

    const handlePerformAction = async () => {
        console.log("handlePerformAction started");
        if (!selectedDevice) {
            console.log("No device selected");
            return;
        }
    
    
        try {
            if (selectedAction === "schedule") {
                const payload = {
                    deviceId: selectedDevice._id.$oid || selectedDevice._id,
                    ...scheduleData
                };
            console.log("Sending payload to backend:", payload);


            const response = await fetch("/api/schedules", {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            console.log("Fetch call completed");
            
             if (!response.ok) {
                  const errorData = await response.json();
                  console.error("Server Error Details:", errorData);
                  throw new Error(errorData.error || "Failed to save schedule");
                }
                console.log("Schedule saved successfully!");
            }
            handleScheduleClose();
        } catch (error) {
            console.error("Error performing action:", error);
        }
    }

    const handleAddDialogOpen = () => {
        setIsAddDialogOpen(true);
    };

    const handleAddDialogClose = () => {
        setIsAddDialogOpen(false);
        setDeviceToEdit(null);
    };

    const handleAddDeviceSuccess = () => {
        fetchDevices();
    };

    const confirmDelete = async () => {
        if (deviceToDelete) {
            await handleDeleteDevice(deviceToDelete._id.$oid || deviceToDelete._id);
            setIsDeleteDialogOpen(false);
            setDeviceToDelete(null);
        }
    };

   return (
    <Container maxWidth={false} disableGutters>
        <PageHeader title="Devices" breadcrumbItems={["Home", "Devices"]} />

        <MaterialReactTable table={table} />

        <Dialog
            open={isScheduleDialogOpen}
            onClose={handleScheduleClose}
            maxWidth="md"
            fullWidth
        >
        <DialogTitle>Schedule Action</DialogTitle>

        <DialogContent dividers>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Recurring Schedule
            </Typography>

            <Stack spacing={3}>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 0.5, fontWeight: 500 }}
                        >
                            Start date *
                        </Typography>
                        <TextField
                            fullWidth
                            type="date"
                            value={scheduleData.startDate}
                            onChange={(e) =>
                                setScheduleData({
                                    ...scheduleData,
                                    startDate: e.target.value,
                                })
                             }
                        />
                    </Box>

                </Stack>


                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 0.5, fontWeight: 500 }}
                        >
                            Power off time *
                        </Typography>

                        <TextField
                            fullWidth
                            type="time"
                            value={scheduleData.powerOffTime}
                            helperText="Example: 18:00"
                            onChange={(e) =>
                                setScheduleData({
                                    ...scheduleData,
                                    powerOffTime: e.target.value,
                            })}
                        />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{ mb: 0.5, fontWeight: 500 }}
                        >
                            Power on time *
                        </Typography>

                            <TextField
                                fullWidth
                                type="time"
                                value={scheduleData.powerOnTime}
                                helperText="Example: 08:00"
                                    onChange={(e) =>
                                        setScheduleData({
                                        ...scheduleData,
                                        powerOnTime: e.target.value,
                                })
                            }
                        />
                    </Box>
                </Stack>
                    
                    <FormControl component="fieldset">
                        <FormLabel component="legend">
                            Power off/on recurrence
                        </FormLabel>

                        <RadioGroup
                            row
                            value={scheduleData.recurrence}
                            onChange={(e) =>
                                setScheduleData({
                                    ...scheduleData,
                                    recurrence: e.target.value,
                                })
                            }
                        >
                            <FormControlLabel
                                value="workdays"
                                control={<Radio />}
                                label="Workdays"
                            />

                            <FormControlLabel
                                value="everyday"
                                control={<Radio />}
                                label="Everyday"
                            />

                            <FormControlLabel
                                value="weekends"
                                control={<Radio />}
                                label="Weekends"
                            />
                        </RadioGroup>
                    </FormControl>
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* Overview */}
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    Scheduling Overview
                </Typography>

                <Box
                    sx={{
                        border: "1px solid #ddd",
                        borderRadius: 1,
                        overflow: "hidden",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "center",
                        }}
                    >
                        <thead>
                            <tr>
                                {["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                                    (day) => (
                                        <th
                                            key={day}
                                            style={{
                                                padding: "10px",
                                                borderBottom: "1px solid #ddd",
                                                background: "#f7f7f7",
                                            }}
                                        >
                                            {day}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td
                                    style={{
                                        padding: "10px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Power On
                                </td>

                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <td key={i} style={{ padding: "10px" }}>
                                        {getScheduleDisplay(i - 1, 'on')}
                                    </td>
                                ))}
                            </tr>

                            <tr>
                                <td
                                    style={{
                                        padding: "10px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Power Off
                                </td>

                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <td key={i} style={{ padding: "10px" }}>
                                        {getScheduleDisplay(i - 1, 'off')}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </Box>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                        /* remove schedule */
                    }}
                >
                    Remove Schedule
                </Button>

                <Box>
                    <Button onClick={handleScheduleClose} sx={{ mr: 1 }}>
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handlePerformAction}
                    >
                        Save Schedule
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>

        <AddDeviceForm
            open={isAddDialogOpen}
            onClose={handleAddDialogClose}
            onSuccess={handleAddDeviceSuccess}
            deviceToEdit={deviceToEdit}
        />

        <Dialog
            open={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
        >
            <DialogTitle>Confirm Delete</DialogTitle>

            <DialogContent>
                <Typography>
                    Are you sure you want to delete the device "
                    {deviceToDelete?.deviceName}"?
                </Typography>
            </DialogContent>

            <DialogActions>
                <Button onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                </Button>

                <Button onClick={confirmDelete} color="error">
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    </Container>
);
};

export default DeviceTable;
