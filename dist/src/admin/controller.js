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
            const allLevels = yield level_1.default.find();
            const firstLevel = yield level_1.default.create({
                number: allLevels.length + 1,
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
            if (!content) {
                return next(new responseService_1.response(req, res, 'update content', 404, 'this content is not exist on databse', null));
            }
            yield (content === null || content === void 0 ? void 0 : content.updateOne(req.body));
            // content.internalContent = req.body.internalContent;
            let finalData = yield content_1.default.findById(req.params.contentId);
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'update content by admin', 200, null, finalData));
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
            const sublesson = yield subLesson_1.default.findById(req.params.subLessonId);
            const finalData = Object.assign(Object.assign({}, (sublesson === null || sublesson === void 0 ? void 0 : sublesson.toObject())), req.body);
            yield (sublesson === null || sublesson === void 0 ? void 0 : sublesson.updateOne(finalData));
            yield (sublesson === null || sublesson === void 0 ? void 0 : sublesson.save());
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'update sublessons', 200, null, finalData));
        });
    }
    // it has a problemmmmm
    updateTitle(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('body', req.params.titleId);
            const title = yield subLesson_1.default.findOne({ 'subLessons._id': req.params.titleId });
            console.log('title', title === null || title === void 0 ? void 0 : title.subLessons);
            if (!title) {
                return next(new responseService_1.response(req, res, 'update title', 404, 'this title is not exist on database', null));
            }
            for (let i = 0; i < (title === null || title === void 0 ? void 0 : title.subLessons.length); i++) {
                if (title.subLessons[i]._id.toString() == req.params.titleId) {
                    title.subLessons[i].eName = req.body.eName;
                    title.subLessons[i].name = req.body.name;
                    title.subLessons[i].aName = req.body.aName;
                }
            }
            yield title.save();
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'update title', 200, null, title));
        });
    }
    deleteTitle(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let title = yield subLesson_1.default.findOne({ 'subLessons._id': req.params.titleId });
            // console.log(title)                
            if (!title) {
                return next(new responseService_1.response(req, res, 'delete title', 404, 'this title is not exist on database', null));
            }
            let finalData = title.toObject();
            let specificTitle = finalData.subLessons.find((elem) => {
                if (elem._id == req.params.titleId) {
                    return elem;
                }
            });
            if (specificTitle === null || specificTitle === void 0 ? void 0 : specificTitle.content) {
                yield content_1.default.findByIdAndDelete(specificTitle === null || specificTitle === void 0 ? void 0 : specificTitle.content);
            }
            yield title.updateOne({ $pull: { subLessons: { _id: req.params.titleId } } });
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'delete title ', 200, null, title));
        });
    }
    deleteContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.params.contentId);
            const content = yield content_1.default.findById(req.params.contentId);
            if (!content) {
                console.log('no content exist');
            }
            if ((content === null || content === void 0 ? void 0 : content.state) == 0) {
                let sublesson = yield subLesson_1.default.findOne({ 'subLessons._id': content.subLesson });
                sublesson === null || sublesson === void 0 ? void 0 : sublesson.subLessons.forEach((elem) => {
                    if (elem._id == content.subLesson) {
                        elem.content = null;
                        // elem.set('content' , null)
                    }
                });
                yield (sublesson === null || sublesson === void 0 ? void 0 : sublesson.save());
            }
            else if ((content === null || content === void 0 ? void 0 : content.state) == 1) {
                let sublesson = yield subLesson_1.default.findById(content.subLesson);
                sublesson === null || sublesson === void 0 ? void 0 : sublesson.set('content', null);
                sublesson === null || sublesson === void 0 ? void 0 : sublesson.save();
            }
            yield content_1.default.findByIdAndDelete(req.params.contentId);
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'delete content', 200, null, content));
        });
    }
    deleteSublesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.params.subLessonId);
            const subLesson = yield subLesson_1.default.findById(req.params.subLessonId);
            if (!subLesson) {
                console.log('no content exist');
            }
            if (subLesson === null || subLesson === void 0 ? void 0 : subLesson.lesson) {
                let lesson = yield lesson_1.default.findById(subLesson.lesson);
                yield (lesson === null || lesson === void 0 ? void 0 : lesson.updateOne({ $pull: { sublessons: subLesson._id } }));
            }
            if (subLesson === null || subLesson === void 0 ? void 0 : subLesson.content) {
                yield content_1.default.findByIdAndDelete(subLesson.content);
            }
            if (subLesson === null || subLesson === void 0 ? void 0 : subLesson.subLessons.length) {
                for (let i = 0; i < (subLesson === null || subLesson === void 0 ? void 0 : subLesson.subLessons.length); i++) {
                    yield content_1.default.deleteMany({ subLesson: subLesson.subLessons[i]._id });
                }
            }
            yield (subLesson === null || subLesson === void 0 ? void 0 : subLesson.deleteOne());
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'delete content', 200, null, subLesson));
        });
    }
    deleteLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.params.lessonId);
            const lesson = yield lesson_1.default.findById(req.params.lessonId);
            if (!lesson) {
                console.log('no content exist');
            }
            if (lesson === null || lesson === void 0 ? void 0 : lesson.sublessons.length) {
                let subLessons = yield subLesson_1.default.find({ lesson: lesson._id });
                for (let i = 0; i < subLessons.length; i++) {
                    if (subLessons[i].content) {
                        yield content_1.default.findByIdAndDelete(subLessons[i].content);
                    }
                    if (subLessons[i].subLessons.length) {
                        for (let j = 0; j < subLessons[i].subLessons.length; j++) {
                            yield content_1.default.deleteMany({ subLesson: subLessons[i].subLessons[j] });
                        }
                    }
                    // here we should delete all sublessons contents . . .
                }
                yield subLesson_1.default.deleteMany({ lesson: lesson._id });
            }
            if (lesson === null || lesson === void 0 ? void 0 : lesson.levels.length) {
                yield level_1.default.deleteMany({ lesson: lesson._id });
            }
            yield (lesson === null || lesson === void 0 ? void 0 : lesson.deleteOne());
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'delete content', 200, null, lesson));
        });
    }
    getAll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            yield level_1.default.deleteMany();
            let levels = yield level_1.default.find();
            return res.status(200).json({
                content: levels
            });
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
