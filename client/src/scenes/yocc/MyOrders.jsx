import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserOrders } from "../../state/ordersSlice";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Divider,
  Stepper, 
  Step, 
  StepLabel,
} from "@mui/material";
import { STATUS } from "../../utils/enums";

const OrderItem = ({ order }) => {
  const statusSteps = ["Pending", "Processing", "Shipped", "Completed"];

  // Menentukan langkah aktif berdasarkan status pesanan saat ini
  // Jika status tidak ditemukan (misal: 'Cancelled'), nilainya akan -1
  const activeStep = statusSteps.indexOf(order.status);

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box
            component="img"
            src={order.mainReferenceImage.url}
            alt="Reference Image"
            sx={{ width: "100%", borderRadius: 2, objectFit: "cover" }}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" fontWeight="bold">
            Order Date: {new Date(order.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="body1">
            <strong>Recipient:</strong> {order.nama}
          </Typography>
          <Typography variant="body1">
            <strong>Address:</strong> {order.alamat}
          </Typography>
          <Typography variant="body1">
            <strong>Quantity:</strong> {order.jumlah} Roll
          </Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Typography variant="body1" mr={1}>
              <strong>Color:</strong>
            </Typography>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: order.warna,
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <Typography ml={1} fontFamily="monospace">
              {order.warna}
            </Typography>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box mt={2}>
            {order.status === "Cancelled" ? (
              <Alert severity="error">This order has been cancelled.</Alert>
            ) : (
              <Stepper activeStep={activeStep} alternativeLabel>
                {statusSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

const MyOrders = () => {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.ordersReducer);

  useEffect(() => {
    // Hanya fetch jika data belum ada
    if (status === STATUS.IDLE) {
      dispatch(fetchUserOrders());
    }
  }, [dispatch]);

  let content;

  if (status === STATUS.LOADING) {
    content = (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  } else if (status === STATUS.ERROR) {
    content = (
      <Alert severity="error">Failed to load orders: {error?.message}</Alert>
    );
  } else if (orders.length === 0) {
    content = (
      <Typography textAlign="center" mt={5}>
        You have no orders yet.
      </Typography>
    );
  } else {
    content = (
      <Box>
        {orders.map((order) => (
          <OrderItem key={order._id} order={order} />
        ))}
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight={600}
        my="30px"
        fontSize="24px"
      >
        List Orders
      </Typography>
      {content}
    </Container>
  );
};

export default MyOrders;
