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
    Select
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
                console.log("Fetched schedules:", data); // Check this in the browser console
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
            console.log("Sending payload to backend:", payload); // Verify data


            const response = await fetch("/api/schedules", {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            console.log("Fetch call completed. Response status:", response.status);
            
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
};

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
            <Dialog open={isScheduleDialogOpen} onClose={handleScheduleClose}>
                <DialogTitle>Schedule Action</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="h6">Current Schedules</Typography>
                    <Box sx={{ mb: 3 }}>
                        {existingSchedules.length > 0 ? ( existingSchedules.map((s, index) => (
                            // Use index if $oid is undefined, or s._id if it's already a string
                            <Typography key={s._id.$oid || index} variant="body2" sx={{ my: 0.5 }}>
                                • <b>{s.startDate}</b>: {s.powerOnTime} to {s.powerOffTime} ({s.recurrence})
                            </Typography>
                        ))
                    ) : (
                    <Typography variant="body2" color="text.secondary">No schedules set.</Typography>
                    )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Add New Schedule */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Add New Schedule</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField 
                            label="Start Date" type="date" InputLabelProps={{ shrink: true }}
                            fullWidth
                            onChange={(e) => setScheduleData({...scheduleData, startDate: e.target.value})} 
                        />
                        <TextField 
                            label="Power On Time" type="time" InputLabelProps={{ shrink: true }}
                            fullWidth
                            onChange={(e) => setScheduleData({...scheduleData, powerOnTime: e.target.value})} 
                        />
                        <TextField 
                            label="Power Off Time" type="time" InputLabelProps={{ shrink: true }}
                            fullWidth
                            onChange={(e) => setScheduleData({...scheduleData, powerOffTime: e.target.value})} 
                        />
                        <Select 
                            value={scheduleData.recurrence} 
                            fullWidth
                            onChange={(e) => setScheduleData({...scheduleData, recurrence: e.target.value})}
                        >
                            <MenuItem value="everyday">Everyday</MenuItem>
                            <MenuItem value="workdays">Workdays</MenuItem>
                            <MenuItem value="weekends">Weekends</MenuItem>
                        </Select>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleScheduleClose}>Cancel</Button>
                    <Button onClick={handlePerformAction} color="primary">
                        Schedule
                    </Button>
                </DialogActions>
            </Dialog>
            <AddDeviceForm
                open={isAddDialogOpen}
                onClose={handleAddDialogClose}
                onSuccess={handleAddDeviceSuccess}
                deviceToEdit={deviceToEdit}
            />
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the device "{deviceToDelete?.deviceName}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DeviceTable;
