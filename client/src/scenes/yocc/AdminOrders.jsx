import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import { privateInstance } from "../../utils/apiInstances";
import CloseIcon from "@mui/icons-material/Close";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalStatus, setModalStatus] = useState("");

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await privateInstance.get("/api/v1/orders/manages");
      setOrders(response.data);
    } catch (err) {
      setError("Failed to fetch orders.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setModalStatus(order.status); // Set status awal untuk dropdown di modal
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  // const handleStatusChange = async (orderId, newStatus) => {
  //   // Optimistic UI update
  //   setOrders((prevOrders) =>
  //     prevOrders.map((order) =>
  //       order._id === orderId ? { ...order, status: newStatus } : order
  //     )
  //   );

  //   try {
  //     await privateInstance.put(`/api/v1/orders/manages/${orderId}`, {
  //       status: newStatus,
  //     });
  //     alert("Order status updated!");
  //   } catch (err) {
  //     alert("Failed to update status. Reverting changes.");
  //     console.error(err);
  //     // Revert UI on failure
  //     fetchAllOrders();
  //   }
  // };
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    const orderId = selectedOrder._id;

    try {
      // Kirim request ke backend untuk update
      await privateInstance.put(`/api/v1/orders/manages/${orderId}`, {
        status: modalStatus,
      });

      // Update state lokal agar UI langsung berubah
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: modalStatus } : order
        )
      );

      alert("Order status updated!");
      handleCloseModal(); // Tutup modal setelah berhasil
    } catch (err) {
      alert("Failed to update status. Please try again.");
      console.error(err);
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Manage All Orders
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="orders table">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.200" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Order Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Quantity
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>{" "}
              {/* Kolom Baru */}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order._id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{order.nama}</TableCell>
                <TableCell>{order.email}</TableCell>
                <TableCell align="center">{order.jumlah}</TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      bgcolor:
                        order.status === "Completed"
                          ? "success.light"
                          : order.status === "Shipped"
                          ? "info.light"
                          : order.status === "Processing"
                          ? "warning.light"
                          : order.status === "Cancelled"
                          ? "error.light"
                          : "grey.300",
                      color: "black",
                      borderRadius: "12px",
                      px: 1.5,
                      py: 0.5,
                      display: "inline-block",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                    }}
                  >
                    {order.status}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenModal(order)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL UNTUK DETAIL PESANAN */}
      <Dialog
        open={!!selectedOrder}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Order Details
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Grid container spacing={3}>
              {/* Kolom Kiri: Detail Teks */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Customer & Order Info
                </Typography>
                <Typography>
                  <strong>Name:</strong> {selectedOrder.nama}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {selectedOrder.email}
                </Typography>
                <Typography>
                  <strong>Address:</strong> {selectedOrder.alamat}
                </Typography>
                <Typography>
                  <strong>Quantity:</strong> {selectedOrder.jumlah} Roll
                </Typography>
                <Box display="flex" alignItems="center" my={1}>
                  <Typography mr={1}>
                    <strong>Color:</strong>
                  </Typography>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: selectedOrder.warna,
                      border: "1px solid #ccc",
                      borderRadius: 1,
                    }}
                  />
                  <Typography ml={1} fontFamily="monospace">
                    {selectedOrder.warna}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Update Status
                </Typography>
                <Select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Processing">Processing</MenuItem>
                  <MenuItem value="Shipped">Shipped</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </Grid>
              {/* Kolom Kanan: Gambar */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Reference Images
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Main Reference
                    </Typography>
                    <img
                      src={selectedOrder.mainReferenceImage.url}
                      alt="Main reference"
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        marginTop: "4px",
                      }}
                    />
                  </Box>
                  {selectedOrder.additionalReferenceImage?.url && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Additional Reference
                      </Typography>
                      <img
                        src={selectedOrder.additionalReferenceImage.url}
                        alt="Additional reference"
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          marginTop: "4px",
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminOrders;
