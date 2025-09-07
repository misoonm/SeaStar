// database.js - إدارة تخزين البيانات
const DB = {
  // تهيئة قاعدة البيانات
  init: function() {
    if (!localStorage.getItem('products')) {
      localStorage.setItem('products', JSON.stringify([]));
    }
    if (!localStorage.getItem('sales')) {
      localStorage.setItem('sales', JSON.stringify([]));
    }
    if (!localStorage.getItem('creditSales')) {
      localStorage.setItem('creditSales', JSON.stringify([]));
    }
    if (!localStorage.getItem('paidCreditSales')) {
      localStorage.setItem('paidCreditSales', JSON.stringify([]));
    }
    if (!localStorage.getItem('suppliers')) {
      localStorage.setItem('suppliers', JSON.stringify([]));
    }
    if (!localStorage.getItem('purchases')) {
      localStorage.setItem('purchases', JSON.stringify([]));
    }
    if (!localStorage.getItem('employees')) {
      localStorage.setItem('employees', JSON.stringify([
        { id: 1, name: 'مدير النظام', role: 'مدير' }
      ]));
    }
    if (!localStorage.getItem('expenses')) {
      localStorage.setItem('expenses', JSON.stringify([]));
    }
    if (!localStorage.getItem('storeName')) {
      localStorage.setItem('storeName', 'متجري');
    }
    if (!localStorage.getItem('settings')) {
      localStorage.setItem('settings', JSON.stringify({
        enableBarcode: true,
        enableDiscounts: true,
        receiptFooter: 'شكراً لشرائكم من متجرنا'
      }));
    }
    if (!localStorage.getItem('users')) {
      const defaultUsers = [
        { id: 1, username: 'abdullah', password: 'abd123ab', name: 'مدير النظام', role: 'مدير' },
        { id: 3, username: 'Sales', password: 'sales830', name: 'مدير النظام', role: 'مدير' },
        { id: 4, username: 'SeaStar', password: 'seastar501', name: 'مدير النظام', role: 'مدير' },
        { id: 2, username: 'user', password: 'user123', name: 'مستخدم عادي', role: 'مستخدم' }
      ];
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
  },

  // الحصول على البيانات
  get: function(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  // حفظ البيانات
  set: function(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // إضافة عنصر جديد
  add: function(key, item) {
    const data = this.get(key);
    data.push(item);
    this.set(key, data);
    return item;
  },

  // تحديث عنصر
  update: function(key, id, updates) {
    const data = this.get(key);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      this.set(key, data);
      return data[index];
    }
    return null;
  },

  // حذف عنصر
  delete: function(key, id) {
    const data = this.get(key);
    const filteredData = data.filter(item => item.id !== id);
    this.set(key, filteredData);
    return true;
  },

  // البحث في البيانات
  find: function(key, condition) {
    const data = this.get(key);
    return data.filter(condition);
  },

  // العثور على عنصر واحد
  findOne: function(key, condition) {
    const data = this.get(key);
    return data.find(condition);
  }
};

// تهيئة قاعدة البيانات عند التحميل
DB.init();
