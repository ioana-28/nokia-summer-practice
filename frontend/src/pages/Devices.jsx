import { useState, useEffect, useMemo } from "react";
import {
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Container,
    Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import AddDeviceForm from "../components/AddDeviceForm";
import PageHeader from "../components/PageHeader";
import ScheduleDialog from "../components/ScheduleDialog";

const DeviceTable = () => {
    const [devices, setDevices] = useState([]);
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [scheduleDevice, setScheduleDevice] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(null);
    const [deviceToEdit, setDeviceToEdit] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);

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

    const handleScheduleOpen = (device) => {
        setScheduleDevice(device);
        setIsScheduleDialogOpen(true);
    };

    const handleScheduleClose = () => {
        setIsScheduleDialogOpen(false);
        setScheduleDevice(null);
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
        switch (action) {
            case "schedule":
                handleScheduleOpen(device);
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

        <ScheduleDialog
            open={isScheduleDialogOpen}
            device={scheduleDevice}
            onClose={handleScheduleClose}
            onSuccess={fetchDevices}
        />

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
