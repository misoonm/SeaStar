// تهيئة قاعدة البيانات IndexedDB
class Database {
    constructor() {
        this.dbName = 'sale';
        this.version = 4; // زيادة الإصدار بسبب إضافة المرتجعات
        this.db = null;
    }

    // فتح الاتصال بقاعدة البيانات
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    // إنشاء المخازن (الجداول)
    createStores(db) {
        // مخزن المنتجات
        if (!db.objectStoreNames.contains('products')) {
            const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
            store.createIndex('name', 'name', { unique: false });
            store.createIndex('category', 'category', { unique: false });
            store.createIndex('barcode', 'barcode', { unique: true });
            store.createIndex('supplierId', 'supplierId', { unique: false });
        }

        // مخزن المبيعات
        if (!db.objectStoreNames.contains('sales')) {
            const store = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
            store.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('customerName', 'customerName', { unique: false });
            store.createIndex('paymentMethod', 'paymentMethod', { unique: false });
        }

        // مخزن المبيعات الآجلة
        if (!db.objectStoreNames.contains('creditSales')) {
            const store = db.createObjectStore('creditSales', { keyPath: 'id', autoIncrement: true });
            store.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('customerName', 'customerName', { unique: false });
            store.createIndex('remainingAmount', 'remainingAmount', { unique: false });
        }

        // مخزن المبيعات المسددة
        if (!db.objectStoreNames.contains('paidCreditSales')) {
            const store = db.createObjectStore('paidCreditSales', { keyPath: 'id', autoIncrement: true });
            store.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('customerName', 'customerName', { unique: false });
            store.createIndex('paymentDate', 'paymentDate', { unique: false });
        }

        // مخزن الموردين
        if (!db.objectStoreNames.contains('suppliers')) {
            const store = db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
            store.createIndex('name', 'name', { unique: true });
            store.createIndex('phone', 'phone', { unique: true });
        }

        // مخزن المشتريات
        if (!db.objectStoreNames.contains('purchases')) {
            const store = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
            store.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('supplierId', 'supplierId', { unique: false });
        }

        // مخزن الموظفين
        if (!db.objectStoreNames.contains('employees')) {
            const store = db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
            store.createIndex('username', 'username', { unique: true });
            store.createIndex('name', 'name', { unique: false });
        }

        // مخزن المصروفات
        if (!db.objectStoreNames.contains('expenses')) {
            const store = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('category', 'category', { unique: false });
        }

        // مخزن الإعدادات
        if (!db.objectStoreNames.contains('settings')) {
            const store = db.createObjectStore('settings', { keyPath: 'key' });
        }

        // مخزن المستخدمين
        if (!db.objectStoreNames.contains('users')) {
            const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            store.createIndex('username', 'username', { unique: true });
        }

        // مخزن المرتجعات - الجديد
        if (!db.objectStoreNames.contains('returns')) {
            const store = db.createObjectStore('returns', { keyPath: 'id', autoIncrement: true });
            store.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('customerName', 'customerName', { unique: false });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('status', 'status', { unique: false });
        }
    }

    // إضافة بيانات أولية
    async seedInitialData() {
        // التحقق إذا كانت البيانات موجودة بالفعل
        const usersCount = await this.count('users');
        if (usersCount > 0) return;

        // إضافة مستخدمين افتراضيين
        await this.add('users', {
            username: 'abdullah',
            password: 'abd123ab',
            name: 'مدير النظام',
            role: 'مدير',
            createdAt: new Date()
        });
          await this.add('users', {
            username: 'SeaStar',
            password: 'seastar830',
            name: 'مدير النظام',
            role: 'مدير',
            createdAt: new Date()
        });
        await this.add('users', {
            username: '771212010',
            password: '771212010',
            name: 'مدير النظام',
            role: 'مدير',
            createdAt: new Date()
        });

        await this.add('users', {
            username: 'user',
            password: 'user123',
            name: 'مستخدم عادي',
            role: 'مستخدم',
            createdAt: new Date()
        });

        // إضافة إعدادات افتراضية
        await this.add('settings', {
            key: 'storeSettings',
            storeName: 'متجري',
            enableBarcode: true,
            enableDiscounts: true,
            receiptFooter: 'شكراً لشرائكم من متجرنا',
            enableReturns: true,
            returnPolicy: 'يمكن استرجاع المنتجات خلال 14 يوم من الشراء'
        });

        // إضافة موظف افتراضي
        await this.add('employees', {
            name: 'مدير النظام',
            role: 'مدير',
            phone: '',
            email: '',
            createdAt: new Date()
        });
    }

