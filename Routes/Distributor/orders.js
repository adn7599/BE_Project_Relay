const express = require("express");

const { TransactionSupplDist } = require("../../Models/Transactions");

const router = express.Router();

const REQUEST_SELECT = { _id: 1, stageCompleted: 1, request: 1 };
const CANCEL_SELECT = { ...REQUEST_SELECT, cancel: 1 };
const PAYMENT_SELECT = { ...REQUEST_SELECT, payment: 1 };
const CONFIRM_SELECT = { ...PAYMENT_SELECT, confirm: 1 };

const selectStage = {
  request: REQUEST_SELECT,
  cancelled: CANCEL_SELECT,
  payment: PAYMENT_SELECT,
  confirm: CONFIRM_SELECT,
};

router.get("/:stageCompleted", async (req, res, next) => {
  try {
    const reg_id = req.user.reg_id;
    const stageCompleted = req.params.stageCompleted;
    if (
      stageCompleted === "request" ||
      stageCompleted === "payment" ||
      stageCompleted === "confirm" ||
      stageCompleted === "cancelled"
    ) {
      //simple query
      //finding transaction belonging to the provider and the selected stage
      const transactionDocs = await TransactionSupplDist.find({
        $and: [
          { "request.provider_id": reg_id },
          { stageCompleted: stageCompleted },
        ],
      }).select(selectStage[stageCompleted]);

      for (let i = 0; i < transactionDocs.length; i++) {
        await transactionDocs[i]
          .populate("request.orders.product", "name unit price")
          .execPopulate();
      }

      res.json(transactionDocs);
    } else {
      res.status(400).json({
        error:
          "Invalid query param sent, must be either request, payment, confirm, cancelled",
      });
      return;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
