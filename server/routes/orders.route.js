import express from "express";
import { ordersController } from "../controllers/index.js"; 
import { authenticate } from "../middlewares/index.js";

const router = express.Router();

router.get(
    "/manages",
    authenticate,
    ordersController.getAllOrders
);

router.put(
    "/manages/:id",
    authenticate,
    ordersController.updateOrderStatus
);

router.get("/", authenticate, ordersController.getUserOrders);
router.post(
    "/",
    authenticate,
    ordersController.createCustomOrder
);


export default router;