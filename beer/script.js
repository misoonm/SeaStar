// قاعدة البيانات المحلية باستخدام IndexedDB
   if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registered with scope:', registration.scope);
                    })
                    .catch(error => {
                        console.error('ServiceWorker registration failed:', error);
                    });
            });
        }

        // PWA Installation Prompt
        let deferredPrompt;
        const installButton = document.getElementById('install-button');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'flex';
        });
        
        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    deferredPrompt = null;
                });
            }
            installButton.style.display = 'none';
        });

        // Splash Screen Simulation
        const splashScreen = document.getElementById('splash-screen');
        const splashProgress = document.getElementById('splash-progress');
        
        // محاكاة تحميل التطبيق
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            splashProgress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    splashScreen.classList.add('hidden');
                }, 500);
            }
        }, 100);


let db;
const DB_NAME = 'sistarDB';
const DB_VERSION = 3; // تم تحديث الإصدار لإضافة وظائف جديدة

// تعريف جداول البيانات
const DB_STORES = {
    SUBSCRIBERS: 'subscribers',
    BUYERS: 'buyers',
    APPOINTMENTS: 'appointments',
    BALANCE: 'balance',
    DEBTS: 'debts',
    PURCHASES: 'purchases'
};

// تهيئة قاعدة البيانات
function initDB() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // إنشاء جداول البيانات إذا لم تكن موجودة
        if (!db.objectStoreNames.contains(DB_STORES.SUBSCRIBERS)) {
            const subscribersStore = db.createObjectStore(DB_STORES.SUBSCRIBERS, { keyPath: 'id', autoIncrement: true });
            subscribersStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(DB_STORES.BUYERS)) {
            const buyersStore = db.createObjectStore(DB_STORES.BUYERS, { keyPath: 'id', autoIncrement: true });
            buyersStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(DB_STORES.APPOINTMENTS)) {
            const appointmentsStore = db.createObjectStore(DB_STORES.APPOINTMENTS, { keyPath: 'id', autoIncrement: true });
            appointmentsStore.createIndex('clientId', 'clientId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(DB_STORES.BALANCE)) {
            const balanceStore = db.createObjectStore(DB_STORES.BALANCE, { keyPath: 'id', autoIncrement: true });
            balanceStore.createIndex('referenceId', 'referenceId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(DB_STORES.DEBTS)) {
            const debtsStore = db.createObjectStore(DB_STORES.DEBTS, { keyPath: 'id', autoIncrement: true });
            debtsStore.createIndex('referenceId', 'referenceId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(DB_STORES.PURCHASES)) {
            db.createObjectStore(DB_STORES.PURCHASES, { keyPath: 'id', autoIncrement: true });
        }
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('تم تهيئة قاعدة البيانات بنجاح');
        loadAllData();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء فتح قاعدة البيانات:', event.target.error);
    };
}

// وظائف CRUD للمشتركين
function addSubscriber(subscriber) {
    const transaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.SUBSCRIBERS);
    const request = store.add(subscriber);
    
    request.onsuccess = function(event) {
        const id = event.target.result;
        showSuccess('تم إضافة المشترك بنجاح');
        
        // إضافة المدفوعات إلى الرصيد
        if (subscriber.paidAmount > 0) {
            addBalanceRecord({
                name: subscriber.name,
                type: 'مشترك',
                amount: subscriber.paidAmount,
                date: new Date().toISOString(),
                referenceId: id
            });
        }
        
        // إضافة المتبقي إلى الديون
        if (subscriber.remainingAmount > 0) {
            addDebtRecord({
                name: subscriber.name,
                type: 'مشترك',
                remainingAmount: subscriber.remainingAmount,
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                referenceId: id
            });
        }
        
        loadSubscribers();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء إضافة المشترك:', event.target.error);
    };
}

function updateSubscriber(subscriber) {
    const transaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.SUBSCRIBERS);
    const request = store.put(subscriber);
    
    request.onsuccess = function() {
        showSuccess('تم تحديث بيانات المشترك بنجاح');
        
        // تحديث المدفوعات في الرصيد
        updateBalanceRecords(subscriber.id, subscriber.paidAmount, subscriber.name);
        
        // تحديث المتبقي في الديون
        updateDebtRecords(subscriber.id, subscriber.remainingAmount, subscriber.name);
        
        loadSubscribers();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء تحديث المشترك:', event.target.error);
    };
}

function deleteSubscriber(id) {
    const transaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.SUBSCRIBERS);
    const request = store.delete(id);
    
    request.onsuccess = function() {
        showSuccess('تم حذف المشترك بنجاح');
        
        // حذف السجلات المرتبطة من الرصيد والديون
        deleteRecordsByReference(DB_STORES.BALANCE, id);
        deleteRecordsByReference(DB_STORES.DEBTS, id);
        
        loadSubscribers();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء حذف المشترك:', event.target.error);
    };
}

function getSubscriber(id, callback) {
    const transaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readonly');
    const store = transaction.objectStore(DB_STORES.SUBSCRIBERS);
    const request = store.get(id);
    
    request.onsuccess = function(event) {
        callback(event.target.result);
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء جلب بيانات المشترك:', event.target.error);
    };
}