    // عمليات CRUD الأساسية

    // إضافة عنصر
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // الحصول على عنصر بواسطة المفتاح
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // الحصول على جميع العناصر
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // التحديث
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // الحذف
    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // العد
    async count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // البحث باستخدام الفهرس
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // الحصول على جميع العناصر بواسطة الفهرس
    async getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // البحث النصي
    async search(storeName, field, searchTerm) {
        const allItems = await this.getAll(storeName);
        return allItems.filter(item => 
            item[field] && item[field].toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // العمليات الخاصة بالتطبيق

    // المنتجات
    async getProducts() {
        return this.getAll('products');
    }

    async addProduct(product) {
        return this.add('products', {
            ...product,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    async updateProduct(id, product) {
        const existing = await this.get('products', id);
        return this.update('products', {
            ...existing,
            ...product,
            updatedAt: new Date()
        });
    }

    async searchProducts(searchTerm) {
        return this.search('products', 'name', searchTerm);
    }

    async getLowStockProducts(threshold = 10) {
        const products = await this.getAll('products');
        return products.filter(product => product.quantity < threshold);
    }

    async getExpiringProducts(days = 30) {
        const products = await this.getAll('products');
        const today = new Date();
        return products.filter(product => {
            if (!product.expiryDate) return false;
            const expiryDate = new Date(product.expiryDate);
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= days && diffDays >= 0;
        });
    }

    // المبيعات
    async getSales() {
        return this.getAll('sales');
    }

    async addSale(sale) {
        return this.add('sales', {
            ...sale,
            createdAt: new Date()
        });
    }

    async getSalesByDateRange(startDate, endDate) {
        const sales = await this.getAll('sales');
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });
    }

    // المبيعات الآجلة
    async getCreditSales() {
        return this.getAll('creditSales');
    }

    async addCreditSale(sale) {
        return this.add('creditSales', {
            ...sale,
            remainingAmount: sale.total,
            createdAt: new Date()
        });
    }

    async updateCreditSalePayment(invoiceNumber, paymentAmount, paymentMethod) {
        const sale = await this.getByIndex('creditSales', 'invoiceNumber', invoiceNumber);
        if (!sale) throw new Error('الفاتورة غير موجودة');

        sale.remainingAmount -= paymentAmount;
        
        if (sale.remainingAmount <= 0) {
            // نقل إلى المبيعات المسددة
            await this.delete('creditSales', sale.id);
            const { id, ...saleWithoutId } = sale;
            await this.add('paidCreditSales', {
                ...saleWithoutId,
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod,
                settledAt: new Date()
            });
        } else {
            // تحديث المبلغ المتبقي
            await this.update('creditSales', sale);
        }

        return sale;
    }

    // الموردين
    async getSuppliers() {
        return this.getAll('suppliers');
    }

    async addSupplier(supplier) {
        return this.add('suppliers', {
            ...supplier,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    // الإعدادات
    async getSettings() {
        const settings = await this.get('settings', 'storeSettings');
        return settings || {
            storeName: 'متجري',
            enableBarcode: true,
            enableDiscounts: true,
            receiptFooter: 'شكراً لشرائكم من متجرنا',
            enableReturns: true,
            returnPolicy: 'يمكن استرجاع المنتجات خلال 14 يوم من الشراء'
        };
    }

    async updateSettings(settings) {
        return this.update('settings', {
            key: 'storeSettings',
            ...settings,
            updatedAt: new Date()
        });
    }

    // المستخدمين
    async getUserByUsername(username) {
        return this.getByIndex('users', 'username', username);
    }

    async verifyUser(username, password) {
        const user = await this.getUserByUsername(username);
        if (!user) return null;
        if (user.password === password) return user;
        return null;
    }

    // المرتجعات - الجديد
    async getReturns() {
        return this.getAll('returns');
    }

    async addReturn(returnData) {
        return this.add('returns', {
            ...returnData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    async getReturn(id) {
        return this.get('returns', id);
    }

    async updateReturn(id, returnData) {
        const existing = await this.get('returns', id);
        return this.update('returns', {
            ...existing,
            ...returnData,
            updatedAt: new Date()
        });
    }

    async deleteReturn(id) {
        return this.delete('returns', id);
    }

    async getReturnsByDateRange(startDate, endDate) {
        const returns = await this.getAll('returns');
        return returns.filter(returnItem => {
            const returnDate = new Date(returnItem.date);
            return returnDate >= new Date(startDate) && returnDate <= new Date(endDate);
        });
    }

    async searchReturns(searchTerm) {
        return this.search('returns', 'invoiceNumber', searchTerm);
    }

    async getReturnsByType(type) {
        return this.getAllByIndex('returns', 'type', type);
    }

    async getReturnsByStatus(status) {
        return this.getAllByIndex('returns', 'status', status);
    }

    // دالة مساعدة للبحث في المبيعات برقم الفاتورة
    async getSaleByInvoiceNumber(invoiceNumber) {
        // البحث في المبيعات العادية
        const sale = await this.getByIndex('sales', 'invoiceNumber', invoiceNumber);
        if (sale) return { ...sale, type: 'sale' };
        
        // البحث في المبيعات الآجلة
        const creditSale = await this.getByIndex('creditSales', 'invoiceNumber', invoiceNumber);
        if (creditSale) return { ...creditSale, type: 'creditSale' };
        
        // البحث في المبيعات المسددة
        const paidCreditSale = await this.getByIndex('paidCreditSales', 'invoiceNumber', invoiceNumber);
        if (paidCreditSale) return { ...paidCreditSale, type: 'paidCreditSale' };
        
        return null;
    }

    // الإحصائيات
    async getDashboardStats() {
        const [
            products,
            sales,
            creditSales,
            expenses,
            returns
        ] = await Promise.all([
            this.getProducts(),
            this.getSales(),
            this.getCreditSales(),
            this.getAll('expenses'),
            this.getReturns()
        ]);

        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales
            .filter(sale => sale.date === today)
            .reduce((sum, sale) => sum + sale.total, 0);

        const lowStockCount = products.filter(product => product.quantity < 10).length;
        const totalCredit = creditSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
        const totalReturns = returns.reduce((sum, returnItem) => sum + returnItem.amount, 0);

        return {
            totalSales,
            todaySales,
            totalProducts: products.length,
            lowStockCount,
            totalCredit,
            totalReturns,
            returnsCount: returns.length
        };
    }

    // إحصائيات المرتجعات
    async getReturnsStats() {
        const returns = await this.getReturns();
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);
        
        const todayReturns = returns.filter(r => r.date === today);
        const monthReturns = returns.filter(r => r.date.startsWith(thisMonth));
        
        const byType = {
            return: returns.filter(r => r.type === 'return').length,
            refund: returns.filter(r => r.type === 'refund').length,
            exchange: returns.filter(r => r.type === 'exchange').length
        };

        return {
            totalReturns: returns.length,
            totalReturnsAmount: returns.reduce((sum, r) => sum + r.amount, 0),
            todayReturns: todayReturns.length,
            todayReturnsAmount: todayReturns.reduce((sum, r) => sum + r.amount, 0),
            monthReturns: monthReturns.length,
            monthReturnsAmount: monthReturns.reduce((sum, r) => sum + r.amount, 0),
            byType
        };
    }
}

// إنشاء instance من قاعدة البيانات
const db = new Database();

// تهيئة قاعدة البيانات عند تحميل الصفحة
async function initDatabase() {
    try {
        await db.open();
        await db.seedInitialData();
        console.log('تم تهيئة قاعدة البيانات بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في تهيئة قاعدة البيانات:', error);
        return false;
    }
}

// وظائف التوافق للانتقال من localStorage إلى IndexedDB
async function migrateFromLocalStorage() {
    if (!localStorage.getItem('products')) return; // لا توجد بيانات للترحيل

    try {
        console.log('بدء ترحيل البيانات من localStorage إلى IndexedDB...');

        // ترحيل المنتجات
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        for (const product of products) {
            await db.addProduct(product);
        }

        // ترحيل المبيعات
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        for (const sale of sales) {
            await db.addSale(sale);
        }

        // ترحيل الموردين
        const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        for (const supplier of suppliers) {
            await db.addSupplier(supplier);
        }

        // ترحيل المرتجعات إذا كانت موجودة
        if (localStorage.getItem('returns')) {
            const returns = JSON.parse(localStorage.getItem('returns') || '[]');
            for (const returnItem of returns) {
                await db.addReturn(returnItem);
            }
        }

        // مسح البيانات القديمة من localStorage
        localStorage.removeItem('products');
        localStorage.removeItem('sales');
        localStorage.removeItem('suppliers');
        localStorage.removeItem('creditSales');
        localStorage.removeItem('paidCreditSales');
        localStorage.removeItem('purchases');
        localStorage.removeItem('employees');
        localStorage.removeItem('expenses');
        localStorage.removeItem('users');
        localStorage.removeItem('returns');

        console.log('تم ترحيل البيانات بنجاح');
    } catch (error) {
        console.error('خطأ في ترحيل البيانات:', error);
    }
}
