import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Divider,
    Box,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Stack
} from "@mui/material";

const ScheduleDialog = ({ open, device, onClose, onSuccess }) => {
    const [scheduleData, setScheduleData] = useState({
        powerOnTime: "",
        powerOffTime: "",
        recurrence: "everyday",
        startDate: ""
    });
    const [existingSchedule, setExistingSchedule] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (open && device) {
            setScheduleData({
                powerOnTime: "",
                powerOffTime: "",
                recurrence: "everyday",
                startDate: ""
            });
            setExistingSchedule(null);
            fetchSchedules(device);
        }
    }, [open, device]);

    const fetchSchedules = async (device) => {
        try {
            const id = device._id.$oid || device._id;
            const response = await fetch(`/api/schedules/${id}`);

            if (response.ok) {
                const data = await response.json();
                console.log("Fetched schedule:", data);
                const schedule = data.length > 0 ? data[0] : null;
                setExistingSchedule(schedule);
                if (schedule) {
                    setScheduleData({
                        powerOnTime: schedule.powerOnTime || "",
                        powerOffTime: schedule.powerOffTime || "",
                        recurrence: schedule.recurrence || "everyday",
                        startDate: schedule.startDate || ""
                    });
                }
            } else {
                console.error("Failed to fetch schedules, status:", response.status);
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
        }
    };

    const handleClose = () => {
        setScheduleData({
            powerOnTime: "",
            powerOffTime: "",
            recurrence: "everyday",
            startDate: ""
        });
        setExistingSchedule(null);
        onClose();
    };

    const getScheduleDisplay = (dayIndex, type) => {
        const { recurrence, powerOnTime, powerOffTime } = scheduleData;
        let isScheduled = false;

        if (recurrence === "everyday") isScheduled = true;
        else if (recurrence === "workdays") isScheduled = dayIndex >= 0 && dayIndex <= 4;
        else if (recurrence === "weekends") isScheduled = dayIndex === 5 || dayIndex === 6;

        if (!isScheduled) return "--:--";
        return type === 'on' ? (powerOnTime || "--:--") : (powerOffTime || "--:--");
    };

    const getEffectiveSchedule = (dayIndex, type) => {
        if (existingSchedule) {
            let isScheduled = false;
            if (existingSchedule.recurrence === "everyday") isScheduled = true;
            else if (existingSchedule.recurrence === "workdays") isScheduled = dayIndex >= 0 && dayIndex <= 4;
            else if (existingSchedule.recurrence === "weekends") isScheduled = dayIndex === 5 || dayIndex === 6;

            return isScheduled ? (type === 'on' ? existingSchedule.powerOnTime : existingSchedule.powerOffTime) : "--:--";
        }
        return getScheduleDisplay(dayIndex, type);
    };

    const handleSave = async () => {
        console.log("handleSave started");
        if (!device) {
            console.log("No device selected");
            return;
        }
        try {
            const payload = {
                deviceId: device._id.$oid || device._id,
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
            onSuccess();
            handleClose();
        } catch (error) {
            console.error("Error saving schedule:", error);
        }
    };

    const handleRemoveSchedule = async () => {
        if (!existingSchedule) {
            console.log("No existing schedule to remove");
            return;
        }
        
        const scheduleId = existingSchedule._id.$oid || existingSchedule._id;
        try {
            const response = await fetch(`/api/schedules/${scheduleId}`, {
                method: "DELETE",
            });
            
            if (response.ok) {
                onSuccess();
                handleClose();
            }
        }
        catch (error) {
            console.error("Error removing schedule:", error);
        }
    };


    const confirmRemoveSchedule = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        setIsDeleteDialogOpen(false);
        await handleRemoveSchedule(); 
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
                                    })
                                }
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
                                        {getEffectiveSchedule(i - 1, 'on')}
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
                                        {getEffectiveSchedule(i - 1, 'off')}
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
                    onClick={() => {confirmRemoveSchedule();}}
                >
                    Remove Schedule
                </Button>

                <Box>
                    <Button onClick={handleClose} sx={{ mr: 1 }}>
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSave}
                    >
                        Save Schedule
                    </Button>
                </Box>
            </DialogActions>
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Removal</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove the current schedule for this device? 
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirmed} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default ScheduleDialog;