// وظائف CRUD للمشترين
function addBuyer(buyer) {
    const transaction = db.transaction([DB_STORES.BUYERS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.BUYERS);
    const request = store.add(buyer);
    
    request.onsuccess = function(event) {
        const id = event.target.result;
        showSuccess('تم إضافة المشتري بنجاح');
        
        // إضافة المدفوعات إلى الرصيد
        if (buyer.buyerPaid > 0) {
            addBalanceRecord({
                name: buyer.name,
                type: 'مشتري',
                amount: buyer.buyerPaid,
                date: new Date().toISOString(),
                referenceId: id
            });
        }
        
        // إضافة المتبقي إلى الديون
        if (buyer.buyerRemaining > 0) {
            addDebtRecord({
                name: buyer.name,
                type: 'مشتري',
                remainingAmount: buyer.buyerRemaining,
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                referenceId: id
            });
        }
        
        loadBuyers();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء إضافة المشتري:', event.target.error);
    };
}

function updateBuyer(buyer) {
    const transaction = db.transaction([DB_STORES.BUYERS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.BUYERS);
    const request = store.put(buyer);
    
    request.onsuccess = function() {
        showSuccess('تم تحديث بيانات المشتري بنجاح');
        
        // تحديث المدفوعات في الرصيد
        updateBalanceRecords(buyer.id, buyer.buyerPaid, buyer.name);
        
        // تحديث المتبقي في الديون
        updateDebtRecords(buyer.id, buyer.buyerRemaining, buyer.name);
        
        loadBuyers();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء تحديث المشتري:', event.target.error);
    };
}

function deleteBuyer(id) {
    const transaction = db.transaction([DB_STORES.BUYERS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.BUYERS);
    const request = store.delete(id);
    
    request.onsuccess = function() {
        showSuccess('تم حذف المشتري بنجاح');
        
        // حذف السجلات المرتبطة من الرصيد والديون
        deleteRecordsByReference(DB_STORES.BALANCE, id);
        deleteRecordsByReference(DB_STORES.DEBTS, id);
        
        loadBuyers();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء حذف المشتري:', event.target.error);
    };
}

function getBuyer(id, callback) {
    const transaction = db.transaction([DB_STORES.BUYERS], 'readonly');
    const store = transaction.objectStore(DB_STORES.BUYERS);
    const request = store.get(id);
    
    request.onsuccess = function(event) {
        callback(event.target.result);
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء جلب بيانات المشتري:', event.target.error);
    };
}

// وظائف CRUD للمواعيد
function addAppointment(appointment) {
    const transaction = db.transaction([DB_STORES.APPOINTMENTS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.add(appointment);
    
    request.onsuccess = function() {
        showSuccess('تم إضافة الموعد بنجاح');
        loadAppointments();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء إضافة الموعد:', event.target.error);
    };
}

function updateAppointment(appointment) {
    const transaction = db.transaction([DB_STORES.APPOINTMENTS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.put(appointment);
    
    request.onsuccess = function() {
        showSuccess('تم تحديث بيانات الموعد بنجاح');
        loadAppointments();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء تحديث الموعد:', event.target.error);
    };
}

function deleteAppointment(id) {
    const transaction = db.transaction([DB_STORES.APPOINTMENTS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.delete(id);
    
    request.onsuccess = function() {
        showSuccess('تم حذف الموعد بنجاح');
        loadAppointments();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء حذف الموعد:', event.target.error);
    };
}

function getAppointment(id, callback) {
    const transaction = db.transaction([DB_STORES.APPOINTMENTS], 'readonly');
    const store = transaction.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.get(id);
    
    request.onsuccess = function(event) {
        callback(event.target.result);
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء جلب بيانات الموعد:', event.target.error);
    };
}

// وظائف CRUD للمشتروات
function addPurchase(purchase) {
    const transaction = db.transaction([DB_STORES.PURCHASES], 'readwrite');
    const store = transaction.objectStore(DB_STORES.PURCHASES);
    const request = store.add(purchase);
    
    request.onsuccess = function(event) {
        const id = event.target.result;
        showSuccess('تم إضافة المشتروات بنجاح');
        
        // خصم قيمة المشتروات من الرصيد الكلي
        addBalanceRecord({
            name: `شراء: ${purchase.itemName}`,
            type: purchase.itemType,
            amount: -purchase.purchaseAmount, // قيم سالبة لتمثيل الخصم
            date: purchase.purchaseDate || new Date().toISOString()
        });
        
        loadPurchases();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء إضافة المشتروات:', event.target.error);
    };
}

function updatePurchase(purchase) {
    const transaction = db.transaction([DB_STORES.PURCHASES], 'readwrite');
    const store = transaction.objectStore(DB_STORES.PURCHASES);
    const request = store.put(purchase);
    
    request.onsuccess = function() {
        showSuccess('تم تحديث بيانات المشتروات بنجاح');
        loadPurchases();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء تحديث المشتروات:', event.target.error);
    };
}

function deletePurchase(id) {
    const transaction = db.transaction([DB_STORES.PURCHASES], 'readwrite');
    const store = transaction.objectStore(DB_STORES.PURCHASES);
    const request = store.delete(id);
    
    request.onsuccess = function() {
        showSuccess('تم حذف المشتروات بنجاح');
        loadPurchases();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء حذف المشتروات:', event.target.error);
    };
}

function getPurchase(id, callback) {
    const transaction = db.transaction([DB_STORES.PURCHASES], 'readonly');
    const store = transaction.objectStore(DB_STORES.PURCHASES);
    const request = store.get(id);
    
    request.onsuccess = function(event) {
        callback(event.target.result);
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء جلب بيانات المشتروات:', event.target.error);
    };
}

// وظائف لإدارة الديون والرصيد
function addBalanceRecord(record) {
    const transaction = db.transaction([DB_STORES.BALANCE], 'readwrite');
    const store = transaction.objectStore(DB_STORES.BALANCE);
    const request = store.add(record);
    
    request.onsuccess = function() {
        loadBalance();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء إضافة سجل الرصيد:', event.target.error);
    };
}

function addDebtRecord(record) {
    const transaction = db.transaction([DB_STORES.DEBTS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.DEBTS);
    const request = store.add(record);
    
    request.onsuccess = function() {
        loadDebts();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء إضافة سجل الديون:', event.target.error);
    };
}

function getDebtRecord(id, callback) {
    const transaction = db.transaction([DB_STORES.DEBTS], 'readonly');
    const store = transaction.objectStore(DB_STORES.DEBTS);
    const request = store.get(id);
    
    request.onsuccess = function(event) {
        callback(event.target.result);
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء جلب سجل الديون:', event.target.error);
    };
}

function updateDebtRecord(id, newAmount) {
    const transaction = db.transaction([DB_STORES.DEBTS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.DEBTS);
    const request = store.get(id);
    
    request.onsuccess = function(event) {
        const debt = event.target.result;
        if (debt) {
            debt.remainingAmount = newAmount;
            store.put(debt);
            
            // تحديث واجهة المستخدم
            setTimeout(() => {
                loadDebts();
                loadDashboardStats();
            }, 100);
        }
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء تحديث سجل الديون:', event.target.error);
    };
}

function deleteDebtRecord(id) {
    const transaction = db.transaction([DB_STORES.DEBTS], 'readwrite');
    const store = transaction.objectStore(DB_STORES.DEBTS);
    const request = store.delete(id);
    
    request.onsuccess = function() {
        loadDebts();
        loadDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('حدث خطأ أثناء حذف سجل الديون:', event.target.error);
    };
}

function deleteRecordsByReference(storeName, referenceId) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('referenceId');
    
    const request = index.openCursor(IDBKeyRange.only(referenceId));
    
    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            cursor.delete();
            cursor.continue();
        }
    };
}

function updateBalanceRecords(referenceId, amount, name) {
    // حذف السجلات القديمة
    deleteRecordsByReference(DB_STORES.BALANCE, referenceId);
    
    // إضافة سجل جديد إذا كان هناك مبلغ
    if (amount > 0) {
        addBalanceRecord({
            name: name,
            type: referenceId.startsWith('sub') ? 'مشترك' : 'مشتري',
            amount: amount,
            date: new Date().toISOString(),
            referenceId: referenceId
        });
    }
}

function updateDebtRecords(referenceId, amount, name) {
    // حذف السجلات القديمة
    deleteRecordsByReference(DB_STORES.DEBTS, referenceId);
    
    // إضافة سجل جديد إذا كان هناك مبلغ
    if (amount > 0) {
        addDebtRecord({
            name: name,
            type: referenceId.startsWith('sub') ? 'مشترك' : 'مشتري',
            remainingAmount: amount,
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            referenceId: referenceId
        });
    }
}

// وظائف لتحميل البيانات وعرضها
function loadAllData() {
    loadSubscribers();
    loadBuyers();
    loadAppointments();
    loadBalance();
    loadDebts();
    loadPurchases();
    loadDashboardStats();
}

function loadSubscribers() {
    const transaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readonly');
    const store = transaction.objectStore(DB_STORES.SUBSCRIBERS);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const subscribers = event.target.result;
        const tbody = document.getElementById('subscribersTableBody');
        tbody.innerHTML = '';
        
        if (subscribers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">
                        <i class="fas fa-user-slash"></i>
                        لا يوجد مشتركون مسجلون
                    </td>
                </tr>
            `;
            return;
        }
        
        subscribers.forEach(subscriber => {
            const remainingHours = (subscriber.hoursPerWeek * 12) - subscriber.takenHours;
            const remainingAmount = subscriber.remainingAmount;
            const status = remainingAmount > 0 ? 'مدين' : 'مسدد';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subscriber.name}</td>
                <td>${subscriber.hoursPerWeek}</td>
                <td>${subscriber.takenHours}</td>
                <td>${remainingHours}</td>
                <td>${subscriber.paidAmount} ر.ي</td>
                <td>${remainingAmount} ر.ي</td>
                <td><span class="badge ${status === 'مسدد' ? 'badge-success' : 'badge-danger'}">${status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-primary edit-subscriber" data-id="${subscriber.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger delete-subscriber" data-id="${subscriber.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-subscriber').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openEditSubscriberModal(id);
            });
        });
        
        document.querySelectorAll('.delete-subscriber').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('هل أنت متأكد من حذف هذا المشترك؟')) {
                    deleteSubscriber(id);
                }
            });
        });
    };
}

function loadBuyers() {
    const transaction = db.transaction([DB_STORES.BUYERS], 'readonly');
    const store = transaction.objectStore(DB_STORES.BUYERS);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const buyers = event.target.result;
        const tbody = document.getElementById('buyersTableBody');
        tbody.innerHTML = '';
        
        if (buyers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-table">
                        <i class="fas fa-user-times"></i>
                        لا يوجد مشترون مسجلون
                    </td>
                </tr>
            `;
            return;
        }
        
        buyers.forEach(buyer => {
            const remainingAmount = buyer.buyerRemaining;
            const status = remainingAmount > 0 ? 'مدين' : 'مسدد';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${buyer.name}</td>
                <td>${buyer.hoursCount}</td>
                <td>${formatDateTime(buyer.deliveryDate)}</td>
                <td>${buyer.buyerPaid} ر.ي</td>
                <td>${remainingAmount} ر.ي</td>
                <td><span class="badge ${status === 'مسدد' ? 'badge-success' : 'badge-danger'}">${status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-primary edit-buyer" data-id="${buyer.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger delete-buyer" data-id="${buyer.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-buyer').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openEditBuyerModal(id);
            });
        });
        
        document.querySelectorAll('.delete-buyer').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('هل أنت متأكد من حذف هذا المشتري؟')) {
                    deleteBuyer(id);
                }
            });
        });
    };
}

function loadAppointments() {
    const transaction = db.transaction([DB_STORES.APPOINTMENTS], 'readonly');
    const store = transaction.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const appointments = event.target.result;
        const tbody = document.getElementById('appointmentsTableBody');
        tbody.innerHTML = '';
        
        if (appointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        <i class="fas fa-calendar-times"></i>
                        لا توجد مواعيد مسجلة
                    </td>
                </tr>
            `;
            return;
        }
        
        appointments.forEach(appointment => {
            const today = new Date();
            const appDate = new Date(appointment.appointmentDate);
            const status = appDate < today ? 'منتهي' : 'قادم';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appointment.clientType === 'subscriber' ? 'مشترك' : 'مشتري'}</td>
                <td>${appointment.clientName}</td>
                <td>${formatDate(appointment.appointmentDate)}</td>
                <td>${appointment.startTime} - ${appointment.endTime}</td>
                <td><span class="badge ${status === 'قادم' ? 'badge-info' : 'badge-danger'}">${status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-primary edit-appointment" data-id="${appointment.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger delete-appointment" data-id="${appointment.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-appointment').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openEditAppointmentModal(id);
            });
        });
        
        document.querySelectorAll('.delete-appointment').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
                    deleteAppointment(id);
                }
            });
        });
    };
}

function loadBalance() {
    const transaction = db.transaction([DB_STORES.BALANCE], 'readonly');
    const store = transaction.objectStore(DB_STORES.BALANCE);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const balanceRecords = event.target.result;
        const tbody = document.getElementById('balanceTableBody');
        tbody.innerHTML = '';
        
        if (balanceRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-table">
                        <i class="fas fa-wallet"></i>
                        لا توجد سجلات رصيد
                    </td>
                </tr>
            `;
            return;
        }
        
        balanceRecords.forEach(record => {
            const isNegative = record.amount < 0;
            const amountClass = isNegative ? 'text-danger' : 'text-success';
            const sign = isNegative ? '-' : '+';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.name}</td>
                <td>${record.type}</td>
                <td class="${amountClass}">${sign} ${Math.abs(record.amount)} ر.س</td>
                <td>${formatDate(record.date)}</td>
                <td>
                    <span class="reference-link" data-reference="${record.referenceId}">
                        ${record.type === 'مشترك' ? 'مشترك' : 'مشتري'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث للروابط المرجعية
        document.querySelectorAll('.reference-link').forEach(link => {
            link.addEventListener('click', function() {
                const referenceId = this.getAttribute('data-reference');
                if (referenceId.startsWith('sub')) {
                    // التنقل إلى قسم المشتركين
                    document.querySelectorAll('.nav-links a').forEach(item => {
                        item.classList.remove('active');
                    });
                    document.querySelector('[data-section="subscribers"]').classList.add('active');
                    
                    document.querySelectorAll('.section').forEach(section => {
                        section.style.display = 'none';
                    });
                    document.getElementById('subscribers').style.display = 'block';
                } else {
                    // التنقل إلى قسم المشترين
                    document.querySelectorAll('.nav-links a').forEach(item => {
                        item.classList.remove('active');
                    });
                    document.querySelector('[data-section="buyers"]').classList.add('active');
                    
                    document.querySelectorAll('.section').forEach(section => {
                        section.style.display = 'none';
                    });
                    document.getElementById('buyers').style.display = 'block';
                }
            });
        });
    };
}

function loadDebts() {
    const transaction = db.transaction([DB_STORES.DEBTS], 'readonly');
    const store = transaction.objectStore(DB_STORES.DEBTS);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const debts = event.target.result;
        const tbody = document.getElementById('debtsTableBody');
        tbody.innerHTML = '';
        
        if (debts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        <i class="fas fa-file-invoice"></i>
                        لا توجد ديون مسجلة
                    </td>
                </tr>
            `;
            return;
        }
        
        debts.forEach(debt => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${debt.name}</td>
                <td>${debt.type}</td>
                <td>${debt.remainingAmount} ر.س</td>
                <td>${formatDate(debt.dueDate)}</td>
                <td>
                    <span class="reference-link" data-reference="${debt.referenceId}">
                        ${debt.type === 'مشترك' ? 'مشترك' : 'مشتري'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-success pay-debt" data-id="${debt.id}" data-type="${debt.type}" data-name="${debt.name}" data-amount="${debt.remainingAmount}">
                        <i class="fas fa-check"></i> تسديد
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث لأزرار التسديد
        document.querySelectorAll('.pay-debt').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const type = this.getAttribute('data-type');
                const name = this.getAttribute('data-name');
                const amount = parseFloat(this.getAttribute('data-amount'));
                
                openPaymentModal(id, type, name, amount);
            });
        });
        
        // إضافة مستمعي الأحداث للروابط المرجعية
        document.querySelectorAll('.reference-link').forEach(link => {
            link.addEventListener('click', function() {
                const referenceId = this.getAttribute('data-reference');
                if (referenceId.startsWith('sub')) {
                    // التنقل إلى قسم المشتركين
                    document.querySelectorAll('.nav-links a').forEach(item => {
                        item.classList.remove('active');
                    });
                    document.querySelector('[data-section="subscribers"]').classList.add('active');
                    
                    document.querySelectorAll('.section').forEach(section => {
                        section.style.display = 'none';
                    });
                    document.getElementById('subscribers').style.display = 'block';
                } else {
                    // التنقل إلى قسم المشترين
                    document.querySelectorAll('.nav-links a').forEach(item => {
                        item.classList.remove('active');
                    });
                    document.querySelector('[data-section="buyers"]').classList.add('active');
                    
                    document.querySelectorAll('.section').forEach(section => {
                        section.style.display = 'none';
                    });
                    document.getElementById('buyers').style.display = 'block';
                }
            });
        });
    };
}

function loadPurchases() {
    const transaction = db.transaction([DB_STORES.PURCHASES], 'readonly');
    const store = transaction.objectStore(DB_STORES.PURCHASES);
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const purchases = event.target.result;
        const tbody = document.getElementById('purchasesTableBody');
        tbody.innerHTML = '';
        
        if (purchases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-table">
                        <i class="fas fa-shopping-cart"></i>
                        لا توجد مشتروات مسجلة
                    </td>
                </tr>
            `;
            return;
        }
        
        purchases.forEach(purchase => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${purchase.itemName}</td>
                <td>${purchase.itemType}</td>
                <td>${formatDate(purchase.purchaseDate)}</td>
                <td>${purchase.purchaseAmount} ر.س</td>
                <td class="action-buttons">
                    <button class="btn btn-primary edit-purchase" data-id="${purchase.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger delete-purchase" data-id="${purchase.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-purchase').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openEditPurchaseModal(id);
            });
        });
        
        document.querySelectorAll('.delete-purchase').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('هل أنت متأكد من حذف هذه المشتروات؟')) {
                    deletePurchase(id);
                }
            });
        });
    };
}

