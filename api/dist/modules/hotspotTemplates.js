"use strict";
/**
 * Created by hamidehnouri on 10/17/2017 AD.
 */
module.exports = {
    alpha: {
        id: 'alpha',
        controller: 'base',
        template: 'alpha',
        title: 'آلفا',
        formConfig: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false },
            { label: 'roomNumber', active: false, required: false },
            { label: 'passportNumber', active: false, required: false },
            { label: 'studentGrade', active: false, required: false },
            { label: 'studentId', active: false, required: false }
        ],
        formConfigEn: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false },
            { label: 'roomNumber', active: false, required: false },
            { label: 'passportNumber', active: false, required: false },
            { label: 'studentGrade', active: false, required: false },
            { label: 'studentId', active: false, required: false }
        ],
        styles: [
            { title: 'پاییز', id: 'fall' },
            { title: 'فضا', id: 'space' },
            { title: 'مزرعه', id: 'field' }
        ]
    },
    restaurant: {
        id: 'restaurant',
        controller: 'base',
        template: 'alpha',
        title: 'رستوران',
        formConfig: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false }
        ],
        formConfigEn: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false }
        ],
        styles: [
            { title: 'پاستا', id: 'pasta' },
            { title: 'پیتزا', id: 'pizza' },
            { title: 'پیتزا قارچ', id: 'mushroomPizza' },
            { title: 'فست‌فود', id: 'fastfood' },
            { title: 'سنتی', id: 'traditional' }
        ]
    },
    cafe: {
        id: 'cafe',
        controller: 'base',
        template: 'alpha',
        title: 'کافه',
        formConfig: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false }
        ],
        formConfigEn: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false }
        ],
        styles: [
            { title: 'صبحانه', id: 'breakfast' },
            { title: 'گردو', id: 'walnut' },
            { title: 'آفتابگردان', id: 'sunflower' },
            { title: 'عصرانه', id: 'supper' },
            { title: 'فانوس', id: 'lantern' },
            { title: 'کروسان', id: 'croisan' },
            { title: 'کافئین', id: 'caffeine' }
        ]
    },
    hotel: {
        id: 'hotel',
        controller: 'base',
        template: 'alpha',
        title: 'هتل',
        formConfig: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false },
            { label: 'roomNumber', active: false, required: false },
            { label: 'passportNumber', active: false, required: false }
        ],
        formConfigEn: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false },
            { label: 'roomNumber', active: false, required: false },
            { label: 'passportNumber', active: false, required: false }
        ],
        styles: [
            { title: 'اتاق', id: 'room' },
            { title: 'ساحل', id: 'beach' },
            { title: 'زنگ', id: 'bell' },
            { title: 'آرامش', id: 'calm' },
            { title: 'لابی', id: 'lobby' },
            { title: 'چمدان', id: 'luggage' },
            { title: 'کوهستان', id: 'mountains' },
            { title: 'پذیرش', id: 'reception' },
            { title: 'تعطیلات', id: 'vacation' }
        ]
    },
    university: {
        id: 'university',
        controller: 'base',
        template: 'alpha',
        title: 'دانشگاه',
        formConfig: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false },
            { label: 'studentGrade', active: false, required: false },
            { label: 'studentId', active: false, required: false }
        ],
        formConfigEn: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false },
            { label: 'studentGrade', active: false, required: false },
            { label: 'studentId', active: false, required: false }
        ],
        styles: [
            { title: 'کتابخانه', id: 'library' },
            { title: 'نقاشی', id: 'drawing' },
            { title: 'طراحی', id: 'sketch' },
            { title: 'روباه', id: 'fox' },
            { title: 'یادداشت‌ها', id: 'notes' },
            { title: 'فارغ‌التحصیلی', id: 'graduation' },
            { title: 'مطالعه', id: 'study' }
        ]
    },
    market: {
        id: 'market',
        controller: 'base',
        template: 'alpha',
        title: 'فروشگاه',
        formConfig: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false }
        ],
        formConfigEn: [
            { label: 'mobile', active: true, required: true },
            { label: 'email', active: false, required: false },
            { label: 'username', active: false, required: true },
            { label: 'age', active: false, required: false },
            { label: 'password', active: false, required: true },
            { label: 'confirmPassword', active: false, required: true },
            { label: 'birthday', active: false, required: false },
            { label: 'firstName', active: false, required: false },
            { label: 'lastName', active: false, required: false },
            { label: 'fullName', active: false, required: false },
            { label: 'gender', active: false, required: false },
            { label: 'nationalCode', active: false, required: false }
        ],
        styles: [
            { title: 'کوچه', id: 'alley' },
            { title: 'انتخاب', id: 'choice' },
            { title: 'پاییزه', id: 'autumn' },
            { title: 'سبد میوه', id: 'fruitBasket' },
            { title: 'سایز', id: 'size' },
            { title: 'توت‌فرنگی‌ها', id: 'strawberries' },
            { title: 'سبزیجات', id: 'veggies' }
        ]
    }
};
//# sourceMappingURL=hotspotTemplates.js.map