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
const question_1 = __importDefault(require("../DB/models/question"));
const cach_1 = __importDefault(require("../service/cach"));
const connection_1 = __importDefault(require("../interservice/connection"));
const { translate } = require('free-translate');
const connection = new connection_1.default();
class adminController {
    createLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyError = (0, express_validator_1.validationResult)(req);
            if (!bodyError.isEmpty()) {
                return next(new responseService_1.response(req, res, 'create lesson', 400, bodyError['errors'][0].msg, null));
            }
            if (!req.body.aName) { // translation for arabic
                const translatedText = yield translate(req.body.name, { to: 'ar' });
                req.body.aName = translatedText;
            }
            if (!req.body.eName) { // translation for arabic
                const translatedText = yield translate(req.body.name, { to: 'en' });
                req.body.eName = translatedText;
            }
            const lesson = yield lesson_1.default.create(req.body);
            const firstLevel = yield level_1.default.create({
                number: req.body.number,
                lesson: lesson._id,
                reward: 0
            });
            yield lesson_1.default.findByIdAndUpdate(lesson._id, { $addToSet: { levels: firstLevel._id } });
            const h = yield connection.resetCache();
            console.log(h);
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
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'create subLesson', 200, null, 'new subLesson create successfully'));
        });
    }
    createTitle(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const sublesson = yield subLesson_1.default.findById(req.params.sublessonId);
            if (!sublesson) {
                return next(new responseService_1.response(req, res, 'create title', 404, 'this sublesson is not exist on database', null));
            }
            yield sublesson.updateOne({ $addToSet: { subLessons: req.body } });
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'create title', 200, null, 'the title created successfulle'));
        });
    }
    createContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let sublesson;
            sublesson = yield subLesson_1.default.findById(req.params.sublesson);
            if (sublesson) {
                const data = Object.assign(Object.assign({}, req.body), { subLesson: sublesson._id, state: 0 });
                const content = yield content_1.default.create(data);
                yield subLesson_1.default.findByIdAndUpdate(req.params.sublesson, { content: content._id });
                yield connection.resetCache();
                return next(new responseService_1.response(req, res, 'create content', 200, null, content));
            }
            sublesson = yield subLesson_1.default.findOne({ 'subLessons._id': req.params.sublesson });
            console.log('is it here??', sublesson);
            if (!sublesson) {
                return next(new responseService_1.response(req, res, 'creating content', 404, 'this sublesson is not exist on database', null));
            }
            const data = Object.assign(Object.assign({}, req.body), { subLesson: req.params.sublesson, state: 0 });
            const content = yield content_1.default.create(data);
            sublesson.subLessons.forEach(element => {
                if (element._id == req.params.sublesson) {
                    element['content'] = content._id;
                    console.log('new content . . .', element);
                }
            });
            yield sublesson.save();
            yield connection.resetCache();
            console.log('check for last time , , , ,');
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
            yield connection.resetCache();
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
            for (let i = 0; i < uppersLevels.length; i++) {
                uppersLevels[i].number -= 1;
                yield uppersLevels[i].save();
            }
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'deleting level', 200, null, 'level deleted successfully'));
        });
    }
    createQuestion(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const level = yield level_1.default.findById(req.params.levelId);
            if (!level) {
                return next(new responseService_1.response(req, res, 'create content', 404, 'this level is not defined on database', null));
            }
            req.body.trueOption -= 1;
            const data = Object.assign(Object.assign({}, req.body), { level: level._id });
            const question = yield question_1.default.create(data);
            yield level.updateOne({ $addToSet: { questions: question._id } });
            yield level.save();
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'create question', 200, null, 'question created successfully!'));
        });
    }
    getLevels(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let cacheData = yield cach_1.default.getter('admin-getLevels');
            let finalData;
            if (cacheData) {
                console.log('read throw cache . . .');
                finalData = cacheData;
            }
            else {
                console.log('cache is empty . . .');
                finalData = yield level_1.default.find();
                yield cach_1.default.setter('admin-getLevels', finalData);
            }
            return next(new responseService_1.response(req, res, 'get levels', 200, null, finalData));
        });
    }
    getContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let cacheData = yield cach_1.default.getter(`admin-getContent-${req.params.contentId}`);
            let finalData;
            if (cacheData) {
                console.log('read throw cache . . .');
                finalData = cacheData;
            }
            else {
                console.log('cache is empty . . .');
                finalData = yield content_1.default.findById(req.params.contentId).populate('subLesson');
                if (!finalData) {
                    return next(new responseService_1.response(req, res, 'get specific content', 404, 'this content is not exist on database', null));
                }
                yield cach_1.default.setter(`admin-getContent-${req.params.contentId}`, finalData);
            }
            return next(new responseService_1.response(req, res, 'get specific content', 200, null, finalData));
        });
    }
    updateContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield content_1.default.findById(req.params.contentId);
            const finalData = Object.assign(Object.assign({}, (content === null || content === void 0 ? void 0 : content.toObject())), req.body);
            yield (content === null || content === void 0 ? void 0 : content.updateOne(finalData));
            yield (content === null || content === void 0 ? void 0 : content.save());
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'update content by admin', 200, null, content));
        });
    }
    updateLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const lesson = yield lesson_1.default.findById(req.params.lessonId).populate('sublessons');
            const finalData = Object.assign(Object.assign({}, (lesson === null || lesson === void 0 ? void 0 : lesson.toObject())), req.body);
            yield (lesson === null || lesson === void 0 ? void 0 : lesson.updateOne(finalData));
            yield (lesson === null || lesson === void 0 ? void 0 : lesson.save());
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'update lesson by admin', 200, null, lesson));
        });
    }
    updateSubLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const sublesson = yield subLesson_1.default.findById(req.params.sublessonId);
            const finalData = Object.assign(Object.assign({}, (sublesson === null || sublesson === void 0 ? void 0 : sublesson.toObject())), req.body);
            yield (sublesson === null || sublesson === void 0 ? void 0 : sublesson.updateOne(finalData));
            yield (sublesson === null || sublesson === void 0 ? void 0 : sublesson.save());
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'get specific content', 200, null, sublesson));
        });
    }
    updateTitle(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const title = yield subLesson_1.default.findOne({ 'subLessons._id': req.params.titleId });
            if (!title) {
                return next(new responseService_1.response(req, res, 'update title', 404, 'this title is not exist on database', null));
            }
            let finalData;
            let newTitle = title.toObject();
            for (let i = 0; i < (title === null || title === void 0 ? void 0 : title.subLessons.length); i++) {
                if ((title.subLessons[i]._id).toString() == req.params.titleId) {
                    console.log('sublessons', title.subLessons);
                    title.subLessons[i] = Object.assign(Object.assign({}, title.subLessons[i]), req.body);
                    console.log('after update', title.subLessons[i]);
                }
            }
            yield title.save();
            return next(new responseService_1.response(req, res, 'update title', 200, null, title));
        });
    }
    getSubLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let cacheData = yield cach_1.default.getter(`admin-getSubLesson-${req.params.sublessonId}`);
            let subLesson;
            if (cacheData) {
                console.log('read throw cach . . .');
                subLesson = cacheData;
            }
            else {
                console.log('cache is empty . . .');
                subLesson = yield subLesson_1.default.findById(req.params.sublessonId).populate('contents').populate('lesson');
                if (!subLesson) {
                    return next(new responseService_1.response(req, res, 'get specific subLesson', 404, 'this sublesson is not exist on database', null));
                }
                yield cach_1.default.setter(`admin-getSubLesson-${req.params.sublessonId}`, subLesson);
            }
            return next(new responseService_1.response(req, res, 'get specific subLesson', 200, null, subLesson));
        });
    }
    getLessons(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let cacheData = yield cach_1.default.getter('admin-getLessons');
            let finalData;
            if (cacheData) {
                finalData = cacheData;
            }
            else {
                const lessons = yield lesson_1.default.find().populate({
                    path: 'sublessons',
                    populate: {
                        path: 'contents',
                        select: 'internalContent',
                    }
                });
                yield cach_1.default.setter('admin-getLessons', lessons);
                finalData = lessons;
            }
            return next(new responseService_1.response(req, res, 'get lessons', 200, null, finalData));
        });
    }
}
exports.default = adminController;