function loadDashboardStats() {
    // إحصائيات المشتركين
    const subscribersTransaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readonly');
    const subscribersStore = subscribersTransaction.objectStore(DB_STORES.SUBSCRIBERS);
    const subscribersRequest = subscribersStore.count();
    
    subscribersRequest.onsuccess = function() {
        const subscribersCount = subscribersRequest.result;
        document.getElementById('subscribersCount').textContent = subscribersCount;
        document.getElementById('subscribersProgress').style.width = `${Math.min(subscribersCount * 5, 100)}%`;
    };
    
    // إحصائيات المشترين
    const buyersTransaction = db.transaction([DB_STORES.BUYERS], 'readonly');
    const buyersStore = buyersTransaction.objectStore(DB_STORES.BUYERS);
    const buyersRequest = buyersStore.count();
    
    buyersRequest.onsuccess = function() {
        const buyersCount = buyersRequest.result;
        document.getElementById('buyersCount').textContent = buyersCount;
        document.getElementById('buyersProgress').style.width = `${Math.min(buyersCount * 10, 100)}%`;
    };
    
    // إحصائيات المواعيد
    const appointmentsTransaction = db.transaction([DB_STORES.APPOINTMENTS], 'readonly');
    const appointmentsStore = appointmentsTransaction.objectStore(DB_STORES.APPOINTMENTS);
    const appointmentsRequest = appointmentsStore.count();
    
    appointmentsRequest.onsuccess = function() {
        const appointmentsCount = appointmentsRequest.result;
        document.getElementById('appointmentsCount').textContent = appointmentsCount;
        document.getElementById('appointmentsProgress').style.width = `${Math.min(appointmentsCount * 10, 100)}%`;
    };
    
    // إحصائيات الرصيد
    const balanceTransaction = db.transaction([DB_STORES.BALANCE], 'readonly');
    const balanceStore = balanceTransaction.objectStore(DB_STORES.BALANCE);
    const balanceRequest = balanceStore.getAll();
    
    balanceRequest.onsuccess = function() {
        const balanceRecords = balanceRequest.result;
        let totalBalance = 0;
        
        balanceRecords.forEach(record => {
            totalBalance += record.amount;
        });
        
        document.getElementById('totalBalance').textContent = `${totalBalance.toLocaleString()} ر.س`;
        document.getElementById('balanceTotal').textContent = `${totalBalance.toLocaleString()} ر.س`;
        document.getElementById('balanceProgress').style.width = `${Math.min(totalBalance / 500, 100)}%`;
    };
    
    // إحصائيات الديون
    const debtsTransaction = db.transaction([DB_STORES.DEBTS], 'readonly');
    const debtsStore = debtsTransaction.objectStore(DB_STORES.DEBTS);
    const debtsRequest = debtsStore.getAll();
    
    debtsRequest.onsuccess = function() {
        const debts = debtsRequest.result;
        let totalDebts = 0;
        
        debts.forEach(debt => {
            totalDebts += debt.remainingAmount;
        });
        
        document.getElementById('totalDebts').textContent = `${totalDebts.toLocaleString()} ر.س`;
        document.getElementById('debtsTotal').textContent = `${totalDebts.toLocaleString()} ر.س`;
        document.getElementById('debtsProgress').style.width = `${Math.min(totalDebts / 200, 100)}%`;
    };
}

