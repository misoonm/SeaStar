// settings.js - الإصدار الكامل
const AppSettings = {
    // تحميل وتطبيق جميع الإعدادات
    init: function() {
        this.load();
        this.setupEventListeners();
    },
    
    // تحميل الإعدادات من localStorage
    load: function() {
        try {
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            const theme = localStorage.getItem('theme') || 'light';
            const storeName = localStorage.getItem('storeName') || 'متجري';
            
            // تطبيق الإعدادات على الصفحة الحالية
            this.applyTheme(theme);
            this.applySettings(settings);
            this.applyStoreName(storeName);
            
            return { settings, theme, storeName };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    },
    
    // تطبيق الثيم على الصفحة
    applyTheme: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // حفظ الثيم في localStorage للمستقبل
        localStorage.setItem('theme', theme);
    },
    
    // تطبيق اسم المتجر
    applyStoreName: function(storeName) {
        const storeNameElements = document.querySelectorAll('#store-name, .store-name');
        if (storeNameElements.length > 0) {
            storeNameElements.forEach(el => {
                el.textContent = storeName;
            });
        }
    },
    
    // تطبيق الإعدادات الأخرى
    applySettings: function(settings) {
        // تطبيق لون الأساسي إذا كان محدداً
        if (settings.primaryColor) {
            this.applyPrimaryColor(settings.primaryColor);
        }
        
        // هنا يمكنك إضافة تطبيق إعدادات أخرى حسب الحاجة
    },
    
    // تطبيق اللون الأساسي
    applyPrimaryColor: function(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        
        // حساب الألوان المشتقة تلقائياً
        const primaryLight = this.lightenColor(color, 20);
        const primaryDark = this.darkenColor(color, 20);
        
        document.documentElement.style.setProperty('--primary-light', primaryLight);
        document.documentElement.style.setProperty('--primary-dark', primaryDark);
    },
    
    // تفتيح اللون
    lightenColor: function(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (
            0x1000000 +
            (R < 255 ? R : 255) * 0x10000 +
            (G < 255 ? G : 255) * 0x100 +
            (B < 255 ? B : 255)
        ).toString(16).slice(1);
    },
    
    // تغميق اللون
    darkenColor: function(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return '#' + (
            0x1000000 +
            (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0)
        ).toString(16).slice(1);
    },
    
    // إعداد مستمعي الأحداث
    setupEventListeners: function() {
        // للصفحات التي تحتاج إلى تفاعل خاص مع الإعدادات
    },
    
    // حفظ الإعدادات
    save: function(newSettings) {
        try {
            // دمج الإعدادات الجديدة مع القديمة
            const currentSettings = JSON.parse(localStorage.getItem('settings') || '{}');
            const updatedSettings = { ...currentSettings, ...newSettings };
            
            // حفظ في localStorage
            localStorage.setItem('settings', JSON.stringify(updatedSettings));
            
            // تطبيق الإعدادات على الصفحة الحالية
            this.applySettings(updatedSettings);
            
            return updatedSettings;
        } catch (error) {
            console.error('Error saving settings:', error);
            return {};
        }
    },
    
    // حفظ الثيم
    saveTheme: function(theme) {
        try {
            localStorage.setItem('theme', theme);
            this.applyTheme(theme);
            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            return false;
        }
    },
    
    // الحصول على إعداد محدد
    get: function(key, defaultValue = null) {
        try {
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            return settings[key] !== undefined ? settings[key] : defaultValue;
        } catch (error) {
            console.error('Error getting setting:', error);
            return defaultValue;
        }
    }
};

// تطبيق الإعدادات تلقائياً عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    AppSettings.init();
});

// جعل الكائن متاحاً globally للوصول إليه من أي مكان
window.AppSettings = AppSettings;
