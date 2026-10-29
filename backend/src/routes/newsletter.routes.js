import express from "express";
import * as newsletterController from "../controllers/newsletter.controller.js";

const newsletterRouter = express.Router();

newsletterRouter.post("/subscribe", newsletterController.subscribeNewsletterController);

export default newsletterRouter;