// وظائف البحث
function performSearch(query) {
    if (!query || query.length < 2) {
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchResults').classList.remove('active');
        return;
    }
    
    const results = [];
    
    // البحث في المشتركين
    const subscribersTransaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readonly');
    const subscribersStore = subscribersTransaction.objectStore(DB_STORES.SUBSCRIBERS);
    const subscribersRequest = subscribersStore.openCursor();
    
    subscribersRequest.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.name.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    id: cursor.value.id,
                    name: cursor.value.name,
                    type: 'مشترك',
                    icon: 'fas fa-users'
                });
            }
            cursor.continue();
        } else {
            // البحث في المشترين
            const buyersTransaction = db.transaction([DB_STORES.BUYERS], 'readonly');
            const buyersStore = buyersTransaction.objectStore(DB_STORES.BUYERS);
            const buyersRequest = buyersStore.openCursor();
            
            buyersRequest.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.name.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            id: cursor.value.id,
                            name: cursor.value.name,
                            type: 'مشتري',
                            icon: 'fas fa-user-tag'
                        });
                    }
                    cursor.continue();
                } else {
                    // عرض النتائج
                    displaySearchResults(results);
                }
            };
        }
    };
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-result-item">
                <i class="fas fa-search"></i>
                <span>لا توجد نتائج</span>
            </div>
        `;
        resultsContainer.classList.add('active');
        return;
    }
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <i class="${result.icon}"></i>
            <span>${result.name}</span>
            <span class="type">${result.type}</span>
        `;
        
        item.addEventListener('click', function() {
            // التنقل إلى القسم المناسب
            if (result.type === 'مشترك') {
                document.querySelectorAll('.nav-links a').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelector('[data-section="subscribers"]').classList.add('active');
                
                document.querySelectorAll('.section').forEach(section => {
                    section.style.display = 'none';
                });
                document.getElementById('subscribers').style.display = 'block';
            } else {
                document.querySelectorAll('.nav-links a').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelector('[data-section="buyers"]').classList.add('active');
                
                document.querySelectorAll('.section').forEach(section => {
                    section.style.display = 'none';
                });
                document.getElementById('buyers').style.display = 'block';
            }
            
            // إخفاء نتائج البحث
            resultsContainer.classList.remove('active');
            document.getElementById('globalSearch').value = '';
        });
        
        resultsContainer.appendChild(item);
    });
    
    resultsContainer.classList.add('active');
}

