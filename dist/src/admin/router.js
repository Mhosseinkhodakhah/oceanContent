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
adminRouter.post('/create-lesson', validators_1.lessonRole, controller.createLesson);
adminRouter.post('/create-sublesson/:lesson', validators_1.subLessonRole, adminAuth, controller.createSublesson);
adminRouter.post('/create-title/:sublessonId', controller.createTitle);
adminRouter.post('/create-content/:sublesson', controller.createContent);
adminRouter.post('/update-content/:contentId', adminAuth, controller.updateContent);
adminRouter.post('/update-lesson/:lessonId', adminAuth, controller.updateLesson);
adminRouter.post('/update-subLesson/:subLessonId', adminAuth, controller.updateSubLesson);
adminRouter.post('/update-title/:titleId', adminAuth, controller.updateTitle);
adminRouter.delete('/delete-subLesson/:subLessonId', adminAuth, controller.deleteSublesson);
adminRouter.delete('/delete-lesson/:lessonId', adminAuth, controller.deleteLesson);
adminRouter.delete('/delete-content/:contentId', adminAuth, controller.deleteContent);
adminRouter.delete('/delete-title/:titleId', adminAuth, controller.deleteTitle);
adminRouter.get('/getAll', controller.getAll);
exports.default = adminRouter;
