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
const connection_1 = __importDefault(require("./interservice/connection"));
const services = new services_1.default();
const connection = new connection_1.default();
class contentController {
    seenContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield content_1.default.findByIdAndUpdate(req.params.contentId, { $addToSet: { seen: req.user.id } });
            yield services.makeLog(req.user, `seen content`, `seen content ${content === null || content === void 0 ? void 0 : content.internalContent.title}`);
            let subLesson;
            if ((content === null || content === void 0 ? void 0 : content.state) == 1) {
                subLesson = yield subLesson_1.default.findOne({ 'subLessons._id': content === null || content === void 0 ? void 0 : content.subLesson });
                subLesson === null || subLesson === void 0 ? void 0 : subLesson.subLessons.forEach(element => {
                    if (element._id == (content === null || content === void 0 ? void 0 : content.subLesson)) {
                        element['seen'].push(req.user.id);
                        console.log('sublesson seen successfully . . .', element['seen']);
                    }
                });
                yield (subLesson === null || subLesson === void 0 ? void 0 : subLesson.save());
                yield services.makeLog(req.user, `seen content`, `seen all content of subLesson ${subLesson === null || subLesson === void 0 ? void 0 : subLesson.name}`);
                let allSublessonsSeen = 0;
                subLesson === null || subLesson === void 0 ? void 0 : subLesson.subLessons.forEach(element => {
                    if (element.seen.includes(req.user.id)) {
                        allSublessonsSeen++;
                    }
                });
                if (allSublessonsSeen == (subLesson === null || subLesson === void 0 ? void 0 : subLesson.subLessons.length)) { // if all sublessons seen in level 1
                    yield (subLesson === null || subLesson === void 0 ? void 0 : subLesson.updateOne({ $addToSet: { seen: req.user.id } }));
                }
                let lesson = yield lesson_1.default.findById(subLesson === null || subLesson === void 0 ? void 0 : subLesson.lesson).populate('sublessons');
                let allLessonSeen = 0;
                lesson === null || lesson === void 0 ? void 0 : lesson.sublessons.forEach((element) => {
                    if (element.seen.includes(req.user.id)) {
                        allLessonSeen++;
                    }
                });
                if ((lesson === null || lesson === void 0 ? void 0 : lesson.sublessons.length) == allLessonSeen) {
                    yield lesson.updateOne({ $addToSet: { seen: req.user.id } });
                    const rewardResponse = yield connection.putReward(req.user.id, lesson === null || lesson === void 0 ? void 0 : lesson.reward, `finished ${lesson === null || lesson === void 0 ? void 0 : lesson.number} Lesson`);
                    yield services.makeLog(req.user, `seen content`, `seen all content of lesson ${lesson === null || lesson === void 0 ? void 0 : lesson.number}`);
                    if (rewardResponse.success) {
                        yield lesson.updateOne({ $addToSet: { rewarded: req.user.id } });
                    }
                }
            }
            else if ((content === null || content === void 0 ? void 0 : content.state) == 0) {
                subLesson = yield subLesson_1.default.findById(content === null || content === void 0 ? void 0 : content.subLesson);
                yield (subLesson === null || subLesson === void 0 ? void 0 : subLesson.updateOne({ $addToSet: { seen: req.user.id } }));
                yield services.makeLog(req.user, `seen content`, `seen all content of subLesson ${subLesson === null || subLesson === void 0 ? void 0 : subLesson.name}`);
                let lesson = yield lesson_1.default.findById(subLesson === null || subLesson === void 0 ? void 0 : subLesson.lesson).populate('sublessons');
                let allLessonSeen = 0;
                lesson === null || lesson === void 0 ? void 0 : lesson.sublessons.forEach((element) => {
                    if (element.seen.includes(req.user.id)) {
                        allLessonSeen++;
                    }
                });
                if ((lesson === null || lesson === void 0 ? void 0 : lesson.sublessons.length) == allLessonSeen) {
                    yield lesson.updateOne({ $addToSet: { seen: req.user.id } });
                    const rewardResponse = yield connection.putReward(req.user.id, lesson === null || lesson === void 0 ? void 0 : lesson.reward, `finished ${lesson === null || lesson === void 0 ? void 0 : lesson.number} Lesson`);
                    yield services.makeLog(req.user, `seen content`, `seen all content of lesson ${lesson === null || lesson === void 0 ? void 0 : lesson.number}`);
                    if (rewardResponse.success) {
                        yield lesson.updateOne({ $addToSet: { rewarded: req.user.id } });
                    }
                }
            }
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'seen content', 200, null, 'content seen by user!'));
        });
    }
}
exports.default = contentController;