// وظائف عرض النماذج
function openSubscriberModal() {
    document.getElementById('subscriberModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> إضافة مشترك جديد';
    document.getElementById('subscriberId').value = '';
    document.getElementById('subscriberName').value = '';
    document.getElementById('hoursPerWeek').value = '10';
    document.getElementById('takenHours').value = '0';
    document.getElementById('paidAmount').value = '0';
    document.getElementById('remainingAmount').value = '0';
    document.getElementById('subscriberModal').style.display = 'flex';
}

function openEditSubscriberModal(id) {
    getSubscriber(id, function(subscriber) {
        if (subscriber) {
            document.getElementById('subscriberModalTitle').innerHTML = '<i class="fas fa-user-edit"></i> تعديل بيانات المشترك';
            document.getElementById('subscriberId').value = subscriber.id;
            document.getElementById('subscriberName').value = subscriber.name;
            document.getElementById('hoursPerWeek').value = subscriber.hoursPerWeek;
            document.getElementById('takenHours').value = subscriber.takenHours;
            document.getElementById('paidAmount').value = subscriber.paidAmount;
            document.getElementById('remainingAmount').value = subscriber.remainingAmount;
            document.getElementById('subscriberModal').style.display = 'flex';
        }
    });
}

function openBuyerModal() {
    document.getElementById('buyerModalTitle').innerHTML = '<i class="fas fa-user-tag"></i> إضافة مشتري جديد';
    document.getElementById('buyerId').value = '';
    document.getElementById('buyerName').value = '';
    document.getElementById('hoursCount').value = '5';
    document.getElementById('deliveryDate').value = getTomorrowDateTime();
    document.getElementById('buyerPaid').value = '0';
    document.getElementById('buyerRemaining').value = '0';
    document.getElementById('buyerModal').style.display = 'flex';
}

function openEditBuyerModal(id) {
    getBuyer(id, function(buyer) {
        if (buyer) {
            document.getElementById('buyerModalTitle').innerHTML = '<i class="fas fa-user-edit"></i> تعديل بيانات المشتري';
            document.getElementById('buyerId').value = buyer.id;
            document.getElementById('buyerName').value = buyer.name;
            document.getElementById('hoursCount').value = buyer.hoursCount;
            document.getElementById('deliveryDate').value = formatDateTimeForInput(buyer.deliveryDate);
            document.getElementById('buyerPaid').value = buyer.buyerPaid;
            document.getElementById('buyerRemaining').value = buyer.buyerRemaining;
            document.getElementById('buyerModal').style.display = 'flex';
        }
    });
}

function openAppointmentModal() {
    document.getElementById('appointmentModalTitle').innerHTML = '<i class="fas fa-calendar-plus"></i> إضافة موعد جديد';
    document.getElementById('appointmentId').value = '';
    document.getElementById('clientType').value = 'subscriber';
    document.getElementById('clientName').innerHTML = '<option value="">-- اختر اسم العميل --</option>';
    document.getElementById('appointmentDate').valueAsDate = new Date();
    document.getElementById('startTime').value = '08:00';
    document.getElementById('endTime').value = '09:00';
    document.getElementById('appointmentModal').style.display = 'flex';
    
    // تحميل أسماء العملاء بناءً على النوع
    loadClientNames('subscriber');
}

function openEditAppointmentModal(id) {
    getAppointment(id, function(appointment) {
        if (appointment) {
            document.getElementById('appointmentModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل بيانات الموعد';
            document.getElementById('appointmentId').value = appointment.id;
            document.getElementById('clientType').value = appointment.clientType;
            document.getElementById('appointmentDate').value = formatDateForInput(appointment.appointmentDate);
            document.getElementById('startTime').value = appointment.startTime;
            document.getElementById('endTime').value = appointment.endTime;
            document.getElementById('appointmentModal').style.display = 'flex';
            
            // تحميل أسماء العملاء بناءً على النوع
            loadClientNames(appointment.clientType, appointment.clientId);
        }
    });
}

function loadClientNames(clientType, selectedId = null) {
    const clientNameSelect = document.getElementById('clientName');
    clientNameSelect.innerHTML = '<option value="">-- اختر اسم العميل --</option>';
    
    if (clientType === 'subscriber') {
        const transaction = db.transaction([DB_STORES.SUBSCRIBERS], 'readonly');
        const store = transaction.objectStore(DB_STORES.SUBSCRIBERS);
        const request = store.getAll();
        
        request.onsuccess = function(event) {
            const subscribers = event.target.result;
            subscribers.forEach(subscriber => {
                const option = document.createElement('option');
                option.value = subscriber.id;
                option.textContent = subscriber.name;
                if (selectedId === subscriber.id) {
                    option.selected = true;
                }
                clientNameSelect.appendChild(option);
            });
        };
    } else {
        const transaction = db.transaction([DB_STORES.BUYERS], 'readonly');
        const store = transaction.objectStore(DB_STORES.BUYERS);
        const request = store.getAll();
        
        request.onsuccess = function(event) {
            const buyers = event.target.result;
            buyers.forEach(buyer => {
                const option = document.createElement('option');
                option.value = buyer.id;
                option.textContent = buyer.name;
                if (selectedId === buyer.id) {
                    option.selected = true;
                }
                clientNameSelect.appendChild(option);
            });
        };
    }
}

function openPurchaseModal() {
    document.getElementById('purchaseModalTitle').innerHTML = '<i class="fas fa-cart-plus"></i> إضافة مشتروات جديدة';
    document.getElementById('purchaseId').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemType').value = 'مواد';
    document.getElementById('purchaseDate').valueAsDate = new Date();
    document.getElementById('purchaseAmount').value = '0';
    document.getElementById('purchaseModal').style.display = 'flex';
}

function openEditPurchaseModal(id) {
    getPurchase(id, function(purchase) {
        if (purchase) {
            document.getElementById('purchaseModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل بيانات المشتروات';
            document.getElementById('purchaseId').value = purchase.id;
            document.getElementById('itemName').value = purchase.itemName;
            document.getElementById('itemType').value = purchase.itemType;
            document.getElementById('purchaseDate').value = formatDateForInput(purchase.purchaseDate);
            document.getElementById('purchaseAmount').value = purchase.purchaseAmount;
            document.getElementById('purchaseModal').style.display = 'flex';
        }
    });
}

function openPaymentModal(id, type, name, amount) {
    document.getElementById('debtId').value = id;
    document.getElementById('debtType').value = type;
    document.getElementById('debtName').value = name;
    document.getElementById('debtAmount').value = `${amount.toLocaleString()} ر.س`;
    document.getElementById('paymentAmount').value = amount;
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('paymentModal').style.display = 'flex';
}

// وظائف مساعدة
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeForInput(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTomorrowDateTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function showSuccess(message) {
    const successAlert = document.getElementById('success-alert');
    successAlert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successAlert.style.display = 'block';
    
    setTimeout(() => {
        successAlert.style.display = 'none';
    }, 3000);
}

// المخططات البيانية
function initCharts() {
    // مخطط المشتركين
    const subscribersCtx = document.getElementById('subscribersChart').getContext('2d');
    const subscribersChart = new Chart(subscribersCtx, {
        type: 'bar',
        data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'],
            datasets: [{
                label: 'عدد المشتركين',
                data: [35, 38, 40, 42, 41, 42, 45],
                backgroundColor: 'rgba(44, 120, 115, 0.7)',
                borderColor: 'rgba(44, 120, 115, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // مخطط الديون
    const debtsCtx = document.getElementById('debtsChart').getContext('2d');
    const debtsChart = new Chart(debtsCtx, {
        type: 'doughnut',
        data: {
            labels: ['المشتركين', 'المشترين'],
            datasets: [{
                data: [5200, 3000],
                backgroundColor: [
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(255, 179, 0, 0.7)'
                ],
                borderColor: [
                    'rgba(220, 53, 69, 1)',
                    'rgba(255, 179, 0, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
    
    return { subscribersChart, debtsChart };
}

// تهيئة الأحداث
function initEvents() {
    // إدارة التنقل بين الأقسام
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة النشاط من جميع الروابط
            document.querySelectorAll('.nav-links a').forEach(item => {
                item.classList.remove('active');
            });
            
            // إضافة النشاط للرابط الحالي
            this.classList.add('active');
            
            // إخفاء جميع الأقسام
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
            });
            
            // إظهار القسم المطلوب
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).style.display = 'block';
        });
    });
    
    // إدارة النماذج المنبثقة
    const subscriberModal = document.getElementById('subscriberModal');
    const buyerModal = document.getElementById('buyerModal');
    const appointmentModal = document.getElementById('appointmentModal');
    const purchaseModal = document.getElementById('purchaseModal');
    const paymentModal = document.getElementById('paymentModal');
    
    const addSubscriberBtn = document.getElementById('addSubscriberBtn');
    const addBuyerBtn = document.getElementById('addBuyerBtn');
    const addAppointmentBtn = document.getElementById('addAppointmentBtn');
    const addPurchaseBtn = document.getElementById('addPurchaseBtn');
    
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    addSubscriberBtn.addEventListener('click', openSubscriberModal);
    addBuyerBtn.addEventListener('click', openBuyerModal);
    addAppointmentBtn.addEventListener('click', openAppointmentModal);
    addPurchaseBtn.addEventListener('click', openPurchaseModal);
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            subscriberModal.style.display = 'none';
            buyerModal.style.display = 'none';
            appointmentModal.style.display = 'none';
            purchaseModal.style.display = 'none';
            paymentModal.style.display = 'none';
        });
    });
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === subscriberModal) subscriberModal.style.display = 'none';
        if (e.target === buyerModal) buyerModal.style.display = 'none';
        if (e.target === appointmentModal) appointmentModal.style.display = 'none';
        if (e.target === purchaseModal) purchaseModal.style.display = 'none';
        if (e.target === paymentModal) paymentModal.style.display = 'none';
    });
    
    // حفظ المشترك
    document.getElementById('saveSubscriber').addEventListener('click', () => {
        const id = document.getElementById('subscriberId').value;
        const subscriber = {
            name: document.getElementById('subscriberName').value,
            hoursPerWeek: parseInt(document.getElementById('hoursPerWeek').value),
            takenHours: parseInt(document.getElementById('takenHours').value),
            paidAmount: parseFloat(document.getElementById('paidAmount').value),
            remainingAmount: parseFloat(document.getElementById('remainingAmount').value)
        };
        
        if (!subscriber.name) {
            alert('يرجى إدخال اسم المشترك');
            return;
        }
        
        if (id) {
            subscriber.id = parseInt(id);
            updateSubscriber(subscriber);
        } else {
            addSubscriber(subscriber);
        }
        
        subscriberModal.style.display = 'none';
    });
    
    // حفظ المشتري
    document.getElementById('saveBuyer').addEventListener('click', () => {
        const id = document.getElementById('buyerId').value;
        const buyer = {
            name: document.getElementById('buyerName').value,
            hoursCount: parseInt(document.getElementById('hoursCount').value),
            deliveryDate: document.getElementById('deliveryDate').value,
            buyerPaid: parseFloat(document.getElementById('buyerPaid').value),
            buyerRemaining: parseFloat(document.getElementById('buyerRemaining').value)
        };
        
        if (!buyer.name) {
            alert('يرجى إدخال اسم المشتري');
            return;
        }
        
        if (id) {
            buyer.id = parseInt(id);
            updateBuyer(buyer);
        } else {
            addBuyer(buyer);
        }
        
        buyerModal.style.display = 'none';
    });
    
    // حفظ الموعد
    document.getElementById('saveAppointment').addEventListener('click', () => {
        const id = document.getElementById('appointmentId').value;
        const appointment = {
            clientType: document.getElementById('clientType').value,
            clientId: parseInt(document.getElementById('clientName').value),
            clientName: document.getElementById('clientName').options[document.getElementById('clientName').selectedIndex].text,
            appointmentDate: document.getElementById('appointmentDate').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value
        };
        
        if (!appointment.clientId) {
            alert('يرجى اختيار اسم العميل');
            return;
        }
        
        if (id) {
            appointment.id = parseInt(id);
            updateAppointment(appointment);
        } else {
            addAppointment(appointment);
        }
        
        appointmentModal.style.display = 'none';
    });
    
    // حفظ المشتروات
    document.getElementById('savePurchase').addEventListener('click', () => {
        const id = document.getElementById('purchaseId').value;
        const purchase = {
            itemName: document.getElementById('itemName').value,
            itemType: document.getElementById('itemType').value,
            purchaseDate: document.getElementById('purchaseDate').value,
            purchaseAmount: parseFloat(document.getElementById('purchaseAmount').value)
        };
        
        if (!purchase.itemName) {
            alert('يرجى إدخال اسم الصنف');
            return;
        }
        
        if (id) {
            purchase.id = parseInt(id);
            updatePurchase(purchase);
        } else {
            addPurchase(purchase);
        }
        
        purchaseModal.style.display = 'none';
    });
    
    // تأكيد التسديد
    document.getElementById('confirmPayment').addEventListener('click', () => {
        const id = parseInt(document.getElementById('debtId').value);
        const type = document.getElementById('debtType').value;
        const name = document.getElementById('debtName').value;
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
        const date = document.getElementById('paymentDate').value || new Date().toISOString();
        
        getDebtRecord(id, function(debt) {
            if (debt) {
                const newRemaining = debt.remainingAmount - paymentAmount;
                
                // تسجيل عملية الدفع في الرصيد
                addBalanceRecord({
                    name: `سداد دين: ${debt.name}`,
                    type: 'دين',
                    amount: paymentAmount,
                    date: date
                });
                
                if (newRemaining > 0) {
                    // تحديث سجل الدين بالمبلغ المتبقي
                    updateDebtRecord(debt.id, newRemaining);
                    showSuccess(`تم تسديد ${paymentAmount} ر.ي من الدين، المتبقي: ${newRemaining} ر.ي`);
                } else {
                    // حذف سجل الدين بالكامل إذا تم تسديده كاملاً
                    deleteDebtRecord(debt.id);
                    showSuccess(`تم تسديد الدين بالكامل`);
                }
            }
        });
        
        paymentModal.style.display = 'none';
    });
    
    // تحديث البيانات
    document.getElementById('refreshBtn').addEventListener('click', loadAllData);
    
    // البحث العالمي
    const globalSearch = document.getElementById('globalSearch');
    globalSearch.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            performSearch(query);
        } else {
            document.getElementById('searchResults').classList.remove('active');
        }
    });
    
    // إخفاء نتائج البحث عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.getElementById('searchResults').classList.remove('active');
        }
    });
    
    // تغيير نوع العميل في نموذج الموعد
    document.getElementById('clientType').addEventListener('change', function() {
        loadClientNames(this.value);
    });
    
    // تعيين التاريخ الحالي في نماذج الشراء والمواعيد
    document.getElementById('purchaseDate').valueAsDate = new Date();
    document.getElementById('appointmentDate').valueAsDate = new Date();
    
    // وظيفة الطباعة
    document.querySelectorAll('.print-section').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            
            // إنشاء نافذة طباعة
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>طباعة ${sectionId}</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                    <style>
                        body {
                            font-family: 'Tajawal', sans-serif;
                            direction: rtl;
                            padding: 20px;
                        }
                        h1 {
                            text-align: center;
                            margin-bottom: 20px;
                            color: #2c7873;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: right;
                        }
                        th {
                            background-color: #2c7873;
                            color: white;
                        }
                        .badge {
                            padding: 3px 6px;
                            border-radius: 4px;
                            font-size: 12px;
                        }
                        .badge-success {
                            background-color: #d4edda;
                            color: #155724;
                        }
                        .badge-danger {
                            background-color: #f8d7da;
                            color: #721c24;
                        }
                        .badge-info {
                            background-color: #d1ecf1;
                            color: #0c5460;
                        }
                        .text-danger {
                            color: #dc3545;
                        }
                        .text-success {
                            color: #28a745;
                        }
                        .empty-table {
                            text-align: center;
                            padding: 30px;
                            color: #6c757d;
                            font-size: 1.1rem;
                        }
                        .empty-table i {
                            font-size: 3rem;
                            display: block;
                            margin-bottom: 15px;
                            color: #ced4da;
                        }
                    </style>
                </head>
                <body>
                    <h1>${document.querySelector(`#${sectionId} .section-title`).textContent}</h1>
                    ${section.innerHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => { window.close(); }, 1000);
                        }
                    <\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
    });
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initDB();
    initCharts();
    initEvents();
});
