

interface messeageInterface {
    arabic: {}
    english: {}
    persian: {}
}


let messages: any = {
    arabic: {
        tokenError: "انتهت صلاحية الرمز",
        emailError: "البريد الإلكتروني غير موجود!",
        codeError: "رمز خاطئ!",
        unknownError: "حدث خطأ ما . . .",
        userNotFound: "هذا المستخدم غير موجود في قاعدة البيانات",
         passedLevelMessage: "تهانينا! لقد اجتزت هذا المستوى والآن يمكنك البدء في", 
        passedAllLessonsOfThisLevel: "تهانينا! لقد اجتزت هذا المستوى ويمكنك البدء في المستوى التالي", 
        levelNotPassed: "عذرًا! لا يمكنك اجتياز هذا المستوى! من فضلك راجع الدرس وحاول مرة أخرى",
        contentNotExist : "المحتوى غير موجود في قاعدة البيانات",
        seenContent : "تمت مشاهدة المحتوى من قبل المستخدم"
    },
    english: {
        tokenError: "Token expired",
        emailError: "Email not found!",
        codeError: "Wrong code!",
        unknownError: "Something went wrong . . .",
        userNotFound : 'this user is not exist on database',
        passedLevelMessage : 'congratulation! you passed this level and now you can start the',
        passedAllLessonsOfThisLevel : 'congratulation! you passed this level and you can start the next level',
        levelNotPassed : 'sorry! you cant pass this level! please review the lesson and try again',
        contentNotExist : "this content is not exist on databse",
        seenContent : "content seen by user!"
    },
    persian: {
        tokenError: "توکن منقضی شده است",
        emailError: "ایمیل یافت نشد!",
        codeError: "کد نادرست است!",
        unknownError: "یک خطا رخ داده است . . .",
        userNotFound : 'این کاربر در پایگاه داده وجود ندارد',
        passedLevelMessage : 'تبریک! شما این سطح را گذرانده‌اید و اکنون می‌توانید شروع کنید',
        passedAllLessonsOfThisLevel : 'تبریک! شما تمام دروس این سطح را گذرانده‌اید و می‌توانید سطح بعدی را شروع کنید',
        levelNotPassed : "متاسفم! شما نمی‌توانید این سطح را بگذرانید! لطفا درس را مرور کرده و دوباره تلاش کنید",
        contentNotExist : "این محتوا در پایگاه داده وجود ندارد",
        seenContent : "شما با موفقیت خواندن این درس را به اتمام رساندید"
    }
}


export default messages;