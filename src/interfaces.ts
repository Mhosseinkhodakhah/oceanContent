export interface lessonDB {
    name: string,
    number: number,
    sublessons: {}[],
    reward: number,
    eName: string,
    aName: string,
    seen: string[],
    rewarded: boolean,
    paasedQuize: boolean,
    levels: any
}


export interface questionDB {
    questionForm: string,
    eQuestionForm: string,
    aQuestionForm: string,
    options: string[],
    eOptions: string[],
    aOptions: string[],
    trueOption: number,
    time: number,
    level: any,
    passedUser: string[]
}



export interface log{
    user : {
        userName : string,
        fullName : string,
        profile : string,
    },
    
    title : string,

    description : string

}

export interface levelDB {
    number: number,
    rewarded: boolean,
    reward: number,
    lesson: any,
    passedUsers: string[],
    questions: any
}

export interface subLessonDB {
    name: string,
    eName: string,
    aName: string,
    number: number,
    lesson: any,
    content: {},
    seen: string[]
    subLessons: { eName: string , name : string , aName : string, number: number, _id: any , seen : string[], content: any }[]
}


export interface content {
    internalContent: {
        title: string,
        aTitle: string,
        eTitle: string,
        describtion: string,
        eDescribtion: string,
        aDescribtion: string,
    },
    state : number

    pictures?: string[],
    ePictures?: string[],
    aPictures?: string[],

    seen?: string[],

    subLesson: any
}


export interface responseInterface {

}