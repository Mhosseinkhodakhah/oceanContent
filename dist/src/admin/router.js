"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = __importDefault(require("../middleware/middleware"));
const validators_1 = require("../validators");
const controller_1 = __importDefault(require("./controller"));
const adminRouter = (0, express_1.Router)();
const adminAuth = new middleware_1.default().adminAuth;
const controller = new controller_1.default();
adminRouter.post('/create-lesson', validators_1.lessonRole, adminAuth, controller.createLesson);
adminRouter.post('/create-sublesson/:lesson', validators_1.subLessonRole, adminAuth, controller.createSublesson);
adminRouter.post('/create-content/:sublesson', adminAuth, controller.createContent);
adminRouter.post('/create-level/:lesson', adminAuth, controller.creteNewLevel);
adminRouter.delete('/delete-level', adminAuth, controller.deleteLevel);
adminRouter.post('/create-questions/:levelId', adminAuth, controller.createQuestion);
exports.default = adminRouter;
