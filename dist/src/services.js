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
const content_1 = __importDefault(require("./DB/models/content"));
const lesson_1 = __importDefault(require("./DB/models/lesson"));
const subLesson_1 = __importDefault(require("./DB/models/subLesson"));
const connection_1 = __importDefault(require("./interservice/connection"));
const connection = new connection_1.default();
class contentService {
    checkSeen(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const contents = yield content_1.default.find({ subLesson: id });
            const seenContents = yield content_1.default.find({ $and: [{ subLesson: id }, { seen: { $in: userId } }] });
            const sublesson = yield subLesson_1.default.findById(id);
            let lessonId = sublesson === null || sublesson === void 0 ? void 0 : sublesson.lesson;
            if (contents.length == seenContents.length) {
                yield subLesson_1.default.findByIdAndUpdate(id, { $push: { seen: userId } });
                const sublessons = yield subLesson_1.default.find({ lesson: lessonId });
                const seenSubLessons = yield subLesson_1.default.find({ $and: [{ lesson: id }, { $in: { seen: userId } }] });
                if (sublessons.length == seenSubLessons.length) {
                    const seenLesson = yield lesson_1.default.findByIdAndUpdate(lessonId, { $push: { seen: userId } });
                    const rewardResponse = yield connection.putReward(userId, seenLesson === null || seenLesson === void 0 ? void 0 : seenLesson.reward, `finished ${seenLesson === null || seenLesson === void 0 ? void 0 : seenLesson.name} Lesson`);
                    if (rewardResponse.success) {
                        yield lesson_1.default.findByIdAndUpdate(lessonId, { rewarded: true });
                    }
                }
            }
        });
    }
}
exports.default = contentService;
