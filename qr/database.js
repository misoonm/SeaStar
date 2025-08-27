// database.js
let db;
const DB_NAME = 'QRCodeDB';
const DB_VERSION = 1;
const STORE_NAME = 'qrcodes';

// تهيئة قاعدة البيانات
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('فشل في فتح قاعدة البيانات');
            reject('فشل في فتح قاعدة البيانات');
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('تم فتح قاعدة البيانات بنجاح');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // إنشاء مخزن البيانات إذا لم يكن موجوداً
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // إنشاء فهارس للبحث
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                
                console.log('تم إنشاء مخزن البيانات');
            }
        };
    });
}

// حفظ رمز QR في قاعدة البيانات
function saveQRCode(qrData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير مهيأة');
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.add(qrData);
        
        request.onsuccess = () => {
            console.log('تم حفظ الرمز بنجاح');
            resolve(request.result);
        };
        
        request.onerror = () => {
            console.error('فشل في حفظ الرمز');
            reject('فشل في حفظ الرمز');
        };
    });
}

// جلب جميع رموز QR
function getAllQRCodes() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير مهيأة');
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('createdAt');
        const request = index.openCursor(null, 'prev'); // الترتيب من الأحدث إلى الأقدم
        
        const qrCodes = [];
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                qrCodes.push(cursor.value);
                cursor.continue();
            } else {
                resolve(qrCodes);
            }
        };
        
        request.onerror = () => {
            console.error('فشل في جلب الرموز');
            reject('فشل في جلب الرموز');
        };
    });
}

// جلب رمز QR محدد بواسطة ID
function getQRCode(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير مهيأة');
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(Number(id));
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            console.error('فشل في جلب الرمز');
            reject('فشل في جلب الرمز');
        };
    });
}

// حذف رمز QR
function deleteQRCode(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير مهيأة');
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(Number(id));
        
        request.onsuccess = () => {
            console.log('تم حذف الرمز بنجاح');
            resolve();
        };
        
        request.onerror = () => {
            console.error('فشل في حذف الرمز');
            reject('فشل في حذف الرمز');
        };
    });
}

// تحديث رمز QR
function updateQRCode(id, updatedData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير مهيأة');
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // أولاً نحصل على البيانات الحالية
        const getRequest = store.get(Number(id));
        
        getRequest.onsuccess = () => {
            const existingData = getRequest.result;
            if (!existingData) {
                reject('الرمز غير موجود');
                return;
            }
            
            // ندمج البيانات الجديدة مع القديمة
            const newData = { ...existingData, ...updatedData };
            
            // نقوم بالتحديث
            const putRequest = store.put(newData);
            
            putRequest.onsuccess = () => {
                console.log('تم تحديث الرمز بنجاح');
                resolve();
            };
            
            putRequest.onerror = () => {
                console.error('فشل في تحديث الرمز');
                reject('فشل في تحديث الرمز');
            };
        };
        
        getRequest.onerror = () => {
            console.error('فشل في جلب الرمز للتحديث');
            reject('فشل في جلب الرمز للتحديث');
        };
    });
}

// البحث في رموز QR
function searchQRCodes(query) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير مهيأة');
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('name');
        const request = index.openCursor();
        
        const results = [];
        const lowerCaseQuery = query.toLowerCase();
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.name.toLowerCase().includes(lowerCaseQuery)) {
                    results.push(cursor.value);
                }
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        
        request.onerror = () => {
            console.error('فشل في البحث');
            reject('فشل في البحث');
        };
    });
}
