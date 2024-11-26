"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const responseService_1 = require("../service/responseService");
const lesson_1 = __importDefault(require("../DB/models/lesson"));
const subLesson_1 = __importDefault(require("../DB/models/subLesson"));
const content_1 = __importDefault(require("../DB/models/content"));
const level_1 = __importDefault(require("../DB/models/level"));
const questions_1 = __importDefault(require("../DB/models/questions"));
const cach_1 = __importDefault(require("../service/cach"));
class adminController {
    createLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyError = (0, express_validator_1.validationResult)(req);
            if (!bodyError.isEmpty()) {
                return next(new responseService_1.response(req, res, 'create lesson', 400, bodyError['errors'][0].msg, null));
            }
            yield lesson_1.default.create(req.body);
            yield cach_1.default.reset();
            return next(new responseService_1.response(req, res, 'create lesson', 200, null, 'new lesson create successfully'));
        });
    }
    createSublesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyError = (0, express_validator_1.validationResult)(req);
            if (!bodyError.isEmpty()) {
                return next(new responseService_1.response(req, res, 'create subLesson', 400, bodyError['errors'][0].msg, null));
            }
            const existance = yield lesson_1.default.findById(req.params.lesson);
            if (!existance) {
                return next(new responseService_1.response(req, res, 'create subLesson', 404, 'this lesson is not exist on database', null));
            }
            const subData = Object.assign(Object.assign({}, req.body), { lesson: existance._id });
            const subLesson = yield subLesson_1.default.create(subData);
            const lesson = yield lesson_1.default.findByIdAndUpdate(req.params.lesson, { $push: { sublessons: subLesson._id } });
            yield cach_1.default.reset();
            return next(new responseService_1.response(req, res, 'create subLesson', 200, null, 'new subLesson create successfully'));
        });
    }
    createContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const sublesson = yield subLesson_1.default.findById(req.params.sublesson);
            if (!sublesson) {
                return next(new responseService_1.response(req, res, 'create content', 404, 'this lesson is not exist', null));
            }
            const content = yield content_1.default.create({ internalContent: req.body.internalContent, subLesson: sublesson._id });
            yield subLesson_1.default.findByIdAndUpdate(req.params.sublesson, { $push: { contents: content._id } });
            yield cach_1.default.reset();
            return next(new responseService_1.response(req, res, 'create content', 200, null, content));
        });
    }
    creteNewLevel(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const lesson = yield lesson_1.default.findById(req.params.lessonId);
            if (!lesson) {
                return next(new responseService_1.response(req, res, 'create new level', 404, 'this lesson is not defined on database', null));
            }
            const level = { number: req.body.number, reward: req.body.reward, lesson: lesson._id };
            const existLevelNumber = yield level_1.default.findOne({ number: req.body.number });
            if (existLevelNumber) {
                const lesss = yield level_1.default.find({ number: { $gt: req.body.number } });
                for (let i = 0; i < lesss.length; i++) {
                    // await lesss[i].updateOne({ $inc: { number: 1 } })
                    lesss[i].number += 1;
                    yield lesss[i].save();
                }
                yield level_1.default.findOneAndUpdate({ number: req.body.number }, { $inc: { number: 1 } });
                const levelCreation = yield level_1.default.create(level);
                yield lesson.updateOne({ $addToSet: { levels: levelCreation._id } });
                yield lesson.save();
                return next(new responseService_1.response(req, res, 'create new level', 200, null, 'new level creation successfully'));
            }
            const levelCreation = yield level_1.default.create(level);
            yield lesson.updateOne({ $addToSet: { levels: levelCreation._id } });
            yield lesson.save();
            yield cach_1.default.reset();
            return next(new responseService_1.response(req, res, 'create new level', 200, null, 'new level creation successfully'));
        });
    }
    deleteLevel(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const level = yield level_1.default.findById(req.params.levelId);
            if (!level) {
                return next(new responseService_1.response(req, res, 'delete level', 404, 'this level is not defined on database', null));
            }
            const lesson = yield lesson_1.default.findOne({ levels: { $in: level._id } });
            const uppersLevels = yield level_1.default.find({ number: { $gt: level.number } });
            yield (lesson === null || lesson === void 0 ? void 0 : lesson.updateOne({ $pull: { levels: level._id } }));
            yield (lesson === null || lesson === void 0 ? void 0 : lesson.save());
            yield level.deleteOne();
            yield level.save();
            for (let i = 0; i < uppersLevels.length; i++) {
                const newNumber = uppersLevels[i].number -= 1;
                yield uppersLevels[i].updateOne({ number: newNumber });
                yield uppersLevels[i].save();
            }
            yield cach_1.default.reset();
            return next(new responseService_1.response(req, res, 'deleting level', 200, null, 'level deleted successfully'));
        });
    }
    createQuestion(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const level = yield level_1.default.findById(req.params.levelId);
            if (!level) {
                return next(new responseService_1.response(req, res, 'create content', 404, 'this level is not defined on database', null));
            }
            const data = Object.assign(Object.assign({}, req.body), { level: level._id });
            const question = yield questions_1.default.create(data);
            yield level.updateOne({ $addToSet: { questions: question._id } });
            yield level.save();
            yield cach_1.default.reset();
            return next(new responseService_1.response(req, res, 'create question', 200, null, 'question created successfully!'));
        });
    }
    getLevels(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const level = yield level_1.default.find();
            return next(new responseService_1.response(req, res, 'get levels', 200, null, level));
        });
    }
    getContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield content_1.default.findById(req.params.contentId).populate('subLesson');
            return next(new responseService_1.response(req, res, 'get specific content', 200, null, content));
        });
    }
    updateContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield content_1.default.findById(req.params.contentId).populate('subLesson');
            yield (content === null || content === void 0 ? void 0 : content.updateOne(req.body));
            yield (content === null || content === void 0 ? void 0 : content.save());
            return next(new responseService_1.response(req, res, 'get specific content', 200, null, content));
        });
    }
    updateLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const lesson = yield lesson_1.default.findById(req.params.lessonId).populate('subLesson');
            yield (lesson === null || lesson === void 0 ? void 0 : lesson.updateOne(req.body));
            yield (lesson === null || lesson === void 0 ? void 0 : lesson.save());
            return next(new responseService_1.response(req, res, 'get specific content', 200, null, lesson));
        });
    }
    updateSubLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const sublesson = yield subLesson_1.default.findById(req.params.sublessonId).populate('subLesson');
            yield (sublesson === null || sublesson === void 0 ? void 0 : sublesson.updateOne(req.body));
            yield (sublesson === null || sublesson === void 0 ? void 0 : sublesson.save());
            return next(new responseService_1.response(req, res, 'get specific content', 200, null, sublesson));
        });
    }
    getSubLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let cacheData = yield cach_1.default.getter('admin-getSubLesson');
            let subLesson;
            if (cacheData) {
                console.log('read throw cach . . .');
                if (cacheData[req.params.sublesson]) {
                    console.log('read throw cach . . .');
                    subLesson = cacheData[req.params.sublesson];
                }
                else {
                    console.log('cache is empty . . .');
                    subLesson = yield subLesson_1.default.findById(req.params.sublesson).populate('contents').populate('lesson');
                    cacheData[req.params.sublesson] = subLesson;
                    yield cach_1.default.setter('admin-getSubLesson', cacheData);
                }
            }
            else {
                console.log('cache is empty . . .');
                subLesson = yield subLesson_1.default.findById(req.params.sublesson).populate('contents').populate('lesson');
                cacheData = {};
                cacheData[req.params.sublesson] = subLesson;
                yield cach_1.default.setter('admin-getSubLesson', cacheData);
            }
            return next(new responseService_1.response(req, res, 'get specific subLesson', 200, null, subLesson));
        });
    }
    getLessons(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const lessons = yield lesson_1.default.find().populate({
                path: 'sublessons',
                populate: {
                    path: 'contents',
                    select: 'internalContent',
                }
            });
            return next(new responseService_1.response(req, res, 'get lessons', 200, null, lessons));
        });
    }
}
exports.default = adminController;
