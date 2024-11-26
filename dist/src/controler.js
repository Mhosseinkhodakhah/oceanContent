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
const services_1 = __importDefault(require("./services"));
const responseService_1 = require("./service/responseService");
const lesson_1 = __importDefault(require("./DB/models/lesson"));
const subLesson_1 = __importDefault(require("./DB/models/subLesson"));
const content_1 = __importDefault(require("./DB/models/content"));
const level_1 = __importDefault(require("./DB/models/level"));
const questions_1 = __importDefault(require("./DB/models/questions"));
const connection_1 = __importDefault(require("./interservice/connection"));
const services = new services_1.default();
const connection = new connection_1.default();
class contentController {
    getLessons(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const language = req.params.lang;
            let lessons;
            switch (language) {
                case 'english':
                    lessons = yield lesson_1.default.find().populate({
                        path: 'sublessons',
                        populate: {
                            path: 'contents',
                            select: 'internalContent',
                        },
                        select: ['-name', '-aName']
                    }).select(['-name', '-aName']);
                    break;
                case 'arabic':
                    lessons = yield lesson_1.default.find().populate({
                        path: 'sublessons',
                        populate: {
                            path: 'contents',
                            select: 'internalContent',
                        },
                        select: ['-name', '-eName']
                    }).select(['-name', '-eName']);
                    break;
                case 'persian':
                    lessons = yield lesson_1.default.find().populate({
                        path: 'sublessons',
                        populate: {
                            path: 'contents',
                            select: 'internalContent',
                        },
                        select: ['-aname', '-eName']
                    }).select(['-aName', '-eName']);
                    break;
                default:
                    lessons = 'please send the language . . .';
                    break;
            }
            return next(new responseService_1.response(req, res, 'get lessons', 200, null, lessons));
        });
    }
    getSubLesson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const sublesson = yield subLesson_1.default.findById(req.params.sublesson).populate('contents').populate('lesson');
            return next(new responseService_1.response(req, res, 'get specific subLesson', 200, null, sublesson));
        });
    }
    getContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield content_1.default.findById(req.params.contentId).populate('subLesson');
            return next(new responseService_1.response(req, res, 'get specific content', 200, null, content));
        });
    }
    seenContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield content_1.default.findByIdAndUpdate(req.params.contentId, { $push: { seen: req.user.id } });
            yield services.checkSeen(req.params.contentId, req.user.id);
            return next(new responseService_1.response(req, res, 'seen content', 200, null, 'content seen by user!'));
        });
    }
    getLevels(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = req.user.id;
            const closedLevels = yield lesson_1.default.find({ seen: { $ne: userId } }).populate('levels').select('levels');
            const unPasseedLevels = yield lesson_1.default.find({ $and: [{ seen: { $in: userId } }, { paasedQuize: { $ne: userId } }] }).populate('levels').select('levels');
            const passedLevels = yield lesson_1.default.find({ $and: [{ seen: { $in: userId } }, { paasedQuize: { $in: userId } }] }).populate('levels').select('levels');
            return next(new responseService_1.response(req, res, 'get levels', 200, null, { closedLevels: closedLevels, unPasseedLevels: unPasseedLevels, passedLevels: passedLevels }));
        });
    }
    openLevel(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = req.user.id;
            const level = yield level_1.default.findOne({ number: req.params.number });
            if (level === null || level === void 0 ? void 0 : level.passedUsers.includes(userId)) {
                const questiotns = yield questions_1.default.find({ level: level === null || level === void 0 ? void 0 : level._id }).limit(10);
                return next(new responseService_1.response(req, res, 'open level', 200, null, { questions: questiotns }));
            }
            const questiotns = yield questions_1.default.find({ $and: [{ level: level === null || level === void 0 ? void 0 : level._id }, { passedUser: { $ne: userId } }] }).limit(10);
            return next(new responseService_1.response(req, res, 'open level', 200, null, { questions: questiotns }));
        });
    }
    //! needs to review
    answer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const answers = req.body;
            let trueAnswers = 0;
            const question = yield questions_1.default.findOne({ questionForm: answers[0].questionForm });
            for (let i = 0; i < answers.length; i++) {
                let title = answers[i].questionForm;
                if ((question === null || question === void 0 ? void 0 : question.options[question === null || question === void 0 ? void 0 : question.trueOption]) == answers[i].answer) {
                    trueAnswers++;
                    yield questions_1.default.findOneAndUpdate({ questionForm: title }, { $push: { passedUser: req.user.id } });
                }
            }
            if (trueAnswers == 10) {
                const level = yield level_1.default.findByIdAndUpdate(question === null || question === void 0 ? void 0 : question.level, { $push: { passedUsers: req.user.id } });
                const rewarded = yield connection.putReward(req.user.id, level === null || level === void 0 ? void 0 : level.reward, `passed ${level === null || level === void 0 ? void 0 : level.number} level`);
                if (rewarded.success) {
                    yield level_1.default.findByIdAndUpdate(level === null || level === void 0 ? void 0 : level._id, { rewarded: true });
                }
                const lessonLevels = yield lesson_1.default.findById(level === null || level === void 0 ? void 0 : level.lesson).populate('levels').select('levels');
                for (let j = 0; j < (lessonLevels === null || lessonLevels === void 0 ? void 0 : lessonLevels.levels.length); j++) {
                    if (lessonLevels === null || lessonLevels === void 0 ? void 0 : lessonLevels.levels[j].passedUser.includes(req.user.id)) {
                        yield lesson_1.default.findByIdAndUpdate(level === null || level === void 0 ? void 0 : level.lesson, { $push: { paasedQuize: req.user.id } });
                        return next(new responseService_1.response(req, res, 'answer questions', 200, null, { message: 'congratulation! you passed this quize' }));
                    }
                }
            }
            else {
                return next(new responseService_1.response(req, res, 'answer questions', 200, null, { message: 'sorry! you cant pass this level! please review the lesson and try again' }));
            }
        });
    }
}
exports.default = contentController;
