import express from "express";
import { ordersController } from "../controllers/index.js"; 
import { authenticate } from "../middlewares/index.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    ordersController.createCustomOrder
);
// router.get("/", authenticate, ordersController.getAllUserOrders);


export default router;